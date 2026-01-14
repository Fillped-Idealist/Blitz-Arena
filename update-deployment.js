const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Read current deployment
  const currentDeployment = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));

  console.log("Current deployment:");
  console.log("  Factory:", currentDeployment.gameFactory);

  // Check if contracts exist
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(currentDeployment.gameFactory);

  console.log("\nChecking factory...");

  try {
    const totalGames = await factory.getTotalGames();
    console.log("✓ Factory is working");
    console.log("  Total games:", totalGames.toString());

    if (totalGames > 0) {
      const gameAddress = await factory.allGames(0);
      console.log("  Latest game:", gameAddress);
    }
  } catch (e) {
    console.log("✗ Factory not working:", e.message);

    // Need to redeploy
    console.log("\nRedeploying all contracts...");

    const [deployer] = await hre.ethers.getSigners();

    const MockToken = await hre.ethers.getContractFactory("MockERC20");
    const blzToken = await MockToken.deploy("BLZ", "BLZ", hre.ethers.parseEther("1000000"));
    await blzToken.waitForDeployment();
    const blzTokenAddress = await blzToken.getAddress();
    console.log("✓ BLZ Token:", blzTokenAddress);

    const prizeToken = await MockToken.deploy("PRIZE", "PRIZE", hre.ethers.parseEther("1000000"));
    await prizeToken.waitForDeployment();
    const prizeTokenAddress = await prizeToken.getAddress();
    console.log("✓ Prize Token:", prizeTokenAddress);

    const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
    const gameRegistry = await GameRegistry.deploy();
    await gameRegistry.waitForDeployment();
    const gameRegistryAddress = await gameRegistry.getAddress();
    console.log("✓ GameRegistry:", gameRegistryAddress);

    const factory2 = await GameFactory.deploy(blzTokenAddress);
    await factory2.waitForDeployment();
    const factoryAddress = await factory2.getAddress();
    console.log("✓ GameFactory:", factoryAddress);

    // Update deployment
    const newDeployment = {
      network: "hardhat",
      chainId: "31337",
      blzToken: blzTokenAddress,
      prizeToken: prizeTokenAddress,
      gameRegistry: gameRegistryAddress,
      gameFactory: factoryAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      "deployments/deployment.json",
      JSON.stringify(newDeployment, null, 2)
    );

    console.log("\n✓ Deployment info updated");

    // Verify
    console.log("\nVerifying new deployment...");
    const factory3 = GameFactory.attach(factoryAddress);
    const totalGames = await factory3.getTotalGames();
    console.log("✓ New factory working");
    console.log("  Total games:", totalGames.toString());
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
