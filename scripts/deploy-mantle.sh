#!/bin/bash

echo "=== 部署到 Mantle Sepolia 测试网 ==="
echo ""

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 错误：未找到 .env 文件"
    echo ""
    echo "请创建 .env 文件并添加以下内容："
    echo "  PRIVATE_KEY=你的私钥"
    echo "  MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz"
    echo ""
    exit 1
fi

# 加载环境变量
export $(grep -v '^#' .env | xargs)

# 检查 PRIVATE_KEY
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ 错误：.env 文件中未找到 PRIVATE_KEY"
    exit 1
fi

echo "✅ 环境变量配置正确"
echo ""

# 部署合约
echo "开始部署合约到 Mantle Sepolia 测试网..."
echo ""

npx hardhat run scripts/deploy.js --network mantle_testnet

echo ""
echo "=== 部署完成 ==="
echo ""
echo "请将上述合约地址更新到 src/lib/chainConfig.ts"
echo ""
