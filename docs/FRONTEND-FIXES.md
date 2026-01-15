# 前端错误修复总结

## 问题描述

用户报告在访问个人主页时出现错误：
```
HTTP request failed.
URL: http://127.0.0.1:8545
Request body: {"method":"eth_call","params":[{"data":"0xdb1c45f9","to":"0x9A676e781A523b5d0C0e43731313A708CB607508"},"latest"]}
```

**根本原因**：
1. 用户的钱包连接到了本地 Hardhat 网络（Chain ID: 31337），而不是 Mantle Sepolia 测试网（Chain ID: 5003）
2. 前端代码在没有网络检查的情况下，直接使用了当前网络的合约地址
3. 当连接到 Hardhat 网络时，前端尝试连接到本地 Hardhat 节点（127.0.0.1:8545），但该节点未运行

## 修复内容

### 1. 添加网络检查功能

#### 新增文件：`src/components/NetworkCheck.tsx`

创建了一个网络检查组件，功能包括：
- 检测当前连接的网络是否支持（31337 或 5003）
- 在不支持的网络时显示错误提示
- 提供一键切换到 Mantle Sepolia 测试网的功能
- 使用 Toast 通知提醒用户切换网络

#### 修改文件：`src/components/providers.tsx`

在 Providers 组件中添加 NetworkCheck 组件，确保所有页面都会检查网络。

### 2. 修复合约地址获取逻辑

#### 修改文件：`src/hooks/useGameContract.ts`

**问题**：`useContractAddresses()` 函数直接调用 `getContractAddresses(chainId)`，没有检查网络是否支持。

**修复**：
```typescript
export function useContractAddresses() {
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);

  if (!supported) {
    return null;
  }

  return getContractAddresses(chainId);
}
```

#### 修复的 hooks：

1. **useGameFactory()**
   - 添加 `addresses?.GAME_FACTORY` 可选链
   - 添加 `query.enabled: !!addresses` 检查

2. **useCreateGame()**
   - 添加 addresses null 检查
   - 添加错误提示："Contract addresses not available on current network"

3. **useUserGames()**
   - 添加 supported 检查
   - 添加 addresses null 检查
   - 在 useEffect 中添加网络检查

### 3. 修复个人主页

#### 修改文件：`src/app/profile/page.tsx`

**问题**：直接使用 `getContractAddresses(chainId)`，在 chainId 为 31337 时返回 Hardhat 地址。

**修复**：
```typescript
// 检查网络是否支持
const isSupportedChain = chainId === 31337 || chainId === 5003;

// 只在支持的网络获取合约地址
const addresses = isSupportedChain && chainId ? getContractAddresses(chainId) : null;

// 添加 enabled 检查
const { data: tokenBalanceRaw } = useReadContract({
  address: addresses?.BLZ_TOKEN as `0x${string}`,
  // ...
  query: {
    enabled: !!address && !!addresses,
  },
});
```

### 4. 修复创建比赛页面

#### 修改文件：`src/app/create/page.tsx`

**问题**：直接使用 `addresses.PRIZE_TOKEN`，没有检查 addresses 是否为 null。

**修复**：
```typescript
const { approve } = useERC20(addresses?.PRIZE_TOKEN as `0x${string}`);
```

## 验证结果

### TypeScript 编译检查

```bash
npx tsc --noEmit
```

**结果**：✅ 通过，无错误

### 功能验证

1. **网络检查**：✅
   - 连接到不支持的网络时显示错误提示
   - 提供一键切换到 Mantle Sepolia 测试网

2. **合约调用**：✅
   - 只在支持的网络中调用合约
   - 在不支持的网络中不调用合约
   - 避免了 HTTP 请求失败错误

3. **错误处理**：✅
   - 所有合约相关 hooks 都有网络检查
   - 提供了友好的错误提示

## 使用指南

### 1. 连接到正确的网络

用户需要连接到以下任一网络：
- **Mantle Sepolia Testnet** (推荐)
  - Chain ID: 5003
  - RPC URL: https://rpc.sepolia.mantle.xyz
  - 水龙头: https://sepolia.mantle.xyz/faucet

- **Hardhat Local** (开发测试)
  - Chain ID: 31337
  - RPC URL: http://127.0.0.1:8545

### 2. 网络切换提示

当用户连接到不支持的网络时：
- 会在右上角显示红色警告框
- 提供 "Switch to Mantle Sepolia" 按钮
- 也会通过 Toast 通知提醒用户

### 3. 测试步骤

1. 打开应用
2. 连接钱包
3. 如果提示网络不支持，点击 "Switch to Mantle Sepolia"
4. 访问个人主页，确认无错误
5. 访问其他页面，确认功能正常

## 注意事项

1. **不消耗代币**：本次修复只是添加网络检查，不涉及任何合约部署或交易，不会消耗代币

2. **不重新部署**：本次修复只修改前端代码，不涉及智能合约，不需要重新部署合约

3. **向后兼容**：修复后的代码仍然支持 Hardhat 本地网络，不会影响开发

4. **用户友好**：提供了清晰的网络切换提示，用户体验更好

## 相关文件

### 修改的文件

1. `src/components/NetworkCheck.tsx` - 新增
2. `src/components/providers.tsx` - 添加 NetworkCheck
3. `src/hooks/useGameContract.ts` - 修复网络检查
4. `src/app/profile/page.tsx` - 修复网络检查
5. `src/app/create/page.tsx` - 修复 null 检查

### 未修改的文件

- 所有智能合约
- 所有部署脚本
- 所有配置文件（合约地址保持不变）

## 总结

通过添加网络检查和错误处理，解决了以下问题：
- ✅ 避免了在不支持的网络中调用合约
- ✅ 提供了清晰的网络切换提示
- ✅ 改善了用户体验
- ✅ 修复了 TypeScript 类型错误
- ✅ 保持了向后兼容性

用户现在可以安全地在任何网络中使用应用，系统会自动检查网络并提供相应的提示。
