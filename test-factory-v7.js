const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== Debugging GameFactory ===\n");

  // Get deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));

  console.log("Deployed contracts:");
  console.log("  Factory:", deploymentInfo.gameFactory);
  console.log("  Registry:", deploymentInfo.gameRegistry);
  console.log("  BLZ Token:", deploymentInfo.blzToken);
  console.log("  Prize Token:", deploymentInfo.prizeToken);

  // Get factory instance
  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  // Try to call getTotalGames first
  console.log("\nCalling getTotalGames...");
  try {
    const result = await factory.getTotalGames();
    console.log("✓ Total games:", result.toString());
  } catch (e) {
    console.log("✗ getTotalGames failed:", e.message);

    // Try low-level call
    console.log("\nTrying low-level eth_call...");
    const callResult = await hre.ethers.provider.call({
      to: deploymentInfo.gameFactory,
      data: "0x948f6f3a"  // Function selector for getTotalGames()
    });
    console.log("Raw result:", callResult);

    if (callResult !== "0x") {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        callResult
      );
      console.log("Decoded:", decoded.toString());
    }
  }

  // Check factory code
  console.log("\nChecking factory contract code...");
  const code = await hre.ethers.provider.getCode(deploymentInfo.gameFactory);
  console.log("Code length:", code.length);
  console.log("Code exists:", code !== "0x");

  // List available functions
  console.log("\nAvailable functions in interface:");
  const functions = factory.interface.fragments.filter(f => f.type === "function");
  functions.forEach(f => {
    console.log("  -", f.name);
  });

  // Create a test game
  console.log("\n=== Creating test game ===\n");

  const [deployer] = await hre.ethers.getSigners();
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const prizeToken = MockToken.attach(deploymentInfo.prizeToken);

  // Approve
  console.log("Approving prize token...");
  await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1050"));
  console.log("✓ Approved");

  // Create game with return value capture
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

  console.log("Creating game...");
  const tx = await factory.createGame(gameConfig);
  console.log("Transaction hash:", tx.hash);

  // Get the return value BEFORE waiting
  console.log("\nChecking return value...");
  // The return value should be available in the transaction receipt
  const receipt = await tx.wait();
  console.log("✓ Transaction confirmed");
  console.log("Gas used:", receipt.gasUsed.toString());

  // Check if the function returns a value
  const iface = factory.interface;
  console.log("\ncreateGame function signature:");
  const createGameFragment = iface.fragments.find(f => f.name === "createGame");
  console.log("  Returns:", createGameFragment.outputs.map(o => o.type).join(", "));

  // Try to get the return value from the transaction
  console.log("\nTrying to get return value from receipt...");

  // Use a static call to get the current state
  console.log("\nAfter transaction, calling getTotalGames again...");
  try {
    const result = await factory.getTotalGames();
    console.log("✓ Total games:", result.toString());
  } catch (e) {
    console.log("✗ Still failed:", e.message);
  }

  // Try getAllGames
  console.log("\nCalling getAllGames...");
  try {
    const result = await factory.getAllGames();
    console.log("✓ getAllGames success!");
    console.log("  Games:", result);
  } catch (e) {
    console.log("✗ getAllGames failed:", e.message);
  }

  // Try to access the public variable directly
  console.log("\nTrying to access allGames(0) - accessing array element...");
  try {
    const game0 = await factory.allGames(0);
    console.log("✓ Game at index 0:", game0);
  } catch (e) {
    console.log("✗ allGames(0) failed:", e.message);
  }

  // Try with allGames.length - get the length
  console.log("\nTrying to call allGames with no args (should fail)...");
  try {
    const result = await factory.allGames();
    console.log("✓ allGames():", result);
  } catch (e) {
    console.log("✗ allGames() failed (expected):", e.message);
  }

  // Try length
  console.log("\nTrying allGames.length property...");
  try {
    const length = await factory.allGames.length();
    console.log("✓ allGames.length:", length);
  } catch (e) {
    console.log("✗ allGames.length failed:", e.message);
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
