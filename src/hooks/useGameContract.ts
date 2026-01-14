"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
import {
  GAME_FACTORY_ABI,
  GAME_INSTANCE_ABI,
  ERC20_ABI,
} from '@/lib/contracts';
import { getContractAddresses, isSupportedChain } from '@/lib/chainConfig';

// GameStatus 枚举
export enum GameStatus {
  Created = 0,
  Ongoing = 1,
  Ended = 2,
  PrizeDistributed = 3,
  Canceled = 4,
}

// GameType 枚举
export enum GameType {
  None = 0,
  NumberGuess = 1,
  RockPaperScissors = 2,
  QuickClick = 3,
  InfiniteMatch = 4,
}

// PrizeDistributionType 枚举
export enum PrizeDistributionType {
  WinnerTakesAll = 0,
  AverageSplit = 1,
  CustomRanked = 2,
}

// 检查网络是否支持
export function useNetworkCheck() {
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);

  if (!supported) {
    toast.error('Unsupported network', {
      description: 'Please switch to Hardhat or Mantle Sepolia Testnet',
    });
  }

  return { supported, chainId };
}

// 获取合约地址
export function useContractAddresses() {
  const chainId = useChainId();
  return getContractAddresses(chainId);
}

/**
 * 使用 GameFactory 合约的 hook
 */
export function useGameFactory() {
  const { address } = useAccount();
  const addresses = useContractAddresses();

  const { data: allGames, refetch: refetchGames } = useReadContract({
    address: addresses.GAME_FACTORY as `0x${string}`,
    abi: GAME_FACTORY_ABI,
    functionName: 'allGames',
  });

  const { data: totalGames, refetch: refetchTotalGames } = useReadContract({
    address: addresses.GAME_FACTORY as `0x${string}`,
    abi: GAME_FACTORY_ABI,
    functionName: 'getTotalGames',
  });

  return {
    allGames: allGames as `0x${string}`[] | undefined,
    totalGames: totalGames as bigint | undefined,
    refetchGames: () => {
      refetchGames();
      refetchTotalGames();
    },
    addresses,
  };
}

/**
 * 创建比赛的 hook
 */
export function useCreateGame() {
  const { address } = useAccount();
  const addresses = useContractAddresses();
  const { supported } = useNetworkCheck();

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createGame = async (config: {
    title: string;
    description: string;
    gameType: GameType;
    entryFee: string; // in human-readable format (e.g., "5")
    minPlayers: number;
    maxPlayers: number;
    registrationEndTime: number; // Unix timestamp
    gameStartTime: number; // Unix timestamp
    prizePool: string; // in human-readable format (e.g., "100")
    distributionType: PrizeDistributionType;
    rankPrizes: number[]; // BPS values (0-10000)
  }) => {
    if (!supported) {
      throw new Error('Unsupported network');
    }

    if (!address) {
      throw new Error('Wallet not connected');
    }

    // 计算总金额 (奖池 + 10% 平台费)
    const prizePoolAmount = parseUnits(config.prizePool, 18);
    const platformFee = (prizePoolAmount * BigInt(1000)) / BigInt(10000); // 10% fee
    const totalAmount = prizePoolAmount + platformFee;

    // 准备配置参数
    const gameConfig = {
      title: config.title,
      description: config.description,
      gameType: config.gameType,
      feeTokenAddress: addresses.PRIZE_TOKEN as `0x${string}`,
      entryFee: parseUnits(config.entryFee, 18),
      minPlayers: BigInt(config.minPlayers),
      maxPlayers: BigInt(config.maxPlayers),
      registrationEndTime: BigInt(config.registrationEndTime),
      gameStartTime: BigInt(config.gameStartTime),
      prizeTokenAddress: addresses.PRIZE_TOKEN as `0x${string}`,
      prizePool: prizePoolAmount,
      distributionType: config.distributionType,
      rankPrizes: config.rankPrizes.map((p) => BigInt(p)),
    };

    toast.info('Creating tournament...', {
      description: 'Please approve the transaction in your wallet',
    });

    writeContract({
      address: addresses.GAME_FACTORY as `0x${string}`,
      abi: GAME_FACTORY_ABI,
      functionName: 'createGame',
      args: [gameConfig],
    });
  };

  return {
    createGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    addresses,
  };
}

