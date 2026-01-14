// 多链合约地址配置

// 网络配置
export const NETWORK_CONFIG = {
  hardhat: {
    chainId: 31337,
    name: 'Hardhat',
    currency: 'ETH',
    explorerUrl: '',
  },
  mantleTestnet: {
    chainId: 5003,
    name: 'Mantle Sepolia Testnet',
    currency: 'MNT',
    explorerUrl: 'https://sepolia.mantlescan.xyz',
  },
};

// 合约地址配置
export const CONTRACT_ADDRESSES = {
  31337: {
    BLZ_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    PRIZE_TOKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    GAME_REGISTRY: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    GAME_FACTORY: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
  5003: {
    // Mantle Sepolia Testnet - 待部署
    BLZ_TOKEN: '',
    PRIZE_TOKEN: '',
    GAME_REGISTRY: '',
    GAME_FACTORY: '',
  },
} as const;

// 获取当前链的合约地址
export function getContractAddresses(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
}

// 检查当前链是否支持
export function isSupportedChain(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}
