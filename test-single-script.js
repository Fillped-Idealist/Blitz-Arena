const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== Single Script Test ===\n");

  // Step 1: Deploy all contracts
  console.log("Step 1: Deploying contracts...");
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

  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = await GameFactory.deploy(blzTokenAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✓ GameFactory:", factoryAddress);

  // Step 2: Create game
  console.log("\nStep 2: Creating game...");

  // Approve
  await prizeToken.connect(deployer).approve(factoryAddress, hre.ethers.parseEther("1050"));

  // Create game
  const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
  const gameStartTime = registrationEndTime + 300;

  const gameConfig = {
    title: "Test Game",
    description: "Test",
    gameType: 1,
    feeTokenAddress: blzTokenAddress,
    entryFee: hre.ethers.parseEther("10"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: prizeTokenAddress,
    prizePool: hre.ethers.parseEther("1000"),
    distributionType: 0,
    rankPrizes: []
  };

  const tx = await factory.createGame(gameConfig);
  const receipt = await tx.wait();
  console.log("✓ Game created. Gas used:", receipt.gasUsed.toString());

  // Step 3: Query games
  console.log("\nStep 3: Querying games...");

  // Try getTotalGames
  try {
    const totalGames = await factory.getTotalGames();
    console.log("✓ Total games:", totalGames.toString());

    if (totalGames > 0) {
      const gameAddress = await factory.allGames(0);
      console.log("✓ Game address:", gameAddress);

      const GameInstance = await hre.ethers.getContractFactory("GameInstance");
      const gameInstance = GameInstance.attach(gameAddress);

      console.log("\nGame details:");
      console.log("  Title:", await gameInstance.title());
      console.log("  Status:", await gameInstance.status());
      console.log("  Entry fee:", hre.ethers.formatEther(await gameInstance.entryFee()));
      console.log("  Prize pool:", hre.ethers.formatEther(await gameInstance.prizePool()));

      // Set GameRegistry
      await gameInstance.setGameRegistry(gameRegistryAddress);
      console.log("\n✓ GameRegistry set");

      // Save info
      const tournamentInfo = {
        address: gameAddress,
        title: await gameInstance.title(),
        status: (await gameInstance.status()).toString(),
        creator: await gameInstance.creator(),
        entryFee: hre.ethers.formatEther(await gameInstance.entryFee()),
        prizePool: hre.ethers.formatEther(await gameInstance.prizePool()),
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        "deployments/latest-tournament.json",
        JSON.stringify(tournamentInfo, null, 2)
      );

      console.log("\n✓ Tournament created and verified!");
      console.log("Frontend URL: http://localhost:5000/tournament/" + gameAddress);

      process.exit(0);
    }
  } catch (e) {
    console.log("✗ Failed:", e.message);
    console.log("Stack:", e.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
