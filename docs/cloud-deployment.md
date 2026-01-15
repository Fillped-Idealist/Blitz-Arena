# 扣子编程云端部署指南

## 问题说明

项目部署在扣子编程云端，本地 MetaMask 无法直接连接到服务器上的 Hardhat 节点（localhost:8545）。

## 解决方案

### 方案 1：使用 Mantle Sepolia 测试网（推荐）

这是最简单的方案，无需配置远程访问，直接使用公共测试网。

#### 优势
- ✅ 无需本地节点
- ✅ MetaMask 可以直接连接
- ✅ 数据持久化（不会因为重启节点而丢失）
- ✅ 可以邀请朋友一起测试
- ✅ 真实的区块链环境

#### 部署步骤

1. **创建部署账户**
   - 在 MetaMask 中创建一个新的测试账户
   - **重要：不要使用有真实资金的账户**
   - 记下私钥（用于部署合约）

2. **创建 .env 文件**

在项目根目录创建 `.env` 文件：

```bash
PRIVATE_KEY=你的私钥（不要带0x前缀）
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
```

3. **获取测试币**

访问 Mantle 水龙头：https://faucet.sepolia.mantle.xyz/

输入你的部署账户地址，完成验证，等待 1-2 分钟。

4. **部署合约**

```bash
# 方法 1：使用部署脚本
chmod +x scripts/deploy-mantle.sh
./scripts/deploy-mantle.sh

# 方法 2：直接运行
npx hardhat run scripts/deploy.js --network mantle_testnet
```

5. **更新前端配置**

从部署输出中复制合约地址，更新 `src/lib/chainConfig.ts`：

```typescript
5003: {
  BLZ_TOKEN: '0x...',  // 替换为实际地址
  PRIZE_TOKEN: '0x...',
  GAME_REGISTRY: '0x...',
  GAME_FACTORY: '0x...',
  USER_LEVEL_MANAGER: '0x...',
},
```

6. **配置 MetaMask**

- 网络名称：Mantle Sepolia Testnet
- RPC URL：https://rpc.sepolia.mantle.xyz
- 链 ID：5003
- 货币符号：MNT
- 区块浏览器：https://sepolia.mantlescan.xyz

7. **开始测试**

- 刷新浏览器
- MetaMask 自动连接到 Mantle Sepolia
- 开始创建比赛！

### 方案 2：配置 Hardhat 节点支持远程访问（复杂）

如果你仍然想使用本地 Hardhat 节点，需要配置远程访问。

#### 步骤

1. **获取服务器公网 IP**

```bash
curl ifconfig.me
```

假设返回：`123.45.67.89`

2. **修改 Hardhat 配置**

编辑 `hardhat.config.js`，添加自定义网络配置：

```javascript
networks: {
  hardhat: {
    chainId: 3137
  },
  mantle_testnet: {
    url: "https://rpc.testnet.mantle.xyz",
    chainId: 5001,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
  },
  // 添加自定义网络
  custom: {
    url: "http://0.0.0.0:8545",  // 监听所有接口
    chainId: 3137,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
  }
}
```

3. **启动 Hardhat 节点**

```bash
npx hardhat node --hostname 0.0.0.0 --port 8545
```

4. **配置 MetaMask**

- RPC URL：`http://123.45.67.89:8545`（替换为你的服务器 IP）
- 链 ID：3137

#### 问题

- ❌ 需要服务器有公网 IP
- ❌ 安全风险（暴露节点到公网）
- ❌ 需要配置防火墙规则
- ❌ 数据不持久化（重启节点会丢失）
- ❌ 只有你能访问（其他人无法参与）

**不推荐使用方案 2**

## 快速开始（方案 1）

### 1 分钟快速部署

```bash
# 1. 创建 .env 文件
echo "PRIVATE_KEY=你的私钥" > .env
echo "MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz" >> .env

# 2. 获取测试币（手动访问水龙头）
# https://faucet.sepolia.mantle.xyz/

# 3. 部署合约
npx hardhat run scripts/deploy.js --network mantle_testnet

# 4. 更新前端配置（手动复制地址到 chainConfig.ts）

# 5. 刷新浏览器，开始测试
```

## 验证部署

部署成功后，在 Mantle Explorer 查看：

https://sepolia.mantlescan.xyz/

输入你的钱包地址，查看部署的交易记录。

## 测试流程

1. **创建比赛**
   - 填写比赛信息
   - MetaMask 弹出确认交易
   - 比赛创建成功

2. **分享比赛**
   - 将比赛链接分享给朋友
   - 朋友使用自己的 MetaMask 账户参与

3. **玩游戏**
   - 报名参加比赛
   - 等待比赛开始
   - 玩游戏并提交分数

4. **查看结果**
   - 在 Mantle Explorer 查看所有交易
   - 查看排行榜

## 常见问题

### Q: 水龙头没有测试币怎么办？

A: 尝试以下方法：
- 等待 1-2 小时后重试
- 尝试其他水龙头
- 在 Discord 或 Twitter 请求测试币

### Q: 部署失败，提示 "insufficient funds"

A: 你的账户需要约 0.1-0.5 MNT 用于部署 Gas 费。

### Q: 如何邀请朋友参与？

A: 直接分享比赛链接，朋友用自己的 MetaMask 账户参与即可。

### Q: 测试网的数据会丢失吗？

A: 不会，Mantle Sepolia 是公共测试网，数据会持久化。

## 资源链接

- Mantle 官网：https://www.mantle.xyz/
- Mantle 文档：https://docs.mantle.xyz/
- Mantle Explorer：https://sepolia.mantlescan.xyz/
- 水龙头：https://faucet.sepolia.mantle.xyz/
- Discord：https://discord.gg/mantle

## 总结

**强烈推荐使用方案 1（Mantle Sepolia 测试网）**：

✅ 简单快速  
✅ 无需配置  
✅ 可以多人测试  
✅ 数据持久化  
✅ 真实的区块链环境  

如果需要帮助，查看：
- `docs/deploy-mantle-sepolia.md` - 详细部署步骤
- `docs/network-setup.md` - MetaMask 配置
- `docs/troubleshooting.md` - 故障排除
