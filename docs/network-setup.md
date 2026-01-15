# MetaMask 网络配置指南

## 如何在 MetaMask 中添加 Hardhat 本地网络

### 方法 1：手动添加网络

1. 打开 MetaMask 扩展
2. 点击顶部的网络下拉菜单
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

### 方法 2：使用开发者工具

如果你已经连接到钱包，可以在浏览器控制台执行以下代码自动添加网络：

```javascript
window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0xc35',
    chainName: 'Hardhat Local',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: []
  }]
})
```

## 如何切换网络

添加网络后：

1. 点击 MetaMask 顶部的网络下拉菜单
2. 选择"Hardhat Local"网络
3. 确认网络已切换

## 如何获取测试账户

Hardhat 节点启动时会自动生成 20 个测试账户，每个账户有 10,000 ETH：

1. 点击 MetaMask 右上角的账户图标
2. 选择"导入账户"
3. 使用以下私钥导入测试账户：

**Account #0** (推荐使用):
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Account #1**:
```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Account #2**:
```
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

## 验证网络连接

切换到 Hardhat 网络后，检查 MetaMask 是否显示：
- 网络名称：Hardhat Local
- 余额：10,000 ETH（或对应账户的余额）
- 链 ID：3137

## 常见问题

### Q: MetaMask 显示"网络错误"或无法连接

**A:** 确保 Hardhat 节点正在运行。在终端中执行：
```bash
curl http://127.0.0.1:8545
```

如果返回 JSON 响应，说明节点正常运行。

### Q: 余额为 0

**A:** Hardhat 网络的测试账户默认有 10,000 ETH。如果余额为 0，可能是：
1. 使用了错误的账户地址
2. Hardhat 节点已重启（账户地址会改变）

### Q: 交易被拒绝

**A:** 检查：
1. 账户是否有足够的余额
2. 是否已授权合约使用代币
3. Gas 费用是否合理

### Q: 看不到创建的比赛

**A:** 检查：
1. 是否正确连接到 Hardhat 网络
2. 交易是否成功确认
3. 前端页面是否已刷新

## 切换到 Mantle Sepolia 测试网

如果需要切换到 Mantle Sepolia 测试网：

1. 点击 MetaMask 顶部的网络下拉菜单
2. 点击"添加网络"
3. 搜索"Mantle Sepolia"或填写以下信息：

```
网络名称：Mantle Sepolia Testnet
RPC URL：https://rpc.sepolia.mantle.xyz
链 ID：5003
货币符号：MNT
区块浏览器 URL：https://sepolia.mantlescan.xyz
```

4. 点击"添加"

## 获取 Mantle Sepolia 测试币

1. 访问 [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)
2. 输入你的钱包地址
3. 完成验证
4. 等待测试币到账（通常 1-2 分钟）
