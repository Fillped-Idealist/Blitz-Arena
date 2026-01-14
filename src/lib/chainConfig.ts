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
    BLZ_TOKEN: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    PRIZE_TOKEN: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    GAME_REGISTRY: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    GAME_FACTORY: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
    USER_LEVEL_MANAGER: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
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
