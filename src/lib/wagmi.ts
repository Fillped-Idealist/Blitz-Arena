import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Blitz Arena",
  projectId: "YOUR_PROJECT_ID", // 在生产环境中需要替换为实际的 WalletConnect Project ID
  chains: [hardhat],
  ssr: true,
});
