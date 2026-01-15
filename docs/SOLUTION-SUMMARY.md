# 解决方案总结：扣子编程云端部署

## 问题描述

项目部署在扣子编程云端服务器，本地 MetaMask 无法连接到服务器的 Hardhat 节点（localhost:8545）。

## 解决方案对比

| 特性 | 方案 1：Mantle Sepolia | 方案 2：远程 Hardhat |
|-----|------------------------|---------------------|
| 难度 | ⭐ 简单 | ⭐⭐⭐⭐ 复杂 |
| 速度 | ⚡ 快 | 🐢 慢 |
| 持久性 | ✅ 数据不丢失 | ❌ 重启后丢失 |
| 多人测试 | ✅ 支持 | ❌ 仅自己 |
| 安全性 | ✅ 安全 | ⚠️ 需要配置防火墙 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐ |

## 推荐方案：Mantle Sepolia 测试网

### 快速开始（3 分钟）

#### 1. 创建测试账户

在 MetaMask 中创建新账户，**不要使用有真实资金的账户**。

#### 2. 获取私钥

在 MetaMask 中：
- 点击账户详情
- 选择"导出私钥"
- 复制私钥（不要分享给任何人）

#### 3. 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
PRIVATE_KEY=你的私钥
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
```

⚠️ **重要：不要将 .env 文件提交到 Git**

#### 4. 获取测试币

访问：https://faucet.sepolia.mantle.xyz/

输入你的钱包地址，完成验证，等待 1-2 分钟。

#### 5. 测试连接

```bash
npx hardhat run test/test-mantle-connection.js --network mantle_testnet
```

预期输出：
```
✅ RPC 连接成功
✅ 余额充足
```

#### 6. 部署合约

```bash
npx hardhat run scripts/deploy.js --network mantle_testnet
```

#### 7. 更新前端配置

从部署输出中复制合约地址，更新 `src/lib/chainConfig.ts`：

```typescript
5003: {
  BLZ_TOKEN: '0x...',  // 复制实际的地址
  PRIZE_TOKEN: '0x...',
  GAME_REGISTRY: '0x...',
  GAME_FACTORY: '0x...',
  USER_LEVEL_MANAGER: '0x...',
},
```

#### 8. 配置 MetaMask

添加网络：
- 网络名称：Mantle Sepolia Testnet
- RPC URL：https://rpc.sepolia.mantle.xyz
- 链 ID：5003
- 货币符号：MNT
- 区块浏览器：https://sepolia.mantlescan.xyz

#### 9. 开始测试

- 刷新浏览器
- MetaMask 自动连接到 Mantle Sepolia
- 开始创建比赛！

## 详细文档

- **`docs/cloud-deployment.md`** - 云端部署完整指南
- **`docs/deploy-mantle-sepolia.md`** - Mantle Sepolia 部署步骤
- **`docs/network-setup.md`** - MetaMask 配置指南

## 测试脚本

- **`test/test-mantle-connection.js`** - 测试 Mantle Sepolia 连接
- **`scripts/deploy-mantle.sh`** - 自动部署脚本

## 常见问题

### Q1: 水龙头没有测试币怎么办？

尝试以下方法：
- 等待 1-2 小时后重试
- 尝试其他水龙头：https://sepoliafaucet.com/
- 在 Twitter 发布钱包地址并 #MantleSepolia 标签

### Q2: 部署失败，提示 "insufficient funds"

确保账户有足够的 MNT（≥ 0.1 MNT）用于部署 Gas 费。

### Q3: 如何邀请朋友参与？

直接分享比赛链接，朋友使用自己的 MetaMask 账户参与即可。

### Q4: 测试网的数据会丢失吗？

不会，Mantle Sepolia 是公共测试网，数据会持久化。

## 下一步

部署完成后，你可以：

1. ✅ 创建比赛
2. ✅ 邀请朋友参与测试
3. ✅ 测试所有游戏功能
4. ✅ 提交分数和奖金分配
5. ✅ 查看排行榜和个人资料

## 技术支持

如果遇到问题：

1. 检查浏览器控制台（F12）
2. 运行连接测试：`npx hardhat run test/test-mantle-connection.js --network mantle_testnet`
3. 查看 Mantle Explorer：https://sepolia.mantlescan.xyz/
4. 查看 `docs/troubleshooting.md`

## 资源链接

- Mantle 官网：https://www.mantle.xyz/
- Mantle 文档：https://docs.mantle.xyz/
- Mantle Explorer：https://sepolia.mantlescan.xyz/
- 水龙头：https://faucet.sepolia.mantle.xyz/
- Discord：https://discord.gg/mantle
