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
    BLZ_TOKEN: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319',
    PRIZE_TOKEN: '0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB',
    GAME_REGISTRY: '0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3',
    GAME_FACTORY: '0x162A433068F51e18b7d13932F27e66a3f99E6890',
    USER_LEVEL_MANAGER: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F',
  },
  5003: {
    // Mantle Sepolia Testnet - Deployed on 2026-01-15 (Updated)
    BLZ_TOKEN: '0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A',
    PRIZE_TOKEN: '0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A',
    GAME_REGISTRY: '0xDEd2563C3111a654603A2427Db18452C85b31C2B',
    GAME_FACTORY: '0x059dc6dcCa08308DD4c7A1005Fd604e564f0E87E',
    USER_LEVEL_MANAGER: '0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba',
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
