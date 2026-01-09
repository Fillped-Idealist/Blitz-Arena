# 部署完成 ✅

你的链游竞技平台已经成功部署并配置完成！

## 部署信息

### 智能合约
- **GameRegistry**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **GameInstance** (测试比赛): `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **BLZ Token** (报名费): `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **Prize Token** (奖金): `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

### 网络配置
- **网络**: Hardhat Local
- **Chain ID**: 31337
- **RPC URL**: http://localhost:8545

### 测试比赛
- **比赛标题**: 数字挑战赛
- **游戏类型**: 猜数字游戏 (NumberGuess)
- **比赛状态**: 进行中 (Ongoing)
- **前端URL**: http://localhost:5000/tournament/0x5FbDB2315678afecb367f032d93F642f64180aa3

### 测试账户
- **地址**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **私钥**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **余额**:
  - BLZ: ~1000 (足够支付报名费)
  - ETH: 10000 (足够支付Gas)

## 如何测试

### 1. 配置MetaMask

1. 打开MetaMask浏览器插件
2. 点击网络下拉菜单 → 添加网络 → 手动添加网络
3. 填入以下信息：
   - **网络名称**: Hardhat Local
   - **新的 RPC URL**: http://localhost:8545
   - **链 ID**: 31337
   - **货币符号**: ETH
4. 点击"保存"

### 2. 导入测试账户

1. 在MetaMask中点击账户图标 → 导入账户
2. 输入测试账户的私钥：
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. 点击"导入"

### 3. 访问比赛页面

在浏览器中打开：
```
http://localhost:5000/tournament/0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4. 连接钱包

1. 点击页面上的"连接钱包"按钮
2. 选择MetaMask
3. 确认连接

### 5. 玩游戏并提交成绩

1. 在比赛详情页，点击"开始游戏"按钮
2. 选择"猜数字游戏"
3. 玩游戏（在5次内猜中1-100的数字）
4. 游戏完成后，点击"提交成绩"
5. 确认MetaMask的交易

### 6. 查看链上结果

交易确认后，你应该能在比赛详情页看到：
- 你的得分
- 提交时间
- 游戏类型
- "已上链"标记

## 已解决的技术问题

### 1. 依赖缺失错误
- **问题**: `@metamask/sdk` not found
- **解决**: 运行 `pnpm add @metamask/sdk` 安装缺失依赖

### 2. 合约部署和配置
- **部署**:
  - GameRegistry合约
  - GameInstance合约
  - Mock ERC20代币（BLZ和PRIZE）
- **配置**:
  - GameInstance初始化为猜数字游戏
  - 设置GameRegistry地址（用于验证游戏结果）

### 3. 测试比赛创建
- 创建测试比赛（数字挑战赛）
- 设置比赛参数：
  - 最小玩家数: 1（便于测试）
  - 报名费: 10 BLZ
  - 奖池: 1000 PRIZE
  - 游戏类型: NumberGuess
- 启动比赛（状态变为Ongoing）

## 可用的游戏

### 1. 猜数字游戏 🔢
- 规则：5次机会猜1-100的随机数
- 计分：第1次猜中100分，依次递减
- 最高分：100分

### 2. 石头剪刀布 ✊✋✌️
- 规则：与AI进行10轮对决
- 计分：胜10分，平5分，负0分
- 最高分：100分

### 3. 快速点击 🎯
- 规则：30秒内点击随机目标
- 计分：每次点击得1分
- 最高分：50分

## 下一步

你现在可以：
1. ✅ 在前端界面玩链游
2. ✅ 提交游戏成绩到区块链
3. ✅ 验证游戏结果的防作弊机制
4. ✅ 查看链上存储的游戏结果

## 常见问题

### Q: 如何创建新的比赛？
A: 访问 http://localhost:5000/create 填写表单即可创建新比赛。

### Q: 如何切换游戏类型？
A: 在创建比赛时，选择不同的游戏类型（猜数字、石头剪刀布、快速点击）。

### Q: 游戏结果如何上链？
A: 游戏完成后，点击"提交成绩"按钮，系统会自动调用智能合约的`submitGameResult`函数。

### Q: 如何查看链上数据？
A: 使用Hardhat控制台或ethers.js的provider来查询合约状态。

### Q: Gas费用由谁支付？
A: 由玩家自己支付（提交成绩时）。

## 系统架构

```
前端 (Next.js)
    ↓
钱包连接 (RainbowKit + Wagmi)
    ↓
游戏组件 (猜数字、猜拳、快速点击)
    ↓
游戏结果
    ↓
useSubmitGameResult Hook
    ↓
智能合约调用 (submitGameResult)
    ↓
GameRegistry (验证游戏结果)
    ↓
GameInstance (存储游戏结果)
    ↓
区块链 (Hardhat Local)
```

## 防作弊机制

### 前端验证
- ✅ 游戏逻辑完整性检查
- ✅ 时间戳生成
- ✅ 哈希计算（与合约一致）

### 后端合约验证
- ✅ GameRegistry统一验证
- ✅ 游戏类型匹配检查
- ✅ 分数范围合理性验证
- ✅ 时间戳合法性检查
- ✅ 数据哈希一致性校验
- ✅ 游戏特定规则验证
- ✅ 防刷分机制（最小间隔10秒）

## 部署文件

- `deployments/deployment.json` - 合约部署信息
- `deployments/tournament.json` - 测试比赛配置

---

🎉 所有功能已就绪，可以开始测试了！
