# 奖金分配与排名逻辑文档

## 概述

本文档详细说明了游戏竞技平台的奖金分配逻辑和排名规则，包括三种奖金分配方式、并列排名处理和自动奖金分配机制。

---

## 1. 奖金分配方式

平台支持三种奖金分配方式，创建比赛时可选择：

### 1.1 Winner Takes All (赢家通吃)
- **分配类型**: `distributionType = '0'`
- **分配规则**: 100% 奖金池给第一名
- **适用场景**: 高竞争性比赛，鼓励争夺第一名

**示例**:
- 奖金池: 200 MNT
- 提交成绩: 10 人
- 分配结果:
  - 第 1 名: 200 MNT
  - 其他: 0 MNT

### 1.2 Average Split (平均分配)
- **分配类型**: `distributionType = '1'`
- **分配规则**: 所有提交成绩的参与者平分奖金池
- **适用场景**: 鼓励参与，降低竞争压力

**示例**:
- 奖金池: 200 MNT
- 提交成绩: 10 人
- 分配结果:
  - 每人: 20 MNT

### 1.3 Top 3 Ranked (前三名分配)
- **分配类型**: `distributionType = '2'`
- **分配规则**: 按排名比例分配（60% / 30% / 10%）
- **适用场景**: 平衡竞争与奖励

**示例**:
- 奖金池: 200 MNT
- 提交成绩: 10 人
- 分配结果:
  - 第 1 名: 120 MNT (60%)
  - 第 2 名: 60 MNT (30%)
  - 第 3 名: 20 MNT (10%)
  - 其他: 0 MNT

> **注意**: 如果参与人数少于 3 人，奖金只分配给实际参与者（如只有 1 人则 100%，2 人则 60%/40%）

---

## 2. 奖金池计算

### 2.1 奖金池来源
奖金池在创建比赛时由组织者设定，直接使用 `prize` 字段的值。

```typescript
奖金池 = parseFloat(tournament.prize)
```

### 2.2 平台手续费
- **费率**: 10%
- **收取时机**: 玩家加入比赛时
- **计算方式**: 每个玩家支付的报名费的 10%

**示例**:
- 报名费: 5 MNT
- 参与人数: 10 人
- 平台手续费: 5 MNT × 10 × 10% = 5 MNT

> **重要**: 平台手续费从报名费中扣除，不影响奖金池。

---

## 3. 排名规则

### 3.1 基本排序原则
排名按照以下优先级排序：

1. **分数降序**: 分数高的排名靠前
2. **提交时间升序**: 分数相同时，先提交成绩的排名靠前

```typescript
const sortResults = (results) => {
  return [...results].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // 分数高的排前面
    }
    return a.timestamp - b.timestamp; // 分数相同则提交时间早的排前面
  });
};
```

### 3.2 并列排名示例

**场景**: 5 人提交成绩，其中 2 人分数相同

| 排名 | 地址 | 分数 | 提交时间 |
|-----|------|------|----------|
| 1 | 0x1234...5678 | 1000 | 10:00:00 |
| 2 | 0xabcd...efgh | 950 | 10:01:00 |
| 3 | 0x9876...5432 | 950 | 10:05:00 |
| 4 | 0xfedc...ba98 | 900 | 10:10:00 |
| 5 | 0x1111...2222 | 850 | 10:15:00 |

**Winner Takes All 模式**:
- 第 1 名 (0x1234...5678): 100% 奖金池

**Top 3 Ranked 模式**:
- 第 1 名 (0x1234...5678): 60%
- 第 2 名 (0xabcd...efgh): 30%
- 第 3 名 (0x9876...5432): 10%

---

## 4. 自动奖金分配机制

### 4.1 触发条件
奖金分配在以下情况自动触发：

1. **比赛结束**: 比赛状态从非 `Ended` 变为 `Ended`
2. **有成绩提交**: `tournament.results.length > 0`

### 4.2 分配流程

```typescript
// 1. 检查比赛是否结束
if (tournament.status !== 'Ended') {
  console.error('Cannot distribute prizes: Tournament not ended');
  return;
}

// 2. 检查是否有成绩
if (tournament.results.length === 0) {
  console.log('No results to distribute prizes');
  return;
}

// 3. 计算奖金池
const prizePool = parseFloat(tournament.prize);

// 4. 按分数和时间排序
const sortedResults = [...tournament.results].sort((a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  return a.timestamp - b.timestamp;
});

// 5. 根据 distributionType 分配奖金
switch (tournament.distributionType) {
  case '0': // Winner Takes All
  case '1': // Average Split
  case '2': // Top 3 Ranked
    // 执行分配...
}
```

### 4.3 交易记录
每次奖金分配都会记录交易：

