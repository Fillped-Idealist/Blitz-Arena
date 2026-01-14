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

  // Check factory balance before
  const factoryBalanceBefore = await prizeToken.balanceOf(deploymentInfo.gameFactory);
  console.log("Factory PRIZE balance before:", hre.ethers.formatEther(factoryBalanceBefore));

  // Check deployer balance before
  const deployerBalanceBefore = await prizeToken.balanceOf(deployer.address);
  console.log("Deployer PRIZE balance before:", hre.ethers.formatEther(deployerBalanceBefore));

  // Approve
  console.log("\nApproving...");
  const approveTx = await prizeToken.connect(deployer).approve(deploymentInfo.gameFactory, hre.ethers.parseEther("1050"));
  await approveTx.wait();

  const allowance = await prizeToken.allowance(deployer.address, deploymentInfo.gameFactory);
  console.log("Allowance:", hre.ethers.formatEther(allowance));

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

  console.log("\nTransaction hash:", tx.hash);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Status:", receipt.status === 1 ? "Success" : "Failed");

  // Check balances after
  const factoryBalanceAfter = await prizeToken.balanceOf(deploymentInfo.gameFactory);
  const deployerBalanceAfter = await prizeToken.balanceOf(deployer.address);
  console.log("\nFactory PRIZE balance after:", hre.ethers.formatEther(factoryBalanceAfter));
  console.log("Deployer PRIZE balance after:", hre.ethers.formatEther(deployerBalanceAfter));
  console.log("Difference:", hre.ethers.formatEther(deployerBalanceBefore - deployerBalanceAfter));

  // Try to find the new game address via the createGame return value
  const result = await provider.getTransactionReceipt(tx.hash);
  console.log("\nTransaction receipt status:", result.status);

  // Print all logs with full details
  console.log("\nAll logs:");
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`\nLog ${i}:`);
    console.log("  Address:", log.address);
    console.log("  Topics:", log.topics);
    console.log("  Data:", log.data);

    // Try to parse with factory interface
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed) {
        console.log("  Parsed event:", parsed.name);
        console.log("  Args:", parsed.args);
      }
    } catch (e) {
      // Try to parse as contract creation
      if (log.topics[0] && log.topics[0].substring(0, 10) === "0x0000000000") {
        console.log("  Possibly a contract creation");
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
