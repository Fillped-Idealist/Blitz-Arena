const hre = require("hardhat");

async function main() {
  console.log("=== Simple Deployment Test ===\n");

  // Deploy MockERC20
  console.log("1. Deploying MockERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test Token", "TEST", hre.ethers.parseEther("1000"));
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✓ Token deployed to:", tokenAddress);

  // Check code
  console.log("\n2. Checking contract code...");
  const code = await hre.ethers.provider.getCode(tokenAddress);
  console.log("Code length:", code.length);
  console.log("Has code:", code !== "0x");

  // Try to call a function
  console.log("\n3. Calling totalSupply()...");
  try {
    const supply = await token.totalSupply();
    console.log("✓ Total supply:", hre.ethers.formatEther(supply));
  } catch (e) {
    console.log("✗ Failed:", e.message);
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
