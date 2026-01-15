const { ethers } = require("hardhat");

async function main() {
  console.log("=== Testing Join Game Function ===\n");

  // 部署的合约地址
  const gameFactoryAddress = "0x1E3d2c13208a25e65F1b90cBD694859B0E44DA51";
  const prizeTokenAddress = "0xDD32ceCE350c0e5bd4Cb9C8FcAe3927977AAD6B2";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const gameFactory = await ethers.getContractAt("GameFactory", gameFactoryAddress);
  const prizeToken = await ethers.getContractAt("MockERC20", prizeTokenAddress);

  // 创建一个新比赛
  console.log("\n1. Creating a new tournament...");
  const now = Math.floor(Date.now() / 1000);
  const registrationEndTime = now + 3600; // 1 hour from now
  const gameStartTime = now + 7200; // 2 hours from now

  const gameConfig = {
    title: "Test Join Tournament",
    description: "Test tournament for join functionality",
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
  const isJoined = await gameInstance.isJoined(deployer.address);
  console.log("\n  Tournament details:");
  console.log(`    Title: ${title}`);
  console.log(`    Game type: ${gameType.toString()}`);
  console.log(`    Status: ${status.toString()}`);
  console.log(`    Is joined: ${isJoined}`);

  // 测试加入比赛
  console.log("\n2. Testing joinGame...");
  const entryFee = ethers.parseEther("5");

  // 授权GameInstance
  await prizeToken.approve(gameAddress, ethers.parseEther("100"));
  console.log("  Approved PrizeToken for GameInstance");

  // 检查授权余额
  const allowance = await prizeToken.allowance(deployer.address, gameAddress);
  console.log("  Current allowance:", ethers.formatEther(allowance));

  try {
    // 加入比赛
    const joinTx = await gameInstance.joinGame();
    const joinReceipt = await joinTx.wait();
    console.log("  Join transaction hash:", joinReceipt.hash);
    console.log("  Successfully joined the tournament!");

    // 检查是否已加入
    const isJoinedAfter = await gameInstance.isJoined(deployer.address);
    console.log("  Is joined after join:", isJoinedAfter);

    // 获取游戏数据
    const gameData = await gameInstance.getGameData();
    console.log("  Player count:", gameData.playerCount.toString());

  } catch (error) {
    console.error("  Failed to join tournament:", error.message);
  }

  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
