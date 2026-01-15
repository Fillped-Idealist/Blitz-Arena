# Blitz Arena - 区块链游戏竞技平台 / Blockchain Gaming Tournament Platform

<div align="center">

一个基于智能合约的生产级游戏竞技平台，采用现代化 UI/UX 设计，支持多钱包集成和无缝智能合约交互。

A production-grade blockchain gaming tournament platform featuring modern UI/UX design, multi-wallet support, and seamless smart contract integration.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[在线演示 / Live Demo](https://5c5f236a-6d0b-4eed-82db-6a193669bde6.dev.coze.site/test) ·
[功能特性 / Features](#-特性-features) ·
[快速开始 / Quick Start](#-快速开始-quick-start) ·
[文档 / Documentation](#-文档-documentation)

</div>

---

## 📝 描述 / Description

### 中文

Blitz Arena 是一个原生的区块链游戏竞技平台，它使玩家能够在 Mantle 区块链上创建、参与和管理游戏比赛。平台抽象化了智能合约部署、资金管理和游戏执行的复杂性，提供了类似于现代 Web 应用的游戏竞技体验。

每次比赛创建都会自动在 Mantle 上部署智能合约，初始化比赛环境并开始报名。支持多种游戏类型，玩家可以参与比赛、提交成绩、争夺奖金。

### English

Blitz Arena is a native blockchain gaming tournament platform that enables players to create, join, and manage game tournaments on the Mantle blockchain. The platform abstracts the complexity of smart contract deployment, fund management, and game execution, providing a gaming tournament experience similar to modern web applications.

Every tournament creation automatically deploys smart contracts to the Mantle blockchain, initializing the tournament environment and starting registration. The platform supports multiple game types, allowing players to participate in tournaments, submit scores, and compete for prizes.

---

## 🔗 重要链接 / Important Links

### 代码仓库 / Code Repositories
- [主仓库 / Main Repository](https://github.com/YOUR_USERNAME/Blitz-Arena)
- [智能合约 / Smart Contracts](./contracts/)
- [前端应用 / Frontend Application](./src/)

### 平台和工具 / Platforms and Tools
- [在线演示 / Live Demo](https://5c5f236a-6d0b-4eed-82db-6a193669bde6.dev.coze.site/test)
- [Mantle Sepolia 测试网水龙头 / Mantle Sepolia Testnet Faucet](https://faucet.mantle.xyz/)

---

## ✨ 特性 / Features

### 🎮 智能合约功能 / Smart Contract Features

- **GameFactory**: 工厂模式创建比赛实例 / Factory pattern for creating tournament instances
- **GameInstance**: 完整比赛生命周期管理 / Complete tournament lifecycle management
- **GameRegistry**: 游戏类型注册、结果验证和反作弊机制 / Game type registration, result verification, and anti-cheat mechanisms
- **UserLevelManager**: 链上等级、经验和成就管理 / On-chain level, experience, and achievement management
- **Multi-Chain Support**: 支持 Hardhat 本地网络和 Mantle Sepolia 测试网 / Supports Hardhat local network and Mantle Sepolia testnet

### 💰 平台代币（BLZ）/ Platform Token (BLZ)

Blitz Arena 使用 BLZ 代币作为平台原生实用代币：

Blitz Arena uses the BLZ token as the platform's native utility token:

- **报名费 / Entry Fee**: 玩家支付 BLZ 代币参加比赛 / Players pay BLZ tokens to participate in tournaments
- **奖池 / Prize Pool**: 获胜者获得 BLZ 代币作为奖励 / Winners receive BLZ tokens as rewards
- **平台手续费 / Platform Fee**: 所有比赛交易的 10% 手续费（创建、报名、退款）/ 10% fee on all tournament transactions (creation, entry, refunds)
- **经验系统 / Experience System**: 1 BLZ = 1 EXP，用于升级 / 1 BLZ = 1 EXP, used for leveling up
- **成就奖励 / Achievement Rewards**: 解锁成就获得 BLZ 代币 / Unlock achievements to earn BLZ tokens

**代币分配 / Token Distribution:**
- 参与奖励 / Participation Reward: 3 BLZ per tournament (游戏完成后发放 / awarded after game completion)
- 前 3 名奖励 / Top 3 Bonus: 第 1 名 20 BLZ，第 2 名 10 BLZ，第 3 名 5 BLZ
- 成就奖励 / Achievement Rewards: 解锁成就获得不等数量 BLZ / Variable BLZ amounts for unlocking achievements
- 等级进度 / Level Progression: 1 BLZ = 1 EXP，等级需求每级增加 1.5 倍 / Level up requirements increase by 1.5x per level

### 🎮 游戏功能 / Game Features

1. **猜数字 / Number Guess** - 猜数字游戏（1-100），最少尝试次数获胜 / Guess a number between 1-100 with minimum attempts
2. **石头剪刀布 / Rock Paper Scissors** - 与 AI 进行 10 回合对战 / Battle AI in 10 rounds
3. **快速点击 / Quick Click** - 30 秒内尽可能多地点击目标 / Click as many targets as possible within 30 seconds
4. **轮回裂隙 / Cycle Rift** - 带技能升级的肉鸽生存游戏 / Roguelike survival game with skill upgrades
5. **无限消除 / Infinite Match** - 无限关卡的消除游戏 / Match-3 puzzle game with infinite levels

**游戏模式 / Game Modes:**
- **比赛模式 / Tournament Mode**: 连接钱包，加入比赛，争夺 BLZ 代币，成绩上链 / Connect wallet, join tournaments, compete for BLZ tokens, track on-chain
- **体验模式 / Experience Mode**: 无需钱包连接，无区块链交易，成绩不保存 / Play without wallet connection, no blockchain transactions, no score persistence

### 🤝 社交系统 / Social System

- **好友系统 / Friend System**: 发送好友请求、接受/拒绝请求、管理好友列表 / Send friend requests, accept/reject requests, manage friend list
- **消息系统 / Messaging System**: 与好友和比赛参与者实时聊天 / Real-time chat with friends and tournament participants
- **比赛聊天室 / Tournament Chat**: 每个比赛自动创建聊天室，24 小时自动清理 / Automatic chat room creation for each tournament, 24-hour auto-cleanup
- **个人主页点赞 / Profile Likes**: 点赞其他玩家的主页以示赞赏 / Like other players' profiles to show appreciation
- **链下数据存储 / Off-chain Data Storage**: 所有社交数据使用 localStorage 存储，零 Gas 消耗 / All social data uses localStorage for zero gas cost

### 🏆 成就系统 / Achievement System

7 个预定义成就，涵盖游戏和社交类别，存储在链上：

7 pre-defined achievements across game and social categories, stored on-chain:

**游戏成就 / Game Achievements:**
- "首场比赛 / First Tournament" - 参加你的第一场比赛（奖励：3 BLZ）/ Join your first tournament (Reward: 3 BLZ)
- "得分大师 / Score Master" - 在比赛中提交成绩（奖励：5 BLZ）/ Submit a score in a tournament (Reward: 5 BLZ)
- "冠军 / Champion" - 赢得你的第一场比赛（奖励：10 BLZ）/ Win your first tournament (Reward: 10 BLZ)
- "比赛老兵 / Tournament Veteran" - 参加 10 场比赛（奖励：15 BLZ）/ Participate in 10 tournaments (Reward: 15 BLZ)

**社交成就 / Social Achievements:**
- "第一个朋友 / First Friend" - 添加第一个好友（奖励：3 BLZ）/ Add your first friend (Reward: 3 BLZ)
- "社交达人 / Social Butterfly" - 添加 10 个好友（奖励：10 BLZ）/ Add 10 friends (Reward: 10 BLZ)
- "社区之星 / Community Star" - 获得 50 个主页点赞（奖励：15 BLZ）/ Receive 50 profile likes (Reward: 15 BLZ)

### 📊 等级与经验系统（链上）/ Level & Experience System (On-Chain)

- **等级范围 / Level Range**: 1 到 100 级 / 1 to 100
- **经验计算 / Experience Calculation**: 1 BLZ = 1 EXP
- **等级需求 / Level Requirements**: 公式 / Formula: `EXP for Level N = 100 × 1.5^(N-1)`
- **等级权益 / Level Benefits**: 更高的等级显示游戏经验和投入程度 / Higher levels show gaming experience and dedication
- **进度提升 / Progression**: 参加比赛、赢得比赛、解锁成就可获得 EXP / Participate in tournaments, win games, unlock achievements to earn EXP
- **UserLevelManager 合约 / Contract**: 在链上管理所有等级数据 / Manages all level data on-chain with secure role-based access control
- **最高等级 / Maximum Level**: 100 级需要约 33 亿 EXP / Level 100 requires ~3.3 billion EXP

### 🏅 排行榜 / Leaderboard

- **实时排名 / Real-time Rankings**: 查看所有游戏的顶级玩家 / View top players across all games
- **游戏筛选 / Game Filtering**: 按特定游戏类型筛选 / Filter by specific game type
- **时间范围 / Time Range**: 按天、周、月或全部时间查看排名 / View rankings by day, week, month, or all-time
- **自定义 UI 组件 / Custom UI Components**: 现代下拉筛选器，平滑动画 / Modern dropdown filters with smooth animations

### 🚀 技术栈 / Technology Stack

#### 前端 / Frontend
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui (production-ready components)
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi v3 + RainbowKit (multi-wallet support)
- **Animations**: Framer Motion
- **TypeScript**: Full type safety

#### 区块链 / Blockchain
- **Smart Contracts**: Solidity ^0.8.24
- **Framework**: Hardhat
- **Networks**: Mantle Sepolia Testnet, Hardhat Local
- **Libraries**: OpenZeppelin Contracts, ethers.js v6, viem

#### 开发工具 / Development Tools
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git

---

## 📖 快速开始 / Quick Start

### 前置要求 / Prerequisites

- Node.js 20+
- pnpm
- MetaMask 或兼容的 Web3 钱包 / MetaMask or compatible Web3 wallet

### 1. 克隆项目 / Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Blitz-Arena.git
cd Blitz-Arena
```

### 2. 安装依赖 / Install Dependencies

```bash
pnpm install
```

### 3. 配置环境变量 / Configure Environment Variables

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的变量（如果需要）：
Edit the `.env` file to configure necessary variables (if needed):

```env
# Mantle Sepolia Testnet
NEXT_PUBLIC_MANTLE_SEPOLIA_RPC_URL=https://sepolia.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5003

# Local Hardhat Network
NEXT_PUBLIC_LOCAL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_LOCAL_CHAIN_ID=31337
```

### 4. 编译智能合约 / Compile Smart Contracts

```bash
pnpm run compile
```

### 5. 启动本地区块链网络 / Start Local Blockchain

在新的终端窗口中打开：
In a new terminal window:

```bash
npx hardhat node
```

### 6. 部署合约到本地网络 / Deploy Contracts to Local Network

在另一个终端中：
In another terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 7. 启动前端开发服务器 / Start Frontend Development Server

```bash
pnpm run dev
```

访问 / Visit: [http://localhost:5000](http://localhost:5000)

### 8. 配置 MetaMask / Configure MetaMask

添加本地网络到 MetaMask：
Add local network to MetaMask:

- **Network Name**: Hardhat Local
- **RPC URL**: http://localhost:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

获取测试代币 / Get test tokens:
```bash
npx hardhat run scripts/check-wallet.js --network localhost
```

---

## 🌐 部署到 Mantle Sepolia 测试网 / Deploy to Mantle Sepolia Testnet

### 1. 获取 MNT 测试代币 / Get MNT Test Tokens

访问水龙头 / Visit: [https://faucet.mantle.xyz/](https://faucet.mantle.xyz/)

### 2. 配置 MetaMask / Configure MetaMask

添加 Mantle Sepolia 网络：
Add Mantle Sepolia network to MetaMask:

- **Network Name**: Mantle Sepolia Testnet
- **RPC URL**: https://sepolia.mantle.xyz
- **Chain ID**: 5003
- **Currency Symbol**: MNT
- **Block Explorer**: https://sepolia.mantle.xyz

### 3. 部署合约 / Deploy Contracts

```bash
npx hardhat run scripts/deploy.js --network mantle
```

或者使用部署脚本：
Or use deployment script:

```bash
bash scripts/deploy-mantle.sh
```

### 4. 更新前端配置 / Update Frontend Configuration

将部署的合约地址更新到 `src/lib/chainConfig.ts`：
Update the deployed contract addresses in `src/lib/chainConfig.ts`:

```typescript
export const MANTLE_SEPOLIA = {
  chainId: 5003,
  GAME_FACTORY: "0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA",
  GAME_REGISTRY: "0x...", // 替换为实际地址 / Replace with actual address
  USER_LEVEL_MANAGER: "0x...", // 替换为实际地址 / Replace with actual address
  // ... 其他配置 / Other configurations
}
```

### 5. 验证合约（可选）/ Verify Contracts (Optional)

```bash
npx hardhat verify --network mantle <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 📁 项目结构 / Project Structure

```
Blitz-Arena/
├── contracts/              # 智能合约 / Smart Contracts
│   ├── GameFactory.sol     # 工厂合约 / Factory Contract
│   ├── GameInstance.sol    # 游戏实例合约 / Game Instance Contract
│   ├── GameRegistry.sol    # 游戏注册合约 / Game Registry Contract
│   ├── UserLevelManager.sol # 等级管理合约 / Level Manager Contract
│   └── Types.sol           # 类型定义 / Type Definitions
├── scripts/                # 部署脚本 / Deployment Scripts
│   ├── deploy.js           # 主部署脚本 / Main Deployment Script
│   └── deploy-mantle.sh    # Mantle 部署脚本 / Mantle Deployment Script
├── src/                    # 前端源码 / Frontend Source
│   ├── app/                # Next.js 页面 / Next.js Pages
│   ├── components/         # React 组件 / React Components
│   ├── hooks/              # 自定义 Hooks / Custom Hooks
│   ├── lib/                # 工具库 / Utilities
│   └── types/              # 类型定义 / Type Definitions
└── public/                 # 公共资源 / Public Assets
    └── game-assets/        # 游戏资源 / Game Assets
```

---

## 🎮 游戏模式 / Game Modes

### 比赛模式 / Tournament Mode

1. 连接钱包 / Connect wallet
2. 浏览比赛列表 / Browse tournament list
3. 加入比赛（支付报名费）/ Join tournament (pay entry fee)
4. 玩游戏 / Play game
5. 提交成绩 / Submit score
6. 等待比赛结束 / Wait for tournament to end
7. 领取奖金 / Claim prize

### 体验模式 / Experience Mode

1. 无需连接钱包 / No wallet connection needed
2. 从比赛详情页进入体验模式 / Enter experience mode from tournament details
3. 完整游戏体验 / Full game experience
4. 成绩不保存 / No score persistence
5. 无区块链交易 / No blockchain transactions

---

## 🤝 贡献 / Contributing

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 许可证 / License

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

## 📞 联系方式 / Contact

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/Blitz-Arena/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/Blitz-Arena/discussions)

---

## 🙏 致谢 / Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Mantle Network](https://www.mantle.xyz/)
- [OpenZeppelin](https://openzeppelin.com/)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！/ If this project helps you, please give it a Star! ⭐**

Made with ❤️ by Blitz Arena Team

</div>
