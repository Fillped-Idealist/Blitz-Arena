const hre = require("hardhat");

async function main() {
  console.log("Checking GameFactory state...");

  const factoryAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(factoryAddress);

  console.log("\nFactory address:", factoryAddress);

  try {
    // 使用ethers的provider
    const provider = hre.ethers.provider;

    // 获取工厂余额
    const factoryBalance = await provider.getBalance(factoryAddress);
    console.log("Factory balance:", hre.ethers.formatEther(factoryBalance), "ETH");

    // 直接使用合约实例调用getAllGames
    console.log("\nCalling getAllGames via contract instance...");
    const allGames = await factory.getAllGames();
    console.log("All games:", allGames);
    console.log("Games array length:", allGames.length);

  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
