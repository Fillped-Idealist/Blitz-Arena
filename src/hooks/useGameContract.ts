"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from "wagmi";
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
  const supported = isSupportedChain(chainId);

  if (!supported) {
    return null;
  }

  return getContractAddresses(chainId);
}

/**
 * 使用 GameFactory 合约的 hook
 */
export function useGameFactory() {
  const { address } = useAccount();
  const addresses = useContractAddresses();

  const { data: allGames, refetch: refetchGames } = useReadContract({
    address: addresses?.GAME_FACTORY as `0x${string}`,
    abi: GAME_FACTORY_ABI,
    functionName: 'getAllGames',
    query: {
      enabled: !!addresses,
    },
  });

  const { data: totalGames, refetch: refetchTotalGames } = useReadContract({
    address: addresses?.GAME_FACTORY as `0x${string}`,
    abi: GAME_FACTORY_ABI,
    functionName: 'getTotalGames',
    query: {
      enabled: !!addresses,
    },
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
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

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
    try {
      if (!supported) {
        throw new Error('Unsupported network. Please switch to Hardhat or Mantle Sepolia Testnet');
      }

      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      if (!addresses) {
        throw new Error('Contract addresses not available on current network');
      }

      if (!publicClient || !walletClient) {
        throw new Error('Wallet client or public client not available');
      }

      // 计算奖池金额（创建比赛时只需要授权 prizePool，不包含平台费）
      // 平台费是在玩家报名时从报名费中扣除的
      const prizePoolAmount = parseUnits(config.prizePool, 18);

      // 检查并授权 PrizeToken
      const allowance = await publicClient.readContract({
        address: addresses.PRIZE_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, addresses.GAME_FACTORY as `0x${string}`],
      }) as bigint;

      // 如果授权不足，先授权
      if (allowance < prizePoolAmount) {
        toast.info('Approving token transfer...', {
          description: 'Please approve the transaction in your wallet',
        });

        const approveHash = await walletClient.writeContract({
          address: addresses.PRIZE_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [addresses.GAME_FACTORY as `0x${string}`, prizePoolAmount],
        });

        // 等待授权交易确认
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        toast.success('Token approved successfully');
      }

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to create tournament', {
        description: errorMessage,
      });
      throw err;
    }
  };

  return {
    createGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
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
  const { address } = useAccount();
  const { supported } = useNetworkCheck();
  const addresses = useContractAddresses();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const joinGame = async (gameAddress: `0x${string}`, entryFee: string) => {
    try {
      if (!supported) {
        throw new Error('Unsupported network. Please switch to Hardhat or Mantle Sepolia Testnet');
      }

      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      if (!addresses) {
        throw new Error('Contract addresses not available on current network');
      }

      if (!publicClient || !walletClient) {
        throw new Error('Wallet client or public client not available');
      }

      // 计算报名费金额
      const entryFeeAmount = parseUnits(entryFee, 18);

      // 检查并授权 feeToken
      // 注意：需要授权给 GameInstance 合约，而不是 GameFactory
      const allowance = await publicClient.readContract({
        address: addresses.PRIZE_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, gameAddress],
      }) as bigint;

      // 如果授权不足，先授权
      if (allowance < entryFeeAmount) {
        toast.info('Approving token transfer...', {
          description: 'Please approve the transaction in your wallet',
        });

        const approveHash = await walletClient.writeContract({
          address: addresses.PRIZE_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [gameAddress, entryFeeAmount],
        });

        // 等待授权交易确认
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        toast.success('Token approved successfully');
      }

      toast.info('Joining tournament...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'joinGame',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to join tournament', {
        description: errorMessage,
      });
      throw err;
    }
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
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitScore = async (gameAddress: `0x${string}`, score: number) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      if (score < 0) {
        throw new Error('Invalid score. Score must be a positive number');
      }

      toast.info('Submitting score...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'submitScore',
        args: [BigInt(score)],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to submit score', {
        description: errorMessage,
      });
      throw err;
    }
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

              // 获取玩家数量 - 添加错误处理
              let playerCount = 0;
              try {
                const players = await publicClient.readContract({
                  address,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'players',
                }) as unknown as Array<{ player: `0x${string}`, score: bigint }>;
                playerCount = players?.length || 0;
              } catch (err) {
                // 如果获取玩家失败，默认为 0
                console.warn(`Failed to fetch players for game ${address}:`, err);
                playerCount = 0;
              }

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
                players: playerCount,
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
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPrize = async (gameAddress: `0x${string}`) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      toast.info('Claiming prize...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'claimPrize',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to claim prize', {
        description: errorMessage,
      });
      throw err;
    }
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

