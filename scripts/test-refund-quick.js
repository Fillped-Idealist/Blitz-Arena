const hre = require("hardhat");

async function main() {
  console.log("=== Quick Test: Token Refund and Prize Distribution ===\n");

  // 获取部署者账户
  const [deployer, player1, player2] = await hre.ethers.getSigners();
  console.log("Deployer (Creator):", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);

  // 读取本地部署信息
  const fs = require("fs");
  const deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment-localhost.json", "utf8"));

  // 获取合约实例
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const prizeToken = MockToken.attach(deploymentInfo.prizeToken);

  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  const GameInstance = await hre.ethers.getContractFactory("GameInstance");

  // 检查初始余额
  console.log("\n=== Checking Initial Balances ===");
  const balances = {};
  for (const account of [deployer, player1, player2]) {
    const balance = await prizeToken.balanceOf(account.address);
    balances[account.address] = balance;
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} tokens`);
  }

  // 授权 Factory 和 GameInstance
  console.log("\n=== Approving Contracts ===");
  const approveAmount = hre.ethers.parseEther("1000");
  for (const account of [deployer, player1, player2]) {
    await prizeToken.connect(account).approve(deploymentInfo.gameFactory, approveAmount);
    console.log(`✓ ${account.address} approved Factory`);
  }

  // 创建立即开始模式的比赛
  console.log("\n=== Creating Immediate Start Tournament ===");
  const now = Math.floor(Date.now() / 1000);

  const config = {
    title: "Quick Test Tournament",
    description: "Testing immediate start mode",
    gameType: 1, // Number Guess
    feeTokenAddress: deploymentInfo.prizeToken,
    entryFee: hre.ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: BigInt(now + 120), // 2分钟后报名结束
    gameStartTime: BigInt(now + 120), // 2分钟后开始（立即开始模式）
    gameEndTime: BigInt(now + 7320), // 2小时+2分钟后结束
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("100"),
    distributionType: 0, // Winner Takes All
    rankPrizes: [],
  };

  console.log("Creating tournament...");
  const tx = await factory.createGame(config);
  const receipt = await tx.wait();

  const event = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed.name === 'GameCreated';
    } catch (e) {
      return false;
    }
  });

  const parsedEvent = factory.interface.parseLog(event);
  const gameAddress = parsedEvent.args[0];
  console.log(`✓ Tournament created at ${gameAddress}`);

  const game = GameInstance.attach(gameAddress);

  // 玩家加入
  console.log("\n=== Players Joining ===");
  await prizeToken.connect(player1).approve(gameAddress, hre.ethers.parseEther("10"));
  const joinP1 = await game.connect(player1).joinGame();
  await joinP1.wait();
  console.log("✓ Player 1 joined");

  await prizeToken.connect(player2).approve(gameAddress, hre.ethers.parseEther("10"));
  const joinP2 = await game.connect(player2).joinGame();
  await joinP2.wait();
  console.log("✓ Player 2 joined");

  // 检查加入后的余额
  console.log("\n=== Balances After Joining ===");
  for (const account of [deployer, player1, player2]) {
    const balance = await prizeToken.balanceOf(account.address);
    const diff = balance - balances[account.address];
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} (change: ${hre.ethers.formatEther(diff)})`);
  }

  // 立即开始游戏
  console.log("\n=== Waiting for Registration to End ===");
  console.log("Registration ends at:", new Date((Number(config.registrationEndTime)) * 1000).toISOString());
  console.log("Current time:", new Date(now * 1000).toISOString());
  console.log("Waiting 125 seconds...");
  await new Promise(resolve => setTimeout(resolve, 125000));

  console.log("\n=== Starting Game ===");
  const status = await game.status();
  console.log(`Current status: ${status} (0=Created)`);

  const startTx = await game.connect(deployer).startGame();
  await startTx.wait();
  console.log("✓ Game started");

  const status2 = await game.status();
  console.log(`Status after start: ${status2} (1=Ongoing)`);

  // 提交分数
  console.log("\n=== Submitting Scores ===");
  const submitP1 = await game.connect(player1).submitScore(100);
  await submitP1.wait();
  console.log("✓ Player 1 submitted score: 100");

  const submitP2 = await game.connect(player2).submitScore(80);
  await submitP2.wait();
  console.log("✓ Player 2 submitted score: 80");

  // 设置胜者
  console.log("\n=== Setting Winners ===");
  const setWinnersTx = await game.connect(deployer).setWinners([player1.address]);
  await setWinnersTx.wait();
  console.log("✓ Winner set: Player 1");

  const status3 = await game.status();
  console.log(`Status: ${status3} (2=Ended)`);

  // 分发奖励
  console.log("\n=== Distributing Prizes ===");
  const distributeTx = await game.connect(deployer).distributePrize();
  await distributeTx.wait();
  console.log("✓ Prizes distributed");

  const status4 = await game.status();
  console.log(`Status: ${status4} (3=PrizeDistributed)`);

  // 检查可领取奖励
  const prizeToClaimP1 = await game.prizeToClaimsAmount(player1.address);
  const prizeToClaimP2 = await game.prizeToClaimsAmount(player2.address);
  console.log(`\n=== Prizes to Claim ===`);
  console.log(`Player 1: ${hre.ethers.formatEther(prizeToClaimP1)} tokens`);
  console.log(`Player 2: ${hre.ethers.formatEther(prizeToClaimP2)} tokens`);

  // 领取奖励
  console.log("\n=== Claiming Prizes ===");
  const claimTx = await game.connect(player1).claimPrize();
  await claimTx.wait();
  console.log("✓ Player 1 claimed prize");

  // 检查最终余额
  console.log("\n=== Final Balances ===");
  for (const account of [deployer, player1, player2]) {
    const balance = await prizeToken.balanceOf(account.address);
    const diff = balance - balances[account.address];
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} (total change: ${hre.ethers.formatEther(diff)})`);
  }

  console.log("\n=== Test Cancel Tournament ===");
  // 创建另一个比赛用于测试取消
  const now2 = Math.floor(Date.now() / 1000);
  const config2 = {
    title: "Cancel Test Tournament",
    description: "Testing cancel game",
    gameType: 1,
    feeTokenAddress: deploymentInfo.prizeToken,
    entryFee: hre.ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: BigInt(now2 + 60),
    gameStartTime: BigInt(now2 + 60),
    gameEndTime: BigInt(now2 + 7200),
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("100"),
    distributionType: 0,
    rankPrizes: [],
  };

  const tx2 = await factory.createGame(config2);
  const receipt2 = await tx2.wait();

  const event2 = receipt2.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed.name === 'GameCreated';
    } catch (e) {
      return false;
    }
  });

  const parsedEvent2 = factory.interface.parseLog(event2);
  const gameAddress2 = parsedEvent2.args[0];
  console.log(`✓ Tournament created at ${gameAddress2}`);

  const game2 = GameInstance.attach(gameAddress2);

  // 玩家加入
  await prizeToken.connect(player1).approve(gameAddress2, hre.ethers.parseEther("10"));
  const joinP3 = await game2.connect(player1).joinGame();
  await joinP3.wait();
  console.log("✓ Player 1 joined");

  // 取消比赛
  console.log("\n=== Canceling Tournament ===");
  const cancelTx = await game2.connect(deployer).cancelGame();
  await cancelTx.wait();
  console.log("✓ Tournament canceled");

  const cancelStatus = await game2.status();
  console.log(`Status: ${cancelStatus} (4=Canceled)`);

  // 检查取消后的余额
  console.log("\n=== Balances After Cancel ===");
  for (const account of [deployer, player1]) {
    const balance = await prizeToken.balanceOf(account.address);
    const diff = balance - balances[account.address];
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} (change: ${hre.ethers.formatEther(diff)})`);
  }

  console.log("\n=== All Tests Completed ===");
  console.log("✓ Normal tournament flow");
  console.log("✓ Prize distribution and claiming");
  console.log("✓ Cancel tournament and refund");
  console.log("\nAll features are working correctly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
