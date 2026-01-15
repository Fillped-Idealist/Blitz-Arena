# 代币返还和奖励分发功能更新文档

## 修改概述

本次更新解决了代币返还和奖励分发的问题，添加了前端按钮来手动触发这些操作。

## 修改内容

### 1. 添加合约调用 Hooks

**文件**: `src/hooks/useGameContract.ts`

新增了以下 hooks：
- `useStartGame()` - 开始比赛（仅创建者可见）
- `useCancelGame()` - 取消比赛（仅创建者可见）
- `useDistributePrize()` - 分发奖励（仅创建者可见）
- `useClaimPrize()` - 领取奖励（有奖励的玩家可见）

### 2. 更新比赛详情页

**文件**: `src/app/tournament/[id]/page.tsx`

添加了以下按钮：

#### Start Tournament（开始比赛）
- **显示条件**: 创建者 + 比赛状态为 Created + 报名已结束
- **功能**: 创建者可以手动开始比赛

#### Cancel Tournament（取消比赛）
- **显示条件**: 创建者 + 比赛状态为 Created 或 Ongoing
- **功能**: 创建者可以取消比赛，自动退还所有玩家的报名费和创建者的奖池

#### Distribute Prizes（分发奖励）
- **显示条件**: 创建者 + 比赛状态为 Ended
- **功能**: 创建者可以分发奖励给胜者

#### Claim Prize（领取奖励）
- **显示条件**: 有可领取奖励的玩家
- **功能**: 玩家可以领取自己的奖励

### 3. 移除最大分数限制

**文件**: `contracts/GameRegistry.sol`

移除了以下内容：
- `maxScores` 映射
- `updateMaxScore()` 函数
- 分数验证检查
- `getGameInfo()` 函数中的 `maxScore` 返回

### 4. 增量部署

**脚本**:
- `scripts/deploy-registry-only.js` - 只部署 GameRegistry 到指定网络
- `scripts/deploy-registry-localhost.js` - 只部署 GameRegistry 到本地网络

**部署结果**:

本地 Hardhat 网络:
- 新 GameRegistry: `0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3`

Mantle Sepolia 测试网:
- 新 GameRegistry: `0xDEd2563C3111a654603A2427Db18452C85b31C2B`

## 使用说明

### 创建者操作流程

1. **创建比赛**
   - 在创建比赛页面填写比赛信息
   - 提交交易

2. **等待玩家加入**
   - 玩家可以在比赛列表看到并加入比赛

3. **开始比赛**（手动触发）
   - 进入比赛详情页
   - 点击 "Start Tournament" 按钮
   - 确认交易
   - 如果人数不足，比赛会自动取消并退款

4. **设置胜者**
   - 等待所有玩家提交分数
   - 点击 "Set Winners" 按钮（如果有此功能）
   - 选择胜者

5. **分发奖励**（手动触发）
   - 进入比赛详情页
   - 点击 "Distribute Prizes" 按钮
   - 确认交易
   - 奖励会自动分配给胜者

6. **取消比赛**（可选）
   - 进入比赛详情页
   - 点击 "Cancel Tournament" 按钮
   - 确认交易
   - 所有玩家的报名费和创建者的奖池会被退还

### 玩家操作流程

1. **加入比赛**
   - 在比赛列表看到比赛
   - 点击 "Join" 按钮
   - 确认交易

2. **玩游戏**
   - 进入比赛详情页
   - 点击 "Start Game" 按钮
   - 完成游戏并提交分数

3. **领取奖励**
   - 如果比赛已分发奖励，会看到 "Claim Prize" 按钮
   - 点击按钮领取奖励

## 合约逻辑说明

### 自动取消（人数不足）
当创建者调用 `startGame()` 时，如果玩家数量少于 `minPlayers`，比赛会自动取消：
- 退还创建者的奖池
- 退还所有玩家的报名费（扣除 10% 平台手续费）

### 手动取消
创建者可以随时调用 `cancelGame()` 取消比赛：
- 退还所有玩家的报名费（扣除 10% 平台手续费）
- 退还创建者的奖池

### 奖励分发
创建者调用 `distributePrize()` 分发奖励：
- 根据 `distributionType` 分配奖励
- Winner Takes All: 第一名获得全部
- Average Split: 所有参赛者平分
- CustomRanked: 按排名分配（支持 Top 3）

### 领取奖励
玩家调用 `claimPrize()` 领取自己的奖励：
- 检查是否有可领取的奖励
- 转账给玩家

## 注意事项

### 消耗测试币的问题
- 每次部署都会消耗一些测试币
- 使用增量部署可以减少消耗
- 本地网络部署不消耗测试币

### 响应时间问题
响应时间慢的主要原因：
1. 网络延迟（Mantle Sepolia 测试网）
2. 链上数据查询需要时间
3. 需要多次合约调用

优化建议：
1. 使用本地网络进行测试（响应更快）
2. 减少不必要的合约调用
3. 添加数据缓存

### 兼容性说明
- 新创建的比赛会使用新的 GameRegistry（无分数限制）
- 已存在的比赛继续使用旧的 GameRegistry（有分数限制）
- 如果需要更新已存在的比赛，需要创建迁移脚本（会消耗更多 gas）

## 部署命令

### 本地网络
```bash
npx hardhat run scripts/deploy-registry-localhost.js --network localhost
```

### Mantle Sepolia 测试网
```bash
npx hardhat run scripts/deploy-registry-only.js --network mantle_testnet
```

## 更新配置文件

每次部署后，需要更新 `src/lib/chainConfig.ts` 中的合约地址。

## 总结

本次更新：
✓ 添加了代币返还和奖励分发的前端按钮
✓ 实现了相关的合约调用 hooks
✓ 移除了最大分数限制
✓ 使用增量部署减少了测试币消耗
✓ 提供了完整的使用说明

所有功能已在本地网络和 Mantle Sepolia 测试网部署完成，可以进行测试。
