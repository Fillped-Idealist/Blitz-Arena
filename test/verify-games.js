const hre = require("hardhat");

async function main() {
  console.log("\n=== 验证比赛列表 ===\n");

  const { ethers } = hre;

  // 读取部署的合约地址
  const deployment = require("../deployments/deployment.json");

  // 获取合约实例
  const GameFactory = await ethers.getContractAt("GameFactory", deployment.gameFactory);

  // 查询比赛列表
  const allGames = await GameFactory.getAllGames();
  const totalGames = await GameFactory.getTotalGames();

  console.log("总比赛数 (getTotalGames):", totalGames.toString());
  console.log("比赛列表长度:", allGames.length);
  console.log("比赛地址列表:");

  for (let i = 0; i < allGames.length; i++) {
    const gameAddress = allGames[i];
    console.log(`  ${i + 1}. ${gameAddress}`);

    // 获取比赛详情
    const GameInstance = await ethers.getContractAt("GameInstance", gameAddress);

    const title = await GameInstance.title();
    const creator = await GameInstance.creator();
    const status = await GameInstance.status();
    const entryFee = await GameInstance.entryFee();
    const prizePool = await GameInstance.prizePool();
    const maxPlayers = await GameInstance.maxPlayers();

    console.log(`     标题: ${title}`);
    console.log(`     创建者: ${creator}`);
    console.log(`     状态: ${status}`);
    console.log(`     报名费: ${ethers.formatEther(entryFee)} PRIZE`);
    console.log(`     奖池: ${ethers.formatEther(prizePool)} PRIZE`);
    console.log(`     最大人数: ${maxPlayers}`);
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
