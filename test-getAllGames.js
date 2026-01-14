const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const deploymentInfo = JSON.parse(fs.readFileSync("deployments/deployment.json", "utf8"));

  const GameFactory = await hre.ethers.getContractFactory("GameFactory");
  const factory = GameFactory.attach(deploymentInfo.gameFactory);

  console.log("=== Testing getAllGames ===\n");

  // Get function selectors
  const iface = factory.interface;
  console.log("Available functions:");
  const functions = iface.fragments.filter(f => f.type === "function" && (f.name.includes("allGames") || f.name.includes("Games")));
  functions.forEach(f => {
    console.log(`  - ${f.name}: ${f.selector}`);
  });

  // Try to call getAllGames using low-level call
  console.log("\n1. Calling getAllGames via low-level eth_call...");
  try {
    const result = await hre.ethers.provider.call({
      to: deploymentInfo.gameFactory,
      data: "0xdb1c45f9"  // Function selector for getAllGames()
    });
    console.log("Raw result:", result);

    if (result && result !== "0x") {
      console.log("Result length:", result.length);

      // Try to decode manually
      if (result.length === 66) {
        // Just one uint256 (length)
        const length = BigInt(result);
        console.log("Array length:", length.toString());
      } else {
        // Try ABI decoding
        try {
          const decoded = iface.decodeFunctionResult("getAllGames", result);
          console.log("Decoded:", decoded);
          console.log("Games array:", decoded[0]);
        } catch (e) {
          console.log("ABI decode failed:", e.message);

          // Try to decode as address[]
          const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder();
          try {
            const decoded = abiCoder.decode(["address[]"], result);
            console.log("Manual decode:", decoded);
          } catch (e2) {
            console.log("Manual decode failed:", e2.message);
          }
        }
      }
    } else {
      console.log("Result is 0x (empty)");
    }
  } catch (e) {
    console.log("Low-level call failed:", e.message);
  }

  // Try to call getTotalGames
  console.log("\n2. Calling getTotalGames...");
  try {
    const result = await factory.getTotalGames();
    console.log("✓ Total games:", result.toString());
  } catch (e) {
    console.log("✗ Failed:", e.message);

    // Try low-level
    try {
      const result = await hre.ethers.provider.call({
        to: deploymentInfo.gameFactory,
        data: "0x948f6f3a"  // Function selector for getTotalGames()
      });
      console.log("Raw result:", result);

      if (result && result !== "0x") {
        const length = BigInt(result);
        console.log("Total games (manual decode):", length.toString());
      }
    } catch (e2) {
      console.log("Low-level call failed:", e2.message);
    }
  }

  // Try to access allGames(0) - public array accessor
  console.log("\n3. Calling allGames(0) - array element accessor...");
  try {
    const game0 = await factory.allGames(0);
    console.log("✓ Game at index 0:", game0);
  } catch (e) {
    console.log("✗ Failed (expected if array is empty):", e.message);
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
