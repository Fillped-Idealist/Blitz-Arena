# 部署完成 ✅

你的链游竞技平台已经成功部署并配置完成！

## 部署信息

### 智能合约（本地Hardhat网络）
- **BLZ Token**: `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6`
- **Prize Token**: `0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82`
- **GameRegistry**: `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e`
- **GameFactory**: `0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0`
- **UserLevelManager**: `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`

### 网络配置
- **网络**: Hardhat Local
- **Chain ID**: 31337
- **RPC URL**: http://localhost:8545

### 新增功能
- **UserLevelManager合约**: 管理用户等级、经验值和成就系统
- **链上数据存储**: 所有等级和成就数据存储在区块链上
- **BLZ Token激励**: 参与比赛、获胜、创建比赛、解锁成就都会获得BLZ代币奖励
- **经验系统**: 1 BLZ = 1 EXP，等级需求每级递增1.5倍，最高100级

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

### 4. 创建或加入比赛

**创建比赛：**
1. 访问 http://localhost:5000/profile 或点击 Profile 页面
2. 找到 "Create Tournament" 部分
3. 填写比赛信息（标题、描述、游戏类型、报名费、最小/最大玩家数等）
4. 选择奖金分配方式
5. 确认MetaMask交易
6. 比赛创建成功后，可以在比赛列表中查看

**加入比赛：**
1. 访问 http://localhost:5000/tournaments
2. 浏览可用比赛列表
3. 选择想要参加的比赛
4. 点击 "Join" 按钮
5. 确认MetaMask交易（支付报名费）
6. 等待比赛开始

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

### 7. 体验等级和成就系统

- **查看等级**: 访问 http://localhost:5000/profile 查看你的当前等级、经验值和进度
- **解锁成就**: 参加比赛、获胜、添加好友等会自动解锁成就并获得BLZ代币奖励
- **代币激励**: 所有活动都会获得BLZ代币，可用于支付比赛报名费

## 已解决的技术问题

### 1. 依赖缺失错误
- **问题**: `@metamask/sdk` not found
- **解决**: 运行 `pnpm add @metamask/sdk` 安装缺失依赖

### 2. 合约部署和配置
- **部署**:
  - GameRegistry合约
  - GameFactory合约
  - UserLevelManager合约（新增，用于管理等级和成就）
  - Mock ERC20代币（BLZ和PRIZE）
- **配置**:
  - GameFactory初始化时设置UserLevelManager地址
  - UserLevelManager初始化BLZ代币地址
  - 所有合约通过角色系统进行权限控制


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
GameInstance (存储游戏结果，触发奖励)
    ↓
UserLevelManager (授予EXP和BLZ代币奖励)
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