```typescript
addTransaction({
  type: 'prize_payout',
  fromAddress: null,       // 平台发放
  toAddress: winnerAddress,  // 获胜玩家
  amount: prize.toString(),
  tournamentId,
  description: `Tournament prize payout: ${prize} tokens`
});
```

---

## 5. 用户交互与反馈

### 5.1 排名显示
- **比赛详情页**: 显示完整排行榜，包括排名、地址、分数
- **当前玩家高亮**: 当前登录玩家的行会高亮显示（蓝色背景）
- **排名颜色**: 前三名使用特殊颜色标记
  - 第 1 名: 金黄色 (`text-yellow-400`)
  - 第 2 名: 银灰色 (`text-gray-300`)
  - 第 3 名: 铜棕色 (`text-amber-600`)

### 5.2 奖金分配提示
- **自动分配提示**: 比赛结束时显示 toast 提示
  ```
  Tournament "XXX" has ended! Prizes have been distributed.
  ```
- **交易记录**: 用户可以在个人中心查看奖金到账记录

### 5.3 分配方式显示
- **比赛详情页**: 显示奖金分配方式
  ```
  Distribution: Winner Takes All
  ```

---

## 6. 边界情况处理

### 6.1 无人提交成绩
- **场景**: `tournament.results.length === 0`
- **处理**: 不分配奖金，记录日志
- **资金流向**: 奖金池保留在平台

### 6.2 Top 3 Ranked 但参与者少于 3 人
- **场景**: 只有 1-2 人提交成绩
- **处理**: 只分配给实际参与者
  - 1 人: 100%
  - 2 人: 60% / 40%

### 6.3 分数为 0
- **场景**: 玩家得分为 0
- **处理**: 正常参与排名，可以分得奖金（Average Split 模式）

### 6.4 奖金池为 0
- **场景**: 比赛创建时未设置奖金池
- **处理**: 不分配奖金，记录日志

### 6.5 奖金金额过小
- **场景**: `Math.floor(prize / count) = 0`
- **处理**: 不分配奖金，跳过该玩家

---

## 7. 代码实现位置

### 7.1 奖金分配逻辑
- **文件**: `src/lib/tournamentStore.ts`
- **函数**: `distributePrizes(tournamentId: string)`
- **行号**: 约 648-710 行

### 7.2 排名逻辑
- **文件**: `src/app/tournament/[id]/page.tsx`
- **函数**: `sortResults(results)`
- **位置**: 组件顶部，约 90-100 行

### 7.3 交易记录
- **文件**: `src/lib/tournamentStore.ts`
- **函数**: `recordPrizePayout()`, `addTransaction()`
- **行号**: 约 575-590 行

---

## 8. 测试场景

### 8.1 测试用例 1: Winner Takes All
**设置**:
- 奖金池: 200 MNT
- 分配方式: Winner Takes All
- 参与者: 10 人，提交成绩 5 人

**预期结果**:
- 第 1 名: 200 MNT
- 第 2-5 名: 0 MNT
- 交易记录: 1 条 `prize_payout`

### 8.2 测试用例 2: Average Split
**设置**:
- 奖金池: 200 MNT
- 分配方式: Average Split
- 参与者: 10 人，提交成绩 5 人

**预期结果**:
- 每人: 40 MNT
- 交易记录: 5 条 `prize_payout`

### 8.3 测试用例 3: Top 3 Ranked
**设置**:
- 奖金池: 200 MNT
- 分配方式: Top 3 Ranked
- 参与者: 10 人，提交成绩 5 人

**预期结果**:
- 第 1 名: 120 MNT
- 第 2 名: 60 MNT
- 第 3 名: 20 MNT
- 第 4-5 名: 0 MNT
- 交易记录: 3 条 `prize_payout`

### 8.4 测试用例 4: 并列排名
**设置**:
- 奖金池: 200 MNT
- 分配方式: Winner Takes All
- 参与者: 3 人，分数相同

**预期结果**:
- 第 1 名: 200 MNT（最先提交的）
- 第 2-3 名: 0 MNT

---

## 9. 未来优化建议

### 9.1 奖金分配方式扩展
- 添加更多分配方式：
  - 前 5 名分配 (50% / 25% / 15% / 7% / 3%)
  - 前 10 名分配
  - 按分数比例分配

### 9.2 排名显示优化
- 添加并列排名显示（如 1、1、3 而不是 1、2、3）
- 显示排名变化趋势（上升/下降）
- 添加历史排名记录

### 9.3 奖金池动态调整
- 支持奖金池动态追加
- 支持奖金池来源多样化（赞助商收入等）
- 添加奖金池分红机制

---

## 10. 相关文档
- [资金流向总结](./FINANCIAL_SUMMARY.md) - 详细的资金流向和交易记录
- [比赛逻辑](./README.md) - 比赛创建、加入、取消等流程

---

**最后更新**: 2024年
**维护者**: Game Platform Team
