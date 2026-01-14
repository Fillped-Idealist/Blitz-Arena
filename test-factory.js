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
  await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1050"));

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
  console.log("\nTotal logs:", receipt.logs.length);

  // Try to get game instance address from the factory
  const allGames = await factory.getAllGames();
  console.log("\nAll games length:", allGames.length);
  console.log("Latest game address:", allGames[allGames.length - 1]);

  const gameAddress = allGames[allGames.length - 1];

  // Get game instance
  const GameInstance = await hre.ethers.getContractFactory("GameInstance");
  const gameInstance = GameInstance.attach(gameAddress);

  console.log("\nGame created at:", gameAddress);
  console.log("Title:", await gameInstance.title());
  console.log("Status:", await gameInstance.status());

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
