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

  // Create game
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
  const receipt = await tx.wait();

  console.log("✓ Transaction confirmed");
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Transaction hash:", tx.hash);

  // Try using callStatic to get the return value
  console.log("\nTrying to get game address from transaction...");

  // Get the contract instance created from the transaction
  // For contracts created via `new`, we can find the address from the transaction receipt
  const contractAddress = receipt.contractAddress;
  console.log("Contract address:", contractAddress);

  if (contractAddress) {
    console.log("✓ Found contract address:", contractAddress);

    // Get game instance
    const GameInstance = await hre.ethers.getContractFactory("GameInstance");
    const gameInstance = GameInstance.attach(contractAddress);

    console.log("\nGame details:");
    const title = await gameInstance.title();
    const status = await gameInstance.status();
    const creator = await gameInstance.creator();

    console.log("  Title:", title);
    console.log("  Status:", status);
    console.log("  Creator:", creator);
    console.log("  Entry fee:", hre.ethers.formatEther(await gameInstance.entryFee()));
    console.log("  Prize pool:", hre.ethers.formatEther(await gameInstance.prizePool()));

    // Set GameRegistry
    console.log("\nSetting GameRegistry...");
    await gameInstance.setGameRegistry(deploymentInfo.gameRegistry);
    console.log("✓ GameRegistry set");

    // Save tournament info
    const tournamentInfo = {
      address: contractAddress,
      title: title,
      status: status.toString(),
      creator: creator,
      entryFee: hre.ethers.formatEther(await gameInstance.entryFee()),
      prizePool: hre.ethers.formatEther(await gameInstance.prizePool()),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      "deployments/latest-tournament.json",
      JSON.stringify(tournamentInfo, null, 2)
    );

    console.log("\n✓ Tournament info saved to deployments/latest-tournament.json");
    console.log("Frontend URL: http://localhost:5000/tournament/" + contractAddress);
  } else {
    console.log("❌ No contract address found in transaction");

    // Try to manually find the game address
    console.log("\nLet's try a different approach...");
    console.log("Checking if getAllGames works with manual call...");

    // Use eth_call directly
    const iface = factory.interface;
    const callData = iface.encodeFunctionData("getAllGames");
    console.log("Call data:", callData);

    try {
      const result = await hre.ethers.provider.call({
        to: deploymentInfo.gameFactory,
        data: callData
      });
      console.log("Raw result:", result);

      if (result && result !== "0x") {
        const decoded = iface.decodeFunctionResult("getAllGames", result);
        console.log("Decoded result:", decoded);
        console.log("Game addresses:", decoded[0]);
      }
    } catch (e) {
      console.error("Manual call failed:", e.message);
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
