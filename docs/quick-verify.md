# 快速验证指南

## 1. 检查合约部署

使用以下命令验证所有合约是否已正确部署：

```bash
npx hardhat run scripts/verify-deployment.js --network mantle_testnet
```

预期输出：
```
=== Verifying Deployment on Mantle Sepolia ===
✅ BLZ Token: Code exists (3854 bytes)
✅ Prize Token: Code exists (3854 bytes)
✅ UserLevelManager: Code exists (10796 bytes)
✅ GameRegistry: Code exists (11712 bytes)
✅ GameFactory: Code exists (43270 bytes)
```

## 2. 检查钱包余额

```bash
npx hardhat run scripts/check-wallet.js --network mantle_testnet
```

预期输出：
```
✅ Wallet connected successfully
Deployer address: 0xce289Ca273e6edd7D84CA15eB354E56a34c7d03d
Wallet balance: 103.226 MNT
Network: mantle_testnet
Chain ID: 5003
```

## 3. 检查前端配置

在浏览器中打开应用，检查以下几点：

### 3.1 钱包连接

- 打开 MetaMask 或 RainbowKit
- 连接到 Mantle Sepolia 测试网 (Chain ID: 5003)
- 确认钱包地址显示正确

### 3.2 网络配置

- 检查 MetaMask 是否连接到 Mantle Sepolia
- RPC URL: https://rpc.sepolia.mantle.xyz
- 链 ID: 5003

### 3.3 合约地址

打开浏览器控制台，运行以下代码：

```javascript
// 获取当前链的合约地址
import { getContractAddresses } from '@/lib/chainConfig';
import { useChainId } from 'wagmi';

const chainId = useChainId();
const addresses = getContractAddresses(chainId);

console.log('Contract Addresses:', addresses);
```

预期输出：
```javascript
{
  BLZ_TOKEN: '0x2dfC071529Fb5b7A7F88558CF78584aE2209D2b6',
  PRIZE_TOKEN: '0xcB2a1d1227f96756c02e4B147596C56D45027cFa',
  GAME_REGISTRY: '0x370B81AB8fAE14B8c6b9bd72F85201Bdb1fbeD01',
  GAME_FACTORY: '0x3bC8655F6903b138C5BfB8F974F65e4C01800A5f',
  USER_LEVEL_MANAGER: '0x98a5D63514231d348269d0D4Ace62cd0265dFa7b'
}
```

## 4. 在浏览器中验证合约

访问 Mantle Explorer: https://sepolia.mantlescan.xyz/

搜索以下合约地址，确认合约存在：

- **BLZ Token**: 0x2dfC071529Fb5b7A7F88558CF78584aE2209D2b6
- **Prize Token**: 0xcB2a1d1227f96756c02e4B147596C56D45027cFa
- **UserLevelManager**: 0x98a5D63514231d348269d0D4Ace62cd0265dFa7b
- **GameRegistry**: 0x370B81AB8fAE14B8c6b9bd72F85201Bdb1fbeD01
- **GameFactory**: 0x3bC8655F6903b138C5BfB8F974F65e4C01800A5f

## 5. 测试核心功能

### 5.1 创建比赛

1. 连接钱包
2. 导航到创建比赛页面
3. 填写比赛信息
4. 提交交易
5. 确认交易成功

### 5.2 参加比赛

1. 导航到比赛列表
2. 选择一个比赛
3. 点击"Join"按钮
4. 支付报名费
5. 确认报名成功

### 5.3 查看个人主页

1. 导航到个人主页
2. 检查等级和代币余额
3. 查看历史比赛
4. 确认数据正确显示

## 6. 检查 TypeScript 编译

```bash
npx tsc --noEmit
```

预期输出：无错误

## 7. 检查前端构建

```bash
pnpm run build
```

预期输出：构建成功

## 常见问题

### Q: 合约地址显示为空

**A**: 检查 `src/lib/chainConfig.ts` 中的合约地址是否正确配置。

### Q: 钱包无法连接

**A**: 确保 MetaMask 连接到 Mantle Sepolia 测试网，Chain ID 为 5003。

### Q: 交易失败

**A**: 检查钱包是否有足够的 MNT 余额，检查网络连接是否正常。

### Q: 前端无法读取合约数据

**A**: 检查 Wagmi 配置，确保网络 ID 正确，检查合约 ABI 是否正确。

## 验证检查清单

- [ ] 合约部署验证通过
- [ ] 钱包余额检查通过
- [ ] 前端配置正确
- [ ] MetaMask 连接正常
- [ ] 合约地址在浏览器中可查
- [ ] 创建比赛功能正常
- [ ] 参加比赛功能正常
- [ ] 个人主页显示正常
- [ ] TypeScript 编译通过
- [ ] 前端构建成功

## 快速修复

### 问题：chainConfig 地址错误

```bash
# 编辑 src/lib/chainConfig.ts
# 更新 Mantle Sepolia (5003) 的合约地址
```

### 问题：Hardhat 网络配置错误

```bash
# 编辑 hardhat.config.js
# 确认 RPC URL 和 Chain ID 正确
```

### 问题：环境变量未加载

```bash
# 检查 .env 文件是否存在
# 确认 dotenv 已配置在 hardhat.config.js 中
```

## 相关文档

- [MANTLE-DEPLOYMENT-SUMMARY.md](./MANTLE-DEPLOYMENT-SUMMARY.md) - 完整部署总结
- [DEPLOYMENT-SUCCESS.md](./DEPLOYMENT-SUCCESS.md) - 部署成功指南
- [troubleshooting.md](./troubleshooting.md) - 故障排除

---

**最后更新**: 2026-01-15
**验证状态**: ✅ 通过
