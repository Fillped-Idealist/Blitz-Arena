const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // 部署 Types 合约（作为库，不直接部署）
  console.log("Contracts are already imported in the solidity files");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 部署一个模拟的 BLZ Token 用于测试
  console.log("\n1. Deploying Mock BLZ Token...");
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const blzToken = await MockToken.deploy("BLZ Token", "BLZ", hre.ethers.parseEther("1000000"));
  await blzToken.waitForDeployment();
  const blzTokenAddress = await blzToken.getAddress();
  console.log("Mock BLZ Token deployed to:", blzTokenAddress);

  // 给部署者分配一些代币
  const deployerBalance = await blzToken.balanceOf(deployer.address);
  console.log("Deployer BLZ balance:", hre.ethers.formatEther(deployerBalance));

  // 部署 UserLevelManager 合约
  console.log("\n1.5. Deploying UserLevelManager...");
  const UserLevelManager = await hre.ethers.getContractFactory("UserLevelManager");
  const levelManager = await UserLevelManager.deploy(blzTokenAddress);
  await levelManager.waitForDeployment();
  const levelManagerAddress = await levelManager.getAddress();
  console.log("UserLevelManager deployed to:", levelManagerAddress);

  // 给 UserLevelManager 合约添加一些代币用于奖励
  console.log("Adding BLZ tokens to UserLevelManager for rewards...");
  await blzToken.transfer(levelManagerAddress, hre.ethers.parseEther("10000"));
  const levelManagerBalance = await blzToken.balanceOf(levelManagerAddress);
  console.log("UserLevelManager BLZ balance:", hre.ethers.formatEther(levelManagerBalance));

  // 部署 GameRegistry 合约
  console.log("\n2. Deploying GameRegistry...");
  const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
  const gameRegistry = await GameRegistry.deploy();
  await gameRegistry.waitForDeployment();
  const gameRegistryAddress = await gameRegistry.getAddress();
  console.log("GameRegistry deployed to:", gameRegistryAddress);

  // 部署 GameFactory 合约（传入 blzToken 和 levelManager）
  console.log("\n3. Deploying GameFactory...");
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = await GameFactory.deploy(blzTokenAddress, levelManagerAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("GameFactory deployed to:", factoryAddress);

  // 部署 Mock Prize Token 用于测试
  console.log("\n4. Deploying Mock Prize Token...");
  const prizeToken = await MockToken.deploy("Prize Token", "PRIZE", hre.ethers.parseEther("1000000"));
  await prizeToken.waitForDeployment();
  const prizeTokenAddress = await prizeToken.getAddress();
  console.log("Mock Prize Token deployed to:", prizeTokenAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("BLZ Token:", blzTokenAddress);
  console.log("Prize Token:", prizeTokenAddress);
  console.log("UserLevelManager:", levelManagerAddress);
  console.log("GameRegistry:", gameRegistryAddress);
  console.log("GameFactory:", factoryAddress);
  console.log("\n⚠️  IMPORTANT:");
  console.log("When creating a GameInstance, you must call:");
  console.log("  gameInstance.setGameRegistry('" + gameRegistryAddress + "')");

  // 保存部署信息
  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    blzToken: blzTokenAddress,
    prizeToken: prizeTokenAddress,
    userLevelManager: levelManagerAddress,
    gameRegistry: gameRegistryAddress,
    gameFactory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployments/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployments/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
