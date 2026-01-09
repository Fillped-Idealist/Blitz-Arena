# Game Arena - Professional Gaming Platform

A production-grade blockchain gaming tournament platform featuring modern UI/UX design, multi-wallet support, and seamless smart contract integration.

![Game Arena](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?style=for-the-badge&logo=solidity)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎮 Smart Contracts
- **GameFactory**: Factory pattern for creating tournament instances
- **GameInstance**: Complete tournament lifecycle management
- **Types.sol**: Shared type definitions for consistency
- **MockERC20**: Test token for local development

### 🚀 Frontend Technology Stack
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui (production-ready components)
- **Styling**: Tailwind CSS 4 with custom theme
- **Web3**: Wagmi v3 + RainbowKit (multi-wallet support)
- **Animations**: Framer Motion for smooth transitions
- **TypeScript**: Full type safety across the codebase

### 🎨 Design Features
- **Modern Dark Theme**: Professional dark mode with glassmorphism effects
- **Responsive Design**: Mobile-first, works on all devices
- **Smooth Animations**: Page transitions, hover effects, and loading states
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
   - Tournament status badges
   - Player count and prize pool display
   - Quick join functionality

3. **Create Tournament** (`/create`)
   - Multi-step form with validation
   - Intuitive time selection with presets
   - Game type selection with visual cards
   - Real-time cost calculation
   - Prize distribution options

## 🛠️ Installation

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
- Collect 5% platform fee
- Track all tournaments
- Withdraw accumulated fees

#### GameInstance
- Player registration and cancellation
- Game state management (Created, Ongoing, Ended, PrizeDistributed, Canceled)
- Score submission
- Winner selection
- Prize distribution (WinnerTakesAll, AverageSplit, CustomRanked)
- Refund handling for canceled games

### Frontend Features

#### Wallet Integration
- **Multi-Wallet Support**: RainbowKit supports 10+ wallets
- **Network Detection**: Automatically detects and switches networks
- **Transaction Signing**: Seamless transaction flow
- **Balance Display**: Real-time token balance updates

#### Tournament Management
- **Browse**: Filter and search tournaments
- **Create**: Intuitive form with real-time validation
- **Join**: One-click tournament registration
- **Track**: Monitor tournament status and progress

#### User Experience
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: Toast notifications with detailed messages
- **Form Validation**: Real-time input validation
- **Responsive Layout**: Mobile, tablet, and desktop optimized
- **Dark Mode**: Native dark theme support

## 🧪 Testing

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
