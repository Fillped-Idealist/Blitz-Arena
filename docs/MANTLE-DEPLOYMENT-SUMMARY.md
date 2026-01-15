# Mantle Sepolia 测试网部署总结

## 部署信息

**部署时间**: 2026-01-15T08:52:51.953Z
**网络**: Mantle Sepolia Testnet (Chain ID: 5003)
**部署者地址**: 0xce289Ca273e6edd7D84CA15eB354E56a34c7d03d

## 合约地址

| 合约名称 | 合约地址 | 说明 |
|---------|---------|------|
| BLZ Token | 0x2dfC071529Fb5b7A7F88558CF78584aE2209D2b6 | 游戏激励代币（Mock ERC20） |
| Prize Token | 0xcB2a1d1227f96756c02e4B147596C56D45027cFa | 奖池代币（Mock ERC20，通常使用 MNT） |
| UserLevelManager | 0x98a5D63514231d348269d0D4Ace62cd0265dFa7b | 用户等级和成就管理 |
| GameRegistry | 0x370B81AB8fAE14B8c6b9bd72F85201Bdb1fbeD01 | 游戏注册表 |
| GameFactory | 0x3bC8655F6903b138C5BfB8F974F65e4C01800A5f | 游戏工厂（创建比赛） |

## Gas 消耗统计

**初始余额**: 104.114481606234703009 MNT
**部署后余额**: 103.226337648197803009 MNT
**Gas 消耗**: ~0.888 MNT（远低于 10 MNT 限制）

### 各合约部署成本估算

- BLZ Token: ~0.2 MNT
- UserLevelManager: ~0.2 MNT
- GameRegistry: ~0.1 MNT
- GameFactory: ~0.2 MNT
- Prize Token: ~0.2 MNT
- Transfer (10000 BLZ): ~0.01 MNT
- Grant Roles (2x): ~0.01 MNT
- **总计**: ~0.92 MNT

## 合约验证状态

✅ BLZ Token: 代码已部署（3854 bytes）
✅ Prize Token: 代码已部署（3854 bytes）
✅ UserLevelManager: 代码已部署（10796 bytes）
✅ GameRegistry: 代码已部署（11712 bytes）
✅ GameFactory: 代码已部署（43270 bytes）

## BLZ Token 配置

- **名称**: BLZ Token
- **符号**: BLZ
- **总供应量**: 1,000,000 BLZ
- **部署者余额**: 990,000 BLZ
- **UserLevelManager 余额**: 10,000 BLZ（用于奖励）

## 权限配置

✅ GameFactory 已被授予 UserLevelManager 的 GAME_ROLE
✅ GameFactory 已被授予 UserLevelManager 的 ADMIN_ROLE

## 前端配置更新

### 已更新文件

1. **src/lib/chainConfig.ts**
   - 更新 Mantle Sepolia 测试网（Chain ID: 5003）的合约地址
   - 所有合约地址已正确配置

2. **src/hooks/useUserLevel.ts**
   - 移除硬编码的 chainId 31337
   - 使用 `useChainId()` 获取当前链 ID
   - 添加网络支持检查

3. **src/app/profile/page.tsx**
   - 修正 chainId 可能导致 undefined 的问题
   - 添加 chainId 存在性检查

4. **hardhat.config.js**
   - 修正 RPC URL: https://rpc.sepolia.mantle.xyz
   - 修正 Chain ID: 5003
   - 添加 dotenv 配置加载

5. **.env**
   - 配置部署者私钥
   - 配置 Mantle Sepolia RPC URL

## 网络配置

### Mantle Sepolia Testnet

- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **区块浏览器**: https://sepolia.mantlescan.xyz
- **原生代币**: MNT (Mantle)

### Wagmi 配置

前端已配置支持以下网络：

1. **Hardhat Local** (Chain ID: 31337)
   - 本地开发网络
   - 用于测试和调试

2. **Mantle Sepolia Testnet** (Chain ID: 5003)
   - 公共测试网
   - 用于真实合约交互

## 使用指南

### 1. 连接钱包

用户需要使用 RainbowKit 或 MetaMask 连接到 Mantle Sepolia 测试网。

### 2. 获取测试代币

- **MNT (Gas 代币)**: 从 https://sepolia.mantle.xyz/faucet 获取
- **BLZ Token**: 联系部署者或从 UserLevelManager 奖励中获取

### 3. 创建比赛

1. 连接钱包到 Mantle Sepolia 测试网
2. 导航到创建比赛页面
3. 填写比赛信息（标题、描述、游戏类型、报名费等）
4. 授权 GameFactory 转移 Prize Token
5. 确认创建比赛

### 4. 参加比赛

1. 连接钱包到 Mantle Sepolia 测试网
2. 导航到比赛列表
3. 选择想要参加的比赛
4. 支付报名费（MNT）
5. 等待比赛开始

### 5. 提交成绩

1. 在比赛开始后进入游戏
2. 完成游戏获得分数
3. 提交分数到智能合约
4. 等待比赛结果

## 合约功能验证

### 创建比赛

```javascript
// 使用 GameFactory 创建比赛
const gameConfig = {
  title: "测试比赛",
  description: "这是一个测试比赛",
  gameType: 4, // InfiniteMatch
  feeTokenAddress: prizeTokenAddress, // 使用 Prize Token（通常是 MNT）
  entryFee: parseUnits("5", 18),
  minPlayers: 2,
  maxPlayers: 10,
  registrationEndTime: Math.floor(Date.now() / 1000) + 3600, // 1 小时后
  gameStartTime: Math.floor(Date.now() / 1000) + 7200, // 2 小时后
  prizeTokenAddress: prizeTokenAddress, // 使用 Prize Token
  prizePool: parseUnits("50", 18),
  distributionType: 0, // Winner Takes All
  rankPrizes: [],
};
```

### 参加比赛

```javascript
// 使用 GameInstance 参加比赛
await gameInstance.joinGame();
```

### 提交分数

```javascript
// 使用 GameInstance 提交分数
await gameInstance.submitScore(score);
```

## 注意事项

1. **Gas 费用**: 所有合约交互都需要 MNT 作为 Gas 费
2. **代币授权**: 创建比赛前需要先授权 GameFactory 转移 Prize Token
3. **比赛时间**: 报名结束时间和游戏开始时间必须符合逻辑
4. **最小人数**: 比赛开始时检查最小人数，不足则自动取消并退款
5. **手续费**: 平台收取 10% 报名费作为手续费
6. **退款机制**: 取消比赛时退还创建者全额奖池，退还玩家 90% 报名费

## 测试网资源

- **Mantle Sepolia Faucet**: https://sepolia.mantle.xyz/faucet
- **Mantle Explorer**: https://sepolia.mantlescan.xyz
- **Mantle Documentation**: https://docs.mantle.xyz

## 下一步

1. 测试所有合约功能（创建、报名、提交分数、分发奖金）
2. 测试等级系统和成就系统
3. 测试社交功能（好友、聊天、点赞）
4. 测试前端 UI/UX
5. 准备主网部署（如有需要）

## 部署验证脚本

使用以下命令验证部署：

```bash
# 检查钱包连接
npx hardhat run scripts/check-wallet.js --network mantle_testnet

# 验证合约部署
npx hardhat run scripts/verify-deployment.js --network mantle_testnet
```

## 联系方式

如有问题，请联系部署者：
- 部署者地址: 0xce289Ca273e6edd7D84CA15eB354E56a34c7d03d
- 项目仓库: [项目地址]

---

**部署状态**: ✅ 成功
**前端状态**: ✅ 已更新
**验证状态**: ✅ 通过
**文档状态**: ✅ 完成