interface GameDetails extends GameData {
  description?: string;
  creator?: `0x${string}`;
  playersList?: Array<{ player: `0x${string}`, score: bigint, submittedAt: bigint }>;
  myScore?: bigint;
  hasSubmitted?: boolean;
  canStartGame?: boolean;
  prizeToClaim?: bigint;
}

/**
 * 获取用户参与的所有比赛的 hook
 */
export function useUserGames(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const chainId = useChainId();
  const userAddr = userAddress || address;
  const publicClient = usePublicClient();

  // 检查网络是否支持
  const supported = isSupportedChain(chainId);

  // 只在支持的网络中获取合约地址
  const addresses = supported ? getContractAddresses(chainId) : null;

  const [userGames, setUserGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 不在支持的网络或不满足条件时，不执行合约调用
    if (!supported || !userAddr || !publicClient || !addresses?.GAME_FACTORY) return;

    const fetchUserGames = async () => {
      setLoading(true);
      try {
        // 获取所有游戏
        const allGames = await publicClient.readContract({
          address: addresses.GAME_FACTORY,
          abi: GAME_FACTORY_ABI,
          functionName: 'getAllGames',
        }) as unknown as `0x${string}`[];

        // 批量检查用户是否参与了每个游戏
        const gamesWithStatus = await Promise.allSettled(
          allGames.map(async (gameAddr) => {
            try {
              const isJoined = await publicClient.readContract({
                address: gameAddr,
                abi: GAME_INSTANCE_ABI,
                functionName: 'isJoined',
                args: [userAddr],
              }) as unknown as boolean;

              if (isJoined) {
                // 获取游戏基本信息
                const [title, status, gameType, entryFee, prizePool] =
                  await Promise.all([
                    publicClient.readContract({
                      address: gameAddr,
                      abi: GAME_INSTANCE_ABI,
                      functionName: 'title',
                    }),
                    publicClient.readContract({
                      address: gameAddr,
                      abi: GAME_INSTANCE_ABI,
                      functionName: 'status',
                    }),
                    publicClient.readContract({
                      address: gameAddr,
                      abi: GAME_INSTANCE_ABI,
                      functionName: 'gameType',
                    }),
                    publicClient.readContract({
                      address: gameAddr,
                      abi: GAME_INSTANCE_ABI,
                      functionName: 'entryFee',
                    }),
                    publicClient.readContract({
                      address: gameAddr,
                      abi: GAME_INSTANCE_ABI,
                      functionName: 'prizePool',
                    }),
                  ]);

                // 获取玩家列表
                const players = await publicClient.readContract({
                  address: gameAddr,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'players',
                }) as unknown as Array<{ player: `0x${string}`, score: bigint }>;

                // 获取用户在比赛中的游戏结果（包含提交时间）
                const gameResult = await publicClient.readContract({
                  address: gameAddr,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'gameResults',
                  args: [userAddr],
                }) as unknown as {
                  gameType: bigint;
                  player: `0x${string}`;
                  score: bigint;
                  timestamp: bigint;
                  gameHash: `0x${string}`;
                  metadata: bigint[];
                } | undefined;

                const submittedAt = gameResult?.timestamp;

                return {
                  address: gameAddr,
                  title: title as string,
                  status: status as unknown as bigint,
                  gameType: gameType as unknown as bigint,
                  entryFee: entryFee as unknown as bigint,
                  prizePool: prizePool as unknown as bigint,
                  players: players?.length || 0,
                  isJoined: true,
                  submittedAt,
                };
              }
              return null as (GameData & { submittedAt?: bigint }) | null;
            } catch (error) {
              console.error(`Failed to check game ${gameAddr}:`, error);
              return null;
            }
          })
        );

        const validGames = gamesWithStatus
          .filter((result): result is PromiseFulfilledResult<GameData> => result.status === 'fulfilled' && result.value !== null)
          .map((result): GameData => result.value!);

        setUserGames(validGames);
      } catch (error) {
        console.error('Error fetching user games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGames();
  }, [userAddr, publicClient, addresses?.GAME_FACTORY]);

  return { userGames, loading, refetch: () => {} };
}

/**
 * 获取单个比赛完整详情的 hook
 */
export function useGameDetails(gameAddress: `0x${string}` | null) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameAddress || !publicClient) {
      setGameDetails(null);
      return;
    }

    const fetchGameDetails = async () => {
      setLoading(true);
      try {
        const [
          title,
          description,
          status,
          gameType,
          entryFee,
          prizePool,
          minPlayers,
          maxPlayers,
          registrationEndTime,
          gameStartTime,
          creator,
        ] = await Promise.all([
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'title',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'description',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'status',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'gameType',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'entryFee',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'prizePool',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'minPlayers',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'maxPlayers',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'registrationEndTime',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'gameStartTime',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'creator',
          }),
        ]);

        // 获取玩家列表和分数
        const players = await publicClient.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'players',
        }) as unknown as Array<{ player: `0x${string}`, score: bigint, submittedAt: bigint }>;

        let myScore: bigint | undefined;
        let hasSubmitted = false;
        let isJoined = false;
        let prizeToClaim: bigint | undefined;

        if (address) {
          isJoined = await publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'isJoined',
            args: [address],
          }) as unknown as boolean;

          if (isJoined) {
            myScore = await publicClient.readContract({
              address: gameAddress,
              abi: GAME_INSTANCE_ABI,
              functionName: 'scores',
              args: [address],
            }) as unknown as bigint;

            hasSubmitted = myScore !== undefined && myScore > BigInt(0);

            prizeToClaim = await publicClient.readContract({
              address: gameAddress,
              abi: GAME_INSTANCE_ABI,
              functionName: 'prizeToClaimsAmount',
              args: [address],
            }) as unknown as bigint;
          }
        }

        // 检查是否可以开始游戏
        const now = Math.floor(Date.now() / 1000);
        const registrationEnd = Number(registrationEndTime);
        const gameStart = Number(gameStartTime);
        const statusBigInt = status as unknown as bigint;
        const canStartGame = statusBigInt === BigInt(GameStatus.Created) && now >= registrationEnd;

        setGameDetails({
          address: gameAddress,
          title: title as string,
          description: description as string,
          status: status as unknown as bigint,
          gameType: gameType as unknown as bigint,
          entryFee: entryFee as unknown as bigint,
          prizePool: prizePool as unknown as bigint,
          minPlayers: minPlayers as unknown as bigint,
          maxPlayers: maxPlayers as unknown as bigint,
          registrationEndTime: registrationEndTime as bigint,
          gameStartTime: gameStartTime as bigint,
          creator: creator as `0x${string}`,
          playersList: players,
          players: players?.length || 0,
          myScore,
          hasSubmitted,
          isJoined,
          canStartGame,
          prizeToClaim,
        });
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameAddress, publicClient, address]);

  return { gameDetails, loading };
}

