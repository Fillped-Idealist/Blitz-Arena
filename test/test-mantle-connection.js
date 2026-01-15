const hre = require("hardhat");

async function main() {
  console.log("\n=== 测试 Mantle Sepolia 连接 ===\n");

  const { ethers } = hre;

  // 获取当前网络信息
  const network = await ethers.provider.getNetwork();
  console.log("当前网络:");
  console.log("  名称:", network.name);
  console.log("  Chain ID:", network.chainId.toString());
  console.log("");

  // 检查是否有可用的账户
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.log("❌ 错误：没有可用的账户");
    console.log("请在 .env 文件中配置 PRIVATE_KEY");
    process.exit(1);
  }

  const deployer = signers[0];
  console.log("部署者账户:", deployer.address);

  // 获取账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log("账户余额:", balanceInEth, "MNT");

  if (balance < ethers.parseEther("0.1")) {
    console.log("\n⚠️  警告：余额不足");
    console.log("建议余额：≥ 0.1 MNT");
    console.log("请访问水龙头获取测试币：https://faucet.sepolia.mantle.xyz/");
  } else {
    console.log("✅ 余额充足");
  }

  // 测试 RPC 连接
  console.log("\n测试 RPC 连接...");
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ RPC 连接成功");
    console.log("当前区块:", blockNumber);
  } catch (error) {
    console.log("❌ RPC 连接失败:", error.message);
    process.exit(1);
  }

  console.log("\n=== 连接测试完成 ===\n");
  console.log("如果所有测试都通过，你可以继续部署合约：");
  console.log("  npx hardhat run scripts/deploy.js --network mantle_testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
