const hre = require("hardhat");

async function main() {
  console.log("=== Incremental Deployment - GameRegistry (Localhost) ===\n");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 只重新部署 GameRegistry
  console.log("\n=== Redeploying GameRegistry (removing score limits) ===");
  const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
  const gameRegistry = await GameRegistry.deploy();
  await gameRegistry.waitForDeployment();
  const gameRegistryAddress = await gameRegistry.getAddress();
  console.log("New GameRegistry deployed to:", gameRegistryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("New GameRegistry:", gameRegistryAddress);
  console.log("\n⚠️  IMPORTANT:");
  console.log("Update src/lib/chainConfig.ts with the new GameRegistry address for chainId 31337:");
  console.log(`GAME_REGISTRY: '${gameRegistryAddress}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
