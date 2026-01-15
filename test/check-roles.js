const hre = require("hardhat");

async function main() {
  console.log("\n=== 检查权限配置 ===\n");

  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  // 读取部署的合约地址
  const deployment = require("../deployments/deployment.json");

  // 获取合约实例
  const UserLevelManager = await ethers.getContractAt("UserLevelManager", deployment.userLevelManager);
  const GameFactory = await ethers.getContractAt("GameFactory", deployment.gameFactory);

  console.log("合约地址:");
  console.log("  UserLevelManager:", deployment.userLevelManager);
  console.log("  GameFactory:", deployment.gameFactory);

  // 计算 GAME_ROLE 哈希
  const GAME_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GAME_ROLE"));
  console.log("\nGAME_ROLE:", GAME_ROLE);

  // 检查 GameFactory 是否有 GAME_ROLE
  const hasRole = await UserLevelManager.hasRole(GAME_ROLE, deployment.gameFactory);
  console.log("\nGameFactory 是否有 GAME_ROLE:", hasRole);

  if (!hasRole) {
    console.log("\n❌ GameFactory 没有 GAME_ROLE！正在授予...");
    const tx = await UserLevelManager.grantRole(GAME_ROLE, deployment.gameFactory);
    await tx.wait();
    console.log("✅ GAME_ROLE 已授予给 GameFactory");
  } else {
    console.log("\n✅ GameFactory 已有 GAME_ROLE");
  }

  // 尝试调用 addExp 测试权限
  console.log("\n=== 测试调用 addExp ===");
  try {
    const testTx = await UserLevelManager.addExp(deployer.address, ethers.parseEther("1"));
    await testTx.wait();
    console.log("✅ addExp 调用成功");
  } catch (error) {
    console.log("❌ addExp 调用失败:", error.message);
  }

  // 检查部署者的经验值
  const exp = await UserLevelManager.getUserExp(deployer.address);
  console.log("\n部署者经验值:", ethers.formatEther(exp));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
