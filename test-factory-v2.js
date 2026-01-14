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

  console.log("Creating game...");
  const tx = await factory.createGame(gameConfig);
  const receipt = await tx.wait();

  console.log("\nTransaction hash:", tx.hash);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Status:", receipt.status === 1 ? "Success" : "Failed");

  // Find GameCreated event in logs
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === "GameCreated") {
        console.log("\n✓ Found GameCreated event");
        const gameAddress = parsed.args.game;
        console.log("Game address:", gameAddress);

        // Get game instance
        const GameInstance = await hre.ethers.getContractFactory("GameInstance");
        const gameInstance = GameInstance.attach(gameAddress);

        console.log("\nGame created at:", gameAddress);
        console.log("Title:", await gameInstance.title());
        console.log("Status:", await gameInstance.status());
        console.log("Creator:", await gameInstance.creator());

        process.exit(0);
      }
    } catch (e) {
      // Continue
    }
  }

  console.log("\n❌ GameCreated event not found");
  process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
