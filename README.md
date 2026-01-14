# Blitz Arena - Professional Gaming Platform

A production-grade blockchain gaming tournament platform featuring modern UI/UX design, multi-wallet support, and seamless smart contract integration.

![Game Arena](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎮 Smart Contracts
- **GameFactory**: Factory pattern for creating tournament instances
- **GameInstance**: Complete tournament lifecycle management
- **GameRegistry**: Game type registration, result verification, and anti-cheat mechanisms
- **Types.sol**: Shared type definitions for consistency
- **MockERC20**: Test token for local development

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

### 🎮 Games
1. **Number Guess** - Guess a number between 1-100 with minimum attempts
2. **Rock Paper Scissors** - Battle AI in 10 rounds
3. **Quick Click** - Click as many targets as possible within 30 seconds
4. **Cycle Rift (轮回裂隙)** - Roguelike survival game with skill upgrades
5. **Infinite Match** - Match-3 puzzle game with infinite levels

**Game Modes:**
- **Tournament Mode**: Connect wallet, join tournaments, compete for BLZ tokens, track on-chain
- **Experience Mode**: Play without wallet connection, no blockchain transactions, no score persistence

### 🤝 Social System
- **Friend System**: Send friend requests, accept/reject requests, manage friend list
- **Messages**: Real-time chat with friends and tournament participants
- **Tournament Chat**: Automatic chat room creation for each tournament, 24-hour auto-cleanup
- **Profile Likes**: Like other players' profiles to show appreciation
- **All data stored off-chain**: All social data uses localStorage for zero gas cost

### 🏆 Achievement System
7 pre-defined achievements across game and social categories:

**Game Achievements:**
- "First Victory" - Win your first tournament (Reward: 10 BLZ)
- "Speed Demon" - Complete a game in under 30 seconds (Reward: 5 BLZ)
- "Perfectionist" - Complete a game with 100% accuracy (Reward: 15 BLZ)

**Social Achievements:**
- "Social Butterfly" - Make 10 friends (Reward: 5 BLZ)
- "Popular" - Receive 50 profile likes (Reward: 10 BLZ)

**Special Achievements:**
- "Veteran" - Participate in 50 tournaments (Reward: 20 BLZ)
- "Champion" - Win 10 tournaments (Reward: 25 BLZ)

### 📊 Level & Experience System
- **Level Range**: 1 to 100
- **Experience Calculation**: 1 BLZ = 1 EXP
- **Level Requirements**: Formula: `nextLevelExp = currentLevelExp * 1.5`
- **Level Benefits**: Higher levels show gaming experience and dedication
- **Progression**: Participate in tournaments, win games, unlock achievements to earn EXP

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

### 📱 Pages
1. **Home Page** (`/`)
   - Hero section with animated gradient background
   - Live statistics display
   - Feature highlights with icons
   - Upcoming tournaments preview
   - Call-to-action sections

2. **Tournaments** (`/tournaments`)
   - Card-based tournament grid
   - Real-time filtering and search
   - Tournament status badges (Open, Full, Live, Ended, Canceled)
   - Player count and prize pool display
   - Quick join functionality with wallet authorization
   - Experience game mode (no wallet required)

3. **Create Tournament** (`/profile#create`)
   - Multi-step form with validation
   - Intuitive time selection with presets
   - Game type selection with visual cards
   - Real-time cost calculation
   - Prize distribution options
   - Creator prize pool validation

4. **Tournament Details** (`/tournament/[id]`)
   - Complete tournament information
   - Participant list with status
   - Full leaderboard (Top 3 + all participants)
   - Game entry point (both tournament and experience modes)
   - Real-time status updates
   - Financial transaction history

5. **Leaderboard** (`/leaderboard`)
   - Real-time rankings across all games
   - Game type filtering
   - Time range selection (day/week/month/all-time)
   - Custom dropdown components
   - Player statistics display

6. **Chat Hub** (`/chat`)
   - Discord-style chat interface
   - Friends direct messaging
   - Tournament chat rooms
   - Add friend modal (in-page, no redirect)
   - Click wallet addresses to view user profiles
   - Unread message indicators
   - Real-time message updates

7. **Profile** (`/profile`)
   - User statistics (Tournaments, Total Prizes, Win Rate)
   - Level and experience progress bar
   - BLZ token balance display
   - Tournament history
   - Friend management (requests, list)
   - Achievement display (text-only, no icons)
   - Profile like count
   - Create tournament section

8. **Documentation** (`/docs`)
   - Complete platform documentation
   - BLZ token system explanation
   - Game rules and scoring
   - Social system guide
   - Achievement system overview

### User Experience
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: Toast notifications with detailed messages
- **Form Validation**: Real-time input validation
- **Responsive Layout**: Mobile, tablet, and desktop optimized
- **Dark Mode**: Native dark theme support
- **Instant Feedback**: All actions provide immediate visual feedback
- **Smart Defaults**: Pre-filled forms with sensible defaults

## 🧪 Testing

### Prerequisites
- Node.js 20+ and pnpm
- MetaMask or compatible Web3 wallet
- Local blockchain network (Hardhat)

### 1. Clone and Install Dependencies

```bash
# Install dependencies
pnpm install
```

### 2. Smart Contracts Setup

```bash
# Compile contracts
pnpm run compile

# Deploy to local Hardhat network
pnpm run deploy:local

# Deploy to Mantle testnet (requires .env with PRIVATE_KEY)
pnpm run deploy:testnet
```

### 3. Start Development Server

```bash
# Start Next.js development server (runs on port 5000)
pnpm run dev
```

The application will be available at **http://localhost:5000**

## 📁 Project Structure

```
.
├── contracts/              # Solidity smart contracts
│   ├── Types.sol          # Shared type definitions
│   ├── GameFactory.sol    # Factory contract
│   ├── GameInstance.sol   # Tournament instance
│   └── MockERC20.sol      # Test token
├── scripts/               # Deployment scripts
│   └── deploy.js         # Contract deployment
├── deployments/           # Deployment information
│   └── deployment.json   # Contract addresses
├── src/
│   ├── app/              # Next.js pages
│   │   ├── page.tsx     # Home page
│   │   ├── tournaments/ # Tournaments listing
│   │   ├── create/      # Create tournament form
│   │   └── layout.tsx   # Root layout
│   ├── components/
│   │   ├── ui/         # shadcn/ui components
│   │   ├── providers.tsx  # Wagmi + RainbowKit setup
│   │   └── navbar.tsx     # Navigation component
│   ├── lib/
│   │   ├── utils.ts       # Utility functions
│   │   └── wagmi.ts       # Wagmi configuration
│   └── types/
│       └── web3.d.ts      # Web3 type definitions
├── public/                # Static assets
├── hardhat.config.js     # Hardhat configuration
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
└── package.json          # Dependencies
```

## 🎯 Core Functionality

### Smart Contract Features

#### GameFactory
- Create new tournament instances
- Collect 10% platform fee (not refundable)
- Track all tournaments
- Withdraw accumulated fees (admin only)
- Enforce creator prize pool requirements: must be > (entryFee × maxPlayers) / 2

#### GameInstance
- Player registration and cancellation (with refund)
- Game state management (Created, Ongoing, Ended, PrizeDistributed, Canceled)
- Score submission with GameRegistry verification
- Winner selection (multiple winners supported)
- Prize distribution (WinnerTakesAll, AverageSplit, CustomRanked)
- Refund handling for canceled games
- Minimum player check at game start (auto-cancel if not met)

#### GameRegistry
- Game type management (enable/disable games)
- Anti-cheat verification (score limits, time intervals, hash validation)
- Game-specific rule validation
- Maximum score enforcement per game type

### Frontend Features

#### Wallet Integration
- **Multi-Wallet Support**: RainbowKit supports 10+ wallets
- **Network Detection**: Automatically detects and switches networks
- **Transaction Signing**: Seamless transaction flow for tournament creation and joining
- **Authorization**: Users must approve token transfers (entry fees, prize pool creation)
- **Balance Display**: Real-time token balance updates

#### Tournament Management
- **Browse**: Filter and search tournaments by status, game type, title
- **Create**: Intuitive form with real-time validation and cost calculation
- **Join**: One-click tournament registration with wallet authorization
- **Track**: Monitor tournament status and progress
- **Experience Mode**: Play games without wallet connection for testing

#### BLZ Token System
- **Earning**:
  - Participate in tournaments: +3 BLZ (after game completion)
  - Win tournaments: Top 3 bonuses (20/10/5 BLZ)
  - Unlock achievements: Variable rewards (5-25 BLZ)
- **Spending**:
  - Tournament entry fees: Pay to join
  - Prize pool creation: Provide initial prize pool
- **Experience**: 1 BLZ = 1 EXP for leveling up
- **Platform Fee**: 10% on all transactions (non-refundable)

#### Social System
- **Friend Management**:
  - Send friend requests
  - Accept/reject pending requests
  - View friend list
  - All data stored in localStorage (no gas cost)
- **Messaging**:
  - Real-time chat with friends
  - Tournament chat rooms (auto-created, auto-cleaned after 24h)
  - Unread message indicators
  - In-page add friend modal
- **Profile Interactions**:
  - Like other players' profiles
  - Click wallet addresses to view user cards
  - View user statistics and achievements

#### Achievement & Level System
- **7 Pre-defined Achievements**: Game, social, and special categories
- **Automatic Unlocking**: Achievements unlock automatically when conditions met
- **BLZ Rewards**: Immediate token distribution upon achievement unlock
- **Level Progression**: 1-100 levels with increasing requirements
- **Experience Calculation**: EXP = BLZ earned, level requirement increases by 1.5x per level

## 🔌 Smart Contract Summary

### Contract Overview

#### 1. Types.sol
- **GameStatus**: Created, Ongoing, Ended, PrizeDistributed, Canceled
- **GameType**: None, NumberGuess, RockPaperScissors, QuickClick, InfiniteMatch
- **PrizeDistributionType**: WinnerTakesAll, AverageSplit, CustomRanked
- **Structs**: GameResult, PlayerInfo, GameConfig, GameData

#### 2. GameRegistry.sol
- **Game Management**: Enable/disable game types
- **Anti-Cheat**:
  - Minimum game interval (10 seconds) to prevent spam
  - Maximum score validation per game type
  - Timestamp validation (not future, not too old)
  - Game hash verification for data integrity
- **Game-Specific Validation**:
  - NumberGuess: Validates attempt count (1-5) and score calculation
  - RockPaperScissors: Validates 10 rounds and score formula
  - QuickClick: Validates click count (max 50 in 30s)
  - InfiniteMatch: Validates level, combo, and score ranges

#### 3. GameFactory.sol
- **Tournament Creation**:
  - Deploys new GameInstance contracts
  - Collects 10% platform fee on creator prize pool
  - Transfers prize pool to GameInstance
  - Stores tournament metadata
- **Fee Management**:
  - Tracks fees per token address
  - Admin can withdraw accumulated fees
- **Factory Features**:
  - List all tournaments
  - Paginated tournament queries
  - Tournament count for pagination

#### 4. GameInstance.sol
- **Tournament Lifecycle**:
  - Initialize with configuration
  - Player registration (with entry fee payment)
  - Cancel registration (with refund)
  - Start game (checks minimum players)
  - Cancel game (with full prize pool refund)
  - Submit score (with GameRegistry verification)
  - Set winners
  - Distribute prizes
  - Claim prizes/withdraw
- **Financial Flows**:
  - Entry fees added to prize pool
  - Creator provides initial prize pool
  - Platform fee (10%) collected on creation
  - Prizes calculated based on distribution type
  - Refunds handled for cancellations
- **State Management**:
  - Tracks players, scores, winners
  - Stores game results with verification
  - Manages prize claims

**Key Features:**
- Automatic cancellation if minimum players not met at start time
- Player can cancel registration before game starts
- Full refund for canceled games (platform fee not refunded)
- Three prize distribution strategies
- Pull pattern for prize claiming (safe against reentrancy)

### User Experience
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: Toast notifications with detailed messages
- **Form Validation**: Real-time input validation
- **Responsive Layout**: Mobile, tablet, and desktop optimized
- **Dark Mode**: Native dark theme support
- **Instant Feedback**: All actions provide immediate visual feedback
- **Smart Defaults**: Pre-filled forms with sensible defaults

### Smart Contract Testing

```bash
# Run contract tests
pnpm run test
```

### Frontend Testing

```bash
# Run Next.js build
pnpm run build

# Type checking
npx tsc --noEmit
```

## 📦 Deployment

### Deploy to Local Network

Contracts are already deployed to the local Hardhat network:
- **BLZ Token**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Prize Token**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **GameFactory**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### Deploy to Mantle Testnet

1. Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
```

2. Update `src/lib/wagmi.ts` to include Mantle testnet:

```typescript
import { hardhat, mantle } from "wagmi/chains";

export const config = getDefaultConfig({
  // ...
  chains: [hardhat, mantle],
  // ...
});
```

3. Deploy contracts:

```bash
pnpm run deploy:testnet
```

4. Update frontend contract addresses in each page file

## 🎨 Customization

### Theme Colors

Edit `src/app/globals.css` to customize the color scheme:

```css
.dark {
  --primary: oklch(0.922 0 0);  /* Primary color */
  --accent: oklch(0.269 0 0);    /* Accent color */
  /* ... more variables */
}
```

### Wagmi Configuration

Edit `src/lib/wagmi.ts` to add more chains or wallets:

```typescript
export const config = getDefaultConfig({
  appName: "Your App Name",
  chains: [mainnet, polygon, arbitrum, ...],
  // ...
});
```

### RainbowKit Theme

Edit `src/components/providers.tsx` to customize the wallet modal:

```typescript
<RainbowKitProvider
  theme={darkTheme({
    accentColor: "#3b82f6",
    accentColorForeground: "white",
  })}
>
```

## 🔐 Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Contract Audits**: Always audit contracts before mainnet deployment
3. **Reentrancy Protection**: Contracts use OpenZeppelin's security patterns
4. **Access Control**: Role-based access control with proper modifiers
5. **Input Validation**: All contract inputs are validated

## 📈 Performance Optimization

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component for optimal loading
- **Lazy Loading**: Components load only when needed
- **Caching**: Aggressive caching for static assets
- **Bundle Analysis**: Optimize bundle size with `@next/bundle-analyzer`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) - Smart contract security
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [RainbowKit](https://www.rainbowkit.com/) - React wallet connection library
- [Wagmi](https://wagmi.sh/) - React Hooks for Ethereum
- [Framer Motion](https://www.framer.com/motion/) - Production-ready motion library

---

Built with ❤️ using Next.js, Web3, and modern design principles.