/**
 * 使用 GameInstance 合约的 hook
 */
export function useGameInstance(gameAddress: `0x${string}` | null) {
  const { address } = useAccount();
  const addresses = useContractAddresses();

  const { data: status, refetch: refetchStatus } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'status',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: creator, refetch: refetchCreator } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'creator',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: title, refetch: refetchTitle } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'title',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: gameType, refetch: refetchGameType } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'gameType',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: players, refetch: refetchPlayers } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'players',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: entryFee, refetch: refetchEntryFee } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'entryFee',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: prizePool, refetch: refetchPrizePool } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'prizePool',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: minPlayers, refetch: refetchMinPlayers } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'minPlayers',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: maxPlayers, refetch: refetchMaxPlayers } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'maxPlayers',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: isJoined, refetch: refetchIsJoined } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'isJoined',
    args: [address!],
    query: {
      enabled: !!gameAddress && !!address,
    },
  });

  const { data: myScore, refetch: refetchMyScore } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'scores',
    args: [address!],
    query: {
      enabled: !!gameAddress && !!address,
    },
  });

  const { data: winners, refetch: refetchWinners } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'winners',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: prizeToClaim, refetch: refetchPrizeToClaim } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'prizeToClaimsAmount',
    args: [address!],
    query: {
      enabled: !!gameAddress && !!address,
    },
  });

  const { data: registrationEndTime, refetch: refetchRegistrationEndTime } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'registrationEndTime',
    query: {
      enabled: !!gameAddress,
    },
  });

  const { data: gameStartTime, refetch: refetchGameStartTime } = useReadContract({
    address: gameAddress!,
    abi: GAME_INSTANCE_ABI,
    functionName: 'gameStartTime',
    query: {
      enabled: !!gameAddress,
    },
  });

  const refetchAll = () => {
    refetchStatus();
    refetchCreator();
    refetchTitle();
    refetchGameType();
    refetchPlayers();
    refetchEntryFee();
    refetchPrizePool();
    refetchMinPlayers();
    refetchMaxPlayers();
    if (address) {
      refetchIsJoined();
      refetchMyScore();
      refetchPrizeToClaim();
    }
    refetchWinners();
    refetchRegistrationEndTime();
    refetchGameStartTime();
  };

  return {
    gameData: gameAddress ? {
      address: gameAddress,
      status: status as bigint | undefined,
      creator: creator as `0x${string}` | undefined,
      title: title as string | undefined,
      gameType: gameType as bigint | undefined,
      players: players as Array<{ player: `0x${string}`, score: bigint }> | undefined,
      entryFee: entryFee as bigint | undefined,
      prizePool: prizePool as bigint | undefined,
      minPlayers: minPlayers as bigint | undefined,
      maxPlayers: maxPlayers as bigint | undefined,
      isJoined: isJoined as boolean | undefined,
      myScore: myScore as bigint | undefined,
      winners: winners as `0x${string}`[] | undefined,
      prizeToClaim: prizeToClaim as bigint | undefined,
      registrationEndTime: registrationEndTime as bigint | undefined,
      gameStartTime: gameStartTime as bigint | undefined,
    } : null,
    refetchAll,
  };
}

/**
 * 报名比赛的 hook
 */
