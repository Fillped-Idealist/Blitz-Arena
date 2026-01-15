# Blitz Arena - 区块链游戏竞技平台

<div align="center">

一个基于智能合约的生产级游戏竞技平台，采用现代化 UI/UX 设计，支持多钱包集成和无缝智能合约交互。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[在线演示](https://youtu.be/zPmpruHYvKI) ·
[功能特性](#-特性-features) ·
[快速开始](#-快速开始-quick-start) ·
[文档](#-文档-documentation)

</div>

---

## 📝 描述

Blitz Arena 是一个原生的区块链游戏竞技平台，它使玩家能够在 Mantle 区块链上创建、参与和管理游戏比赛。平台抽象化了智能合约部署、资金管理和游戏执行的复杂性，提供了类似于现代 Web 应用的游戏竞技体验。

每次比赛创建都会自动在 Mantle 上部署智能合约，初始化比赛环境并开始报名。支持多种游戏类型，玩家可以参与比赛、提交成绩、争夺奖金。

---

## 🔗 重要链接

### 代码仓库
- [主仓库](https://github.com/Fillped-Idealist/Blitz-Arena)
- [智能合约](./contracts/)
- [前端应用](./src/)

### 平台和工具
- [在线演示](https://youtu.be/zPmpruHYvKI)
- [Mantle Sepolia 测试网水龙头](https://faucet.mantle.xyz/)

### 联系方式
- **邮箱**: 2062147937@qq.com
- **GitHub**: [Fillped-Idealist](https://github.com/Fillped-Idealist?tab=repositories)

### 📜 已部署合约（Mantle Sepolia 测试网）

| 合约名称 | 合约地址 | 区块浏览器 |
|---------|---------|-----------|
| **BLZ 代币** | `0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A` | [查看](https://sepolia.mantlescan.xyz/address/0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A) |
| **MNT 奖金代币** | `0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A` | [查看](https://sepolia.mantlescan.xyz/address/0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A) |
| **Game Registry** | `0xDEd2563C3111a654603A2427Db18452C85b31C2B` | [查看](https://sepolia.mantlescan.xyz/address/0xDEd2563C3111a654603A2427Db18452C85b31C2B) |
| **Game Factory** | `0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA` | [查看](https://sepolia.mantlescan.xyz/address/0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA) |
| **User Level Manager** | `0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba` | [查看](https://sepolia.mantlescan.xyz/address/0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba) |

---

## ✨ 特性

### 🎮 智能合约功能

- **GameFactory**: 工厂模式创建比赛实例
- **GameInstance**: 完整比赛生命周期管理
- **GameRegistry**: 游戏类型注册、结果验证和反作弊机制
- **UserLevelManager**: 链上等级、经验和成就管理
- **多链支持**: 支持 Hardhat 本地网络和 Mantle Sepolia 测试网

### 💰 平台代币（BLZ）

Blitz Arena 使用 BLZ 代币作为平台原生实用代币：

- **报名费**: 玩家支付 BLZ 代币参加比赛
- **奖池**: 获胜者获得 BLZ 代币作为奖励
- **平台手续费**: 所有比赛交易的 10% 手续费（创建、报名、退款）
- **经验系统**: 1 BLZ = 1 EXP，用于升级
- **成就奖励**: 解锁成就获得 BLZ 代币

**代币分配:**
- 参与奖励: 每个比赛 3 BLZ（游戏完成后发放）
- 前 3 名奖励: 第 1 名 20 BLZ，第 2 名 10 BLZ，第 3 名 5 BLZ
- 成就奖励: 解锁成就获得不等数量 BLZ
- 等级进度: 1 BLZ = 1 EXP，等级需求每级增加 1.5 倍

### 🎮 游戏功能

1. **猜数字** - 猜数字游戏（1-100），最少尝试次数获胜
2. **石头剪刀布** - 与 AI 进行 10 回合对战
3. **快速点击** - 30 秒内尽可能多地点击目标
4. **轮回裂隙** - 带技能升级的肉鸽生存游戏
5. **无限消除** - 无限关卡的消除游戏

**游戏模式:**
- **比赛模式**: 连接钱包，加入比赛，争夺 BLZ 代币，成绩上链
- **体验模式**: 无需钱包连接，无区块链交易，成绩不保存

### 🤝 社交系统

- **好友系统**: 发送好友请求、接受/拒绝请求、管理好友列表
- **消息系统**: 与好友和比赛参与者实时聊天
- **比赛聊天室**: 每个比赛自动创建聊天室，24 小时自动清理
- **个人主页点赞**: 点赞其他玩家的主页以示赞赏
- **链下数据存储**: 所有社交数据使用 localStorage 存储，零 Gas 消耗

### 🏆 成就系统

7 个预定义成就，涵盖游戏和社交类别，存储在链上：

**游戏成就:**
- "首场比赛" - 参加你的第一场比赛（奖励：3 BLZ）
- "得分大师" - 在比赛中提交成绩（奖励：5 BLZ）
- "冠军" - 赢得你的第一场比赛（奖励：10 BLZ）
- "比赛老兵" - 参加 10 场比赛（奖励：15 BLZ）

**社交成就:**
- "第一个朋友" - 添加第一个好友（奖励：3 BLZ）
- "社交达人" - 添加 10 个好友（奖励：10 BLZ）
- "社区之星" - 获得 50 个主页点赞（奖励：15 BLZ）

### 📊 等级与经验系统（链上）

- **等级范围**: 1 到 100 级
- **经验计算**: 1 BLZ = 1 EXP
- **等级需求**: 公式: `EXP for Level N = 100 × 1.5^(N-1)`
- **等级权益**: 更高的等级显示游戏经验和投入程度
- **进度提升**: 参加比赛、赢得比赛、解锁成就可获得 EXP
- **UserLevelManager 合约**: 在链上管理所有等级数据
- **最高等级**: 100 级需要约 33 亿 EXP

### 🏅 排行榜

- **实时排名**: 查看所有游戏的顶级玩家
- **游戏筛选**: 按特定游戏类型筛选
- **时间范围**: 按天、周、月或全部时间查看排名
- **自定义 UI 组件**: 现代下拉筛选器，平滑动画

### 🚀 技术栈

#### 前端
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui（生产级组件）
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi v3 + RainbowKit（多钱包支持）
- **Animations**: Framer Motion
- **TypeScript**: 完整类型安全

#### 区块链
- **Smart Contracts**: Solidity ^0.8.24
- **Framework**: Hardhat
- **Networks**: Mantle Sepolia Testnet, Hardhat Local
- **Libraries**: OpenZeppelin Contracts, ethers.js v6, viem

#### 开发工具
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git

---

## 📖 快速开始

### 前置要求

- Node.js 20+
- pnpm
- MetaMask 或兼容的 Web3 钱包

### 1. 克隆项目

```bash
git clone https://github.com/Fillped-Idealist/Blitz-Arena.git
cd Blitz-Arena
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的变量（如果需要）：

```env
# Mantle Sepolia 测试网
NEXT_PUBLIC_MANTLE_SEPOLIA_RPC_URL=https://sepolia.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5003

# 本地 Hardhat 网络
NEXT_PUBLIC_LOCAL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_LOCAL_CHAIN_ID=31337
```

### 4. 编译智能合约

```bash
pnpm run compile
```

### 5. 启动本地区块链网络

在新的终端窗口中打开：

```bash
npx hardhat node
```

### 6. 部署合约到本地网络

在另一个终端中：

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 7. 启动前端开发服务器

```bash
pnpm run dev
```

访问: [http://localhost:5000](http://localhost:5000)

### 8. 配置 MetaMask

添加本地网络到 MetaMask：

- **Network Name**: Hardhat Local
- **RPC URL**: http://localhost:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

获取测试代币:
```bash
npx hardhat run scripts/check-wallet.js --network localhost
```

---

## 🌐 部署到 Mantle Sepolia 测试网

### 1. 获取 MNT 测试代币

访问: [https://faucet.mantle.xyz/](https://faucet.mantle.xyz/)

### 2. 配置 MetaMask

添加 Mantle Sepolia 网络到 MetaMask：

- **Network Name**: Mantle Sepolia Testnet
- **RPC URL**: https://sepolia.mantle.xyz
- **Chain ID**: 5003
- **Currency Symbol**: MNT
- **Block Explorer**: https://sepolia.mantle.xyz

### 3. 部署合约

```bash
npx hardhat run scripts/deploy.js --network mantle
```

或者使用部署脚本：

```bash
bash scripts/deploy-mantle.sh
```

### 4. 更新前端配置

将部署的合约地址更新到 `src/lib/chainConfig.ts`：

```typescript
export const MANTLE_SEPOLIA = {
  chainId: 5003,
  GAME_FACTORY: "0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA",
  GAME_REGISTRY: "0x...", // 替换为实际地址
  USER_LEVEL_MANAGER: "0x...", // 替换为实际地址
  // ... 其他配置
}
```

### 5. 验证合约（可选）

```bash
npx hardhat verify --network mantle <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 📁 项目结构

```
Blitz-Arena/
├── contracts/              # 智能合约
│   ├── GameFactory.sol     # 工厂合约
│   ├── GameInstance.sol    # 游戏实例合约
│   ├── GameRegistry.sol    # 游戏注册合约
│   ├── UserLevelManager.sol # 等级管理合约
│   └── Types.sol           # 类型定义
├── scripts/                # 部署脚本
│   ├── deploy.js           # 主部署脚本
│   └── deploy-mantle.sh    # Mantle 部署脚本
├── src/                    # 前端源码
│   ├── app/                # Next.js 页面
│   ├── components/         # React 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   └── types/              # 类型定义
└── public/                 # 公共资源
    └── game-assets/        # 游戏资源
```

---

## 🎮 游戏模式

### 比赛模式

1. 连接钱包
2. 浏览比赛列表
3. 加入比赛（支付报名费）
4. 玩游戏
5. 提交成绩
6. 等待比赛结束
7. 领取奖金

### 体验模式

1. 无需连接钱包
2. 从比赛详情页进入体验模式
3. 完整游戏体验
4. 成绩不保存
5. 无区块链交易

---

## 🤝 贡献

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- **邮箱**: 2062147937@qq.com
- **GitHub**: [Fillped-Idealist](https://github.com/Fillped-Idealist?tab=repositories)
- **Issues**: [GitHub Issues](https://github.com/Fillped-Idealist/Blitz-Arena/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Fillped-Idealist/Blitz-Arena/discussions)

---

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Mantle Network](https://www.mantle.xyz/)
- [OpenZeppelin](https://openzeppelin.com/)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！ ⭐**

由 [Fillped-Idealist](https://github.com/Fillped-Idealist?tab=repositories) 用 ❤️ 制作

</div>
