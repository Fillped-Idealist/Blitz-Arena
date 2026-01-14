const { ethers } = require("hardhat");

async function main() {
  const factory = await ethers.getContractAt(
    "GameFactory",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );

  const total = await factory.getTotalGames();
  console.log("Total games:", total.toString());

  try {
    const allGames = await factory.getAllGames();
    console.log("All games count:", allGames.length);
  } catch (error) {
    console.log("Error calling getAllGames:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
