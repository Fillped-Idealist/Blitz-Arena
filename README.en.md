# Blitz Arena - Blockchain Gaming Tournament Platform

A production-grade blockchain gaming tournament platform featuring modern UI/UX design, multi-wallet support, and seamless smart contract integration.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 📝 Description

Blitz Arena is a native blockchain gaming tournament platform that enables players to create, join, and manage game tournaments on the Mantle blockchain. The platform abstracts the complexity of smart contract deployment, fund management, and game execution, providing a gaming tournament experience similar to modern web applications.

Every tournament creation automatically deploys smart contracts to the Mantle blockchain, initializing the tournament environment and starting registration. The platform supports multiple game types, allowing players to participate in tournaments, submit scores, and compete for prizes.

## 🔗 Important Links

### Code Repositories
- [Main Repository](https://github.com/your-repo/blitz-arena) - Main project code
- [Smart Contracts](./contracts/) - Solidity smart contract code
- [Frontend Application](./src/) - Next.js frontend application

### Platforms and Tools
- [Live Demo](https://your-demo-url.com) - Real-time platform demo
- [Mantle Sepolia Testnet Faucet](https://faucet.mantle.xyz/) - Get testnet tokens

### Media & Documentation
- [Quick Start Guide](./docs/QUICKSTART.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Game Documentation](./GAMES_README.md)
- [Prize Distribution Mechanism](./PRIZE_DISTRIBUTION.md)

## 📖 Overview

Blitz Arena is an Ethereum smart contract-based gaming tournament platform that supports creating tournaments, joining matches, playing blockchain games, submitting scores, and distributing prizes. The frontend uses a modern technology stack to provide a production-grade UI/UX experience, with 5 integrated on-chain games. The platform features complete social functionality, a level system, achievement system, and token incentive mechanisms.

### Core Concepts

- **Smart Contract Deployment**: Every tournament creation automatically deploys new smart contracts to the Mantle blockchain
- **Multi-Game Support**: Supports 5 different types of on-chain games
- **Token Economy System**: Uses BLZ token as the platform token for entry fees, prize pools, and rewards
- **Social Features**: Friend system, messaging system, chat rooms, profile likes
- **Levels & Achievements**: On-chain managed level system and achievement system with automatic token rewards

### 📊 Performance Metrics

- **Deployment Time**: From tournament creation to smart contract deployment ~30 seconds
- **Transaction Confirmation Time**: Mantle Sepolia testnet average ~2 seconds
- **Gas Optimization**: Single tournament creation Gas consumption < 10 MNT
- **User Interface**: Page load time < 1 second (first load)

### 💎 Value Proposition

#### Player Benefits
- **Instant Participation**: Complete registration and start gameplay within 30 seconds
- **Fair Competition**: All scores and transaction records are on-chain, publicly transparent
- **Instant Settlement**: Automatic prize distribution after tournament ends
- **Social Interaction**: Chat with friends, join tournament chat rooms, like player profiles

#### Creator Benefits
- **Zero-Code Deployment**: Create tournaments with one click without writing smart contract code
- **Flexible Configuration**: Support for custom tournament rules, timing, and prize distribution
- **Cost-Effective**: Gas fee optimization, reducing 90% deployment costs
- **Parallel Testing**: Support for instant start mode and scheduled mode

## 🏗️ System Component Overview

### 1. Development Layer
- **Next.js 16 Application**: Frontend web application
- **TypeScript**: Full-stack type safety
- **shadcn/ui**: Production-grade UI component library
- **Tailwind CSS 4**: Modern styling system
- **Wagmi v3 + RainbowKit**: Multi-wallet Web3 integration

### 2. Blockchain Layer (Mantle)
- **GameFactory.sol**: Factory contract responsible for creating tournament instances
- **GameInstance.sol**: Individual tournament contract managing complete lifecycle
- **GameRegistry.sol**: Game type registration, result verification, and anti-cheat mechanisms
- **UserLevelManager.sol**: User level, experience, and achievement management
- **Types.sol**: Shared type definitions

### 3. Token System
- **BLZ Token**: Platform token used for entry fees, prize pools, and rewards
- **MNT**: Mantle network native token used for paying gas fees
- **MockERC20.sol**: Local development test token

### 4. Game Layer
- **Number Guess**: Number guessing game (1-100)
- **Rock Paper Scissors**: Rock-paper-scissors (10 rounds)
- **Quick Click**: Fast clicking (30 seconds)
- **Cycle Rift**: Roguelike survival game
- **Infinite Match**: Infinite match-3 game

### 5. Social Layer
- **Friend System**: Add friends, manage friend requests
- **Messaging System**: Real-time chat, tournament chat rooms
- **Profile**: User profiles, achievement display, like feature
- **localStorage**: All social data stored off-chain, zero gas cost

## 🎯 Key Data Flows

### 1. Create Tournament Flow
```
Create Tournament → GameFactory.deploy() → Deploy GameInstance →
Authorize Token → Lock Prize Pool → Tournament Starts Accepting Players
```

### 2. Registration Flow
```
Click Join → Check Eligibility → Authorize Entry Fee → Transfer Entry Fee →
Add to Player List → Issue BLZ Token Reward (3 EXP)
```

### 3. Game Flow
```
Select Game → Experience Mode (No Wallet) / Tournament Mode →
Complete Game → Submit Score → On-chain Recording → Compete on Leaderboard
```

### 4. Prize Distribution Flow
```
Tournament Ends → Set Winners → Calculate Prizes →
Deduct Platform Fee (10%) → Distribute Prizes → Record Transactions → Update Rankings
```

## ✨ Features

### 🎮 Smart Contract Features
- **GameFactory**: Factory pattern for creating tournament instances
- **GameInstance**: Complete tournament lifecycle management
- **GameRegistry**: Game type registration, result verification, and anti-cheat mechanisms
- **UserLevelManager**: On-chain level, experience, and achievement management
- **Multi-Chain Support**: Hardhat local network and Mantle Sepolia testnet

### 💰 Platform Token (BLZ)
Blitz Arena uses the BLZ token as the platform's native utility token:
- **Entry Fee**: Players pay BLZ tokens to participate in tournaments
- **Prize Pool**: Winners receive BLZ tokens as rewards
- **Platform Fee**: 10% fee on all tournament transactions (creation, entry, refunds)
- **Experience System**: 1 BLZ = 1 EXP, used for leveling up
- **Achievement Rewards**: Unlock achievements to earn BLZ tokens

**Token Distribution:**
- Participation Reward: 3 BLZ per tournament (awarded after game completion)
- Top 3 Bonus: 20 BLZ for 1st, 10 BLZ for 2nd, 5 BLZ for 3rd place
- Achievement Rewards: Variable BLZ amounts for unlocking achievements
- Level Progression: 1 BLZ = 1 EXP, level up requirements increase by 1.5x per level

### 🎮 Game Features
1. **Number Guess** - Guess a number between 1-100 with minimum attempts
2. **Rock Paper Scissors** - Battle AI in 10 rounds
3. **Quick Click** - Click as many targets as possible within 30 seconds
4. **Cycle Rift** - Roguelike survival game with skill upgrades
5. **Infinite Match** - Match-3 puzzle game with infinite levels

**Game Modes:**
- **Tournament Mode**: Connect wallet, join tournaments, compete for BLZ tokens, track on-chain
- **Experience Mode**: Play without wallet connection, no blockchain transactions, no score persistence

### 🤝 Social System
- **Friend System**: Send friend requests, accept/reject requests, manage friend list
- **Messaging System**: Real-time chat with friends and tournament participants
- **Tournament Chat**: Automatic chat room creation for each tournament, 24-hour auto-cleanup
- **Profile Likes**: Like other players' profiles to show appreciation
- **Off-chain Data Storage**: All social data uses localStorage for zero gas cost

### 🏆 Achievement System
7 pre-defined achievements across game and social categories, stored on-chain:

**Game Achievements:**
- "First Tournament" - Join your first tournament (Reward: 3 BLZ)
- "Score Master" - Submit a score in a tournament (Reward: 5 BLZ)
- "Champion" - Win your first tournament (Reward: 10 BLZ)
- "Tournament Veteran" - Participate in 10 tournaments (Reward: 15 BLZ)

**Social Achievements:**
- "First Friend" - Add your first friend (Reward: 3 BLZ)
- "Social Butterfly" - Add 10 friends (Reward: 10 BLZ)
- "Community Star" - Receive 50 profile likes (Reward: 15 BLZ)

**On-Chain Storage:**
- All achievements are recorded on the blockchain via UserLevelManager contract
- Achievement unlock events emit BLZ token rewards
- Achievement status is publicly verifiable

### 📊 Level & Experience System (On-Chain)
- **Level Range**: 1 to 100
- **Experience Calculation**: 1 BLZ = 1 EXP
- **Level Requirements**: Formula: `EXP for Level N = 100 × 1.5^(N-1)`
- **Level Benefits**: Higher levels show gaming experience and dedication
- **Progression**: Participate in tournaments, win games, unlock achievements to earn EXP
- **UserLevelManager Contract**: Manages all level data on-chain with secure role-based access control
- **Maximum Level**: Level 100 requires ~3.3 billion EXP
- **Automatic Level Up**: Experience automatically advances your level when thresholds are met

### 🏅 Leaderboard
- **Real-time Rankings**: View top players across all games
- **Game Filtering**: Filter by specific game type
- **Time Range**: View rankings by day, week, month, or all-time
- **Custom UI Components**: Modern dropdown filters with smooth animations

### 🚀 Frontend Technology Stack
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui (production-ready components)
- **Styling**: Tailwind CSS 4 with custom theme
- **Web3**: Wagmi v3 + RainbowKit (multi-wallet support)
- **Animations**: Framer Motion for smooth transitions
- **TypeScript**: Full type safety across the codebase
- **Storage**: localStorage for social data, smart contracts for game results

### 🎨 Design Features
- **Modern Dark Theme**: Professional dark mode with glassmorphism effects
- **Responsive Design**: Mobile-first, works on all devices
- **Smooth Animations**: Page transitions, hover effects, and loading states
- **Discord-Inspired Chat**: Modern chat interface with real-time updates
- **User Card Modal**: Click any wallet address to view user profile and stats
- **Intuitive UX**: Clear navigation, instant feedback, and error handling
- **Product-Grade UI**: Polished components ready for production deployment

### 📱 Page Structure
1. **Home** (`/`) - Hero section, live statistics, feature highlights, upcoming tournaments
2. **Tournaments** (`/tournaments`) - Card-based tournament grid, real-time filtering and search, status badges, quick join
3. **Create Tournament** (`/create`) - Multi-step form, intuitive time selection, game type selection, real-time cost calculation
4. **Tournament Details** (`/tournament/[id]`) - Complete tournament information, participant list, leaderboard, game entry
5. **Leaderboard** (`/leaderboard`) - Real-time rankings, game type filtering, time range selection
6. **Chat Hub** (`/chat`) - Discord-style chat interface, friend messages, tournament chat rooms
7. **Profile** (`/profile`) - User statistics, level progress, token balance, tournament history, friend management, achievement display
8. **Documentation** (`/docs`) - Complete platform documentation, getting started guide, game rules, token system explanation, FAQ

### User Experience
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: Toast notifications with detailed messages
- **Form Validation**: Real-time input validation
- **Responsive Layout**: Mobile, tablet, and desktop optimized
- **Dark Mode**: Native dark theme support
- **Instant Feedback**: All actions provide immediate visual feedback
- **Smart Defaults**: Pre-filled forms with sensible defaults

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and pnpm
- MetaMask or compatible Web3 wallet
- Mantle Sepolia testnet tokens

### Installation Steps

#### Step 1: Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-repo/blitz-arena.git
cd blitz-arena

# Install dependencies
pnpm install
```

#### Step 2: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env file to add your configuration
```

`.env` file content:
```env
# Next.js
NEXT_PUBLIC_APP_NAME=Blitz Arena
NEXT_PUBLIC_APP_URL=http://localhost:5000

# Smart Contract Addresses (Mantle Sepolia)
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_BLZ_TOKEN=0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A
NEXT_PUBLIC_PRIZE_TOKEN=0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A
NEXT_PUBLIC_GAME_FACTORY=0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA
NEXT_PUBLIC_GAME_REGISTRY=0xDEd2563C3111a654603A2427Db18452C85b31C2B
NEXT_PUBLIC_USER_LEVEL_MANAGER=0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba

# Hardhat Network (Local Development)
NEXT_PUBLIC_LOCAL_CHAIN_ID=31337
NEXT_PUBLIC_LOCAL_BLZ_TOKEN=0x4A679253410272dd5232B3Ff7cF5dbB88f295319
NEXT_PUBLIC_LOCAL_PRIZE_TOKEN=0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB
NEXT_PUBLIC_LOCAL_GAME_FACTORY=0x51A1ceB83B83F1985a81C295d1fF28Afef186E02
NEXT_PUBLIC_LOCAL_GAME_REGISTRY=0xc5a5C42992dECbae36851359345FE25997F5C42d
NEXT_PUBLIC_LOCAL_USER_LEVEL_MANAGER=0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
```

#### Step 3: Start Local Blockchain (Optional)

```bash
# Start Hardhat local network
pnpm run node

# In another terminal, deploy contracts to local network
pnpm run deploy:local
```

#### Step 4: Start Development Server

```bash
# Start Next.js development server
pnpm run dev
```

Visit http://localhost:5000

#### Step 5: Connect Wallet

1. Install MetaMask or compatible wallet
2. Add Mantle Sepolia testnet:
   - Network Name: Mantle Sepolia
   - RPC URL: https://rpc.sepolia.mantle.xyz
   - Chain ID: 5003
   - Currency Symbol: MNT
   - Block Explorer: https://sepolia.mantlescan.xyz
3. Get testnet tokens: https://faucet.mantle.xyz/
4. Click "Connect Wallet" in the top right corner of the website

## 🧪 Testing

### Run Smart Contract Tests

```bash
# Compile contracts
pnpm run compile

# Run tests
pnpm run test
```

### Run Frontend Build Check

```bash
# Build Next.js application
pnpm run build

# Check for type errors
npx tsc --noEmit
```

## 🏗️ Core Components

### Smart Contracts
- **GameFactory.sol** - Factory contract responsible for deploying tournament instances
- **GameInstance.sol** - Individual tournament contract managing complete lifecycle
- **GameRegistry.sol** - Game type registration, result verification, and anti-cheat
- **UserLevelManager.sol** - User level, experience, and achievement management
- **Types.sol** - Shared type definitions
- **MockERC20.sol** - Local development test token

### Frontend Components
- **pages** - Page components
- **hooks** - React Hooks (contract interaction, state management)
- **components** - UI components
- **lib** - Utility functions and configuration
- **app** - Next.js App Router pages

### Game Components
- **NumberGuessGame** - Number guessing game
- **RockPaperScissorsGame** - Rock-paper-scissors game
- **QuickClickGame** - Fast clicking game
- **RoguelikeGame** - Roguelike survival game
- **InfiniteMatchGame** - Infinite match-3 game

## 📋 Deployed Contracts

### Mantle Sepolia Testnet (Chain ID: 5003)

| Contract Name | Contract Address | Block Explorer |
|---------------|------------------|----------------|
| BLZ Token | 0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A | [View](https://sepolia.mantlescan.xyz/address/0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A) |
| Prize Token (MNT) | 0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A | [View](https://sepolia.mantlescan.xyz/address/0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A) |
| GameFactory | 0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA | [View](https://sepolia.mantlescan.xyz/address/0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA) |
| GameRegistry | 0xDEd2563C3111a654603A2427Db18452C85b31C2B | [View](https://sepolia.mantlescan.xyz/address/0xDEd2563C3111a654603A2427Db18452C85b31C2B) |
| UserLevelManager | 0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba | [View](https://sepolia.mantlescan.xyz/address/0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba) |

**Deployment Information**:
- Deployment Date: 2026-01-15
- Deployer: 0xce289Ca273e6edd7D84CA15eB354E56a34c7d03d
- Notes: Time logic update and getWinners function added

### Hardhat Local Network (Chain ID: 31337)

| Contract Name | Contract Address |
|---------------|------------------|
| BLZ Token | 0x4A679253410272dd5232B3Ff7cF5dbB88f295319 |
| Prize Token | 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB |
| GameFactory | 0x51A1ceB83B83F1985a81C295d1fF28Afef186E02 |
| GameRegistry | 0xc5a5C42992dECbae36851359345FE25997F5C42d |
| UserLevelManager | 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F |

## 📖 Detailed Documentation

- [Quick Start Guide](./docs/QUICKSTART.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Game Documentation](./GAMES_README.md)
- [Prize Distribution Mechanism](./PRIZE_DISTRIBUTION.md)
- [Time Logic Update](./TIME_LOGIC_UPDATE.md)
- [Smart Contract Integration](./SMART_CONTRACT_INTEGRATION.md)
- [Test Report](./TESTING_SUMMARY.md)
- [Mantle Deployment Summary](./docs/MANTLE-DEPLOYMENT-SUMMARY.md)

## 🗺️ Roadmap

### Short-term Goals
- [ ] Support more game types (FPS, strategy games)
- [ ] Improve user search and discovery features
- [ ] Add tournament replay functionality
- [ ] Optimize gas fees

### Medium-term Goals
- [ ] Multi-chain deployment support (Ethereum, Polygon, BSC)
- [ ] Add NFT reward system
- [ ] Implement league and season system
- [ ] Improve achievement system (more achievements, badges)

### Long-term Goals
- [ ] Decentralized governance (DAO)
- [ ] Cross-chain gaming tournaments
- [ ] AI-driven opponent matching
- [ ] Mobile application (React Native)

## 🤝 Contributing

Contributions are welcome! Please read our contribution guidelines.

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 📧 Contact

- Project Homepage: [https://github.com/your-repo/blitz-arena](https://github.com/your-repo/blitz-arena)
- Issue Tracker: [GitHub Issues](https://github.com/your-repo/blitz-arena/issues)
- Email: your-email@example.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Mantle Network](https://www.mantle.xyz/)
- [OpenZeppelin](https://www.openzeppelin.com/)

---

**Built for Mantle Network** 🚀
