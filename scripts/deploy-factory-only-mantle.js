const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Incremental deployment to Mantle Sepolia Testnet...\n");

  // 读取现有部署信息
  const deploymentInfoPath = path.join(__dirname, "..", "deployments", "deployment.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));

  console.log("=== Existing Deployments (Mantle Sepolia) ===");
  console.log("BLZ Token:", deploymentInfo.blzToken);
  console.log("Prize Token:", deploymentInfo.prizeToken);
  console.log("UserLevelManager:", deploymentInfo.userLevelManager);
  console.log("GameRegistry:", deploymentInfo.gameRegistry);
  console.log("Old GameFactory:", deploymentInfo.gameFactory);
  console.log("\n");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 获取现有合约实例
  const blzToken = await hre.ethers.getContractAt("MockERC20", deploymentInfo.blzToken);
  const levelManager = await hre.ethers.getContractAt("UserLevelManager", deploymentInfo.userLevelManager);
  const gameRegistry = await hre.ethers.getContractAt("GameRegistry", deploymentInfo.gameRegistry);

  // 部署新的 GameFactory
  console.log("Deploying new GameFactory with updated joinGame and time logic...");
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = await GameFactory.deploy(deploymentInfo.blzToken, deploymentInfo.userLevelManager);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("New GameFactory deployed to:", factoryAddress);

  // 授予 GAME_ROLE 权限
  console.log("\nGranting GAME_ROLE to new GameFactory...");
  const GAME_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("GAME_ROLE"));
  const roleTx1 = await levelManager.grantRole(GAME_ROLE, factoryAddress);
  await roleTx1.wait();
  console.log("GAME_ROLE granted to new GameFactory");

  // 授予 ADMIN_ROLE 权限
  console.log("Granting ADMIN_ROLE to new GameFactory...");
  const ADMIN_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ADMIN_ROLE"));
  const roleTx2 = await levelManager.grantRole(ADMIN_ROLE, factoryAddress);
  await roleTx2.wait();
  console.log("ADMIN_ROLE granted to new GameFactory");

  // 更新部署信息
  deploymentInfo.gameFactory = factoryAddress;
  deploymentInfo.timestamp = new Date().toISOString();
  deploymentInfo.notes = "GameFactory redeployed with updated time logic (registration ends 15 min before game ends)";

  // 保存更新后的部署信息
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info updated");

  console.log("\n=== Deployment Summary ===");
  console.log("GameFactory (OLD):", deploymentInfo.gameFactory);
  console.log("GameFactory (NEW):", factoryAddress);
  console.log("\n✅ Incremental deployment completed!");
  console.log("\n⚠️  IMPORTANT:");
  console.log("1. Update chainConfig.ts with the new GameFactory address");
  console.log("2. Old GameInstance contracts will still use the old logic");
  console.log("3. New tournaments created with the new GameFactory will use the updated logic");
  console.log("\n📝 Changes in this deployment:");
  console.log("- Time logic: registrationEndTime = gameEndTime - 15 minutes");
  console.log("- Game start check: uses gameStartTime instead of registrationEndTime");
  console.log("- Join game check: simplified to use registrationEndTime only");
  console.log("- Submit score check: added gameEndTime check");
  console.log("- Min game duration: 30 minutes (reduced from 24 hours)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
