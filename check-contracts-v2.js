const hre = require("hardhat");

async function main() {
  const deploymentInfo = JSON.parse(require("fs").readFileSync("deployments/deployment.json", "utf8"));

  console.log("Deployment info:", deploymentInfo);

  const addresses = [
    { name: "BLZ Token", address: deploymentInfo.blzToken },
    { name: "Prize Token", address: deploymentInfo.prizeToken },
    { name: "GameRegistry", address: deploymentInfo.gameRegistry },
    { name: "GameFactory", address: deploymentInfo.gameFactory },
  ];

  console.log("\nChecking deployed contracts:\n");

  for (const { name, address } of addresses) {
    console.log(`${name} (${address}):`);

    // Get code
    const code = await hre.ethers.provider.getCode(address);
    const hasCode = code !== "0x";
    console.log(`  Has code: ${hasCode}`);
    console.log(`  Code length: ${code.length}`);

    // Try to call a function for each contract
    try {
      if (name.includes("Token")) {
        const MockToken = await hre.ethers.getContractFactory("MockERC20");
        const token = MockToken.attach(address);
        const supply = await token.totalSupply();
        console.log(`  Total Supply: ${hre.ethers.formatEther(supply)}`);
      } else if (name.includes("Factory")) {
        const GameFactory = await hre.ethers.getContractFactory("GameFactory");
        const factory = GameFactory.attach(address);
        const totalGames = await factory.getTotalGames();
        console.log(`  Total Games: ${totalGames.toString()}`);
      }
    } catch (e) {
      console.log(`  Function call failed: ${e.message}`);
    }

    console.log();
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
