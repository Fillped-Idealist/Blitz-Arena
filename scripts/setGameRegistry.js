const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Setting GameRegistry for GameInstance...");

  // 获取部署信息
  const deploymentInfo = JSON.parse(
    fs.readFileSync("deployments/deployment.json", "utf8")
  );

  // 从命令行参数获取GameInstance地址
  const gameInstanceAddress = process.argv[2];

  if (!gameInstanceAddress) {
    console.error("\n❌ Error: GameInstance address is required");
    console.log("Usage: node scripts/setGameRegistry.js <gameInstanceAddress>");
    console.log("\nExample:");
    console.log("  node scripts/setGameRegistry.js 0x1234...");
    process.exit(1);
  }

  console.log("\nGameInstance address:", gameInstanceAddress);
  console.log("GameRegistry address:", deploymentInfo.gameRegistry);

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting with account:", deployer.address);

  // 获取GameInstance合约实例
  const GameInstance = await hre.ethers.getContractFactory("GameInstance");
  const gameInstance = GameInstance.attach(gameInstanceAddress);

  // 设置GameRegistry
  console.log("\nSetting GameRegistry...");
  const tx = await gameInstance.setGameRegistry(deploymentInfo.gameRegistry);
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");

  await tx.wait();
  console.log("\n✅ GameRegistry set successfully!");
  console.log("GameInstance can now verify game results from GameRegistry.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
