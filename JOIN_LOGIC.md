# 比赛加入逻辑说明

## 当前判断逻辑

### 1. 状态检查（优先级最高）
- **Created (status = 0)**: 允许加入
- **Ongoing (status = 1)**: 不允许加入 - "Game is in progress. Registration is closed."
- **Ended (status = 2)**: 不允许加入 - "Game has ended. Registration is closed."
- **PrizeDistributed (status = 3)**: 不允许加入 - "Prizes have been distributed. Registration is closed."
- **Canceled (status = 4)**: 不允许加入 - "Game has been canceled. Registration is closed."

### 2. 时间检查

#### 立即开始模式 (`registrationEndTime === gameStartTime`)
- 在创建比赛时选择"立即开始"选项
- `registrationEndTime = gameStartTime = blockTimestamp + 60`
- **判断逻辑**：只要状态是 `Created`，就可以加入，不做额外的时间检查
- **原因**：立即开始模式下，比赛可能在任何时间被创建者通过 `startGame` 函数手动开始，所以只要比赛还没开始，就可以加入

#### 正常模式 (`registrationEndTime !== gameStartTime`)
- `registrationEndTime = blockTimestamp + registrationDuration * 60`
- `gameStartTime = registrationEndTime`
- **判断逻辑**：必须在 `registrationEndTime` 之前加入
- 如果 `currentTimestamp >= registrationEndTime`，则不允许加入

### 3. 其他检查
- **玩家数量**：不能超过 `maxPlayers`
- **是否已加入**：不能重复加入
- **授权检查**：需要授权足够的代币给 GameInstance 合约

## 前端 vs 合约

### 前端检查（useJoinGame hook）
1. 网络检查（必须是 Hardhat 或 Mantle Sepolia）
2. 钱包连接检查
3. 时间检查（如上所述）
4. 状态检查（如上所述）
5. 玩家数量检查
6. 是否已加入检查
7. 代币授权检查

### 合约检查（GameInstance.joinGame）
1. 状态必须是 `Created`
2. 报名时间检查：
   - 如果 `registrationEndTime === gameStartTime`（立即开始模式）：`block.timestamp < gameStartTime + 15 minutes`
   - 否则：`block.timestamp < registrationEndTime`
3. 必须未加入
4. 必须授权足够的代币

## 常见问题

### Q: 为什么创建了"立即开始"的比赛后，无法立即加入？
A: 可能的原因：
1. 比赛状态已经改变（不再是 `Created`）
2. 玩家数量已满
3. 代币授权不足
4. 网络不支持

### Q: "立即开始"模式下，最晚什么时候可以加入？
A:
- **前端逻辑**：只要状态是 `Created`，就可以加入
- **合约逻辑**：在 `gameStartTime + 15 minutes` 之前可以加入

### Q: 为什么会有"Unknown"显示？
A: 可能的原因：
1. `gameType` 不在 1-4 范围内（合约中的定义）
2. `status` 不在 0-4 范围内（合约中的定义）
3. 数据读取失败或未加载完成

## 调试建议

### 检查比赛详情
```javascript
const gameData = await publicClient.readContract({
  address: gameAddress,
  abi: GAME_INSTANCE_ABI,
  functionName: 'getGameData',
});

console.log('Status:', gameData.status.toString());
console.log('Game Type:', gameData.gameType.toString());
console.log('Player Count:', gameData.playerCount.toString());
```

### 检查当前时间
```javascript
const currentBlock = await publicClient.getBlock();
const currentTimestamp = Number(currentBlock.timestamp);
console.log('Current timestamp:', currentTimestamp);
```

### 检查比赛时间
```javascript
const [regEndTime, gameStartTime] = await Promise.all([
  publicClient.readContract({ address: gameAddress, abi: GAME_INSTANCE_ABI, functionName: 'registrationEndTime' }),
  publicClient.readContract({ address: gameAddress, abi: GAME_INSTANCE_ABI, functionName: 'gameStartTime' }),
]);

console.log('Registration end time:', Number(regEndTime));
console.log('Game start time:', Number(gameStartTime));
console.log('Is immediate start mode:', Number(regEndTime) === Number(gameStartTime));
```

## 最近修复

1. **修复"立即开始"模式的时间判断逻辑**
   - 之前：要求在 `gameStartTime + 15 minutes` 之前加入
   - 现在：只要状态是 `Created`，就可以加入（因为比赛可能还没被手动开始）

2. **调整检查顺序**
   - 之前：先检查时间，再检查状态
   - 现在：先检查状态，再检查时间（因为状态更重要）

3. **移除 console.error**
   - 所有 `console.error` 改为 `console.log`，避免控制台报错
