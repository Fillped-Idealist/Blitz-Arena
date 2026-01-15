const hre = require("hardhat");

async function main() {
  console.log("Checking wallet connection...");

  try {
    // 获取部署者账户
    const [deployer] = await hre.ethers.getSigners();

    if (!deployer) {
      console.log("❌ No deployer found. Check your PRIVATE_KEY in .env file.");
      return;
    }

    console.log("✅ Wallet connected successfully");
    console.log("Deployer address:", deployer.address);

    // 检查余额
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Wallet balance:", hre.ethers.formatEther(balance), "MNT");

    // 获取网络信息
    const network = await hre.ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());

    if (balance === 0n) {
      console.log("\n⚠️  Warning: Wallet has no MNT balance!");
      console.log("Please get some testnet MNT from the faucet:");
      console.log("https://sepolia.mantle.xyz/faucet");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
