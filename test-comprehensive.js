const { ethers } = require("hardhat");

async function main() {
  console.log("=== Comprehensive Test ===\n");

  const gameFactoryAddress = "0x1E3d2c13208a25e65F1b90cBD694859B0E44DA51";
  const prizeTokenAddress = "0xDD32ceCE350c0e5bd4Cb9C8FcAe3927977AAD6B2";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const gameFactory = await ethers.getContractAt("GameFactory", gameFactoryAddress);
  const prizeToken = await ethers.getContractAt("MockERC20", prizeTokenAddress);

  // 获取当前区块时间
  const currentBlock = await ethers.provider.getBlock('latest');
  const blockTimestamp = Number(currentBlock.timestamp);
  console.log("Current block timestamp:", blockTimestamp, new Date(blockTimestamp * 1000).toISOString());

  // 创建立即开始的比赛
  console.log("\n1. Creating immediate start tournament (simulating frontend)...");
  const registrationEndTime = blockTimestamp + 60;
  const gameStartTime = blockTimestamp + 60;

  const gameConfig = {
    title: "Immediate Start Tournament",
    description: "Test",
    gameType: 4, // Infinite Match
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

  await prizeToken.approve(gameFactoryAddress, ethers.parseEther("1000"));
  const tx = await gameFactory.createGame(gameConfig);
  await tx.wait();

  const allGames = await gameFactory.getAllGames();
  const gameAddress = allGames[allGames.length - 1];
  console.log("  Tournament created at:", gameAddress);

  // 等待一段时间，模拟用户创建后尝试加入
  console.log("\n2. Waiting 30 seconds to simulate user delay...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  const newBlock = await ethers.provider.getBlock('latest');
  const newTimestamp = Number(newBlock.timestamp);
  console.log("  Current timestamp after delay:", newTimestamp, new Date(newTimestamp * 1000).toISOString());
  console.log("  Time passed:", newTimestamp - blockTimestamp, "seconds");

  // 模拟前端检查
  console.log("\n3. Simulating frontend join checks...");
  const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
  const [regEnd, gameStart, status, gameType, maxPlayers] = await Promise.all([
    gameInstance.registrationEndTime(),
    gameInstance.gameStartTime(),
    gameInstance.status(),
    gameInstance.gameType(),
    gameInstance.maxPlayers(),
  ]);

  const regEndTimeNum = Number(regEnd);
  const startTimeNum = Number(gameStart);

  console.log("  Registration end time:", regEndTimeNum, new Date(regEndTimeNum * 1000).toISOString());
  console.log("  Game start time:", startTimeNum, new Date(startTimeNum * 1000).toISOString());
  console.log("  Current timestamp:", newTimestamp, new Date(newTimestamp * 1000).toISOString());
  console.log("  Status:", status.toString(), status === BigInt(0) ? "Created" : "Not Created");
  console.log("  Game Type:", gameType.toString());
  console.log("  Max Players:", maxPlayers.toString());

  console.log("\n  Checking time logic...");
  console.log("    Is immediate start mode:", regEndTimeNum === startTimeNum);
  console.log("    Current timestamp >= start time:", newTimestamp >= startTimeNum);

  console.log("\n  Old frontend logic (before fix):");
  if (regEndTimeNum === startTimeNum) {
    const timeUntilDeadline = startTimeNum + 900 - newTimestamp;
    console.log("    Immediate start mode. Time until deadline:", timeUntilDeadline, "seconds");
    if (newTimestamp >= startTimeNum + 900) {
      console.log("    ❌ OLD LOGIC: Would throw error - Registration time has passed");
    } else {
      console.log("    ✓ OLD LOGIC: Would allow join");
    }
  }

  console.log("\n  New frontend logic (after fix):");
  if (status !== BigInt(0)) {
    console.log("    ❌ NEW LOGIC: Status is not Created - Cannot join");
  } else {
    if (regEndTimeNum === startTimeNum) {
      console.log("    ✓ NEW LOGIC: Immediate start mode + Created status - Can join");
    } else {
      if (newTimestamp >= regEndTimeNum) {
        console.log("    ❌ NEW LOGIC: Registration time has passed - Cannot join");
      } else {
        console.log("    ✓ NEW LOGIC: Normal mode + Before reg end - Can join");
      }
    }
  }

  // 尝试实际加入
  console.log("\n4. Attempting actual join...");
  try {
    await prizeToken.approve(gameAddress, ethers.parseEther("100"));
    const joinTx = await gameInstance.joinGame();
    const joinReceipt = await joinTx.wait();
    console.log("  ✓ Successfully joined! Transaction hash:", joinReceipt.hash);

    const isJoined = await gameInstance.isJoined(deployer.address);
    console.log("  Is joined:", isJoined);

    const gameData = await gameInstance.getGameData();
    console.log("  Player count:", gameData.playerCount.toString());
  } catch (error) {
    console.log("  ❌ Failed to join:", error.message);
  }

  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
