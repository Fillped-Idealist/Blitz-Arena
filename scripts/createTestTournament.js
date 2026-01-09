const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Creating a test tournament...");

  // 获取部署信息
  const deploymentInfo = JSON.parse(
    fs.readFileSync("deployments/deployment.json", "utf8")
  );

  // 获取部署者账户
  const [deployer, player1, player2] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Player1:", player1.address);
  console.log("Player2:", player2.address);

  // 获取代币合约实例
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const blzToken = MockToken.attach(deploymentInfo.blzToken);
  const prizeToken = MockToken.attach(deploymentInfo.prizeToken);

  // 授权代币
  console.log("\nApproving tokens...");
  await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1050"));
  console.log("✓ Prize token approved");

  // 创建比赛配置
  const registrationEndTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后
  const gameStartTime = registrationEndTime + 300; // 报名结束5分钟后开始

  const gameConfig = {
    title: "数字挑战赛",
    description: "测试链游集成的猜数字游戏比赛",
    gameType: 1, // NumberGuess
    feeTokenAddress: deploymentInfo.blzToken,
    entryFee: hre.ethers.parseEther("10"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("1000"),
    distributionType: 0, // WinnerTakesAll
    rankPrizes: []
  };

  // 创建比赛
  console.log("\nCreating tournament...");
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  const tx = await factory.createGame(gameConfig);
  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("✓ Tournament created");

  // 调试：打印所有logs
  console.log("\nTransaction logs:", receipt.logs.length);
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`Log ${i}:`, {
      address: log.address,
      topics: log.topics,
      data: log.data
    });
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed) {
        console.log(`  -> Parsed as: ${parsed.name}`, parsed.args);
      }
    } catch (e) {
      // Ignore
    }
  }

  // 从交易收据中获取GameCreated事件
  const gameCreatedEvent = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed && parsed.name === "GameCreated";
    } catch (e) {
      return false;
    }
  });

  if (!gameCreatedEvent) {
    throw new Error("GameCreated event not found in transaction receipt");
  }

  const parsed = factory.interface.parseLog(gameCreatedEvent);
  const gameInstanceAddress = parsed.args[0];
  console.log("\nGameInstance address:", gameInstanceAddress);

  // 获取GameInstance合约实例
  const GameInstance = await hre.ethers.getContractFactory("GameInstance");
  const gameInstance = GameInstance.attach(gameInstanceAddress);

  // 设置GameRegistry
  console.log("\nSetting GameRegistry...");
  await gameInstance.setGameRegistry(deploymentInfo.gameRegistry);
  console.log("✓ GameRegistry set");

  // 给玩家分配BLZ代币用于报名
  console.log("\nDistributing tokens to players...");
  await blzToken.connect(deployer).transfer(player1.address, hre.ethers.parseEther("1000"));
  await blzToken.connect(deployer).transfer(player2.address, hre.ethers.parseEther("1000"));
  console.log("✓ Tokens distributed");

  // 玩家授权
  console.log("\nPlayers approving tokens...");
  await blzToken.connect(player1).approve(gameInstanceAddress, hre.ethers.parseEther("100"));
  await blzToken.connect(player2).approve(gameInstanceAddress, hre.ethers.parseEther("100"));
  console.log("✓ Players approved");

  // 玩家报名
  console.log("\nPlayers joining tournament...");
  await gameInstance.connect(player1).joinGame();
  console.log("✓ Player1 joined");
  await gameInstance.connect(player2).joinGame();
  console.log("✓ Player2 joined");

  // 开始比赛
  console.log("\nStarting tournament...");
  await gameInstance.startGame();
  console.log("✓ Tournament started");

  // 获取比赛数据
  const gameData = await gameInstance.getGameData();
  console.log("\n=== Tournament Details ===");
  console.log("Title:", gameData.title);
  console.log("Status:", ["Created", "Ongoing", "Ended", "PrizeDistributed", "Canceled"][gameData.status]);
  console.log("Game Type:", ["None", "NumberGuess", "RockPaperScissors", "QuickClick"][gameData.gameType]);
  console.log("Players:", gameData.playerCount.toString(), "/", gameData.maxPlayers.toString());
  console.log("Entry Fee:", hre.ethers.formatEther(gameData.entryFee), "BLZ");
  console.log("Prize Pool:", hre.ethers.formatEther(gameData.prizePool), "PRIZE");
  console.log("Game Start Time:", new Date(Number(gameData.gameStartTime) * 1000).toLocaleString());

  // 保存比赛信息
  const tournamentInfo = {
    gameInstanceAddress: gameInstanceAddress,
    gameData: {
      title: gameData.title,
      status: gameData.status,
      gameType: gameData.gameType,
      playerCount: gameData.playerCount.toString(),
      entryFee: hre.ethers.formatEther(gameData.entryFee),
      prizePool: hre.ethers.formatEther(gameData.prizePool),
      gameStartTime: gameData.gameStartTime.toString()
    },
    deployer: deployer.address,
    player1: player1.address,
    player2: player2.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "deployments/tournament.json",
    JSON.stringify(tournamentInfo, null, 2)
  );

  console.log("\n=== Access Information ===");
  console.log("\nFrontend URL:");
  console.log("  http://localhost:5000/tournament/" + gameInstanceAddress);
  console.log("\nUse this URL to test the game interface!");
  console.log("\nTournament info saved to deployments/tournament.json");

  console.log("\n✅ Setup complete! You can now:");
  console.log("  1. Visit the tournament page");
  console.log("  2. Connect wallet with Player1 or Player2 account");
  console.log("  3. Play the NumberGuess game");
  console.log("  4. Submit score to blockchain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
