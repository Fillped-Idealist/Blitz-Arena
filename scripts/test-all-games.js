const hre = require("hardhat");

async function main() {
  console.log("=== Testing all 5 game types ===\n");

  // 获取部署者账户
  const [deployer, player1, player2] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);

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
  for (const account of [deployer, player1, player2]) {
    const tx = await prizeToken.transfer(account.address, fundAmount);
    await tx.wait();
    const balance = await prizeToken.balanceOf(account.address);
    console.log(`${account.address}: ${hre.ethers.formatEther(balance)} tokens`);
  }

  // 授权 Factory 使用创建者的代币
  console.log("\n=== Approving Factory ===");
  const approveAmount = hre.ethers.parseEther("1000");
  for (const account of [deployer, player1, player2]) {
    const tx = await prizeToken.connect(account).approve(deploymentInfo.gameFactory, approveAmount);
    await tx.wait();
    const allowance = await prizeToken.allowance(account.address, deploymentInfo.gameFactory);
    console.log(`${account.address} approved: ${hre.ethers.formatEther(allowance)} tokens`);
  }

  // 测试5个游戏类型
  const gameTypes = [
    { name: "Number Guess", type: 1 },
    { name: "Rock Paper Scissors", type: 2 },
    { name: "Quick Click", type: 3 },
    { name: "Roguelike Survival (Cycle Rift)", type: 4 },
    { name: "Infinite Match", type: 5 },
  ];

  const gameAddresses = [];

  for (const game of gameTypes) {
    console.log(`\n=== Creating ${game.name} Tournament (Type: ${game.type}) ===`);

    const now = Math.floor(Date.now() / 1000);
    const gameDuration = 120 * 60; // 120 minutes
    const registrationDuration = 60; // 60 seconds for immediate start mode

    const config = {
      title: `${game.name} Tournament`,
      description: `Test tournament for ${game.name}`,
      gameType: game.type,
      feeTokenAddress: deploymentInfo.prizeToken,
      entryFee: hre.ethers.parseEther("5"), // 5 tokens
      minPlayers: 2,
      maxPlayers: 10,
      registrationEndTime: BigInt(now + registrationDuration), // 60 seconds from now
      gameStartTime: BigInt(now + registrationDuration), // Same as reg end (immediate start)
      gameEndTime: BigInt(now + gameDuration), // 120 minutes from now
      prizeTokenAddress: deploymentInfo.prizeToken,
      prizePool: hre.ethers.parseEther("100"), // 100 tokens prize pool
      distributionType: 0, // Winner Takes All
      rankPrizes: [],
    };

    try {
      const tx = await factory.createGame(config);
      const receipt = await tx.wait();

      // 获取新创建的游戏实例地址
      // GameCreated 事件的第一个参数是游戏地址
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === 'GameCreated';
        } catch (e) {
          return false;
        }
      });

      if (!event) {
        console.error(`✗ Cannot find GameCreated event for ${game.name}`);
        continue;
      }

      const parsedEvent = factory.interface.parseLog(event);
      const gameAddress = parsedEvent.args[0];
      gameAddresses.push({ name: game.name, address: gameAddress, type: game.type });
      console.log(`✓ ${game.name} tournament created at ${gameAddress}`);

      // 验证游戏数据
      const gameInstance = GameInstance.attach(gameAddress);
      const title = await gameInstance.title();
      const gameType = await gameInstance.gameType();
      const status = await gameInstance.status();
      const regEndTime = await gameInstance.registrationEndTime();
      const startTime = await gameInstance.gameStartTime();
      const endTime = await gameInstance.gameEndTime();

      console.log(`  Title: ${title}`);
      console.log(`  Game Type: ${gameType}`);
      console.log(`  Status: ${status}`);
      console.log(`  Registration End: ${new Date(Number(regEndTime) * 1000).toISOString()}`);
      console.log(`  Game Start: ${new Date(Number(startTime) * 1000).toISOString()}`);
      console.log(`  Game End: ${new Date(Number(endTime) * 1000).toISOString()}`);

      // 验证游戏类型是否正确
      if (gameType !== BigInt(game.type)) {
        console.error(`✗ Game type mismatch! Expected ${game.type}, got ${gameType}`);
      } else {
        console.log(`✓ Game type correct`);
      }

      // 测试加入比赛
      console.log(`\n  Testing join game...`);
      const joinTx = await prizeToken.connect(player1).approve(gameAddress, hre.ethers.parseEther("10"));
      await joinTx.wait();

      const joinGameTx = await gameInstance.connect(player1).joinGame();
      const joinReceipt = await joinGameTx.wait();
      console.log(`✓ Player 1 joined ${game.name} tournament`);

      // 验证玩家已加入
      const isJoined = await gameInstance.isJoined(player1.address);
      console.log(`  Player 1 joined: ${isJoined}`);

      if (!isJoined) {
        console.error(`✗ Player 1 failed to join ${game.name} tournament!`);
      }

    } catch (error) {
      console.error(`✗ Failed to create ${game.name} tournament:`, error.message);
    }
  }

  // 测试立即开始模式的时间窗口
  console.log("\n=== Testing Immediate Start Mode Time Window ===");
  const testGame = gameAddresses[0]; // Use Number Guess for testing
  const testInstance = GameInstance.attach(testGame.address);

  const regEndTime = await testInstance.registrationEndTime();
  const startTime = await testInstance.gameStartTime();
  const endTime = await testInstance.gameEndTime();
  const currentTimestamp = Math.floor(Date.now() / 1000);

  console.log(`Current timestamp: ${currentTimestamp} (${new Date(currentTimestamp * 1000).toISOString()})`);
  console.log(`Registration end time: ${Number(regEndTime)} (${new Date(Number(regEndTime) * 1000).toISOString()})`);
  console.log(`Game start time: ${Number(startTime)} (${new Date(Number(startTime) * 1000).toISOString()})`);
  console.log(`Game end time: ${Number(endTime)} (${new Date(Number(endTime) * 1000).toISOString()})`);

  const registrationDeadline = Number(endTime) - 15 * 60; // 15 minutes before end
  console.log(`Registration deadline: ${registrationDeadline} (${new Date(registrationDeadline * 1000).toISOString()})`);

  // 检查是否可以现在加入
  console.log(`\nCan player2 join now?`);
  try {
    const approveTx = await prizeToken.connect(player2).approve(testGame.address, hre.ethers.parseEther("10"));
    await approveTx.wait();

    const joinTx = await testInstance.connect(player2).joinGame();
    const joinReceipt = await joinTx.wait();
    console.log(`✓ Player 2 joined successfully`);
  } catch (error) {
    console.log(`✗ Player 2 cannot join: ${error.message}`);
  }

  console.log("\n=== Summary ===");
  console.log(`Total games created: ${gameAddresses.length}`);
  gameAddresses.forEach(game => {
    console.log(`  - ${game.name} (Type: ${game.type}): ${game.address}`);
  });

  console.log("\n=== All tests completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
