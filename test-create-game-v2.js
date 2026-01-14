const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== Creating Test Tournament v2 ===\n");

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

  // Get total games
  console.log("\nGetting total games...");
  try {
    const totalGames = await factory.getTotalGames();
    console.log("✓ Total games:", totalGames.toString());

    if (totalGames > 0) {
      // Get game at index 0 using the array accessor
      console.log("\nGetting game at index 0...");
      const gameAddress = await factory.allGames(0);
      console.log("✓ Game address:", gameAddress);

      // Get game instance
      const GameInstance = await hre.ethers.getContractFactory("GameInstance");
      const gameInstance = GameInstance.attach(gameAddress);

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

      // Add players
      console.log("\nAdding players...");
      const [player1, player2] = await hre.ethers.getSigners();
      const blzToken = MockToken.attach(deploymentInfo.blzToken);

      // Mint tokens to players
      await blzToken.connect(deployer).transfer(player1.address, hre.ethers.parseEther("1000"));
      await blzToken.connect(deployer).transfer(player2.address, hre.ethers.parseEther("1000"));
      console.log("✓ Tokens transferred to players");

      // Approve and join
      await blzToken.connect(player1).approve(gameAddress, hre.ethers.parseEther("100"));
      await gameInstance.connect(player1).joinGame();
      console.log("✓ Player1 joined");

      await blzToken.connect(player2).approve(gameAddress, hre.ethers.parseEther("100"));
      await gameInstance.connect(player2).joinGame();
      console.log("✓ Player2 joined");

      // Start game
      console.log("\nStarting game...");
      await gameInstance.startGame();
      console.log("✓ Game started");

      // Submit scores
      console.log("\nSubmitting scores...");
      await gameInstance.connect(player1).submitScore(100);
      console.log("✓ Player1 submitted score: 100");

      await gameInstance.connect(player2).submitScore(80);
      console.log("✓ Player2 submitted score: 80");

      // Set winners
      console.log("\nSetting winners...");
      await gameInstance.setWinners([player1.address]);
      console.log("✓ Winner set:", player1.address);

      // Distribute prizes
      console.log("\nDistributing prizes...");
      await gameInstance.distributePrize();
      console.log("✓ Prizes distributed");

      // Check prize
      const prizeToClaim = await gameInstance.prizeToClaimsAmount(player1.address);
      console.log("\nPlayer1 prize to claim:", hre.ethers.formatEther(prizeToClaim));

      // Claim prize
      console.log("\nClaiming prize...");
      await gameInstance.connect(player1).claimPrize();
      console.log("✓ Prize claimed");

      // Save info
      const tournamentInfo = {
        address: gameAddress,
        title: await gameInstance.title(),
        status: (await gameInstance.status()).toString(),
        creator: await gameInstance.creator(),
        entryFee: hre.ethers.formatEther(await gameInstance.entryFee()),
        prizePool: hre.ethers.formatEther(await gameInstance.prizePool()),
        winner: player1.address,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        "deployments/latest-tournament.json",
        JSON.stringify(tournamentInfo, null, 2)
      );

      console.log("\n✓ Full tournament flow completed!");
      console.log("Frontend URL: http://localhost:5000/tournament/" + gameAddress);
    }
  } catch (e) {
    console.log("✗ Failed:", e.message);
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
