# Mantle Sepolia 测试网部署指南

## 检查清单

在开始部署之前，请确保已完成以下所有本地检查：

- ✅ 智能合约代码和逻辑检查通过
- ✅ 合约 ABI 文件定义检查通过
- ✅ 前端合约配置文件检查通过
- ✅ 前端 hooks 交互逻辑检查通过
- ✅ 前端页面组件检查通过
- ✅ TypeScript 类型检查通过
- ✅ 本地合约测试通过
- ✅ 前端与合约交互测试通过

## 部署前准备

### 1. 创建测试账户

在 MetaMask 中创建一个新的测试账户：

1. 打开 MetaMask
2. 点击账户图标 → 创建账户
3. 设置账户名称（如 "Mantle Test Account"）
4. 备份助记词（⚠️ 重要：不要丢失）

**⚠️ 重要：不要使用有真实资金的账户！**

### 2. 获取私钥

1. 在 MetaMask 中切换到新创建的账户
2. 点击账户图标 → 账户详情
3. 点击"导出私钥"
4. 输入 MetaMask 密码
5. 复制私钥（⚠️ 不要分享给任何人）

### 3. 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 替换为你的私钥（不要包含 0x 前缀）
PRIVATE_KEY=你的私钥

# Mantle Sepolia RPC URL
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
```

**⚠️ 安全提示：**
- 不要将 `.env` 文件提交到 Git
- 不要在公共场所分享你的私钥
- 使用完删除私钥

### 4. 获取测试币

访问 Mantle 水龙头：https://faucet.sepolia.mantle.xyz/

1. 输入你的钱包地址
2. 完成验证（可能需要 Twitter 或 Discord）
3. 等待 1-2 分钟
4. 检查 MetaMask 余额（应该收到测试 MNT）

**需要的测试币数量：**
- 部署 Gas 费：约 0.1-0.5 MNT
- 创建比赛：约 0.01 MNT
- 参与比赛：约 0.001 MNT

**建议：至少准备 1 MNT**

如果水龙头没有足够的测试币，尝试：
- https://sepoliafaucet.com/
- 在 Twitter 发布钱包地址并 #MantleSepolia 标签
- 等待 1-2 小时后重试

### 5. 验证网络连接

运行连接测试：

```bash
npx hardhat run test/test-mantle-connection.js --network mantle_testnet
```

**预期输出：**
```
=== 测试 Mantle Sepolia 连接 ===

当前网络:
  名称: mantle_testnet
  Chain ID: 5003

部署者账户: 0x...
账户余额: 1000.0 MNT

测试 RPC 连接...
✅ RPC 连接成功
当前区块: xxxxxx

✅ 余额充足

=== 连接测试完成 ===
```

## 部署步骤

### 步骤 1：部署合约

运行部署脚本：

```bash
npx hardhat run scripts/deploy.js --network mantle_testnet
```

**预期输出：**
```
Deploying contracts...

1. Deploying Mock BLZ Token...
Mock BLZ Token deployed to: 0x...

1.5. Deploying UserLevelManager...
UserLevelManager deployed to: 0x...

2. Deploying GameRegistry...
GameRegistry deployed to: 0x...

3. Deploying GameFactory...
GameFactory deployed to: 0x...

4. Deploying Mock Prize Token...
Mock Prize Token deployed to: 0x...

