# Blitz Arena - 区块链游戏竞技平台

一个基于智能合约的生产级游戏竞技平台，采用现代化 UI/UX 设计，支持多钱包集成和无缝智能合约交互。

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 📝 描述

Blitz Arena 是一个原生的区块链游戏竞技平台，它使玩家能够在 Mantle 区块链上创建、参与和管理游戏比赛。平台抽象化了智能合约部署、资金管理和游戏执行的复杂性，提供了类似于现代 Web 应用的游戏竞技体验。

每次比赛创建都会自动在 Mantle 上部署智能合约，初始化比赛环境并开始报名。支持多种游戏类型，玩家可以参与比赛、提交成绩、争夺奖金。

## 🔗 重要链接

### 代码仓库
- [主仓库](https://github.com/your-repo/blitz-arena) - 主项目代码
- [智能合约](./contracts/) - Solidity 智能合约代码
- [前端应用](./src/) - Next.js 前端应用

### 平台和工具
- [在线演示](https://your-demo-url.com) - 实时平台演示
- [Mantle Sepolia 测试网水龙头](https://faucet.mantle.xyz/) - 获取测试网代币

### 媒体与文档
- [快速开始指南](./docs/QUICKSTART.md)
- [部署指南](./DEPLOYMENT.md)
- [游戏说明](./GAMES_README.md)
- [奖金分配机制](./PRIZE_DISTRIBUTION.md)

## 📖 概述

Blitz Arena 是一个基于以太坊智能合约的游戏竞技平台，支持创建比赛、报名参加、玩链游、提交成绩和分发奖金。前端采用现代化技术栈，提供产品级的 UI/UX 体验，并集成了5个链上小游戏。平台提供完整的社交功能、等级系统、成就系统和代币激励机制。

### 核心概念

- **智能合约部署**：每次创建比赛都会自动部署新的智能合约到 Mantle 区块链
- **多游戏支持**：支持5种不同类型的链上游戏
- **代币经济系统**：使用 BLZ 代币作为平台代币，支持报名费、奖池和奖励
- **社交功能**：好友系统、消息系统、聊天室、个人主页点赞
- **等级与成就**：链上管理的等级系统和成就系统，解锁自动发放代币

### 📊 绩效指标

- **部署时间**：从创建比赛到智能合约部署完成仅需 ~30 秒
- **交易确认时间**：Mantle Sepolia 测试网平均 ~2 秒
- **Gas 优化**：单次比赛创建 Gas 消耗 < 10 MNT
- **用户界面**：页面加载时间 < 1 秒（首次加载）

### 💎 价值主张

#### 玩家福利
- **即时参赛**：30 秒内完成报名和游戏开始
- **公平竞赛**：所有成绩和交易记录上链，公开透明
- **即时结算**：比赛结束后自动分发奖金
- **社交互动**：与朋友聊天、加入比赛聊天室、点赞玩家主页

#### 创建者福利
- **零代码部署**：无需编写智能合约代码，一键创建比赛
- **灵活配置**：支持自定义比赛规则、时间、奖池分配方式
- **成本效益**：Gas 费用优化，降低 90% 部署成本
- **并行测试**：支持立即开始模式和定时模式

## 🏗️ 系统组件概述

### 1. 开发层
- **Next.js 16 应用**：前端 Web 应用
- **TypeScript**：全栈类型安全
- **shadcn/ui**：生产级 UI 组件库
- **Tailwind CSS 4**：现代化样式系统
- **Wagmi v3 + RainbowKit**：多钱包 Web3 集成

### 2. 区块链层（Mantle）
- **GameFactory.sol**：工厂合约，负责创建比赛实例
- **GameInstance.sol**：单个比赛合约，管理完整生命周期
- **GameRegistry.sol**：游戏类型注册和结果验证
- **UserLevelManager.sol**：用户等级、经验和成就管理
- **Types.sol**：共享类型定义

### 3. 代币系统
- **BLZ Token**：平台代币，用于报名费、奖池和奖励
- **MNT**：Mantle 网络原生代币，用于支付 Gas 费用
- **MockERC20.sol**：本地开发测试代币

### 4. 游戏层
- **Number Guess**：猜数字游戏（1-100）
- **Rock Paper Scissors**：石头剪刀布（10 回合）
- **Quick Click**：快速点击（30 秒）
- **Cycle Rift（轮回裂隙）**：肉鸽割草生存游戏
- **Infinite Match**：无限消除游戏

### 5. 社交层
- **好友系统**：添加好友、好友请求管理
- **消息系统**：实时聊天、比赛聊天室
- **个人主页**：用户资料、成就展示、点赞功能
- **localStorage**：所有社交数据链下存储，零 Gas 消耗

## 🎯 关键数据流

### 1. 创建比赛流程
```
创建比赛 → GameFactory.deploy() → 部署 GameInstance → 
授权代币 → 锁定奖池 → 比赛开始接受报名
```

### 2. 报名流程
```
点击加入 → 检查报名资格 → 授权报名费 → 转账报名费 → 
加入玩家列表 → 发放 BLZ 代币奖励（3 EXP）
```

### 3. 游戏流程
```
选择游戏 → 体验模式（无需钱包）/ 正式模式 → 
完成游戏 → 提交成绩 → 链上记录 → 竞争排行榜
```

### 4. 奖金分发流程
```
比赛结束 → 设置获胜者 → 计算奖金 → 
扣除平台费（10%）→ 分发奖金 → 记录交易 → 更新排名
```

## ✨ 特性

### 🎮 智能合约功能
- **GameFactory**：工厂模式创建比赛实例
- **GameInstance**：完整比赛生命周期管理
- **GameRegistry**：游戏类型注册、结果验证和反作弊机制
- **UserLevelManager**：链上等级、经验和成就管理
- **支持多链**：Hardhat 本地网络和 Mantle Sepolia 测试网

### 💰 平台代币（BLZ）
Blitz Arena 使用 BLZ 代币作为平台原生实用代币：
- **报名费**：玩家支付 BLZ 代币参加比赛
- **奖池**：获胜者获得 BLZ 代币作为奖励
- **平台手续费**：所有比赛交易的 10% 手续费（创建、报名、退款）
- **经验系统**：1 BLZ = 1 EXP，用于升级
- **成就奖励**：解锁成就获得 BLZ 代币

**代币分配：**
- 参与奖励：每个比赛 3 BLZ（游戏完成后发放）
- 前 3 名奖励：第 1 名 20 BLZ，第 2 名 10 BLZ，第 3 名 5 BLZ
- 成就奖励：解锁成就获得不等数量 BLZ
- 等级进度：1 BLZ = 1 EXP，等级需求每级增加 1.5 倍

### 🎮 游戏功能
1. **猜数字** - 1-100 范围内猜数字，最少尝试次数获胜
2. **石头剪刀布** - 与 AI 进行 10 回合对战
3. **快速点击** - 30 秒内尽可能多地点击目标
4. **轮回裂隙** - 带技能升级的肉鸽生存游戏
5. **无限消除** - 无限关卡的消除游戏

**游戏模式：**
- **比赛模式**：连接钱包，加入比赛，争夺 BLZ 代币，成绩上链
- **体验模式**：无需钱包连接，无区块链交易，成绩不保存

### 🤝 社交系统
- **好友系统**：发送好友请求、接受/拒绝请求、管理好友列表
- **消息系统**：与好友和比赛参与者实时聊天
- **比赛聊天室**：每个比赛自动创建聊天室，24 小时自动清理
- **个人主页点赞**：点赞其他玩家的主页以示赞赏
- **链下数据存储**：所有社交数据使用 localStorage 存储，零 Gas 消耗

### 🏆 成就系统
7 个预定义成就，涵盖游戏和社交类别，存储在链上：

**游戏成就：**
- "首场比赛" - 参加你的第一场比赛（奖励：3 BLZ）
- "得分大师" - 在比赛中提交成绩（奖励：5 BLZ）
- "冠军" - 赢得你的第一场比赛（奖励：10 BLZ）
- "比赛老兵" - 参加 10 场比赛（奖励：15 BLZ）

**社交成就：**
- "第一个朋友" - 添加第一个好友（奖励：3 BLZ）
- "社交达人" - 添加 10 个好友（奖励：10 BLZ）
- "社区之星" - 获得 50 个主页点赞（奖励：15 BLZ）

**链上存储：**
- 所有成就通过 UserLevelManager 合约记录在区块链上
- 成就解锁事件发放 BLZ 代币奖励
- 成就状态公开可验证

### 📊 等级与经验系统（链上）
- **等级范围**：1 到 100 级
- **经验计算**：1 BLZ = 1 EXP
- **等级需求**：公式：`N 级所需经验 = 100 × 1.5^(N-1)`
- **等级权益**：更高的等级显示游戏经验和投入程度
- **进度提升**：参加比赛、赢得比赛、解锁成就可获得 EXP
- **UserLevelManager 合约**：在链上管理所有等级数据，基于角色的安全访问控制
- **最高等级**：100 级需要约 33 亿 EXP
- **自动升级**：经验值达到阈值时自动提升等级

### 🏅 排行榜
- **实时排名**：查看所有游戏的顶级玩家
- **游戏筛选**：按特定游戏类型筛选
- **时间范围**：按天、周、月或全部时间查看排名
- **自定义 UI 组件**：现代下拉筛选器，平滑动画

### 🚀 前端技术栈
- **框架**：Next.js 16 with App Router
- **UI 组件**：shadcn/ui（生产级组件）
- **样式**：Tailwind CSS 4 with 自定义主题
- **Web3**：Wagmi v3 + RainbowKit（多钱包支持）
- **动画**：Framer Motion 流畅过渡
- **TypeScript**：全代码库类型安全
- **存储**：localStorage 存储社交数据，智能合约存储游戏结果

### 🎨 设计特性
- **现代暗色主题**：专业暗色模式，毛玻璃效果
- **响应式设计**：移动优先，适用于所有设备
- **平滑动画**：页面过渡、悬停效果和加载状态
- **Discord 风格聊天**：现代聊天界面，实时更新
- **用户卡片模态框**：点击钱包地址查看用户资料和统计
- **直观 UX**：清晰导航、即时反馈和错误处理
- **产品级 UI**：精美的组件，准备好生产部署

### 📱 页面结构
1. **首页** (`/`) - 英雄区块、实时统计、功能亮点、即将到来的比赛
2. **比赛列表** (`/tournaments`) - 卡片式比赛网格、实时筛选和搜索、状态标签、快速加入
3. **创建比赛** (`/create`) - 多步骤表单、直观时间选择、游戏类型选择、实时成本计算
4. **比赛详情** (`/tournament/[id]`) - 完整比赛信息、参与者列表、排行榜、游戏入口
5. **排行榜** (`/leaderboard`) - 实时排名、游戏类型筛选、时间范围选择
6. **聊天中心** (`/chat`) - Discord 风格聊天界面、好友消息、比赛聊天室
7. **个人主页** (`/profile`) - 用户统计、等级进度、代币余额、比赛历史、好友管理、成就展示
8. **文档** (`/docs`) - 完整平台文档、入门指南、游戏规则、代币系统说明、FAQ

### 用户体验
- **加载状态**：骨架屏和加载动画
- **错误处理**：Toast 通知，详细错误信息
- **表单验证**：实时输入验证
- **响应式布局**：移动端、平板和桌面端优化
- **暗色模式**：原生暗色主题支持
- **即时反馈**：所有操作提供即时视觉反馈
- **智能默认值**：预填充表单，合理默认值

## 🚀 快速开始

### 先决条件
- Node.js 20+ 和 pnpm
- MetaMask 或兼容的 Web3 钱包
- Mantle Sepolia 测试网代币

### 安装步骤

#### 步骤 1：安装依赖

```bash
# 克隆仓库
git clone https://github.com/your-repo/blitz-arena.git
cd blitz-arena

# 安装依赖
pnpm install
```

#### 步骤 2：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的配置
```

`.env` 文件内容：
```env
# Next.js
NEXT_PUBLIC_APP_NAME=Blitz Arena
NEXT_PUBLIC_APP_URL=http://localhost:5000

# 智能合约地址（Mantle Sepolia）
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_BLZ_TOKEN=0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A
NEXT_PUBLIC_PRIZE_TOKEN=0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A
NEXT_PUBLIC_GAME_FACTORY=0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA
NEXT_PUBLIC_GAME_REGISTRY=0xDEd2563C3111a654603A2427Db18452C85b31C2B
NEXT_PUBLIC_USER_LEVEL_MANAGER=0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba

# Hardhat 网络（本地开发）
NEXT_PUBLIC_LOCAL_CHAIN_ID=31337
NEXT_PUBLIC_LOCAL_BLZ_TOKEN=0x4A679253410272dd5232B3Ff7cF5dbB88f295319
NEXT_PUBLIC_LOCAL_PRIZE_TOKEN=0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB
NEXT_PUBLIC_LOCAL_GAME_FACTORY=0x51A1ceB83B83F1985a81C295d1fF28Afef186E02
NEXT_PUBLIC_LOCAL_GAME_REGISTRY=0xc5a5C42992dECbae36851359345FE25997F5C42d
NEXT_PUBLIC_LOCAL_USER_LEVEL_MANAGER=0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
```

#### 步骤 3：启动本地区块链（可选）

```bash
# 启动 Hardhat 本地网络
pnpm run node

# 在另一个终端部署合约到本地网络
pnpm run deploy:local
```

#### 步骤 4：启动开发服务器

```bash
# 启动 Next.js 开发服务器
pnpm run dev
```

访问 http://localhost:5000

#### 步骤 5：连接钱包

1. 安装 MetaMask 或兼容钱包
2. 添加 Mantle Sepolia 测试网：
   - 网络名称：Mantle Sepolia
   - RPC URL：https://rpc.sepolia.mantle.xyz
   - Chain ID：5003
   - 货币符号：MNT
   - 区块浏览器：https://sepolia.mantlescan.xyz
3. 获取测试网代币：https://faucet.mantle.xyz/
4. 在网站右上角点击 "Connect Wallet"

## 🧪 测试

### 运行智能合约测试

```bash
# 编译合约
pnpm run compile

# 运行测试
pnpm run test
```

### 运行前端构建检查

```bash
# 构建 Next.js 应用
pnpm run build

# 检查类型错误
npx tsc --noEmit
```

## 🏗️ 核心组件

### 智能合约
- **GameFactory.sol** - 负责部署比赛实例的工厂合约
- **GameInstance.sol** - 单个比赛合约，管理完整生命周期
- **GameRegistry.sol** - 游戏类型注册、结果验证和反作弊
- **UserLevelManager.sol** - 用户等级、经验和成就管理
- **Types.sol** - 共享类型定义
- **MockERC20.sol** - 本地开发测试代币

### 前端组件
- **pages** - 页面组件
- **hooks** - React Hooks（合约交互、状态管理）
- **components** - UI 组件
- **lib** - 工具函数和配置
- **app** - Next.js App Router 页面

### 游戏组件
- **NumberGuessGame** - 猜数字游戏
- **RockPaperScissorsGame** - 石头剪刀布游戏
- **QuickClickGame** - 快速点击游戏
- **RoguelikeGame** - 肉鸽割草游戏
- **InfiniteMatchGame** - 无限消除游戏

## 📋 已部署合约

### Mantle Sepolia 测试网（Chain ID: 5003）

| 合约名称 | 合约地址 | 区块浏览器 |
|---------|---------|-----------|
| BLZ Token | 0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A | [查看](https://sepolia.mantlescan.xyz/address/0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A) |
| Prize Token (MNT) | 0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A | [查看](https://sepolia.mantlescan.xyz/address/0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A) |
| GameFactory | 0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA | [查看](https://sepolia.mantlescan.xyz/address/0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA) |
| GameRegistry | 0xDEd2563C3111a654603A2427Db18452C85b31C2B | [查看](https://sepolia.mantlescan.xyz/address/0xDEd2563C3111a654603A2427Db18452C85b31C2B) |
| UserLevelManager | 0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba | [查看](https://sepolia.mantlescan.xyz/address/0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba) |

**部署信息**：
- 部署时间：2026-01-15
- 部署者：0xce289Ca273e6edd7D84CA15eB354E56a34c7d03d
- 备注：时间逻辑更新和 getWinners 函数添加

### Hardhat 本地网络（Chain ID: 31337）

| 合约名称 | 合约地址 |
|---------|---------|
| BLZ Token | 0x4A679253410272dd5232B3Ff7cF5dbB88f295319 |
| Prize Token | 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB |
| GameFactory | 0x51A1ceB83B83F1985a81C295d1fF28Afef186E02 |
| GameRegistry | 0xc5a5C42992dECbae36851359345FE25997F5C42d |
| UserLevelManager | 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F |

## 📖 详细文档

- [快速开始指南](./docs/QUICKSTART.md)
- [部署指南](./DEPLOYMENT.md)
- [游戏说明](./GAMES_README.md)
- [奖金分配机制](./PRIZE_DISTRIBUTION.md)
- [时间逻辑更新](./TIME_LOGIC_UPDATE.md)
- [智能合约集成](./SMART_CONTRACT_INTEGRATION.md)
- [测试报告](./TESTING_SUMMARY.md)
- [Mantle 部署总结](./docs/MANTLE-DEPLOYMENT-SUMMARY.md)

## 🗺️ 路线图

### 近期计划
- [ ] 支持更多游戏类型（FPS、策略游戏）
- [ ] 改进用户搜索和发现功能
- [ ] 添加比赛回放功能
- [ ] 优化 Gas 费用

### 中期计划
- [ ] 支持多链部署（以太坊、Polygon、BSC）
- [ ] 添加 NFT 奖励系统
- [ ] 实现联赛和赛季系统
- [ ] 改进成就系统（更多成就、徽章）

### 长期计划
- [ ] 去中心化治理（DAO）
- [ ] 跨链游戏竞技
- [ ] AI 驱动的对手匹配
- [ ] 移动应用（React Native）

## 🤝 贡献

欢迎贡献！请阅读我们的贡献指南。

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

- 项目主页：[https://github.com/your-repo/blitz-arena](https://github.com/your-repo/blitz-arena)
- 问题反馈：[GitHub Issues](https://github.com/your-repo/blitz-arena/issues)
- 邮箱：your-email@example.com

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Mantle Network](https://www.mantle.xyz/)
- [OpenZeppelin](https://www.openzeppelin.com/)

---

**专为 Mantle Network 打造** 🚀
