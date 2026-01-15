# Blitz Arena 故障排除指南

## 问题：创建比赛后看不到比赛，没有弹出钱包授权

### 已修复的问题

1. ✅ **Hardhat 节点未运行**
   - 原因：本地 Hardhat 网络节点未启动
   - 解决：节点已在后台运行 (`http://127.0.0.1:8545`)

2. ✅ **合约未部署**
   - 原因：合约代码未部署到本地网络
   - 解决：所有合约已重新部署

3. ✅ **前端配置的合约地址不正确**
   - 原因：配置文件中的合约地址过期
   - 解决：`src/lib/chainConfig.ts` 已更新为最新地址

4. ✅ **GameFactory 缺少 ADMIN_ROLE 权限**
   - 原因：GameFactory 尝试授予 GameInstance GAME_ROLE，但缺少 ADMIN_ROLE
   - 解决：部署脚本已更新，授予 GameFactory ADMIN_ROLE

### 当前合约地址（Hardhat 本地网络）

```json
{
  "BLZ_TOKEN": "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  "PRIZE_TOKEN": "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
  "GAME_REGISTRY": "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  "GAME_FACTORY": "0x9A676e781A523b5d0C0e43731313A708CB607508",
  "USER_LEVEL_MANAGER": "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
}
```

### 如何验证问题已解决

#### 1. 检查 Hardhat 节点是否运行

在终端中执行：
```bash
curl http://127.0.0.1:8545
```

如果返回 JSON 响应，说明节点正常运行。

#### 2. 检查合约是否部署

在浏览器中访问 `http://localhost:5000`，打开浏览器控制台（F12），执行：

```javascript
// 检查合约代码是否存在
fetch('http://127.0.0.1:8545', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_getCode',
    params: ['0x9A676e781A523b5d0C0e43731313A708CB607508', 'latest'],
    id: 1
  })
})
.then(res => res.json())
.then(data => {
  console.log('合约代码长度:', data.result.length / 2 - 1);
  console.log('合约是否存在:', data.result !== '0x');
});
```

#### 3. 检查钱包配置

**重要：必须配置 MetaMask**

1. 打开 MetaMask 扩展
2. 点击网络下拉菜单
3. 点击"添加网络"或"自定义RPC"
4. 填写以下信息：

```
网络名称：Hardhat Local
RPC URL：http://127.0.0.1:8545
链 ID：3137
货币符号：ETH
区块浏览器 URL：(留空)
```

5. 点击"保存"
6. 切换到 Hardhat Local 网络

#### 4. 导入测试账户

使用以下私钥导入测试账户（推荐使用第一个）：

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

操作步骤：
1. 点击 MetaMask 右上角的账户图标
2. 选择"导入账户"
3. 粘贴上述私钥
4. 确认导入

导入后，你应该看到余额为 10,000 ETH。

#### 5. 刷新前端页面

完成上述配置后：
1. 刷新浏览器页面（F5）
2. 确认 MetaMask 已连接到 Hardhat Local 网络
3. 确认已导入测试账户

### 测试创建比赛

1. 点击导航栏的 "Create Tournament"
2. 填写比赛信息：
   - 标题：Test Tournament
   - 游戏类型：选择任意一个（如 Number Guess）
   - 报名费：5
   - 奖池：100（必须 ≥ 25）
3. 点击"Create Tournament" 按钮

**预期结果：**
- MetaMask 弹出交易确认窗口
- 显示交易详情（创建比赛）
- 确认交易
- 交易成功后，页面跳转到比赛列表
- 可以看到新创建的比赛

### 如果仍然出现问题

#### 问题 1：MetaMask 不弹出授权窗口

**可能原因：**
- MetaMask 未连接到 Hardhat 网络
- 网络配置不正确
- 账户余额不足

**解决方案：**
1. 检查 MetaMask 网络是否为 "Hardhat Local"
2. 检查账户余额是否 > 0
3. 刷新页面并重试

#### 问题 2：交易失败

**可能原因：**
- 授权失败
- 余额不足
- Gas 费不足

**解决方案：**
1. 检查账户是否有足够的 ETH（用于 Gas）
2. 检查是否有足够的 Prize Token（用于创建比赛）
3. 查看浏览器控制台的错误信息

#### 问题 3：创建比赛后看不到比赛

**可能原因：**
- 交易未确认
- 前端未刷新数据
- 合约调用失败

**解决方案：**
1. 检查 MetaMask 交易历史，确认交易已成功
2. 刷新页面
3. 打开浏览器控制台，查看是否有错误

### 常见错误及解决方案

#### 错误 1：`HTTP request failed. URL: http://127.0.0.1:8545`

**原因：** Hardhat 节点未运行

**解决方案：**
```bash
# 检查节点是否运行
curl http://127.0.0.1:8545

# 如果未运行，启动节点
npx hardhat node > /tmp/hardhat.log 2>&1 &
```

#### 错误 2：`AccessControlUnauthorizedAccount`

**原因：** 合约权限配置错误

**解决方案：** 重新部署合约
```bash
npx hardhat run scripts/deploy.js --network localhost
```

#### 错误 3：`Wallet not connected`

**原因：** MetaMask 未连接

**解决方案：**
1. 点击页面右上角的"Connect Wallet"按钮
2. 授权 MetaMask 连接

### 重新部署合约的完整流程

如果需要重新部署合约：

1. **停止当前节点**
   ```bash
   pkill -f "hardhat node"
   ```

2. **重新部署合约**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **启动节点**
   ```bash
   npx hardhat node > /tmp/hardhat.log 2>&1 &
   ```

4. **更新前端配置**
   - 打开 `src/lib/chainConfig.ts`
   - 使用 `deployments/deployment.json` 中的地址更新配置

5. **刷新浏览器页面**

### 获取帮助

如果上述步骤都无法解决问题，请：

1. 打开浏览器控制台（F12）
2. 查看错误消息
3. 检查终端中的 Hardhat 节点日志
4. 运行诊断脚本：

```bash
npx hardhat run test/verify-games.js --network localhost
```

### 测试账户

Hardhat 节点自动生成 20 个测试账户，每个账户有 10,000 ETH：

| 账户 | 私钥 |
|-----|------|
| Account #0 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| Account #1 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| Account #2 | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |

### 快速检查清单

- [ ] Hardhat 节点正在运行
- [ ] MetaMask 已添加 Hardhat Local 网络
- [ ] MetaMask 已切换到 Hardhat Local 网络
- [ ] 已导入测试账户
- [ ] 账户余额 > 0
- [ ] 前端页面已刷新
- [ ] MetaMask 已连接到前端
- [ ] 合约地址配置正确

### 联系支持

如果问题仍未解决，请提供以下信息：

1. 浏览器控制台的错误消息
2. MetaMask 交易历史
3. Hardhat 节点日志
4. 当前网络和账户信息