=== Deployment Summary ===
BLZ Token: 0x...
Prize Token: 0x...
UserLevelManager: 0x...
GameRegistry: 0x...
GameFactory: 0x...
```

**记录所有合约地址！** 后续步骤需要使用。

### 步骤 2：验证部署

在 Mantle Explorer 查看合约：

https://sepolia.mantlescan.xyz/

输入每个合约地址，验证：
- 合约代码已部署
- 创建者地址正确
- 部署交易成功

### 步骤 3：更新前端配置

编辑 `src/lib/chainConfig.ts`：

```typescript
export const CONTRACT_ADDRESSES = {
  31337: {
    // Hardhat 本地网络（保留）
    BLZ_TOKEN: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    PRIZE_TOKEN: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
    GAME_REGISTRY: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    GAME_FACTORY: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    USER_LEVEL_MANAGER: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  },
  5003: {
    // 替换为部署输出的实际地址
    BLZ_TOKEN: '0x...',      // 从部署输出复制
    PRIZE_TOKEN: '0x...',     // 从部署输出复制
    GAME_REGISTRY: '0x...',  // 从部署输出复制
    GAME_FACTORY: '0x...',   // 从部署输出复制
    USER_LEVEL_MANAGER: '0x...', // 从部署输出复制
  },
};
```

### 步骤 4：配置 MetaMask

添加 Mantle Sepolia 网络：

```
网络名称：Mantle Sepolia Testnet
RPC URL：https://rpc.sepolia.mantle.xyz
链 ID：5003
货币符号：MNT
区块浏览器 URL：https://sepolia.mantlescan.xyz
```

### 步骤 5：刷新前端

1. 刷新浏览器（F5）
2. MetaMask 应该自动切换到 Mantle Sepolia
3. 确认钱包已连接

## 部署后验证

### 1. 创建测试比赛

1. 访问 http://localhost:5000
2. 点击 "Create Tournament"
3. 填写比赛信息：
   - 标题：Test Tournament on Mantle
   - 游戏类型：Number Guess
   - 报名费：5 MNT
   - 奖池：100 MNT
   - 最小人数：2
   - 最大人数：10
4. 点击 "Create Tournament"
5. MetaMask 弹出交易确认
6. 确认交易

### 2. 查看交易

在 Mantle Explorer 查看交易：
https://sepolia.mantlescan.xyz/

### 3. 验证比赛

1. 自动跳转到比赛列表
2. 看到新创建的比赛
3. 点击比赛查看详情

## 测试流程

### 完整功能测试

1. **创建比赛**
   - ✅ MetaMask 弹出授权
   - ✅ 交易成功
   - ✅ 比赛出现在列表中

2. **参与比赛**
   - 切换到第二个账户
   - 授权 Prize Token
   - 支付报名费（5 MNT）
   - ✅ 报名成功

3. **开始比赛**
   - 等待报名结束（或创建短期比赛）
   - 使用创建者账户开始比赛
   - ✅ 比赛状态变为 Ongoing

4. **玩游戏**
   - 玩 Number Guess 游戏
   - 提交分数
   - ✅ 分数提交成功

5. **结束比赛**
   - 设置获胜者
   - 分发奖金
   - ✅ 奖金分配正确

6. **领取奖金**
   - 玩家领取奖金
   - ✅ 奖金到账

7. **查看等级**
   - 检查等级和经验值
   - ✅ 经验值增加

## 常见问题

### Q: 部署失败，提示 "insufficient funds"

**A:** 账户需要足够的 MNT 用于部署 Gas 费（约 0.1-0.5 MNT）

### Q: 水龙头没有响应

**A:** 尝试其他水龙头或等待一段时间

### Q: MetaMask 无法连接

**A:** 检查网络配置，确保 RPC URL 和 Chain ID 正确

### Q: 交易一直 pending

**A:** Mantle Sepolia 可能区块时间较长，等待 5-10 分钟

### Q: 前端看不到比赛

**A:**
1. 检查合约地址是否正确更新
2. 刷新浏览器
3. 检查 MetaMask 网络
4. 打开浏览器控制台查看错误

## 部署检查清单

- [ ] 创建测试账户
- [ ] 获取私钥
- [ ] 创建 .env 文件
- [ ] 获取测试币（≥ 1 MNT）
- [ ] 验证网络连接
- [ ] 部署合约
- [ ] 验证部署（在 Explorer 查看）
- [ ] 更新前端配置
- [ ] 配置 MetaMask
- [ ] 刷新前端
- [ ] 创建测试比赛
- [ ] 参与比赛
- [ ] 完成游戏流程
- [ ] 领取奖金
- [ ] 验证等级系统

## 部署成功标志

当你看到以下内容时，说明部署成功：

- ✅ 所有合约部署成功
- ✅ 在 Explorer 可以看到合约
- ✅ MetaMask 可以连接到 Mantle Sepolia
- ✅ 可以创建比赛
- ✅ 可以参与比赛
- ✅ 可以提交分数
- ✅ 可以领取奖金
- ✅ 等级系统正常工作

## 下一步

部署成功后，你可以：

1. 创建多个比赛
2. 邀请朋友参与
3. 测试所有游戏类型
4. 探索所有功能
5. 准备部署到主网（未来）

## 资源链接

- Mantle Explorer: https://sepolia.mantlescan.xyz/
- Mantle 水龙头: https://faucet.sepolia.mantle.xyz/
- Mantle 文档: https://docs.mantle.xyz/
- Discord: https://discord.gg/mantle

## 支持

如果遇到问题：

1. 查看 `docs/troubleshooting.md`
2. 查看 `docs/cloud-deployment.md`
3. 在 Explorer 查看交易详情
4. 在浏览器控制台查看错误