/**
 * 开始比赛的 hook
 */
export function useStartGame() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const startGame = async (gameAddress: `0x${string}`) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      toast.info('Starting game...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'startGame',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to start game', {
        description: errorMessage,
      });
      throw err;
    }
  };

  return {
    startGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 设置比赛获胜者的 hook
 */
export function useSetWinners() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setWinners = async (gameAddress: `0x${string}`, winners: `0x${string}`[]) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      if (!winners || winners.length === 0) {
        throw new Error('Winners list is empty. Please select at least one winner');
      }

      toast.info('Setting winners...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'setWinners',
        args: [winners],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to set winners', {
        description: errorMessage,
      });
      throw err;
    }
  };

  return {
    setWinners,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 分配奖金的 hook
 */
export function useDistributePrize() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const distributePrize = async (gameAddress: `0x${string}`) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      toast.info('Distributing prizes...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'distributePrize',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to distribute prizes', {
        description: errorMessage,
      });
      throw err;
    }
  };

  return {
    distributePrize,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 取消比赛的 hook
 */
export function useCancelGame() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelGame = async (gameAddress: `0x${string}`) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected. Please connect your wallet first');
      }

      toast.info('Cancelling game...', {
        description: 'Please approve the transaction in your wallet',
      });

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'cancelGame',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Failed to cancel game', {
        description: errorMessage,
      });
      throw err;
    }
  };

  return {
    cancelGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
