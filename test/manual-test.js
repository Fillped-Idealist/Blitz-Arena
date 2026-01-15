const hre = require("hardhat");

async function main() {
  console.log("\n=== Blitz Arena 手动测试 ===\n");

  // 获取合约地址
  const { ethers } = hre;
  const [deployer, player1, player2] = await ethers.getSigners();

  console.log("测试账户:");
  console.log("  部署者:", deployer.address);
  console.log("  玩家1:", player1.address);
  console.log("  玩家2:", player2.address);

  // 读取部署的合约地址
  const deployment = require("../deployments/deployment.json");

  console.log("\n合约地址:");
  console.log("  GameFactory:", deployment.gameFactory);
  console.log("  GameRegistry:", deployment.gameRegistry);
  console.log("  UserLevelManager:", deployment.userLevelManager);
  console.log("  BLZ Token:", deployment.blzToken);
  console.log("  Prize Token:", deployment.prizeToken);

  // 获取合约实例
  const GameFactory = await ethers.getContractAt("GameFactory", deployment.gameFactory);
  const UserLevelManager = await ethers.getContractAt("UserLevelManager", deployment.userLevelManager);
  const BLZToken = await ethers.getContractAt("MockERC20", deployment.blzToken);
  const PrizeToken = await ethers.getContractAt("MockERC20", deployment.prizeToken);

  // 检查合约是否存在
  console.log("\n=== 检查合约状态 ===");

  const factoryCode = await ethers.provider.getCode(deployment.gameFactory);
  console.log("GameFactory 合约代码长度:", factoryCode.length);

  // 检查 GameFactory 的权限
  const GAME_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GAME_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const hasGameRole = await UserLevelManager.hasRole(GAME_ROLE, deployment.gameFactory);
  const hasAdminRole = await UserLevelManager.hasRole(ADMIN_ROLE, deployment.gameFactory);
  console.log("GameFactory 是否有 GAME_ROLE:", hasGameRole);
  console.log("GameFactory 是否有 ADMIN_ROLE:", hasAdminRole);

  // 检查代币余额
  const deployerBLZ = await BLZToken.balanceOf(deployer.address);
  const deployerPrize = await PrizeToken.balanceOf(deployer.address);
  console.log("\n部署者余额:");
  console.log("  BLZ Token:", ethers.formatEther(deployerBLZ));
  console.log("  Prize Token:", ethers.formatEther(deployerPrize));

  // 测试创建比赛
  console.log("\n=== 测试创建比赛 ===");

  const now = Math.floor(Date.now() / 1000);
  const registrationEndTime = now + 3600; // 1小时后
  const gameStartTime = registrationEndTime + 3600; // 2小时后

  const gameConfig = {
    title: "Test Tournament",
    description: "This is a test tournament",
    gameType: 1, // Number Guess
    feeTokenAddress: deployment.prizeToken,
    entryFee: ethers.parseEther("5"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: deployment.prizeToken,
    prizePool: ethers.parseEther("100"),
    distributionType: 0, // Winner Takes All
    rankPrizes: []
  };

  // 检查创建者奖池是否满足要求
  const minimumCreatorPrize = (5 * 10) / 2; // (entryFee × maxPlayers) / 2 = 25
  console.log("创建者奖池验证:");
  console.log("  最小要求:", minimumCreatorPrize);
  console.log("  实际提供:", ethers.formatEther(gameConfig.prizePool));

  console.log("比赛配置:", {
    ...gameConfig,
    entryFee: ethers.formatEther(gameConfig.entryFee),
    prizePool: ethers.formatEther(gameConfig.prizePool)
  });

  // 授权 Prize Token
  console.log("\n授权 Prize Token...");
  const approveTx = await PrizeToken.connect(deployer).approve(
    deployment.gameFactory,
    ethers.MaxUint256
  );
  await approveTx.wait();
  console.log("授权完成，交易哈希:", approveTx.hash);

  // 创建比赛
  console.log("\n创建比赛...");
  const createTx = await GameFactory.createGame(gameConfig);
  const receipt = await createTx.wait();

  console.log("比赛创建完成，交易哈希:", createTx.hash);

  // 解析事件获取游戏地址
  const event = receipt.logs.find(
    log => log.topics[0] === ethers.id("GameCreated(address)")
  );

  if (event) {
    const gameAddress = ethers.AbiCoder.defaultAbiCoder().decode(
      ["address"],
      event.data
    )[0];

    console.log("\n新比赛地址:", gameAddress);

    // 查询比赛列表
    console.log("\n=== 查询比赛列表 ===");
    const allGames = await GameFactory.getAllGames();
    console.log("总比赛数:", allGames.length);
    console.log("比赛列表:", allGames);

    const totalGames = await GameFactory.getTotalGames();
    console.log("总比赛数 (getTotalGames):", totalGames.toString());

    // 获取游戏详情
    console.log("\n=== 查询比赛详情 ===");
    const game = await GameFactory.games(allGames[0]);
    console.log("比赛详情:");
    console.log("  标题:", game.title);
    console.log("  描述:", game.description);
    console.log("  创建者:", game.creator);
    console.log("  状态:", game.status);
    console.log("  报名费:", ethers.formatEther(game.entryFee));
    console.log("  奖池:", ethers.formatEther(game.prizePool));
    console.log("  最小人数:", game.minPlayers.toString());
    console.log("  最大人数:", game.maxPlayers.toString());
    console.log("  当前人数:", game.currentPlayers.toString());
  }

  console.log("\n=== 测试完成 ===");
  console.log("\n现在你可以在浏览器中访问 http://localhost:5000 进行测试");
  console.log("请确保:");
  console.log("  1. MetaMask 已连接到 Hardhat Local 网络 (Chain ID: 3137)");
  console.log("  2. 使用上述测试账户之一");
  console.log("  3. 刷新浏览器页面");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
