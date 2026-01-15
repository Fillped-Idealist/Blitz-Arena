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
    BLZ_TOKEN: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    PRIZE_TOKEN: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
    GAME_REGISTRY: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    GAME_FACTORY: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    USER_LEVEL_MANAGER: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
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
