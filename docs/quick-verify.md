# Blitz Arena 快速验证指南

## 一键验证所有配置

### 1. 验证 Hardhat 节点

在终端中执行：

```bash
curl -I http://127.0.0.1:8545
```

**预期结果：** 返回 HTTP 200 响应

### 2. 验证合约部署

```bash
npx hardhat run test/verify-games.js --network localhost
```

**预期结果：** 显示比赛列表（至少 1 个比赛）

### 3. 验证前端服务

在浏览器中访问：`http://localhost:5000`

**预期结果：** 页面正常加载，无控制台错误

## 测试创建比赛的完整步骤

### 步骤 1：配置 MetaMask

1. 打开 MetaMask
2. 添加网络：
   - 名称：Hardhat Local
   - RPC URL：http://127.0.0.1:8545
   - 链 ID：3137
   - 符号：ETH

3. 导入账户：
   - 私钥：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 步骤 2：连接钱包

1. 访问 `http://localhost:5000`
2. 点击右上角 "Connect Wallet"
3. 在 MetaMask 中确认连接

### 步骤 3：创建比赛

1. 点击导航栏 "Create Tournament"
2. 填写表单：
   - **标题：** My First Tournament
   - **游戏类型：** Number Guess (🔢)
   - **报名费：** 5
   - **创建者奖池：** 100
   - **最小人数：** 2
   - **最大人数：** 10
   - **比赛时长：** 30 min
   - **游戏时长：** 30 min
3. 点击 "Create Tournament"

### 步骤 4：确认交易

1. MetaMask 弹出交易窗口
2. 确认交易详情
3. 点击 "Confirm"

### 步骤 5：查看比赛

1. 交易成功后，自动跳转到比赛列表
2. 看到新创建的比赛 "My First Tournament"
3. 点击比赛查看详情

## 测试报名比赛

### 步骤 1：切换到第二个账户

1. 在 MetaMask 中切换账户
2. 导入第二个账户：
   - 私钥：`0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### 步骤 2：授权代币

1. 返回比赛列表
2. 点击比赛 "My First Tournament"
3. 点击 "Join Tournament"
4. MetaMask 弹出授权窗口
5. 确认授权 Prize Token

### 步骤 3：支付报名费

1. MetaMask 再次弹出，显示支付 5 PRIZE
2. 确认交易

### 步骤 4：确认报名

1. 交易成功后，页面显示 "Joined"
2. 比赛详情页显示参与者列表

## 测试游戏流程

### 步骤 1：等待报名结束

方法 1：手动修改时间
```bash
# 在另一个终端中，加速时间
npx hardhat console --network localhost
> await ethers.provider.send('evm_increaseTime', [3600])
> await ethers.provider.send('evm_mine', [])
> exit
```

方法 2：创建短期比赛
- 重新创建一个比赛，设置报名时长为 1 分钟

### 步骤 2：开始比赛

1. 使用创建者账户
2. 进入比赛详情页
3. 点击 "Start Game"

### 步骤 3：玩游戏

1. 游戏页面自动打开
2. 完成 Number Guess 游戏
3. 提交分数

### 步骤 4：查看排行榜

1. 返回比赛详情页
2. 查看 "Leaderboard" 部分
3. 看到你的分数

## 常见问题

### Q1: MetaMask 显示"网络错误"

**原因：** Hardhat 节点未运行

**解决：**
```bash
pkill -f "hardhat node"
npx hardhat node > /tmp/hardhat.log 2>&1 &
```

### Q2: 交易失败，提示"insufficient funds"

**原因：** 账户没有足够的 ETH 或代币

**解决：**
- 确保使用的是测试账户（有 10,000 ETH）
- 检查是否需要授权代币

### Q3: 创建比赛后看不到比赛

**原因：** 交易未确认或前端未刷新

**解决：**
- 检查 MetaMask 交易历史
- 刷新页面
- 打开控制台查看错误

### Q4: 报名时无反应

**原因：** 未授权代币

**解决：**
- 第一次报名时需要先授权
- 确认 MetaMask 授权窗口

## 检查清单

使用以下清单确保所有配置正确：

```bash
# 1. 检查 Hardhat 节点
curl -I http://127.0.0.1:8545

# 2. 检查合约
npx hardhat run test/verify-games.js --network localhost

# 3. 检查 Next.js
curl -I http://localhost:5000

# 4. 检查 TypeScript 编译
npx tsc --noEmit
```

所有检查都应该返回成功（HTTP 200 或无错误）。

## 下一步

验证完成后，你可以：

1. 创建更多比赛
2. 邀请朋友参与（使用不同的测试账户）
3. 尝试不同的游戏类型
4. 探索排行榜和个人资料功能

## 技术支持

如果遇到问题：

1. 查看浏览器控制台（F12）
2. 查看 Hardhat 节点日志：`tail -f /tmp/hardhat.log`
3. 查看 Next.js 开发服务器日志
4. 参考故障排除指南：`docs/troubleshooting.md`
