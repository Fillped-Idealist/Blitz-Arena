const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Get deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Get token contract
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const prizeToken = MockToken.attach(deploymentInfo.prizeToken);

  // Approve
  console.log("Approving...");
  const approveTx = await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1050"));
  await approveTx.wait();
  console.log("✓ Approved");

  // Create game - capture the return value
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
  const gameStartTime = registrationEndTime + 300;

  const gameConfig = {
    title: "数字挑战赛",
    description: "测试比赛",
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
  console.log("Transaction hash:", tx.hash);

  // Wait for transaction receipt
  const receipt = await tx.wait();
  console.log("✓ Transaction confirmed");
  console.log("Gas used:", receipt.gasUsed.toString());

  // Now call getAllGames
  console.log("\nCalling getAllGames...");
  try {
    const allGames = await factory.getAllGames();
    console.log("✓ getAllGames success!");
    console.log("Total games:", allGames.length);
    console.log("All games:", allGames);

    if (allGames.length > 0) {
      const latestGame = allGames[allGames.length - 1];
      console.log("\nLatest game address:", latestGame);

      // Get game instance
      const GameInstance = await hre.ethers.getContractFactory("GameInstance");
      const gameInstance = GameInstance.attach(latestGame);

      console.log("\nGame details:");
      console.log("  Title:", await gameInstance.title());
      console.log("  Status:", await gameInstance.status());
      console.log("  Creator:", await gameInstance.creator());
      console.log("  Entry fee:", hre.ethers.formatEther(await gameInstance.entryFee()));
      console.log("  Prize pool:", hre.ethers.formatEther(await gameInstance.prizePool()));

      // Save tournament info
      const tournamentInfo = {
        address: latestGame,
        title: await gameInstance.title(),
        status: (await gameInstance.status()).toString(),
        creator: await gameInstance.creator(),
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        "deployments/latest-tournament.json",
        JSON.stringify(tournamentInfo, null, 2)
      );

      console.log("\n✓ Tournament info saved to deployments/latest-tournament.json");
      console.log("Frontend URL: http://localhost:5000/tournament/" + latestGame);
    }
  } catch (e) {
    console.error("❌ getAllGames failed:", e.message);
    console.error("Error details:", e);

    // Try to check contract storage directly
    console.log("\nChecking contract storage...");
    try {
      const storage = await hre.ethers.provider.getStorageAt(
        deploymentInfo.gameFactory,
        0x2
      );
      console.log("Storage at slot 2:", storage);
    } catch (e2) {
      console.log("Storage check failed:", e2.message);
    }
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
