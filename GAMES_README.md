# 链游集成说明

本项目已集成3个区块链小游戏，支持自动将游戏结果提交到链上并记录在智能合约中。

## 游戏列表

### 1. 猜数字游戏 (NumberGuess)
- **游戏规则**: 系统随机生成1-100的数字，玩家在5次机会内猜中
- **计分方式**:
  - 第1次猜中: 100分
  - 第2次猜中: 80分
  - 第3次猜中: 60分
  - 第4次猜中: 40分
  - 第5次猜中: 20分
  - 未猜中: 0分
- **合约类型**: `GameType.NumberGuess` (1)

### 2. 石头剪刀布 (RockPaperScissors)
- **游戏规则**: 与AI进行10轮石头剪刀布对决
- **计分方式**:
  - 胜一局: 10分
  - 平局: 5分
  - 败局: 0分
  - 最高得分: 100分（全胜）
- **合约类型**: `GameType.RockPaperScissors` (2)

### 3. 快速点击 (QuickClick)
- **游戏规则**: 30秒内尽可能多地点击随机出现的目标
- **计分方式**: 每次成功点击得1分
- **安全限制**:
  - 最小点击间隔: 600ms（防止作弊）
  - 最大点击次数: 50次（30秒内理论最大值）
- **合约类型**: `GameType.QuickClick` (3)

## 智能合约架构

### GameRegistry.sol
负责管理和验证游戏结果的核心合约：

**主要功能**:
- 游戏类型管理（启用/禁用游戏）
- 游戏结果验证（防止作弊）
- 最大分数限制
- 防刷分机制（最小游戏间隔）

**安全机制**:
- 时间戳验证（防止未来时间提交）
- 分数合理性检查
- 游戏特定规则验证
- 数据哈希校验（防篡改）

### GameInstance.sol (已扩展)
扩展了原有比赛合约，支持链游集成：

**新增功能**:
- `gameType` 字段：关联的游戏类型
- `setGameRegistry()`：设置游戏注册合约地址
- `submitGameResult()`：提交游戏结果并验证
- `getPlayerGameResult()`：获取玩家的游戏结果
- `gameResults` 映射：存储玩家的游戏结果数据

### Types.sol (已扩展)
新增游戏相关类型定义：

```solidity
enum GameType {
    None,               // 0
    NumberGuess,        // 1
    RockPaperScissors,  // 2
    QuickClick          // 3
}

struct GameResult {
    GameType gameType;     // 游戏类型
    address player;        // 玩家地址
    uint256 score;         // 游戏得分
    uint256 timestamp;     // 游戏完成时间戳
    bytes32 gameHash;      // 游戏数据哈希
    uint256[] metadata;    // 游戏元数据
}
```

## 前端组件

### 游戏组件
位于 `src/components/games/` 目录：

- `NumberGuessGame.tsx` - 猜数字游戏组件
- `RockPaperScissorsGame.tsx` - 石头剪刀布游戏组件
- `QuickClickGame.tsx` - 快速点击游戏组件

### 上链服务
位于 `src/hooks/useGameSubmission.ts`：

- `useSubmitGameResult()` - 提交游戏结果到链上
- `useGetPlayerGameResult()` - 获取玩家的游戏结果
- `useGetGameData()` - 获取比赛数据
- `computeGameHashAsync()` - 计算游戏哈希（与合约一致）

## 集成到比赛流程

### 1. 创建比赛
在 `/create` 页面选择游戏类型：

```typescript
// GameType: 1 = NumberGuess, 2 = RockPaperScissors, 3 = QuickClick
const formData = {
  gameType: "1",  // 选择猜数字游戏
  // ... 其他配置
};
```

### 2. 玩家报名
玩家点击"立即报名"加入比赛

### 3. 开始游戏
在比赛详情页 `/tournament/[id]`，当比赛状态为 `Ongoing` 时：

```typescript
// 游戏启动逻辑
const handleStartGame = (gameType: number) => {
  setActiveGame(gameType);  // 显示对应游戏界面
};
```

### 4. 提交成绩
游戏完成后，自动调用合约提交结果：

```typescript
const handleGameComplete = async (result: GameResult) => {
  await submitGameResult(result);  // 提交到链上
  toast.success('游戏成绩已提交到链上！');
};
```

### 5. 查看结果
比赛详情页显示玩家的游戏结果：

```typescript
const { data: playerGameResult } = useGetPlayerGameResult(
  gameInstanceAddress,
  playerAddress
);
```

## 防作弊机制

### 前端验证
1. **游戏逻辑验证**: 确保游戏在前端正确运行
2. **时间戳生成**: 使用当前时间戳
3. **哈希计算**: 根据游戏数据计算正确的哈希值

### 后端合约验证
1. **GameRegistry验证**: 调用 `verifyGameResult()` 函数
2. **游戏类型检查**: 确保游戏类型匹配
3. **分数范围检查**: 验证分数不超过最大值
4. **时间戳验证**: 确保时间戳合理（非未来时间）
5. **哈希一致性**: 验证提交的哈希与计算的一致
6. **游戏特定规则**:
   - 猜数字: 验证猜测次数与得分对应
   - 猜拳: 验证胜负和平局次数总和为10
   - 快速点击: 验证点击次数在合理范围内
7. **防刷分**: 最小游戏间隔10秒

## 部署步骤

### 1. 编译合约
```bash
pnpm run compile
```

### 2. 部署到本地
```bash
pnpm run deploy:local
```

### 3. 部署到Mantle测试网
```bash
pnpm run deploy:testnet
```

### 4. 设置GameRegistry
部署后，需要调用 `GameInstance.setGameRegistry()` 设置游戏注册合约地址

## 使用示例

### 创建比赛（猜数字游戏）
```typescript
const gameConfig = {
  title: "数字挑战赛",
  description: "测试你的运气和逻辑！",
  gameType: 1,  // NumberGuess
  minPlayers: 2,
  maxPlayers: 10,
  // ... 其他配置
};
```

### 提交游戏结果
```typescript
const result: GameResult = {
  gameType: 1,
  playerAddress: playerAddress,
  score: 80,  // 2次猜中
  timestamp: Math.floor(Date.now() / 1000),
  gameHash: await computeGameHashAsync(...),
  metadata: [2]  // 尝试次数
};

await submitGameResult(result);
```

## 注意事项

1. **钱包连接**: 游戏需要Web3钱包支持
2. **Gas费用**: 提交成绩需要支付Gas费用
3. **网络切换**: 确保钱包连接到正确的网络
4. **合约部署**: 确保智能合约已正确部署到目标网络
5. **GameRegistry设置**: 必须设置GameRegistry地址才能提交成绩

## 测试建议

1. 测试每个游戏的基本功能
2. 验证游戏结果成功提交到链上
3. 检查防作弊机制（尝试提交无效数据）
4. 测试多玩家场景
5. 验证奖金分发流程

## 未来扩展

可以轻松添加新的游戏：

1. 在 `GameType` 枚举中添加新游戏类型
2. 在 `GameRegistry` 中添加验证规则
3. 创建游戏前端组件
4. 在比赛页面集成新游戏

所有新增游戏都遵循相同的接口和验证流程。
