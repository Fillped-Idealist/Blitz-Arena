# 快速开始指南

## 🌐 网络配置

### 支持的网络

Blitz Arena 支持以下两个网络：

1. **Mantle Sepolia Testnet** (推荐)
   - Chain ID: 5003
   - RPC URL: https://rpc.sepolia.mantle.xyz
   - 区块浏览器: https://sepolia.mantlescan.xyz
   - 水龙头: https://sepolia.mantle.xyz/faucet

2. **Hardhat Local** (开发测试)
   - Chain ID: 31337
   - RPC URL: http://127.0.0.1:8545

### 连接到 Mantle Sepolia 测试网

#### 方法 1: 使用 RainbowKit (推荐)

1. 打开应用
2. 点击右上角的 "Connect Wallet" 按钮
3. 选择你的钱包（MetaMask、WalletConnect 等）
4. 如果当前网络不是 Mantle Sepolia，点击网络切换按钮
5. 选择 "Mantle Sepolia Testnet"

#### 方法 2: 手动配置 MetaMask

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 点击 "添加网络" 或 "自定义 RPC"
4. 填写以下信息：

```
网络名称：Mantle Sepolia Testnet
RPC URL：https://rpc.sepolia.mantle.xyz
链 ID：5003
货币符号：MNT
区块浏览器 URL：https://sepolia.mantlescan.xyz
```

5. 点击 "保存"
6. 确保选择 "Mantle Sepolia Testnet"

## 💰 获取测试代币

### MNT (Gas 代币)

访问 Mantle 水龙头获取 MNT：
- https://sepolia.mantle.xyz/faucet

**步骤**：
1. 复制你的钱包地址
2. 访问水龙头网站
3. 粘贴钱包地址
4. 完成验证（如果有）
5. 等待 1-2 分钟

### BLZ Token (游戏激励代币)

BLZ Token 目前通过以下方式获取：
- 参加比赛：获得 3 BLZ
- 比赛获胜：第一名 20 BLZ，第二名 10 BLZ，第三名 5 BLZ
- 解锁成就：获得额外的 BLZ 奖励

## 🎮 核心功能

### 1. 创建比赛

1. 连接到 Mantle Sepolia 测试网
2. 导航到 "Create Tournament" 页面
3. 填写比赛信息：
   - 标题
   - 描述
   - 游戏类型（肉鸽割草 / 无限消除 / 其他）
   - 报名费（默认 5 MNT）
   - 最小/最大人数
   - 报名结束时间
   - 游戏开始时间
   - 奖池金额
   - 奖金分配方式
4. 授权 GameFactory 转移代币
5. 确认创建比赛

### 2. 参加比赛

1. 导航到 "Tournaments" 页面
2. 选择一个比赛
3. 点击 "Join" 按钮
4. 授权 GameInstance 转移报名费
5. 确认参加比赛

### 3. 玩游戏

1. 等待比赛开始
2. 进入游戏页面
3. 开始游戏并获得分数
4. 提交分数到智能合约

### 4. 领取奖金

1. 等待比赛结束
2. 等待创建者设置获胜者
3. 等待奖金分发
4. 在比赛详情页领取奖金

### 5. 查看个人主页

1. 导航到 "Profile" 页面
2. 查看以下信息：
   - 等级和经验值
   - BLZ 代币余额
   - 历史比赛记录
   - 获得的成就
   - 好友列表

## ⚠️ 常见问题

### Q: 提示 "Unsupported Network"

**A**: 你的钱包连接到了不支持的网络。点击提示框中的 "Switch to Mantle Sepolia" 按钮，或手动切换到 Mantle Sepolia 测试网。

### Q: 交易失败 "insufficient funds"

**A**: 你的 MNT 余额不足以支付 Gas 费。访问水龙头获取更多 MNT。

### Q: 无法连接到钱包

**A**: 确保：
- MetaMask 已安装并解锁
- 钱包已连接到正确的网络
- RainbowKit 配置正确

### Q: 游戏无法加载

**A**: 确保你已连接到支持的网络，并且比赛已开始。

### Q: 提交分数失败

**A**: 确保：
- 比赛正在进行中（状态为 Ongoing）
- 你已经参加了比赛
- 网络连接正常

## 🔧 故障排除

### 检查网络连接

1. 打开浏览器控制台
2. 检查是否有网络错误
3. 确认钱包连接到正确的网络

### 检查合约地址

在浏览器控制台中运行：

```javascript
import { getContractAddresses, useChainId } from '@/lib/chainConfig';
import { useChainId } from 'wagmi';

const chainId = useChainId();
const addresses = getContractAddresses(chainId);
console.log('Current network:', chainId);
console.log('Contract addresses:', addresses);
```

### 清除缓存

如果遇到奇怪的问题，尝试：
1. 清除浏览器缓存
2. 重新加载页面
3. 重新连接钱包

## 📚 相关文档

- [部署总结](./MANTLE-DEPLOYMENT-SUMMARY.md) - Mantle Sepolia 部署详情
- [部署指南](./deploy-mantle-sepolia.md) - 合约部署指南
- [前端修复](./FRONTEND-FIXES.md) - 前端错误修复
- [故障排除](./troubleshooting.md) - 常见问题解决

## 🚀 下一步

1. 连接到 Mantle Sepolia 测试网
2. 获取测试代币
3. 创建或参加比赛
4. 体验游戏功能
5. 查看个人主页和排行榜

---

**最后更新**: 2026-01-15
**状态**: ✅ 所有功能正常运行
