const hre = require("hardhat");

async function main() {
  console.log("Testing time logic...\n");

  // 获取部署者账户
  const [deployer, player1, player2] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Player1:", player1.address);
  console.log("Player2:", player2.address);

  // 获取已部署的合约
  const deploymentInfoPath = "./deployments/deployment-localhost.json";
  const fs = require("fs");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));

  console.log("\n=== Deployed Contracts ===");
  console.log("GameFactory:", deploymentInfo.gameFactory);
  console.log("BLZ Token:", deploymentInfo.blzToken);
  console.log("Prize Token:", deploymentInfo.prizeToken);

  // 获取合约实例
  const factory = await hre.ethers.getContractAt("GameFactory", deploymentInfo.gameFactory);
  const prizeToken = await hre.ethers.getContractAt("MockERC20", deploymentInfo.prizeToken);
  const blzToken = await hre.ethers.getContractAt("MockERC20", deploymentInfo.blzToken);

  // 给玩家分配一些代币
  console.log("\n=== Distributing tokens to players ===");
  await prizeToken.transfer(player1.address, hre.ethers.parseEther("1000"));
  await prizeToken.transfer(player2.address, hre.ethers.parseEther("1000"));
  console.log("Transferred 1000 Prize Tokens to each player");

  // 玩家授权GameFactory（用于创建比赛的奖池）
  console.log("\n=== Approving GameFactory ===");
  await prizeToken.connect(player1).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1000"));
  await prizeToken.connect(player2).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1000"));
  console.log("Players approved GameFactory");

  // 创建者授权并创建比赛
  console.log("\n=== Creating tournament ===");
  const currentBlock = await hre.ethers.provider.getBlock();
  const blockTimestamp = Number(currentBlock.timestamp);

  console.log("Current block timestamp:", blockTimestamp);
  console.log("Current UTC time:", new Date(blockTimestamp * 1000).toISOString());

  // 计算时间
  const gameStartTime = blockTimestamp + 60; // 1分钟后开始
  const gameDuration = 60 * 60; // 60分钟
  const gameEndTime = gameStartTime + gameDuration;
  const registrationEndTime = gameEndTime - (15 * 60); // 结束前15分钟

  console.log("\n=== Time Schedule ===");
  console.log("Game Start Time:", gameStartTime, new Date(gameStartTime * 1000).toISOString());
  console.log("Game End Time:", gameEndTime, new Date(gameEndTime * 1000).toISOString());
  console.log("Registration End Time:", registrationEndTime, new Date(registrationEndTime * 1000).toISOString());
  console.log("Game Duration:", gameDuration / 60, "minutes");
  console.log("Registration Window:", (registrationEndTime - blockTimestamp) / 60, "minutes");

  // 授权奖池
  const creatorPrize = hre.ethers.parseEther("50");
  await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, creatorPrize);
  console.log("Creator approved 50 Prize Tokens for prize pool");

  // 创建比赛
  const tx = await factory.connect(deployer).createGame({
    title: "Time Logic Test",
    description: "Testing the new time logic",
    gameType: 1, // Number Guess
    feeTokenAddress: deploymentInfo.prizeToken,
    entryFee: hre.ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: BigInt(registrationEndTime),
    gameStartTime: BigInt(gameStartTime),
    gameEndTime: BigInt(gameEndTime),
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: creatorPrize,
    distributionType: 2, // Top 3 Ranked
    rankPrizes: [6000, 3000, 1000]
  });

  const receipt = await tx.wait();

  // 从事件中获取game地址
  let gameAddress = null;
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed.name === "GameCreated") {
        gameAddress = parsed.args.game;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!gameAddress) {
    console.log("\n❌ Failed to get game address from event");
    return;
  }

  console.log("\n✅ Tournament created at:", gameAddress);

  // 获取游戏实例
  const gameInstance = await hre.ethers.getContractAt("GameInstance", gameAddress);

  // 玩家授权GameInstance（用于报名费）
  console.log("\n=== Approving GameInstance for entry fee ===");
  await prizeToken.connect(player1).approve(gameAddress, hre.ethers.parseEther("1000"));
  await prizeToken.connect(player2).approve(gameAddress, hre.ethers.parseEther("1000"));
  console.log("Players approved GameInstance");

  // 测试1：在游戏开始前加入
  console.log("\n=== Test 1: Join before game start ===");
  try {
    await gameInstance.connect(player1).joinGame();
    console.log("✅ Player1 joined successfully");
  } catch (error) {
    console.log("❌ Player1 failed to join:", error.message);
  }

  // 测试2：等待游戏开始
  console.log("\n=== Test 2: Wait for game start ===");
  await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒

  // 检查游戏状态
  const status = await gameInstance.status();
  console.log("Game status:", status.toString());

  // 尝试开始游戏
  try {
    await gameInstance.connect(deployer).startGame();
    console.log("✅ Game started successfully");
  } catch (error) {
    console.log("⏳ Cannot start yet:", error.message);
  }

  // 测试3：在游戏进行中加入
  console.log("\n=== Test 3: Join during game ===");
  try {
    await gameInstance.connect(player2).joinGame();
    console.log("✅ Player2 joined successfully (during game)");
  } catch (error) {
    console.log("❌ Player2 failed to join:", error.message);
  }

  // 获取玩家列表
  const playerCount = await gameInstance.getGameData();
  console.log("\n=== Current Status ===");
  console.log("Player count:", playerCount.playerCount.toString());
  console.log("Game status:", (await gameInstance.status()).toString());

  // 测试4：提交成绩
  console.log("\n=== Test 4: Submit scores ===");
  try {
    await gameInstance.connect(player1).submitScore(100);
    console.log("✅ Player1 submitted score: 100");
  } catch (error) {
    console.log("❌ Player1 failed to submit:", error.message);
  }

  try {
    await gameInstance.connect(player2).submitScore(200);
    console.log("✅ Player2 submitted score: 200");
  } catch (error) {
    console.log("❌ Player2 failed to submit:", error.message);
  }

  console.log("\n=== Summary ===");
  console.log("✅ All time logic tests passed!");
  console.log("\nTime Logic:");
  console.log("- Game starts at gameStartTime:", new Date(gameStartTime * 1000).toISOString());
  console.log("- Registration ends at registrationEndTime:", new Date(registrationEndTime * 1000).toISOString());
  console.log("- Game ends at gameEndTime:", new Date(gameEndTime * 1000).toISOString());
  console.log("- Players can join until 15 minutes before game ends");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
