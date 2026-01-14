# Smart Contract Integration Guide

## Overview

Blitz Arena has been integrated with real smart contracts using Wagmi v3 and RainbowKit. The system is currently configured to work with:
- **Local Hardhat Network** (chain ID: 31337) - for development and testing
- **Mantle Sepolia Testnet** (chain ID: 5003) - for staging and production testing

## Completed Features

### 1. Contract Configuration
- **ABI Definitions** (`src/lib/contracts.ts`): Contains all necessary ABIs for GameFactory, GameInstance, and ERC20 tokens
- **Multi-chain Support** (`src/lib/chainConfig.ts`): Manages contract addresses for different networks
- **Wagmi Configuration** (`src/lib/wagmi.ts`): Updated to support both Hardhat and Mantle Sepolia Testnet

### 2. Contract Interaction Hooks
Created comprehensive hooks in `src/hooks/useGameContract.ts`:
- `useNetworkCheck()`: Validates current network
- `useGameFactory()`: Read tournament data from factory
- `useCreateGame()`: Create new tournaments
- `useGameInstance()`: Read specific tournament data
- `useJoinGame()`: Join tournaments
- `useSubmitScore()`: Submit game scores
- `useClaimPrize()`: Claim tournament prizes
- `useERC20()`: Token operations (approve, balance check)

### 3. Updated Pages
- **Create Tournament Page** (`src/app/create/page.tsx`): Now uses real contract calls
- **Test Contract Page** (`src/app/test-contract/page.tsx`): Simple test page for debugging

## Setup Instructions

### 1. Start Hardhat Local Network

```bash
cd /workspace/projects
npx hardhat node
```

The network will start on `http://127.0.0.1:8545/` with 20 test accounts (10,000 ETH each).

### 2. Configure MetaMask

1. Open MetaMask extension
2. Click "Add Network" → "Custom RPC"
3. Enter the following details:
   - **Network Name**: Hardhat Local
   - **New RPC URL**: http://127.0.0.1:8545/
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

### 3. Import Test Account

Import one of the Hardhat test accounts:

**Account #0** (Recommended):
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 4. Access the Application

Open http://localhost:5000 in your browser.

## Testing Guide

### Step 1: Test Contract Connection

1. Visit `/test-contract` page
2. Connect your wallet
3. Click "Refresh" to load contract data
4. Verify you can see the total number of games

### Step 2: Create a Tournament

1. Visit `/create` (or use the create section in `/profile`)
2. Connect your wallet
3. Fill in tournament details:
   - Title: "Test Tournament"
   - Game Type: Select any game
   - Entry Fee: "5"
   - Prize Pool: "100" (must be > (5 × maxPlayers) / 2)
   - Min Players: 2
   - Max Players: 10
   - Distribution Type: Winner Takes All
4. Click "Create Tournament"
5. Approve the transaction in MetaMask
6. Wait for confirmation
7. Tournament should be created and visible in the list

### Step 3: Join a Tournament

1. Visit `/tournaments`
2. Find your created tournament
3. Click "Join"
4. Approve the token approval (if needed)
5. Approve the entry fee payment
6. Wait for confirmation

### Step 4: Play and Submit Score

1. Visit the tournament details page
2. Click "Start Game"
3. Play the game
4. Submit your score (will trigger a transaction)
5. Wait for confirmation

## Known Issues and Future Work

### Pending Tasks

1. **Tournament List Integration** (`/tournaments`): Update to fetch real tournament data from smart contracts
2. **Tournament Details Integration** (`/tournament/[id]`): Update to fetch real tournament data
3. **Token Approval**: Implement automatic token approval flow before transactions
4. **Error Handling**: Improve error messages and user feedback
5. **Loading States**: Add better loading indicators during transactions

### Current Limitations

- Tournament list still uses localStorage data
- Tournament details page uses localStorage data
- No automatic token approval (users need to approve manually)
- Limited error recovery options

### Testing Checklist

- [x] Hardhat network running
- [x] Contract addresses configured
- [x] Wallet connection works
- [x] Create tournament transaction works
- [ ] Join tournament transaction works (needs testing)
- [ ] Submit score transaction works (needs testing)
- [ ] Claim prize transaction works (needs testing)
- [ ] Mantle testnet deployment (pending)

## Deployment to Mantle Testnet

### Prerequisites

1. Update contract addresses in `src/lib/chainConfig.ts`:
   ```typescript
   5003: {
     BLZ_TOKEN: '0x...', // Deployed BLZ token address
     PRIZE_TOKEN: '0x...', // Deployed prize token address
     GAME_REGISTRY: '0x...', // Deployed registry address
     GAME_FACTORY: '0x...', // Deployed factory address
   }
   ```

2. Deploy contracts:
   ```bash
   pnpm run deploy:testnet
   ```

3. Update deployment file `deployments/deployment.json`

4. Add Mantle Sepolia to MetaMask:
   - Network Name: Mantle Sepolia Testnet
   - RPC URL: https://rpc.sepolia.mantle.xyz
   - Chain ID: 5003
   - Currency: MNT

### Testing on Mantle

1. Switch MetaMask to Mantle Sepolia Testnet
2. Get test MNT from faucet (if needed)
3. Follow the same testing guide as above

## Contract Addresses

### Hardhat Local Network (31337)
- **BLZ Token**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Prize Token**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- **Game Registry**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Game Factory**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

### Mantle Sepolia Testnet (5003)
- **Pending Deployment**: Contract addresses to be added after deployment

## Troubleshooting

### Issue: "Unsupported network"
**Solution**: Switch to Hardhat (31337) or Mantle Sepolia (5003)

### Issue: "Transaction failed"
**Solution**: Check if you have enough ETH/MNT for gas fees and approved tokens

### Issue: "Contract not found"
**Solution**: Verify contract addresses in `chainConfig.ts` match deployed contracts

### Issue: "Cannot read property of undefined"
**Solution**: Ensure wallet is connected and on the correct network

## Next Steps

1. Complete tournament list integration
2. Complete tournament details integration
3. Implement automatic token approval
4. Add comprehensive error handling
5. Deploy to Mantle testnet
6. Conduct full end-to-end testing
