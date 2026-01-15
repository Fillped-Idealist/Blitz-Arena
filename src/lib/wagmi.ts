import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat } from "wagmi/chains";

// Mantle Sepolia Testnet 配置
export const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  network: 'mantle-sepolia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: "Blitz Arena",
  projectId: "YOUR_PROJECT_ID", // 在生产环境中需要替换为实际的 WalletConnect Project ID
  chains: [mantleSepolia, hardhat], // 将 Mantle Sepolia 设为默认网络
  ssr: true,
});

