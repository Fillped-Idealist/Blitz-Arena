const { ethers } = require("hardhat");

async function main() {
  console.log("=== Testing Immediate Start Join ===\n");

  const gameFactoryAddress = "0x1E3d2c13208a25e65F1b90cBD694859B0E44DA51";
  const prizeTokenAddress = "0xDD32ceCE350c0e5bd4Cb9C8FcAe3927977AAD6B2";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const gameFactory = await ethers.getContractAt("GameFactory", gameFactoryAddress);
  const prizeToken = await ethers.getContractAt("MockERC20", prizeTokenAddress);

  // 获取当前区块时间
  const currentBlock = await ethers.provider.getBlock('latest');
  const blockTimestamp = Number(currentBlock.timestamp);
  console.log("Current block timestamp:", blockTimestamp);
  console.log("Current time:", new Date(blockTimestamp * 1000).toISOString());

  // 创建立即开始的比赛
  console.log("\n1. Creating immediate start tournament...");
  const registrationEndTime = blockTimestamp + 60;
  const gameStartTime = blockTimestamp + 60;

  console.log("  Registration end time:", registrationEndTime, new Date(registrationEndTime * 1000).toISOString());
  console.log("  Game start time:", gameStartTime, new Date(gameStartTime * 1000).toISOString());

  const gameConfig = {
    title: "Immediate Start Test",
    description: "Testing immediate start mode",
    gameType: 4,
    feeTokenAddress: prizeTokenAddress,
    entryFee: ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: prizeTokenAddress,
    prizePool: ethers.parseEther("100"),
    distributionType: 0,
    rankPrizes: [10000]
  };

  // 授权
  await prizeToken.approve(gameFactoryAddress, ethers.parseEther("1000"));
  const tx = await gameFactory.createGame(gameConfig);
  const receipt = await tx.wait();

  const allGames = await gameFactory.getAllGames();
  const gameAddress = allGames[allGames.length - 1];
  console.log("  Tournament created at:", gameAddress);

  // 检查比赛详情
  const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
  const [title, regEnd, gameStart, status] = await Promise.all([
    gameInstance.title(),
    gameInstance.registrationEndTime(),
    gameInstance.gameStartTime(),
    gameInstance.status(),
  ]);

  console.log("\n  Tournament details:");
  console.log("    Title:", title);
  console.log("    Registration end:", Number(regEnd), new Date(Number(regEnd) * 1000).toISOString());
  console.log("    Game start:", Number(gameStart), new Date(Number(gameStart) * 1000).toISOString());
  console.log("    Status:", status.toString());

  // 获取新的区块时间
  const newBlock = await ethers.provider.getBlock('latest');
  const newTimestamp = Number(newBlock.timestamp);
  console.log("\n2. Current block timestamp after creation:", newTimestamp, new Date(newTimestamp * 1000).toISOString());
  console.log("  Time since creation:", newTimestamp - blockTimestamp, "seconds");

  // 检查是否可以加入
  console.log("\n3. Checking if can join...");
  console.log("  Is immediate start mode:", Number(regEnd) === Number(gameStart));
  console.log("  Current timestamp >= start time:", newTimestamp >= Number(gameStart));
  console.log("  Current timestamp >= start time + 900:", newTimestamp >= Number(gameStart) + 900);

  // 尝试加入
  console.log("\n4. Attempting to join...");
  try {
    await prizeToken.approve(gameAddress, ethers.parseEther("100"));
    const joinTx = await gameInstance.joinGame();
    const joinReceipt = await joinTx.wait();
    console.log("  Successfully joined! Transaction hash:", joinReceipt.hash);
  } catch (error) {
    console.error("  Failed to join:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
