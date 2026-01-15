const { ethers } = require("hardhat");

async function main() {
  console.log("=== Debugging Tournament Status ===\n");

  // 部署的合约地址
  const gameFactoryAddress = "0x1E3d2c13208a25e65F1b90cBD694859B0E44DA51";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // 检查GameFactory
  console.log("\nChecking GameFactory...");
  const gameFactory = await ethers.getContractAt("GameFactory", gameFactoryAddress);
  const totalGames = await gameFactory.getTotalGames();
  console.log("Total games created:", totalGames.toString());

  if (totalGames.toString() === "0") {
    console.log("\nNo games found. Let's create one...");
    return;
  }

  // 获取所有游戏
  const allGames = await gameFactory.getAllGames();
  console.log("\nAll tournament addresses:");
  allGames.forEach((addr, idx) => {
    console.log(`  ${idx + 1}. ${addr}`);
  });

  // 检查每个游戏的详情
  for (let i = 0; i < allGames.length; i++) {
    const gameAddress = allGames[i];
    console.log(`\n=== Tournament ${i + 1}: ${gameAddress} ===`);

    const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);

    const title = await gameInstance.title();
    const gameType = await gameInstance.gameType();
    const status = await gameInstance.status();
    const minPlayers = await gameInstance.minPlayers();
    const maxPlayers = await gameInstance.maxPlayers();
    const registrationEndTime = await gameInstance.registrationEndTime();
    const gameStartTime = await gameInstance.gameStartTime();
    const entryFee = await gameInstance.entryFee();

    // 获取玩家数量
    const gameData = await gameInstance.getGameData();
    const playerCount = gameData.playerCount;

    const now = Math.floor(Date.now() / 1000);

    console.log(`  Title: ${title}`);
    console.log(`  Game Type: ${gameType.toString()}`);
    console.log(`  Status: ${status.toString()} (${getStatusLabel(status)})`);
    console.log(`  Players: ${playerCount}/${Number(maxPlayers)}`);
    console.log(`  Entry Fee: ${ethers.formatEther(entryFee)} tokens`);
    console.log(`  Registration End Time: ${registrationEndTime.toString()} (${new Date(Number(registrationEndTime) * 1000).toISOString()})`);
    console.log(`  Game Start Time: ${gameStartTime.toString()} (${new Date(Number(gameStartTime) * 1000).toISOString()})`);
    console.log(`  Current Time: ${now} (${new Date(now * 1000).toISOString()})`);
    console.log(`  Is Immediate Start: ${Number(registrationEndTime) === Number(gameStartTime)}`);

    // 检查是否已加入
    const isJoined = await gameInstance.isJoined(deployer.address);
    console.log(`  Deployer is joined: ${isJoined}`);

    // 检查是否可以加入
    const canJoin = (
      status.toString() === "0" &&
      playerCount < Number(maxPlayers) &&
      !isJoined &&
      (Number(registrationEndTime) === Number(gameStartTime)
        ? now < Number(gameStartTime) + 900
        : now < Number(registrationEndTime))
    );
    console.log(`  Can join: ${canJoin}`);
    console.log(`  Reason: ${getCannotJoinReason(status, playerCount, maxPlayers, isJoined, registrationEndTime, gameStartTime, now)}`);
  }
}

function getStatusLabel(status) {
  const statusMap = {
    "0": "Created",
    "1": "Ongoing",
    "2": "Ended",
    "3": "PrizeDistributed",
    "4": "Canceled"
  };
  return statusMap[status.toString()] || "Unknown";
}

function getCannotJoinReason(status, playerCount, maxPlayers, isJoined, regEndTime, gameStartTime, now) {
  if (status.toString() !== "0") {
    return `Game is ${getStatusLabel(status)}`;
  }
  if (isJoined) {
    return "Already joined";
  }
  if (playerCount >= maxPlayers) {
    return "Game is full";
  }

  // 检查报名时间
  if (Number(regEndTime) === Number(gameStartTime)) {
    // 立即开始模式
    if (now >= Number(gameStartTime) + 900) {
      return "Registration time has passed (more than 15 mins after start)";
    }
  } else {
    // 正常模式
    if (now >= Number(regEndTime)) {
      return "Registration time has passed";
    }
  }

  return "Can join";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