export function useJoinGame() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const joinGame = async (gameAddress: `0x${string}`, entryFee: string) => {
    toast.info('Joining tournament...', {
      description: 'Please approve the transaction in your wallet',
    });

    // 先授权代币
    // 注意：这里需要先调用 approve 函数授权 GameInstance 使用代币
    // 简化版假设已授权，实际需要先 approve

    writeContract({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      functionName: 'joinGame',
    });
  };

  return {
    joinGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 提交分数的 hook
 */
export function useSubmitScore() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitScore = async (gameAddress: `0x${string}`, score: number) => {
    toast.info('Submitting score...', {
      description: 'Please approve the transaction in your wallet',
    });

    writeContract({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      functionName: 'submitScore',
      args: [BigInt(score)],
    });
  };

  return {
    submitScore,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 批量获取游戏数据的 hook
 */
export function useGamesBatch(gameAddresses: `0x${string}`[] | undefined) {
  const publicClient = usePublicClient();
  const [gamesData, setGamesData] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameAddresses || gameAddresses.length === 0 || !publicClient) {
      setGamesData([]);
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.allSettled(
          gameAddresses.map(async (address) => {
            try {
              // 获取游戏数据
              const [status, title, gameType, entryFee, prizePool, minPlayers, maxPlayers, registrationEndTime, gameStartTime] =
                await Promise.all([
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'status',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'title',
                  }) as unknown as Promise<string>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'gameType',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'entryFee',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'prizePool',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'minPlayers',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'maxPlayers',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'registrationEndTime',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'gameStartTime',
                  }) as unknown as Promise<bigint>,
                ]);

              // 获取玩家数量
              const players = await publicClient.readContract({
                address,
                abi: GAME_INSTANCE_ABI,
                functionName: 'players',
              }) as unknown as Array<{ player: `0x${string}`, score: bigint }>;

              return {
                address,
                title,
                status: status as bigint,
                gameType: gameType as bigint,
                entryFee: entryFee as bigint,
                prizePool: prizePool as bigint,
                minPlayers: minPlayers as bigint,
                maxPlayers: maxPlayers as bigint,
                registrationEndTime: registrationEndTime as bigint,
                gameStartTime: gameStartTime as bigint,
                players: players?.length || 0,
              };
            } catch (error) {
              console.error(`Failed to fetch game ${address}:`, error);
              throw error;
            }
          })
        );

        const successfulGames = results
          .filter((result): result is PromiseFulfilledResult<GameData> => result.status === 'fulfilled')
          .map(result => result.value);

        setGamesData(successfulGames);
      } catch (error) {
        console.error('Error fetching games batch:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [gameAddresses, publicClient]);

  return { gamesData, loading, error, refetch: () => {} };
}

/**
 * 领取奖金的 hook
 */
export function useClaimPrize() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = async (gameAddress: `0x${string}`) => {
    toast.info('Claiming prize...', {
      description: 'Please approve the transaction in your wallet',
    });

    writeContract({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      functionName: 'claimPrize',
    });
  };

  return {
    claimPrize,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * ERC20 代币操作的 hook
 */
export function useERC20(tokenAddress: `0x${string}`) {
  const { address } = useAccount();

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, address!], // 这里应该是 owner 和 spender，简化版
    query: {
      enabled: !!address,
    },
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (spender: `0x${string}`, amount: string) => {
    const amountWei = parseUnits(amount, 18);

    toast.info('Approving token...', {
      description: 'Please approve the transaction in your wallet',
    });

    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amountWei],
    });
  };

  return {
    balance: balance as bigint | undefined,
    allowance: allowance as bigint | undefined,
    approve,
    refetchBalance: () => refetchBalance(),
    refetchAllowance: () => refetchAllowance(),
    isPending,
    isConfirming,
    isSuccess,
  };
}

// 添加 GameData 类型定义
interface GameData {
  address: `0x${string}`;
  title: string;
  status: bigint;
  gameType: bigint;
  entryFee: bigint;
  prizePool: bigint;
  minPlayers: bigint;
  maxPlayers: bigint;
  registrationEndTime: bigint;
  gameStartTime: bigint;
  players: number;
  isJoined?: boolean;
}

