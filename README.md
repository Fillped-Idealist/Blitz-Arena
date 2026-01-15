# Blitz Arena - Blockchain Gaming Tournament Platform

<div align="center">

A production-grade blockchain gaming tournament platform featuring modern UI/UX design, multi-wallet support, and seamless smart contract integration.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[Live Demo](https://youtu.be/zPmpruHYvKI) ·
[Features](#-features) ·
[Quick Start](#-quick-start) ·
[Documentation](#-documentation)

</div>

---

## 📝 Description

Blitz Arena is a native blockchain gaming tournament platform that enables players to create, join, and manage game tournaments on the Mantle blockchain. The platform abstracts the complexity of smart contract deployment, fund management, and game execution, providing a gaming tournament experience similar to modern web applications.

Every tournament creation automatically deploys smart contracts to the Mantle blockchain, initializing the tournament environment and starting registration. The platform supports multiple game types, allowing players to participate in tournaments, submit scores, and compete for prizes.

---

## 🔗 Important Links

### Code Repositories
- [Main Repository](https://github.com/Fillped-Idealist/Blitz-Arena)
- [Smart Contracts](./contracts/)
- [Frontend Application](./src/)

### Platforms and Tools
- [Live Demo](https://youtu.be/zPmpruHYvKI)
- [Mantle Sepolia Testnet Faucet](https://faucet.mantle.xyz/)

### Contact
- **Email**: 2062147937@qq.com
- **GitHub**: [Fillped-Idealist](https://github.com/Fillped-Idealist?tab=repositories)

---

## ✨ Features

### 🎮 Smart Contract Features

- **GameFactory**: Factory pattern for creating tournament instances
- **GameInstance**: Complete tournament lifecycle management
- **GameRegistry**: Game type registration, result verification, and anti-cheat mechanisms
- **UserLevelManager**: On-chain level, experience, and achievement management
- **Multi-Chain Support**: Supports Hardhat local network and Mantle Sepolia testnet

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

### 📊 Level & Experience System (On-Chain)

- **Level Range**: 1 to 100
- **Experience Calculation**: 1 BLZ = 1 EXP
- **Level Requirements**: Formula: `EXP for Level N = 100 × 1.5^(N-1)`
- **Level Benefits**: Higher levels show gaming experience and dedication
- **Progression**: Participate in tournaments, win games, unlock achievements to earn EXP
- **UserLevelManager Contract**: Manages all level data on-chain with secure role-based access control
- **Maximum Level**: Level 100 requires ~3.3 billion EXP

### 🏅 Leaderboard

- **Real-time Rankings**: View top players across all games
- **Game Filtering**: Filter by specific game type
- **Time Range**: View rankings by day, week, month, or all-time
- **Custom UI Components**: Modern dropdown filters with smooth animations

### 🚀 Technology Stack

#### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui (production-ready components)
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi v3 + RainbowKit (multi-wallet support)
- **Animations**: Framer Motion
- **TypeScript**: Full type safety

#### Blockchain
- **Smart Contracts**: Solidity ^0.8.24
- **Framework**: Hardhat
- **Networks**: Mantle Sepolia Testnet, Hardhat Local
- **Libraries**: OpenZeppelin Contracts, ethers.js v6, viem

#### Development Tools
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git

---

## 📖 Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- MetaMask or compatible Web3 wallet

### 1. Clone the Repository

```bash
git clone https://github.com/Fillped-Idealist/Blitz-Arena.git
cd Blitz-Arena
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file to configure necessary variables (if needed):

```env
# Mantle Sepolia Testnet
NEXT_PUBLIC_MANTLE_SEPOLIA_RPC_URL=https://sepolia.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5003

# Local Hardhat Network
NEXT_PUBLIC_LOCAL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_LOCAL_CHAIN_ID=31337
```

### 4. Compile Smart Contracts

```bash
pnpm run compile
```

### 5. Start Local Blockchain

In a new terminal window:

```bash
npx hardhat node
```

### 6. Deploy Contracts to Local Network

In another terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 7. Start Frontend Development Server

```bash
pnpm run dev
```

Visit: [http://localhost:5000](http://localhost:5000)

### 8. Configure MetaMask

Add local network to MetaMask:

- **Network Name**: Hardhat Local
- **RPC URL**: http://localhost:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

Get test tokens:
```bash
npx hardhat run scripts/check-wallet.js --network localhost
```

---

## 🌐 Deploy to Mantle Sepolia Testnet

### 1. Get MNT Test Tokens

Visit: [https://faucet.mantle.xyz/](https://faucet.mantle.xyz/)

### 2. Configure MetaMask

Add Mantle Sepolia network to MetaMask:

- **Network Name**: Mantle Sepolia Testnet
- **RPC URL**: https://sepolia.mantle.xyz
- **Chain ID**: 5003
- **Currency Symbol**: MNT
- **Block Explorer**: https://sepolia.mantle.xyz

### 3. Deploy Contracts

```bash
npx hardhat run scripts/deploy.js --network mantle
```

Or use deployment script:

```bash
bash scripts/deploy-mantle.sh
```

### 4. Update Frontend Configuration

Update the deployed contract addresses in `src/lib/chainConfig.ts`:

```typescript
export const MANTLE_SEPOLIA = {
  chainId: 5003,
  GAME_FACTORY: "0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA",
  GAME_REGISTRY: "0x...", // Replace with actual address
  USER_LEVEL_MANAGER: "0x...", // Replace with actual address
  // ... Other configurations
}
```

### 5. Verify Contracts (Optional)

```bash
npx hardhat verify --network mantle <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 📁 Project Structure

```
Blitz-Arena/
├── contracts/              # Smart Contracts
│   ├── GameFactory.sol     # Factory Contract
│   ├── GameInstance.sol    # Game Instance Contract
│   ├── GameRegistry.sol    # Game Registry Contract
│   ├── UserLevelManager.sol # Level Manager Contract
│   └── Types.sol           # Type Definitions
├── scripts/                # Deployment Scripts
│   ├── deploy.js           # Main Deployment Script
│   └── deploy-mantle.sh    # Mantle Deployment Script
├── src/                    # Frontend Source
│   ├── app/                # Next.js Pages
│   ├── components/         # React Components
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # Utilities
│   └── types/              # Type Definitions
└── public/                 # Public Assets
    └── game-assets/        # Game Assets
```

---

## 🎮 Game Modes

### Tournament Mode

1. Connect wallet
2. Browse tournament list
3. Join tournament (pay entry fee)
4. Play game
5. Submit score
6. Wait for tournament to end
7. Claim prize

### Experience Mode

1. No wallet connection needed
2. Enter experience mode from tournament details
3. Full game experience
4. No score persistence
5. No blockchain transactions

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

## 📞 Contact

- **Email**: 2062147937@qq.com
- **GitHub**: [Fillped-Idealist](https://github.com/Fillped-Idealist?tab=repositories)
- **Issues**: [GitHub Issues](https://github.com/Fillped-Idealist/Blitz-Arena/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Fillped-Idealist/Blitz-Arena/discussions)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Mantle Network](https://www.mantle.xyz/)
- [OpenZeppelin](https://openzeppelin.com/)

---

<div align="center">

**⭐ If this project helps you, please give it a Star! ⭐**

Made with ❤️ by [Fillped-Idealist](https://github.com/Fillped-Idealist?tab=repositories)

</div>
