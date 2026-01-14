const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== Creating Test Tournament ===\n");

  const deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);

  // Get contracts
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const prizeToken = MockToken.attach(deploymentInfo.prizeToken);
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  // Approve
  console.log("\nApproving...");
  const approveTx = await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1050"));
  await approveTx.wait();
  console.log("✓ Approved");

  // Create game
  const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
  const gameStartTime = registrationEndTime + 300;

  const gameConfig = {
    title: "Test Game",
    description: "Test",
    gameType: 1,
    feeTokenAddress: deploymentInfo.blzToken,
    entryFee: hre.ethers.parseEther("10"),
    minPlayers: 2,
    maxPlayers: 10,
    registrationEndTime: registrationEndTime,
    gameStartTime: gameStartTime,
    prizeTokenAddress: deploymentInfo.prizeToken,
    prizePool: hre.ethers.parseEther("1000"),
    distributionType: 0,
    rankPrizes: []
  };

  console.log("\nCreating game...");
  const tx = await factory.createGame(gameConfig);
  const receipt = await tx.wait();

  console.log("✓ Game created");
  console.log("Gas used:", receipt.gasUsed.toString());

  // Get all games
  console.log("\nGetting all games...");
  const allGames = await factory.getAllGames();
  console.log("Total games:", allGames.length);

  if (allGames.length > 0) {
    const latestGame = allGames[allGames.length - 1];
    console.log("Latest game:", latestGame);

    // Get game instance
    const GameInstance = await hre.ethers.getContractFactory("GameInstance");
    const gameInstance = GameInstance.attach(latestGame);

    console.log("\nGame details:");
    console.log("  Title:", await gameInstance.title());
    console.log("  Status:", await gameInstance.status());
    console.log("  Creator:", await gameInstance.creator());
    console.log("  Entry fee:", hre.ethers.formatEther(await gameInstance.entryFee()));
    console.log("  Prize pool:", hre.ethers.formatEther(await gameInstance.prizePool()));

    // Set GameRegistry
    console.log("\nSetting GameRegistry...");
    await gameInstance.setGameRegistry(deploymentInfo.gameRegistry);
    console.log("✓ GameRegistry set");

    // Save info
    const tournamentInfo = {
      address: latestGame,
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

    console.log("\n✓ Tournament created!");
    console.log("Frontend URL: http://localhost:5000/tournament/" + latestGame);
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
