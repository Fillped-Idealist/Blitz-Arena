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
    // Mantle Sepolia Testnet
    BLZ_TOKEN: '0x26624b8d2F28A21379d88A304B2529554f140005',
    PRIZE_TOKEN: '0xaBAd6BD5baedb6A090bAB50DC43CEd42A92cF77F',
    GAME_REGISTRY: '0x3aE8809e382d3f77217412B8289b505D47CE7A14',
    GAME_FACTORY: '0xF6Ef81EC8b61688AE168AB4B5d67b6f7E58E4e24',
    USER_LEVEL_MANAGER: '0x74AFF7421b3c35954f0BAE1024e2aba8B2140967',
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
