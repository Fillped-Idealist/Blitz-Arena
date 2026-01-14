const hre = require("hardhat");

async function main() {
  const deploymentInfo = JSON.parse(require("fs").readFileSync("deployments/deployment.json", "utf8"));

  const addresses = [
    { name: "BLZ Token", address: deploymentInfo.blzToken },
    { name: "Prize Token", address: deploymentInfo.prizeToken },
    { name: "GameRegistry", address: deploymentInfo.gameRegistry },
    { name: "GameFactory", address: deploymentInfo.gameFactory },
  ];

  console.log("Checking deployed contracts:\n");

  for (const { name, address } of addresses) {
    const code = await hre.ethers.provider.getCode(address);
    const hasCode = code !== "0x";
    console.log(`${name}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Has code: ${hasCode}`);
    console.log(`  Code length: ${code.length}\n`);
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
