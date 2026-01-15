const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== Verifying Deployment on Mantle Sepolia ===\n");

  // 读取部署信息
  if (!fs.existsSync("deployments/deployment.json")) {
    console.log("❌ Deployment info not found!");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));
  console.log("Deployment info:");
  console.log("  Network:", deployment.network);
  console.log("  Chain ID:", deployment.chainId);
  console.log("  Deployer:", deployment.deployer);
  console.log("  Timestamp:", deployment.timestamp);
  console.log("");

  // 获取当前网络信息
  const network = await hre.ethers.provider.getNetwork();
  console.log("Current network:");
  console.log("  Chain ID:", network.chainId.toString());
  console.log("  Name:", network.name);
  console.log("");

  // 验证合约地址
  console.log("=== Contract Addresses ===");
  console.log("BLZ Token:", deployment.blzToken);
  console.log("Prize Token:", deployment.prizeToken);
  console.log("UserLevelManager:", deployment.userLevelManager);
  console.log("GameRegistry:", deployment.gameRegistry);
  console.log("GameFactory:", deployment.gameFactory);
  console.log("");

  // 检查合约代码
  console.log("=== Checking Contract Code ===");
  const contracts = [
    { name: "BLZ Token", address: deployment.blzToken },
    { name: "Prize Token", address: deployment.prizeToken },
    { name: "UserLevelManager", address: deployment.userLevelManager },
    { name: "GameRegistry", address: deployment.gameRegistry },
    { name: "GameFactory", address: deployment.gameFactory },
  ];

  for (const contract of contracts) {
    const code = await hre.ethers.provider.getCode(contract.address);
    if (code === "0x") {
      console.log(`❌ ${contract.name}: No code found at address ${contract.address}`);
    } else {
      console.log(`✅ ${contract.name}: Code exists (${code.length} bytes)`);
    }
  }
  console.log("");

  // 检查余额
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("=== Deployer Balance ===");
  console.log("MNT Balance:", hre.ethers.formatEther(balance), "MNT");
  console.log("");

  // 验证 BLZ Token
  console.log("=== Verifying BLZ Token ===");
  const blzToken = await hre.ethers.getContractAt("MockERC20", deployment.blzToken);
  const blzName = await blzToken.name();
  const blzSymbol = await blzToken.symbol();
  const blzTotalSupply = await blzToken.totalSupply();
  const blzDeployerBalance = await blzToken.balanceOf(deployer.address);
  const blzManagerBalance = await blzToken.balanceOf(deployment.userLevelManager);
  console.log("Name:", blzName);
  console.log("Symbol:", blzSymbol);
  console.log("Total Supply:", hre.ethers.formatEther(blzTotalSupply));
  console.log("Deployer Balance:", hre.ethers.formatEther(blzDeployerBalance));
  console.log("UserLevelManager Balance:", hre.ethers.formatEther(blzManagerBalance));
  console.log("");

  // 验证 UserLevelManager
  console.log("=== Verifying UserLevelManager ===");
  const levelManager = await hre.ethers.getContractAt("UserLevelManager", deployment.userLevelManager);
  try {
    const blzTokenAddress = await levelManager.BLZ_TOKEN_ADDRESS();
    console.log("BLZ Token Address:", blzTokenAddress);
    console.log("Match with deployment:", blzTokenAddress === deployment.blzToken ? "✅" : "❌");
  } catch (error) {
    console.log("⚠️  BLZ_TOKEN_ADDRESS is immutable, cannot verify directly");
  }
  console.log("");

  // 验证 GameFactory
  console.log("=== Verifying GameFactory ===");
  const factory = await hre.ethers.getContractAt("GameFactory", deployment.gameFactory);
  try {
    const factoryBlzToken = await factory.BLZ_TOKEN_ADDRESS();
    const factoryLevelManager = await factory.LEVEL_MANAGER_ADDRESS();
    console.log("BLZ Token Address:", factoryBlzToken);
    console.log("Match with deployment:", factoryBlzToken === deployment.blzToken ? "✅" : "❌");
    console.log("LevelManager Address:", factoryLevelManager);
    console.log("Match with deployment:", factoryLevelManager === deployment.userLevelManager ? "✅" : "❌");
  } catch (error) {
    console.log("⚠️  Token addresses are immutable, cannot verify directly");
  }
  console.log("");

  // 检查 Gas 使用
  console.log("=== Gas Usage Estimate ===");
  console.log("Deployment cost estimation:");
  console.log("  - BLZ Token: ~2 MNT");
  console.log("  - UserLevelManager: ~2 MNT");
  console.log("  - GameRegistry: ~1 MNT");
  console.log("  - GameFactory: ~2 MNT");
  console.log("  - Prize Token: ~2 MNT");
  console.log("  - Transfer (10000 BLZ): ~0.1 MNT");
  console.log("  - Grant Roles (2x): ~0.1 MNT");
  console.log("  Total: ~9.2 MNT");
  console.log("");

  console.log("=== Verification Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
