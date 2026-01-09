# 游戏竞技平台

基于以太坊智能合约的游戏竞技平台，支持创建比赛、报名参加、提交成绩和分发奖金。

## 项目结构

```
.
├── contracts/           # Solidity 智能合约
│   ├── Types.sol       # 共享类型定义
│   ├── GameFactory.sol  # 工厂合约
│   ├── GameInstance.sol # 游戏实例合约
│   └── MockERC20.sol    # 测试代币合约
├── scripts/            # 部署脚本
│   └── deploy.js       # 合约部署脚本
├── deployments/        # 部署信息
│   └── deployment.json # 部署地址信息
├── src/               # Next.js 前端
│   ├── app/          # 页面组件
│   └── types/        # TypeScript 类型定义
└── hardhat.config.js # Hardhat 配置
```

## 智能合约功能

### Types.sol
定义了共享的数据结构和枚举类型：
- `GameStatus`: 游戏状态（已创建、进行中、已结束等）
- `PlayerInfo`: 玩家信息结构体
- `PrizeDistributionType`: 奖励分配方式（胜者全得、平均分配、自定义排名）
- `GameConfig`: 游戏配置参数
- `GameData`: 游戏数据

### GameFactory.sol
工厂合约，负责：
- 创建游戏实例
- 收取 5% 平台手续费
- 管理所有游戏实例
- 提取累积的费用

### GameInstance.sol
游戏实例合约，负责：
- 玩家报名/取消报名
- 游戏流程管理（开始、结束）
- 成绩提交
- 胜者设置
- 奖金分发
- 退款处理

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 编译合约

```bash
pnpm run compile
```

### 3. 部署合约到本地网络

```bash
pnpm run deploy:local
```

部署完成后，合约地址会保存在 `deployments/deployment.json` 文件中。

### 4. 启动前端服务

前端服务应该已经自动启动，如果没有：

```bash
pnpm run dev
```

访问 http://localhost:5000 查看前端界面。

## 前端功能

### 钱包连接
- 支持 MetaMask 等兼容钱包
- 自动切换到正确的网络（本地测试网 chainId: 31337）

### 游戏管理
- **创建游戏**: 设置游戏标题、描述、报名费、奖池、玩家数量等
- **游戏列表**: 查看所有可用游戏
- **参加游戏**: 缴纳报名费并加入游戏
- **铸造测试代币**: 为测试环境铸造 BLZ 和 PRIZE 代币

### 游戏状态
- **已创建**: 玩家可以报名
- **进行中**: 游戏进行中，玩家可以提交成绩
- **已结束**: 游戏结束，等待设置胜者
- **奖金已分发**: 奖金已分发，玩家可以领取
- **已取消**: 游戏取消，玩家可以申请退款

## 合约地址

本地测试网部署地址（参考 `deployments/deployment.json`）：
- **BLZ Token**: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- **Prize Token**: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
- **GameFactory**: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

## 测试流程

1. **连接钱包**
   - 点击"连接钱包"按钮
   - 在 MetaMask 中确认连接

2. **铸造测试代币**
   - 点击"铸造测试代币"按钮
   - 获得用于测试的 BLZ 和 PRIZE 代币

3. **创建游戏**
   - 切换到"创建游戏"标签
   - 填写游戏信息
   - 提交交易

4. **参加游戏**
   - 在游戏列表中找到刚创建的游戏
   - 点击"参加游戏"按钮
   - 缴纳报名费

## 部署到 Mantle 测试网

### 1. 配置环境变量

创建 `.env` 文件：

```
PRIVATE_KEY=your_private_key_here
```

### 2. 部署

```bash
pnpm run deploy:testnet
```

### 3. 更新前端合约地址

修改 `src/app/page.tsx` 中的合约地址：

```typescript
const GAME_FACTORY_ADDRESS = "your_deployed_factory_address";
const BLZ_TOKEN_ADDRESS = "your_deployed_blz_token_address";
const PRIZE_TOKEN_ADDRESS = "your_deployed_prize_token_address";
```

## 注意事项

1. **Gas 费用**: 本地测试网 Gas 费用为 0，但真实网络需要支付
2. **代币授权**: 创建游戏前需要先授权代币给 Factory 合约
3. **时间戳**: 游戏时间使用 Unix 时间戳
4. **安全性**: 生产环境部署前请进行完整的安全审计

## 技术栈

- **智能合约**: Solidity ^0.8.24, OpenZeppelin Contracts
- **前端**: Next.js 16, React 19, Tailwind CSS 4
- **Web3**: ethers.js v6
- **开发框架**: Hardhat

## 开发命令

```bash
# 编译合约
pnpm run compile

# 运行测试
pnpm run test

# 部署到本地
pnpm run deploy:local

# 部署到 Mantle 测试网
pnpm run deploy:testnet

# 启动 Hardhat 节点
pnpm run node

# 启动前端开发服务器
pnpm run dev
```

## License

MIT
