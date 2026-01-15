const { ethers } = require("hardhat");

async function main() {
  console.log("=== Testing Deployed Contracts on Mantle Sepolia ===\n");

  // 部署的合约地址
  const blzTokenAddress = "0xcC4c864CF05b7398AEfD7857Ed0bD28c02f26353";
  const prizeTokenAddress = "0xDD32ceCE350c0e5bd4Cb9C8FcAe3927977AAD6B2";
  const userLevelManagerAddress = "0x6774Fd4342A2FE2cD04b9F75A229ee646fD0bb7E";
  const gameRegistryAddress = "0x24BF9bc997226Dd90A46410b4e38de9247a696a6";
  const gameFactoryAddress = "0x1E3d2c13208a25e65F1b90cBD694859B0E44DA51";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // 1. 检查BLZ Token
  console.log("\n1. Checking BLZ Token...");
  const blzToken = await ethers.getContractAt("MockERC20", blzTokenAddress);
  const blzBalance = await blzToken.balanceOf(deployer.address);
  console.log("✓ BLZ Token deployed at:", blzTokenAddress);
  console.log("  Deployer BLZ balance:", ethers.formatEther(blzBalance));

  // 2. 检查Prize Token
  console.log("\n2. Checking Prize Token...");
  const prizeToken = await ethers.getContractAt("MockERC20", prizeTokenAddress);
  const prizeBalance = await prizeToken.balanceOf(deployer.address);
  console.log("✓ Prize Token deployed at:", prizeTokenAddress);
  console.log("  Deployer Prize Token balance:", ethers.formatEther(prizeBalance));

  // 3. 检查UserLevelManager
  console.log("\n3. Checking UserLevelManager...");
  const userLevelManager = await ethers.getContractAt("UserLevelManager", userLevelManagerAddress);
  const managerBalance = await blzToken.balanceOf(userLevelManagerAddress);
  console.log("✓ UserLevelManager deployed at:", userLevelManagerAddress);
  console.log("  UserLevelManager BLZ balance:", ethers.formatEther(managerBalance));

  // 4. 检查GameRegistry
  console.log("\n4. Checking GameRegistry...");
  const gameRegistry = await ethers.getContractAt("GameRegistry", gameRegistryAddress);
  const registryAdmin = await gameRegistry.hasRole(await gameRegistry.DEFAULT_ADMIN_ROLE(), deployer.address);
  console.log("✓ GameRegistry deployed at:", gameRegistryAddress);
  console.log("  Deployer has DEFAULT_ADMIN_ROLE:", registryAdmin);

  // 5. 检查GameFactory
  console.log("\n5. Checking GameFactory...");
  const gameFactory = await ethers.getContractAt("GameFactory", gameFactoryAddress);
  const totalGames = await gameFactory.getTotalGames();
  console.log("✓ GameFactory deployed at:", gameFactoryAddress);
  console.log("  Total games created:", totalGames.toString());

  // 6. 测试创建比赛
  console.log("\n6. Testing createGame...");
  const now = Math.floor(Date.now() / 1000);
  const registrationEndTime = now + 3600;
  const gameStartTime = now + 7200;

  const gameConfig = {
    title: "Test Tournament - Mantle Sepolia",
    description: "Test tournament on Mantle Sepolia testnet",
    gameType: 4, // InfiniteMatch
    feeTokenAddress: prizeTokenAddress,
    entryFee: ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: prizeTokenAddress,
    prizePool: ethers.parseEther("100"),
    distributionType: 0, // WinnerTakesAll
    rankPrizes: [10000] // 100% to winner
  };

  // 授权PrizeToken
  const approveAmount = ethers.parseEther("1000");
  await prizeToken.approve(gameFactoryAddress, approveAmount);
  console.log("  Approved PrizeToken for GameFactory");

  // 创建比赛
  const tx = await gameFactory.createGame(gameConfig);
  const receipt = await tx.wait();
  console.log("  Transaction hash:", receipt.hash);

  // 获取新创建的比赛地址
  const allGames = await gameFactory.getAllGames();
  const gameAddress = allGames[allGames.length - 1];
  console.log("  New tournament created at:", gameAddress);

  // 检查比赛详情
  const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
  const title = await gameInstance.title();
  const gameType = await gameInstance.gameType();
  const status = await gameInstance.status();
  console.log("  Tournament title:", title);
  console.log("  Game type:", gameType.toString());
  console.log("  Status:", status.toString());

  // 7. 测试加入比赛
  console.log("\n7. Testing joinGame...");
  const entryFee = ethers.parseEther("5");

  // 授权GameInstance
  await prizeToken.approve(gameAddress, ethers.parseEther("100"));
  console.log("  Approved PrizeToken for GameInstance");

  // 加入比赛
  const joinTx = await gameInstance.joinGame();
  const joinReceipt = await joinTx.wait();
  console.log("  Join transaction hash:", joinReceipt.hash);

  // 检查是否已加入
  const isJoined = await gameInstance.isJoined(deployer.address);
  console.log("  Is joined:", isJoined);

  // 检查玩家数量（使用getGameData函数）
  const gameData = await gameInstance.getGameData();
  console.log("  Player count:", gameData.playerCount.toString());

  // 8. 检查用户等级
  console.log("\n8. Checking user level...");
  const userData = await userLevelManager.getUserData(deployer.address);
  console.log("  Total EXP:", ethers.formatEther(userData.totalExp));
  console.log("  Current level:", userData.currentLevel.toString());
  console.log("  EXP for next level:", ethers.formatEther(userData.expForNextLevel));

  console.log("\n=== All tests passed! ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
