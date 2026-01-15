# 部署到 Mantle Sepolia 测试网

## 为什么选择 Mantle Sepolia？

- 公共测试网，无需本地节点
- MetaMask 可以直接连接
- 提供水龙头获取测试币
- 适合开发和测试

## 部署步骤

### 1. 准备环境变量

创建 `.env` 文件（根目录）：

```bash
# Mantle Sepolia 测试网配置
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
PRIVATE_KEY=你的私钥（用于部署合约）
```

⚠️ **重要：**
- 不要使用有真实资金的私钥
- 建议创建一个新的测试账户
- 不要提交 `.env` 文件到 Git

### 2. 部署合约

```bash
npx hardhat run scripts/deploy.js --network mantle_testnet
```

### 3. 获取合约地址

部署完成后，会输出合约地址，类似：

```
=== Deployment Summary ===
BLZ Token: 0x...
Prize Token: 0x...
UserLevelManager: 0x...
GameRegistry: 0x...
GameFactory: 0x...
```

### 4. 更新前端配置

编辑 `src/lib/chainConfig.ts`，更新 Mantle Sepolia 的合约地址：

```typescript
export const CONTRACT_ADDRESSES = {
  31337: {
    // Hardhat 本地网络（保留用于开发）
    // ...
  },
  5003: {
    BLZ_TOKEN: '0x...',  // 从部署输出中复制
    PRIZE_TOKEN: '0x...',
    GAME_REGISTRY: '0x...',
    GAME_FACTORY: '0x...',
    USER_LEVEL_MANAGER: '0x...',
  },
};
```

### 5. 配置 MetaMask

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 添加网络或搜索 "Mantle Sepolia Testnet"

网络信息：
```
网络名称：Mantle Sepolia Testnet
RPC URL：https://rpc.sepolia.mantle.xyz
链 ID：5003
货币符号：MNT
区块浏览器 URL：https://sepolia.mantlescan.xyz
```

### 6. 获取测试币

访问 Mantle 水龙头：
- https://faucet.sepolia.mantle.xyz/

输入你的钱包地址，完成验证，等待 1-2 分钟。

### 7. 刷新前端页面

1. 刷新浏览器
2. MetaMask 应该自动连接到 Mantle Sepolia
3. 开始测试！

## 验证部署

### 检查合约部署

```bash
npx hardhat run test/verify-games.js --network mantle_testnet
```

### 在浏览器中查看合约

访问 Mantle Explorer：
https://sepolia.mantlescan.xyz/

输入合约地址，查看合约代码和交易记录。

## 获取测试币

### 方法 1：官方水龙头

访问：https://faucet.sepolia.mantle.xyz/

### 方法 2：二次方水龙头

如果官方水龙头无法使用，尝试：
- https://sepoliafaucet.com/

### 方法 3：社交媒体

在 Twitter 或 Discord 上发布你的钱包地址，请求测试币。

## 常见问题

### Q: 部署失败，提示 "insufficient funds"

**A:** 你的部署账户需要足够的 MNT 用于 Gas 费（约 0.1-0.5 MNT）

### Q: 无法连接到 Mantle Sepolia

**A:** 检查网络配置：
- RPC URL 是否正确
- 链 ID 是否为 5003
- MetaMask 是否切换到 Mantle Sepolia

### Q: 水龙头没有响应

**A:** 尝试其他水龙头或等待一段时间（水龙头有冷却时间）

## 下一步

部署完成后，你可以：

1. 创建比赛
2. 邀请朋友参与测试
3. 测试所有游戏功能
4. 提交分数和奖金分配

## 注意事项

- 这是测试网，代币没有真实价值
- 每次重启 Hardhat 节点，测试网数据不会丢失
- 定期检查水龙头余额
- 不要使用有真实资金的私钥
