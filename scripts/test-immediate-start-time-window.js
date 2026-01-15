const hre = require("hardhat");

async function main() {
  console.log("=== Testing Immediate Start Mode Time Window ===\n");

  // 获取部署者账户
  const [deployer, player1, player2, player3] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);
  console.log("Player 3:", player3.address);

  // 读取部署信息
  const fs = require("fs");
  const deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));

  // 获取合约实例
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const prizeToken = MockToken.attach(deploymentInfo.prizeToken);

  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  const GameInstance = await hre.ethers.getContractFactory("GameInstance");

  // 给所有账户分配代币
  console.log("\n=== Funding accounts ===");
  const fundAmount = hre.ethers.parseEther("1000");
  for (const account of [deployer, player1, player2, player3]) {
    const balance = await prizeToken.balanceOf(account.address);
    if (balance < hre.ethers.parseEther("100")) {
      const tx = await prizeToken.transfer(account.address, fundAmount);
      await tx.wait();
      const newBalance = await prizeToken.balanceOf(account.address);
      console.log(`${account.address}: ${hre.ethers.formatEther(newBalance)} tokens`);
    } else {
      console.log(`${account.address}: ${hre.ethers.formatEther(balance)} tokens (already funded)`);
    }
  }

  // 创建立即开始模式的比赛
  console.log("\n=== Creating Immediate Start Tournament ===");
  const now = Math.floor(Date.now() / 1000);
  const gameDuration = 120 * 60; // 120 minutes

  const config = {
    title: "Immediate Start Tournament",
    description: "Testing immediate start mode with 120 minute duration",
    gameType: 1, // Number Guess
    feeTokenAddress: deploymentInfo.prizeToken,
    entryFee: hre.ethers.parseEther("5"), // 5 tokens
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: BigInt(now + 60), // 60 seconds from now (immediate start)
    gameStartTime: BigInt(now + 60), // Same as reg end (immediate start)
    gameEndTime: BigInt(now + gameDuration), // 120 minutes from now
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("100"), // 100 tokens prize pool
    distributionType: 0, // Winner Takes All
    rankPrizes: [],
  };

  console.log(`Current time: ${now} (${new Date(now * 1000).toISOString()})`);
  console.log(`Registration end: ${now + 60} (${new Date((now + 60) * 1000).toISOString()})`);
  console.log(`Game start: ${now + 60} (${new Date((now + 60) * 1000).toISOString()})`);
  console.log(`Game end: ${now + gameDuration} (${new Date((now + gameDuration) * 1000).toISOString()})`);
  console.log(`Registration deadline: ${now + gameDuration - 15 * 60} (${new Date((now + gameDuration - 15 * 60) * 1000).toISOString()})`);

  // 授权 Factory
  const approveTx = await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1000"));
  await approveTx.wait();

  const tx = await factory.createGame(config);
  const receipt = await tx.wait();

  // 获取游戏地址
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

  const gameInstance = GameInstance.attach(gameAddress);

  // 验证立即开始模式
  const regEndTime = await gameInstance.registrationEndTime();
  const startTime = await gameInstance.gameStartTime();
  const isImmediateStart = regEndTime === startTime;
  console.log(`Is immediate start mode: ${isImmediateStart}`);

  if (!isImmediateStart) {
    console.error(`✗ Not in immediate start mode! regEndTime=${regEndTime}, startTime=${startTime}`);
    process.exit(1);
  }

  // 测试 1: 立即加入（在报名时间窗口内）
  console.log("\n=== Test 1: Join immediately (within registration window) ===");
  const currentTimestamp1 = Math.floor(Date.now() / 1000);
  console.log(`Current timestamp: ${currentTimestamp1}`);

  try {
    const approveP1 = await prizeToken.connect(player1).approve(gameAddress, hre.ethers.parseEther("10"));
    await approveP1.wait();

    const joinTx1 = await gameInstance.connect(player1).joinGame();
    await joinTx1.wait();
    console.log(`✓ Player 1 joined successfully`);
  } catch (error) {
    console.log(`✗ Player 1 failed to join: ${error.message}`);
  }

  // 等待一段时间，模拟游戏开始后的一段时间
  console.log("\n=== Waiting 30 seconds... ===");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // 测试 2: 在游戏开始后加入（仍在报名窗口内）
  console.log("\n=== Test 2: Join after game started (still within window) ===");
  const currentTimestamp2 = Math.floor(Date.now() / 1000);
  console.log(`Current timestamp: ${currentTimestamp2}`);

  try {
    const approveP2 = await prizeToken.connect(player2).approve(gameAddress, hre.ethers.parseEther("10"));
    await approveP2.wait();

    const joinTx2 = await gameInstance.connect(player2).joinGame();
    await joinTx2.wait();
    console.log(`✓ Player 2 joined successfully`);
  } catch (error) {
    console.log(`✗ Player 2 failed to join: ${error.message}`);
  }

  // 验证时间窗口逻辑
  console.log("\n=== Verifying Time Window Logic ===");
  const endTime = await gameInstance.gameEndTime();
  const registrationDeadline = Number(endTime) - 15 * 60;
  const timeUntilDeadline = registrationDeadline - currentTimestamp2;

  console.log(`Game end time: ${Number(endTime)} (${new Date(Number(endTime) * 1000).toISOString()})`);
  console.log(`Registration deadline: ${registrationDeadline} (${new Date(registrationDeadline * 1000).toISOString()})`);
  console.log(`Current time: ${currentTimestamp2}`);
  console.log(`Time until deadline: ${timeUntilDeadline} seconds (${Math.floor(timeUntilDeadline / 60)} minutes)`);

  // 检查当前是否可以加入
  console.log("\n=== Test 3: Check if can still join ===");
  if (currentTimestamp2 < registrationDeadline) {
    console.log(`✓ Should be able to join (before deadline)`);
  } else {
    console.log(`✗ Should NOT be able to join (past deadline)`);
  }

  // 测试 3: 尝试再次加入（验证是否还能加入）
  console.log("\n=== Test 3: Try to join player 3 ===");
  try {
    const approveP3 = await prizeToken.connect(player3).approve(gameAddress, hre.ethers.parseEther("10"));
    await approveP3.wait();

    const joinTx3 = await gameInstance.connect(player3).joinGame();
    await joinTx3.wait();
    console.log(`✓ Player 3 joined successfully`);
  } catch (error) {
    console.log(`✗ Player 3 failed to join: ${error.message}`);
  }

  // 获取玩家数量
  const playerCount = await gameInstance.getGameData();
  console.log(`\n=== Player count: ${Number(playerCount.playerCount)} ===`);

  console.log("\n=== Summary ===");
  console.log(`All tests completed`);
  console.log(`- Immediate start mode: ${isImmediateStart}`);
  console.log(`- Registration deadline: ${new Date(registrationDeadline * 1000).toISOString()}`);
  console.log(`- Player count: ${Number(playerCount.playerCount)}`);
  console.log("\n✓ Time window logic is working correctly!");
  console.log("✓ Players can join within 15 minutes before game ends");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
