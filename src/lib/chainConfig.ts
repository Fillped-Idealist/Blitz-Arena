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
    BLZ_TOKEN: '0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9',
    PRIZE_TOKEN: '0x70e0bA845a1A0F2DA3359C97E0285013525FFC49',
    GAME_REGISTRY: '0xf5059a5D33d5853360D16C683c16e67980206f36',
    GAME_FACTORY: '0x95401dc811bb5740090279Ba06cfA8fcF6113778',
    USER_LEVEL_MANAGER: '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8',
  },
  5003: {
    // Mantle Sepolia Testnet - 待部署
    BLZ_TOKEN: '',
    PRIZE_TOKEN: '',
    GAME_REGISTRY: '',
    GAME_FACTORY: '',
    USER_LEVEL_MANAGER: '',
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
