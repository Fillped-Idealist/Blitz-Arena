# 时间逻辑更新说明

## 修改内容

### 1. 最小持续时间：24小时 → 30分钟
- **之前**：比赛最小持续时间为24小时
- **现在**：比赛最小持续时间为30分钟
- **影响**：短游戏（如Quick Click）可以有更短的比赛周期

### 2. 报名截止时间：报名结束时 → 比赛结束前15分钟
- **之前**：
  - 立即开始模式：报名截止 = 游戏开始，允许在比赛结束前15分钟内报名
  - 正常模式：报名截止 = 游戏开始时间
- **现在**：所有模式的报名截止时间都是比赛结束前15分钟
- **影响**：玩家可以在游戏进行中继续报名，直到比赛结束前15分钟

## 实现细节

### 前端时间计算 (src/app/create/page.tsx)
```typescript
// 游戏结束时间 = 开始时间 + 游戏时长（至少30分钟）
const minGameDuration = 30 * 60; // 30分钟
const actualGameDuration = Math.max(requestedGameDuration, minGameDuration);
gameEndTime = gameStartTime + actualGameDuration;

// 报名截止时间为游戏结束前15分钟
registrationEndTime = gameEndTime - (15 * 60);
```

### 合约侧时间验证 (src/hooks/useGameContract.ts)
```typescript
// 如果时间已经过期，重新计算
if (adjustedRegistrationEndTime <= latestTimestamp) {
  adjustedGameStartTime = latestTimestamp + 60;
  const minDuration = 30 * 60; // 30分钟
  adjustedGameEndTime = adjustedGameStartTime + Math.max(originalDuration, minDuration);
  // 报名截止时间为游戏结束前15分钟
  adjustedRegistrationEndTime = adjustedGameEndTime - (15 * 60);
} else {
  // 确保报名截止时间是游戏结束前15分钟
  adjustedRegistrationEndTime = adjustedGameEndTime - (15 * 60);
}
```

### 合约逻辑简化 (contracts/GameInstance.sol)
```solidity
// 之前：区分立即开始模式和正常模式
if (registrationEndTime == gameStartTime) {
  require(block.timestamp < gameEndTime - 15 minutes, "Registration time passed");
} else {
  require(block.timestamp < registrationEndTime, "Registration time passed");
}

// 现在：统一逻辑
require(block.timestamp < registrationEndTime, "Registration time passed");
```

## 时间示例

### 示例1：立即开始模式 - 120分钟游戏
```
当前时间：2026-01-15 10:00:00
游戏开始时间：2026-01-15 10:01:00 (+60秒)
游戏结束时间：2026-01-15 12:01:00 (+120分钟)
报名截止时间：2026-01-15 11:46:00 (结束前15分钟)

玩家可以在以下时间段内报名：
- 10:01:00 - 11:46:00 (105分钟)
```

### 示例2：正常模式 - 60分钟游戏
```
当前时间：2026-01-15 10:00:00
报名时间：30分钟
游戏开始时间：2026-01-15 10:30:00
游戏结束时间：2026-01-15 11:30:00 (+60分钟)
报名截止时间：2026-01-15 11:15:00 (结束前15分钟)

玩家可以在以下时间段内报名：
- 现在开始报名
- 游戏开始后仍可报名：10:30:00 - 11:15:00 (45分钟)
```

### 示例3：短游戏 - 10分钟（自动调整为30分钟）
```
用户设置：游戏时长10分钟
最小持续时间：30分钟

当前时间：2026-01-15 10:00:00
游戏开始时间：2026-01-15 10:01:00
游戏结束时间：2026-01-15 10:31:00 (自动调整为30分钟)
报名截止时间：2026-01-15 10:16:00 (结束前15分钟)

玩家可以在以下时间段内报名：
- 10:01:00 - 10:16:00 (15分钟)
```

## 部署信息

### 合约部署
- **网络**：Hardhat Localhost (Chain ID: 31337)
- **部署方式**：增量部署（只部署 GameFactory）
- **新 GameFactory 地址**：0x162A433068F51e18b7d13932F27e66a3f99E6890
- **旧 GameFactory 地址**：0x67d269191c92Caf3cD7723F116c85e6E9bf55933

### 配置更新
- `src/lib/chainConfig.ts`：GAME_FACTORY 地址已更新

## 注意事项

### 1. 旧比赛的影响
- 使用旧 GameFactory 创建的比赛仍然使用旧的报名时间逻辑
- 新创建的比赛使用新的逻辑

### 2. 游戏时长建议
- Quick Click：建议 5-30 分钟
- Number Guess：建议 15-60 分钟
- Rock Paper Scissors：建议 15-30 分钟
- Infinite Match：建议 30-120 分钟
- Roguelike Survival：建议 60-120 分钟

### 3. 报名时间计算
- 报名截止始终是：游戏结束时间 - 15分钟
- 如果用户设置的游戏时长 < 30分钟，会自动调整为30分钟
- 报名时间可能会延续到游戏进行中

## 验证步骤

### 创建比赛验证
1. 进入创建比赛页面
2. 设置游戏时长为 10 分钟（短于30分钟）
3. 创建比赛后检查时间：
   - 游戏时长应为30分钟
   - 报名截止时间应为游戏结束前15分钟

### 加入比赛验证
1. 创建一个立即开始的比赛（游戏时长 60分钟）
2. 在游戏开始后尝试加入
3. 应该允许加入，直到比赛结束前15分钟
4. 在比赛结束前14分钟尝试加入应失败

### 浏览器控制台日志
创建和加入比赛时，浏览器控制台会输出详细的调试信息：
```
=== Create Tournament Debug ===
Current block timestamp: ...
Registration end time: ...
Game start time: ...
Game end time: ...
Game duration: ... minutes
```

```
[useJoinGame] Registration end time: ...
[useJoinGame] Game start time: ...
[useJoinGame] Game end time: ...
[useJoinGame] Time until registration ends: ... seconds
[useJoinGame] Registration ends 15 minutes before game ends
```
