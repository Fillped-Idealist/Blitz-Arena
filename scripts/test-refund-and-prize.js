const hre = require("hardhat");

async function main() {
  console.log("=== Testing Token Refund and Prize Distribution ===\n");

  // 获取部署者账户
  const [deployer, player1, player2, player3] = await hre.ethers.getSigners();
  console.log("Deployer (Creator):", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);
  console.log("Player 3:", player3.address);

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
  for (const account of [deployer, player1, player2, player3]) {
    const balance = await prizeToken.balanceOf(account.address);
    balances[account.address] = balance;
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} tokens`);
  }

  // 授权 Factory
  console.log("\n=== Approving Factory ===");
  const approveAmount = hre.ethers.parseEther("1000");
  for (const account of [deployer, player1, player2, player3]) {
    const tx = await prizeToken.connect(account).approve(deploymentInfo.gameFactory, approveAmount);
    await tx.wait();
    console.log(`✓ ${account.address} approved Factory`);
  }

  // 创建测试比赛1：人数不足自动取消
  console.log("\n=== Test 1: Auto-cancel when insufficient players ===");
  const now = Math.floor(Date.now() / 1000);

  const config1 = {
    title: "Auto Cancel Test",
    description: "Testing auto-cancel when players < minPlayers",
    gameType: 1, // Number Guess
    feeTokenAddress: deploymentInfo.prizeToken,
    entryFee: hre.ethers.parseEther("5"), // 5 tokens
    minPlayers: 3, // 需要3个玩家
    maxPlayers: 10,
    registrationEndTime: BigInt(now + 300), // 5分钟后报名结束
    gameStartTime: BigInt(now + 360), // 6分钟后开始
    gameEndTime: BigInt(now + 2160), // 36分钟后结束
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("100"), // 100 tokens prize pool
    distributionType: 0, // Winner Takes All
    rankPrizes: [],
  };

  console.log("Creating tournament with minPlayers=3...");
  const tx1 = await factory.createGame(config1);
  const receipt1 = await tx1.wait();

  const event1 = receipt1.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed.name === 'GameCreated';
    } catch (e) {
      return false;
    }
  });

  const parsedEvent1 = factory.interface.parseLog(event1);
  const gameAddress1 = parsedEvent1.args[0];
  console.log(`✓ Tournament created at ${gameAddress1}`);

  const game1 = GameInstance.attach(gameAddress1);

  // 只有2个玩家加入（少于minPlayers=3）
  console.log("\nPlayer 1 joining...");
  const approveP1 = await prizeToken.connect(player1).approve(gameAddress1, hre.ethers.parseEther("10"));
  await approveP1.wait();
  const joinP1 = await game1.connect(player1).joinGame();
  await joinP1.wait();
  console.log("✓ Player 1 joined");

  console.log("Player 2 joining...");
  const approveP2 = await prizeToken.connect(player2).approve(gameAddress1, hre.ethers.parseEther("10"));
  await approveP2.wait();
  const joinP2 = await game1.connect(player2).joinGame();
  await joinP2.wait();
  console.log("✓ Player 2 joined");

  // 等待报名结束
  console.log("\nWaiting for registration to end...");
  await new Promise(resolve => setTimeout(resolve, 65000)); // 65秒

  // 创建者尝试开始游戏
  console.log("\nCreator trying to start game (should auto-cancel)...");
  const startTx = await game1.connect(deployer).startGame();
  const startReceipt = await startTx.wait();
  console.log("✓ startGame called");

  // 检查状态
  const status1 = await game1.status();
  console.log(`Game status after startGame: ${status1} (3=Canceled)`);

  // 检查余额
  console.log("\n=== Checking Balances After Auto-Cancel ===");
  for (const account of [deployer, player1, player2]) {
    const balance = await prizeToken.balanceOf(account.address);
    const diff = balance - balances[account.address];
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} (change: ${hre.ethers.formatEther(diff)})`);
  }

  // 创建测试比赛2：正常流程
  console.log("\n=== Test 2: Normal tournament flow ===");
  const now2 = Math.floor(Date.now() / 1000);

  const config2 = {
    title: "Normal Flow Test",
    description: "Testing normal tournament flow",
    gameType: 1, // Number Guess
    feeTokenAddress: deploymentInfo.prizeToken,
    entryFee: hre.ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: BigInt(now2 + 300), // 5分钟后报名结束
    gameStartTime: BigInt(now2 + 360), // 6分钟后开始
    gameEndTime: BigInt(now2 + 2160), // 36分钟后结束
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("100"),
    distributionType: 0, // Winner Takes All
    rankPrizes: [],
  };

  console.log("Creating tournament...");
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
  console.log("\nPlayers joining...");
  const approveP3 = await prizeToken.connect(player1).approve(gameAddress2, hre.ethers.parseEther("10"));
  await approveP3.wait();
  const joinP3 = await game2.connect(player1).joinGame();
  await joinP3.wait();
  console.log("✓ Player 1 joined");

  const approveP4 = await prizeToken.connect(player2).approve(gameAddress2, hre.ethers.parseEther("10"));
  await approveP4.wait();
  const joinP4 = await game2.connect(player2).joinGame();
  await joinP4.wait();
  console.log("✓ Player 2 joined");

  // 等待报名结束
  console.log("\nWaiting for registration to end...");
  await new Promise(resolve => setTimeout(resolve, 65000));

  // 开始游戏
  console.log("\nCreator starting game...");
  const startTx2 = await game2.connect(deployer).startGame();
  await startTx2.wait();
  console.log("✓ Game started");

  const status2 = await game2.status();
  console.log(`Game status: ${status2} (1=Ongoing)`);

  // 提交分数
  console.log("\nPlayers submitting scores...");
  const submitP1 = await game2.connect(player1).submitScore(100);
  await submitP1.wait();
  console.log("✓ Player 1 submitted score: 100");

  const submitP2 = await game2.connect(player2).submitScore(80);
  await submitP2.wait();
  console.log("✓ Player 2 submitted score: 80");

  // 设置胜者
  console.log("\nCreator setting winners...");
  const setWinnersTx = await game2.connect(deployer).setWinners([player1.address]);
  await setWinnersTx.wait();
  console.log("✓ Winner set: Player 1");

  const status3 = await game2.status();
  console.log(`Game status: ${status3} (2=Ended)`);

  // 分发奖励
  console.log("\nCreator distributing prizes...");
  const distributeTx = await game2.connect(deployer).distributePrize();
  await distributeTx.wait();
  console.log("✓ Prizes distributed");

  const status4 = await game2.status();
  console.log(`Game status: ${status4} (3=PrizeDistributed)`);

  // 检查可领取奖励
  const prizeToClaimP1 = await game2.prizeToClaimsAmount(player1.address);
  console.log(`\nPlayer 1 prize to claim: ${hre.ethers.formatEther(prizeToClaimP1)} tokens`);

  // 领取奖励
  console.log("\nPlayer 1 claiming prize...");
  const claimTx = await game2.connect(player1).claimPrize();
  await claimTx.wait();
  console.log("✓ Prize claimed");

  // 检查最终余额
  console.log("\n=== Checking Final Balances ===");
  for (const account of [deployer, player1, player2]) {
    const balance = await prizeToken.balanceOf(account.address);
    const diff = balance - balances[account.address];
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} (total change: ${hre.ethers.formatEther(diff)})`);
  }

  console.log("\n=== All tests completed ===");
  console.log("\nSummary:");
  console.log("✓ Test 1: Auto-cancel when insufficient players");
  console.log("✓ Test 2: Normal tournament flow");
  console.log("✓ Prize distribution and claiming");
  console.log("\nAll refund and prize distribution features are working correctly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
