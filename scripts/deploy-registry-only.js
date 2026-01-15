const hre = require("hardhat");

async function main() {
  console.log("=== Incremental Deployment - GameRegistry Only ===\n");

  // 读取现有的部署信息
  const fs = require("fs");
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));
    console.log("Existing deployment found:");
    console.log("  GameFactory:", deploymentInfo.gameFactory);
    console.log("  UserLevelManager:", deploymentInfo.userLevelManager);
    console.log("  Old GameRegistry:", deploymentInfo.gameRegistry);
  } catch (error) {
    console.error("Error reading deployment info:", error.message);
    console.log("Please run 'npx hardhat run scripts/deploy.js' first to deploy all contracts.");
    process.exit(1);
  }

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeploying with account:", deployer.address);

  // 只重新部署 GameRegistry
  console.log("\n=== Redeploying GameRegistry (removing score limits) ===");
  const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
  const gameRegistry = await GameRegistry.deploy();
  await gameRegistry.waitForDeployment();
  const gameRegistryAddress = await gameRegistry.getAddress();
  console.log("New GameRegistry deployed to:", gameRegistryAddress);

  // 更新部署信息
  deploymentInfo.gameRegistry = gameRegistryAddress;
  deploymentInfo.timestamp = new Date().toISOString();

  // 保存更新后的部署信息
  fs.writeFileSync(
    "deployments/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✓ Deployment info updated");

  console.log("\n=== Deployment Summary ===");
  console.log("New GameRegistry:", gameRegistryAddress);
  console.log("GameFactory:", deploymentInfo.gameFactory);
  console.log("UserLevelManager:", deploymentInfo.userLevelManager);
  console.log("\n⚠️  IMPORTANT:");
  console.log("1. Update src/lib/chainConfig.ts with the new GameRegistry address");
  console.log("2. New tournaments will use the new GameRegistry (no score limits)");
  console.log("3. Existing tournaments will continue to use the old GameRegistry");
  console.log("\nNew address to add to chainConfig.ts:");
  console.log(`GAME_REGISTRY: '${gameRegistryAddress}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
