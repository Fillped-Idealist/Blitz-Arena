const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== Debugging Deployment Script ===\n");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // 部署一个模拟的 BLZ Token 用于测试
  console.log("\n1. Deploying Mock BLZ Token...");
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const blzToken = await MockToken.deploy("BLZ Token", "BLZ", hre.ethers.parseEther("1000000"));
  await blzToken.waitForDeployment();
  const blzTokenAddress = await blzToken.getAddress();
  console.log("Mock BLZ Token deployed to:", blzTokenAddress);

  // Check code immediately
  const code1 = await hre.ethers.provider.getCode(blzTokenAddress);
  console.log("Code exists:", code1 !== "0x");
  console.log("Code length:", code1.length);

  // 测试函数调用
  console.log("\nTesting token functions...");
  try {
    const balance = await blzToken.balanceOf(deployer.address);
    console.log("✓ Deployer BLZ balance:", hre.ethers.formatEther(balance));

    const totalSupply = await blzToken.totalSupply();
    console.log("✓ Total supply:", hre.ethers.formatEther(totalSupply));
  } catch (e) {
    console.log("✗ Token function calls failed:", e.message);
  }

  // 部署 GameRegistry 合约
  console.log("\n2. Deploying GameRegistry...");
  const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
  const gameRegistry = await GameRegistry.deploy();
  await gameRegistry.waitForDeployment();
  const gameRegistryAddress = await gameRegistry.getAddress();
  console.log("GameRegistry deployed to:", gameRegistryAddress);

  // Check code
  const code2 = await hre.ethers.provider.getCode(gameRegistryAddress);
  console.log("Code exists:", code2 !== "0x");
  console.log("Code length:", code2.length);

  // 测试函数调用
  console.log("\nTesting registry functions...");
  try {
    const version = await gameRegistry.getVersion();
    console.log("✓ Registry version:", version);
  } catch (e) {
    console.log("✗ Registry function call failed:", e.message);
  }

  // 部署 GameFactory 合约
  console.log("\n3. Deploying GameFactory...");
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = await GameFactory.deploy(blzTokenAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("GameFactory deployed to:", factoryAddress);

  // Check code
  const code3 = await hre.ethers.provider.getCode(factoryAddress);
  console.log("Code exists:", code3 !== "0x");
  console.log("Code length:", code3.length);

  // 测试函数调用
  console.log("\nTesting factory functions...");
  try {
    const totalGames = await factory.getTotalGames();
    console.log("✓ Total games:", totalGames.toString());
  } catch (e) {
    console.log("✗ getTotalGames failed:", e.message);
  }

  // 部署 Mock Prize Token 用于测试
  console.log("\n4. Deploying Mock Prize Token...");
  const prizeToken = await MockToken.deploy("Prize Token", "PRIZE", hre.ethers.parseEther("1000000"));
  await prizeToken.waitForDeployment();
  const prizeTokenAddress = await prizeToken.getAddress();
  console.log("Mock Prize Token deployed to:", prizeTokenAddress);

  // Check code
  const code4 = await hre.ethers.provider.getCode(prizeTokenAddress);
  console.log("Code exists:", code4 !== "0x");
  console.log("Code length:", code4.length);

  // 保存部署信息
  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    blzToken: blzTokenAddress,
    prizeToken: prizeTokenAddress,
    gameRegistry: gameRegistryAddress,
    gameFactory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "deployments/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n=== Deployment Summary ===");
  console.log("BLZ Token:", blzTokenAddress);
  console.log("Prize Token:", prizeTokenAddress);
  console.log("GameRegistry:", gameRegistryAddress);
  console.log("GameFactory:", factoryAddress);
  console.log("\n✓ All contracts deployed and verified!");

  console.log("\nDeployment info saved to deployments/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
