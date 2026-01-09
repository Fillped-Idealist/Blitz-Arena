const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Creating a simple test tournament...");

  // 获取部署者账户
  const [deployer, player1] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Player1:", player1.address);

  // 手动部署GameInstance
  console.log("\n1. Deploying GameInstance...");
  const GameInstance = await hre.ethers.getContractFactory("GameInstance");
  const gameInstance = await GameInstance.deploy();
  await gameInstance.waitForDeployment();
  const gameInstanceAddress = await gameInstance.getAddress();
  console.log("✓ GameInstance deployed to:", gameInstanceAddress);

  // 部署GameRegistry
  console.log("\n2. Deploying GameRegistry...");
  const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
  const gameRegistry = await GameRegistry.deploy();
  await gameRegistry.waitForDeployment();
  const gameRegistryAddress = await gameRegistry.getAddress();
  console.log("✓ GameRegistry deployed to:", gameRegistryAddress);

  // 部署代币
  console.log("\n3. Deploying Mock Tokens...");
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const blzToken = await MockToken.deploy("BLZ Token", "BLZ", hre.ethers.parseEther("1000000"));
  await blzToken.waitForDeployment();
  const blzTokenAddress = await blzToken.getAddress();
  console.log("✓ BLZ Token deployed to:", blzTokenAddress);

  const prizeToken = await MockToken.deploy("Prize Token", "PRIZE", hre.ethers.parseEther("1000000"));
  await prizeToken.waitForDeployment();
  const prizeTokenAddress = await prizeToken.getAddress();
  console.log("✓ Prize Token deployed to:", prizeTokenAddress);

  // 给玩家分配代币
  await blzToken.transfer(player1.address, hre.ethers.parseEther("1000"));
  console.log("✓ Transferred 1000 BLZ to player1");

  // 初始化GameInstance
  const now = Math.floor(Date.now() / 1000);
  const registrationEndTime = now + 3600; // 1小时后
  const gameStartTime = registrationEndTime + 300; // 报名结束5分钟后开始

  console.log("\n4. Initializing GameInstance...");
  const tx = await gameInstance.initialize({
    title: "数字挑战赛",
    description: "测试链游集成的猜数字游戏比赛",
    gameType: 1, // NumberGuess
    feeTokenAddress: blzTokenAddress,
    entryFee: hre.ethers.parseEther("10"),
    minPlayers: 1, // 改为1以便测试
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: prizeTokenAddress,
    prizePool: hre.ethers.parseEther("1000"),
    distributionType: 0, // WinnerTakesAll
    rankPrizes: []
  }, deployer.address);

  await tx.wait();
  console.log("✓ GameInstance initialized");

  // 设置GameRegistry
  console.log("\n5. Setting GameRegistry...");
  await gameInstance.setGameRegistry(gameRegistryAddress);
  console.log("✓ GameRegistry set");

  // 玩家授权代币
  console.log("\n6. Player approving tokens...");
  await blzToken.connect(player1).approve(gameInstanceAddress, hre.ethers.parseEther("100"));
  console.log("✓ Player approved tokens");

  // 玩家报名
  console.log("\n7. Player joining tournament...");
  await gameInstance.connect(player1).joinGame();
  console.log("✓ Player joined");

  // 开始比赛
  console.log("\n8. Starting tournament...");
  console.log("Waiting for registration time to pass...");
  await hre.ethers.provider.send("evm_increaseTime", [3600]); // 推进1小时
  await hre.ethers.provider.send("evm_mine"); // 挖一个新的区块
  await gameInstance.startGame();
  console.log("✓ Tournament started");

  // 获取比赛数据
  const gameData = await gameInstance.getGameData();
  console.log("\n=== Tournament Details ===");
  console.log("Title:", gameData.title);
  console.log("Status:", ["Created", "Ongoing", "Ended", "PrizeDistributed", "Canceled"][gameData.status]);
  console.log("Game Type:", ["None", "NumberGuess", "RockPaperScissors", "QuickClick"][gameData.gameType]);
  console.log("Players:", gameData.playerCount.toString());
  console.log("Entry Fee:", hre.ethers.formatEther(gameData.entryFee), "BLZ");
  console.log("Prize Pool:", hre.ethers.formatEther(gameData.prizePool), "PRIZE");
  console.log("Game Start Time:", new Date(Number(gameData.gameStartTime) * 1000).toLocaleString());

  // 保存比赛信息
  const tournamentInfo = {
    gameInstanceAddress: gameInstanceAddress,
    gameRegistryAddress: gameRegistryAddress,
    blzTokenAddress: blzTokenAddress,
    prizeTokenAddress: prizeTokenAddress,
    gameData: {
      title: gameData.title,
      status: Number(gameData.status),
      gameType: Number(gameData.gameType),
      entryFee: hre.ethers.formatEther(gameData.entryFee),
      prizePool: hre.ethers.formatEther(gameData.prizePool)
    },
    deployer: deployer.address,
    player1: player1.address,
    player1PK: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    timestamp: new Date().toISOString()
  };

  // 确保deployments目录存在
  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  fs.writeFileSync(
    "deployments/tournament.json",
    JSON.stringify(tournamentInfo, null, 2)
  );

  console.log("\n=== Access Information ===");
  console.log("\nFrontend URL:");
  console.log("  http://localhost:5000/tournament/" + gameInstanceAddress);
  console.log("\nNetwork: Hardhat Local (Chain ID: 31337)");
  console.log("\nPlayer1 Account for testing:");
  console.log("  Address:", player1.address);
  console.log("  Private Key:", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("\n⚠️  To test:");
  console.log("  1. Open http://localhost:5000");
  console.log("  2. Connect MetaMask with Hardhat network");
  console.log("  3. Import account with private key above");
  console.log("  4. Visit tournament page");
  console.log("  5. Play NumberGuess game and submit score");

  console.log("\n✅ Setup complete!");
  console.log("\nTournament info saved to deployments/tournament.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
