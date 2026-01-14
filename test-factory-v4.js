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

  // Check allGames length before
  console.log("\nChecking allGames array before...");
  try {
    // Direct call to the contract's public state variable
    const result = await hre.ethers.provider.send("eth_getStorageAt", [
      deploymentInfo.gameFactory,
      "0x4",  // Slot for allGames (need to find correct slot)
      "latest"
    ]);
    console.log("Storage at slot 4:", result);
  } catch (e) {
    console.log("Storage check failed:", e.message);
  }

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
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✓ Transaction confirmed");
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
  console.log("Logs count:", receipt.logs.length);

  // Now try different ways to find the game address
  console.log("\nTrying to find game address...");

  // Method 1: Check allGames array again
  try {
    // The contract stores allGames as a public state variable
    // We need to use low-level calls to access it
    const gameAddress = await factory.allGames();
    console.log("\nMethod 1 - allGames:", gameAddress);
    console.log("Game array length:", gameAddress.length);

    if (gameAddress.length > 0) {
      const latestGame = gameAddress[gameAddress.length - 1];
      console.log("Latest game address:", latestGame);

      // Get game instance
      const GameInstance = await hre.ethers.getContractFactory("GameInstance");
      const gameInstance = GameInstance.attach(latestGame);

      console.log("\nGame details:");
      console.log("  Title:", await gameInstance.title());
      console.log("  Status:", await gameInstance.status());
      console.log("  Creator:", await gameInstance.creator());
    }
  } catch (e) {
    console.log("allGames() failed:", e.message);
  }

  // Method 2: Try to parse logs with different interfaces
  console.log("\nParsing logs...");
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`\nLog ${i}:`);
    console.log("  Address:", log.address);
    console.log("  Topics:", log.topics.map(t => t.substring(0, 20) + "..."));

    // Check if this is from the factory
    if (log.address.toLowerCase() === deploymentInfo.gameFactory.toLowerCase()) {
      console.log("  From factory");

      // Try to parse as GameCreated event
      // The signature for GameCreated(address indexed, address indexed) is:
      // GameCreated(address,address)
      const gameCreatedSignature = hre.ethers.id("GameCreated(address,address)");
      console.log("  GameCreated signature:", gameCreatedSignature.substring(0, 10));

      if (log.topics[0] === gameCreatedSignature) {
        console.log("  ✓ This is a GameCreated event!");
        console.log("  Game address:", log.topics[1]);
        console.log("  Creator address:", log.topics[2]);

        const gameAddress = log.topics[1];
        // Get game instance
        const GameInstance = await hre.ethers.getContractFactory("GameInstance");
        const gameInstance = GameInstance.attach(gameAddress);

        console.log("\nGame details:");
        console.log("  Title:", await gameInstance.title());
        console.log("  Status:", await gameInstance.status());
      }
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
