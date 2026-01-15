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
  RoguelikeSurvival = 4, // 新增：肉鸽割草游戏（Cycle Rift）
  InfiniteMatch = 5, // 更新：Infinite Match 为 5
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
        const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });

        if (receipt.status !== 'success') {
          throw new Error('Token approval failed');
        }

        toast.success('Token approved successfully', {
          description: 'You can now create the tournament',
        });
      }

      // 在发送交易之前，再次获取最新的区块时间，确保时间是最新的
      const latestBlock = await publicClient.getBlock();
      const latestTimestamp = Number(latestBlock.timestamp);

      console.log('=== useCreateGame Debug ===');
      console.log('Latest block timestamp:', latestTimestamp);
      console.log('Latest UTC time:', new Date(latestTimestamp * 1000).toISOString());
      console.log('Original registration end time:', config.registrationEndTime);
      console.log('Original game start time:', config.gameStartTime);

      // 如果传入的时间已经过期（小于当前区块时间），需要调整
      let adjustedRegistrationEndTime = config.registrationEndTime;
      let adjustedGameStartTime = config.gameStartTime;

      // 如果时间已经过期，重新计算（立即开始模式 + 60 秒）
      if (adjustedRegistrationEndTime <= latestTimestamp) {
        const timeDiff = latestTimestamp - adjustedRegistrationEndTime;
        console.log('Time expired, diff:', timeDiff, 'seconds');
        adjustedRegistrationEndTime = latestTimestamp + 60;
        adjustedGameStartTime = latestTimestamp + 60;
      }

      console.log('Adjusted registration end time:', adjustedRegistrationEndTime);
      console.log('Adjusted game start time:', adjustedGameStartTime);
      console.log('===========================');

      // 准备配置参数
      const gameConfig = {
        title: config.title,
        description: config.description,
        gameType: config.gameType,
        feeTokenAddress: addresses.PRIZE_TOKEN as `0x${string}`,
        entryFee: parseUnits(config.entryFee, 18),
        minPlayers: BigInt(config.minPlayers),
        maxPlayers: BigInt(config.maxPlayers),
        registrationEndTime: BigInt(adjustedRegistrationEndTime),
        gameStartTime: BigInt(adjustedGameStartTime),
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
    isPending: isPending || isConfirming,
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

  // 监听交易成功
  useEffect(() => {
    if (isSuccess) {
      toast.success("Successfully joined tournament!");
    }
  }, [isSuccess]);

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

      // 获取当前区块时间戳
      const currentBlock = await publicClient.getBlock();
      const currentTimestamp = Number(currentBlock.timestamp);

      // 获取游戏的报名时间和游戏开始时间
      const [registrationEndTime, gameStartTime, gameEndTime] = await Promise.all([
        publicClient.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'registrationEndTime',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'gameStartTime',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'gameEndTime',
        }) as Promise<bigint>,
      ]);

      const regEndTime = Number(registrationEndTime);
      const startTime = Number(gameStartTime);
      const endTime = Number(gameEndTime);

      console.log('[useJoinGame] Registration end time:', regEndTime, new Date(regEndTime * 1000).toISOString());
      console.log('[useJoinGame] Game start time:', startTime, new Date(startTime * 1000).toISOString());
      console.log('[useJoinGame] Game end time:', endTime, new Date(endTime * 1000).toISOString());
      console.log('[useJoinGame] Current timestamp:', currentTimestamp, new Date(currentTimestamp * 1000).toISOString());
      console.log('[useJoinGame] Is immediate start mode:', regEndTime === startTime);

      // 检查报名时间（移动到状态检查之后，因为状态更重要）
      // 先检查比赛状态
      const status = await publicClient.readContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'status',
      }) as unknown as bigint;

      console.log('[useJoinGame] Game status:', status.toString());

      if (status !== BigInt(0)) { // GameStatus.Created = 0
        const statusMessages: Record<string, string> = {
          '1': 'Game is in progress. Registration is closed.',
          '2': 'Game has ended. Registration is closed.',
          '3': 'Prizes have been distributed. Registration is closed.',
          '4': 'Game has been canceled. Registration is closed.',
        };
        throw new Error(statusMessages[status.toString()] || 'Cannot join game at this time');
      }

      // 现在检查报名时间
      if (regEndTime === startTime) {
        // 立即开始模式：允许在比赛结束前15分钟内报名
        // 例如：120分钟的比赛，创建后105分钟内可以报名
        const timeUntilEnd = endTime - currentTimestamp;
        const registrationDeadline = endTime - 15 * 60; // 结束前15分钟
        const timeUntilDeadline = registrationDeadline - currentTimestamp;

        console.log('[useJoinGame] Immediate start mode.');
        console.log('[useJoinGame] Time until game ends:', timeUntilEnd, 'seconds');
        console.log('[useJoinGame] Registration deadline:', registrationDeadline, new Date(registrationDeadline * 1000).toISOString());
        console.log('[useJoinGame] Time until registration deadline:', timeUntilDeadline, 'seconds');

        if (currentTimestamp >= registrationDeadline) {
          throw new Error('Registration time has passed. In immediate start mode, registration closes 15 minutes before the game ends.');
        }
      } else {
        // 正常模式：必须在报名时间结束前报名
        const timeUntilRegEnd = regEndTime - currentTimestamp;
        console.log('[useJoinGame] Normal mode. Time until registration ends:', timeUntilRegEnd, 'seconds');

        if (currentTimestamp >= regEndTime) {
          throw new Error('Registration time has passed. The tournament registration has ended.');
        }
      }

      // 检查玩家数量
      const maxPlayers = await publicClient.readContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'maxPlayers',
      }) as bigint;

      const gameData = await publicClient.readContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'getGameData',
      }) as unknown as {
        playerCount: bigint;
        status: bigint;
        // ... 其他字段
      };

      console.log('[useJoinGame] Current players:', Number(gameData.playerCount), '/', maxPlayers.toString());

      if (Number(gameData.playerCount) >= Number(maxPlayers)) {
        throw new Error('Tournament is full. Maximum number of players has been reached.');
      }

      // 检查是否已加入
      const isJoined = await publicClient.readContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'isJoined',
        args: [address],
      }) as boolean;

      console.log('[useJoinGame] User isJoined:', isJoined);

      if (isJoined) {
        throw new Error('You have already joined this tournament.');
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

      console.log('[useJoinGame] Current allowance:', allowance.toString());
      console.log('[useJoinGame] Required entryFee:', entryFeeAmount.toString());
      console.log('[useJoinGame] Approval needed:', allowance < entryFeeAmount);

      // 如果授权不足，先授权
      // 使用更大的授权额度以避免频繁授权（授权 10 倍的入场费，最多 100 个代币）
      const approveAmount = entryFeeAmount * BigInt(10) > parseUnits('100', 18) ? entryFeeAmount * BigInt(10) : parseUnits('100', 18);

      if (allowance < entryFeeAmount) {
        toast.info('Approving token transfer...', {
          description: 'Please approve the transaction in your wallet',
        });

        const approveHash = await walletClient.writeContract({
          address: addresses.PRIZE_TOKEN as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [gameAddress, approveAmount],
        });

        console.log('[useJoinGame] Approve transaction sent:', approveHash);
        console.log('[useJoinGame] Approve amount:', approveAmount.toString());

        // 等待授权交易确认
        const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });

        if (receipt.status !== 'success') {
          throw new Error('Token approval failed');
        }

        console.log('[useJoinGame] Approve transaction confirmed');

        toast.success('Token approved successfully', {
          description: 'You can now join the tournament',
        });
      } else {
        console.log('[useJoinGame] Token already approved');
      }

      // 检查代币余额
      const balance = await publicClient.readContract({
        address: addresses.PRIZE_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      console.log('[useJoinGame] Token balance:', balance.toString());

      if (balance < entryFeeAmount) {
        throw new Error(`Insufficient token balance. You have ${formatUnits(balance, 18)} tokens, but need ${entryFee} tokens.`);
      }

      toast.info('Joining tournament...', {
        description: 'Please approve the transaction in your wallet',
      });

      console.log('[useJoinGame] Calling joinGame on contract:', gameAddress);

      writeContract({
        address: gameAddress,
        abi: GAME_INSTANCE_ABI,
        functionName: 'joinGame',
      });
    } catch (err) {
      console.log('[useJoinGame] Error:', err);

      // 解析合约错误
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      // 检查是否是合约回滚错误
      if (errorMessage.includes('execution reverted')) {
        // 尝试从错误消息中提取更多信息
        const lowerMessage = errorMessage.toLowerCase();

        if (lowerMessage.includes('game not accepting players')) {
          throw new Error('Game is not accepting players. It may have already started or ended.');
        }
        if (lowerMessage.includes('registration time passed')) {
          throw new Error('Registration time has passed. Please check the tournament schedule.');
        }
        if (lowerMessage.includes('max players reached')) {
          throw new Error('Tournament is full. Maximum number of players has been reached.');
        }
        if (lowerMessage.includes('already joined')) {
          throw new Error('You have already joined this tournament.');
        }
        if (lowerMessage.includes('transfer failed')) {
          throw new Error('Token transfer failed. Please ensure you have sufficient tokens and have approved the contract.');
        }
        if (lowerMessage.includes('insufficient allowance') || lowerMessage.includes('allowance')) {
          throw new Error('Token allowance is insufficient. Please approve the contract to spend your tokens.');
        }
        if (lowerMessage.includes('insufficient balance')) {
          throw new Error('Insufficient token balance. Please make sure you have enough tokens to join.');
        }
      }

      toast.error('Failed to join tournament', {
        description: errorMessage,
      });
      throw err;
    }
  };

  return {
    joinGame,
    hash,
    isPending: isPending || isConfirming,
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
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 批量获取游戏数据的 hook
 */
export function useGamesBatch(gameAddresses: `0x${string}`[] | undefined) {
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();
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
          gameAddresses.map(async (gameAddress) => {
            try {
              // 获取游戏数据
              const [status, title, gameType, entryFee, prizePool, minPlayers, maxPlayers, registrationEndTime, gameStartTime] =
                await Promise.all([
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'status',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'title',
                  }) as unknown as Promise<string>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'gameType',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'entryFee',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'prizePool',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'minPlayers',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'maxPlayers',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'registrationEndTime',
                  }) as unknown as Promise<bigint>,
                  publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'gameStartTime',
                  }) as unknown as Promise<bigint>,
                ]);

              // 获取玩家数量和用户是否已加入
              let playerCount = 0;
              let isJoined = false;

              try {
                const gameData = await publicClient.readContract({
                  address: gameAddress,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'getGameData',
                }) as unknown as {
                  playerCount: bigint;
                  status: bigint;
                  // ... 其他字段
                };

                playerCount = Number(gameData.playerCount);
                console.log(`[useGamesBatch] Game ${gameAddress}: Fetched playerCount = ${playerCount}`);

                // 如果用户已连接钱包，检查是否已加入
                if (userAddress) {
                  isJoined = await publicClient.readContract({
                    address: gameAddress,
                    abi: GAME_INSTANCE_ABI,
                    functionName: 'isJoined',
                    args: [userAddress],
                  }) as unknown as boolean;
                  console.log(`[useGamesBatch] Game ${gameAddress}: User ${userAddress} isJoined = ${isJoined}`);
                }
              } catch (err) {
                // 如果获取失败，默认为 0
                console.warn(`[useGamesBatch] Failed to fetch game data for ${gameAddress}:`, err);
                playerCount = 0;
              }

              return {
                address: gameAddress,
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
                isJoined,
              };
            } catch (error) {
              console.log(`Failed to fetch game ${gameAddress}:`, error);
              throw error;
            }
          })
        );

        const successfulGames = results
          .filter((result): result is PromiseFulfilledResult<GameData> => result.status === 'fulfilled')
          .map(result => result.value);

        setGamesData(successfulGames);
      } catch (error) {
        console.log('Error fetching games batch:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [gameAddresses, publicClient, userAddress]);

  const refetch = () => {
    if (!gameAddresses || gameAddresses.length === 0 || !publicClient) {
      return;
    }

    setLoading(true);
    setError(null);

    // 使用非空断言，因为已经在上面检查了 publicClient 的存在性
    const client = publicClient;

    Promise.allSettled(
      gameAddresses.map(async (gameAddress) => {
        try {
          const [status, title, gameType, entryFee, prizePool, minPlayers, maxPlayers, registrationEndTime, gameStartTime] =
            await Promise.all([
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'status',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'title',
              }) as unknown as Promise<string>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'gameType',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'entryFee',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'prizePool',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'minPlayers',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'maxPlayers',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'registrationEndTime',
              }) as unknown as Promise<bigint>,
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'gameStartTime',
              }) as unknown as Promise<bigint>,
            ]);

          let playerCount = 0;
          let isJoined = false;

          try {
            const gameData = await client.readContract({
              address: gameAddress,
              abi: GAME_INSTANCE_ABI,
              functionName: 'getGameData',
            }) as unknown as {
              playerCount: bigint;
              status: bigint;
              // ... 其他字段
            };
            playerCount = Number(gameData.playerCount);

            if (userAddress) {
              isJoined = await client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'isJoined',
                args: [userAddress],
              }) as unknown as boolean;
            }
          } catch (err) {
            console.warn(`[useGamesBatch refetch] Failed to fetch players for game ${gameAddress}:`, err);
            playerCount = 0;
          }

          return {
            address: gameAddress,
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
            isJoined,
          };
        } catch (error) {
          console.log(`Failed to fetch game ${gameAddress}:`, error);
          throw error;
        }
      })
    ).then((results) => {
      const successfulGames = results
        .filter((result): result is PromiseFulfilledResult<GameData> => result.status === 'fulfilled')
        .map(result => result.value);
      setGamesData(successfulGames);
    }).catch((error) => {
      console.log('Error refetching games batch:', error);
      setError(error as Error);
    }).finally(() => {
      setLoading(false);
    });
  };

  return { gamesData, loading, error, refetch };
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
    isPending: isPending || isConfirming,
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
  gameEndTime: bigint; // 新增：比赛结束时间
  players: number;
  isJoined: boolean;
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

                // 获取游戏数据（包含玩家数量）
                const gameData = await publicClient.readContract({
                  address: gameAddr,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'getGameData',
                }) as unknown as {
                  playerCount: bigint;
                  status: bigint;
                  // ... 其他字段
                };

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
                  players: Number(gameData.playerCount),
                  isJoined: true,
                  submittedAt,
                };
              }
              return null as (GameData & { submittedAt?: bigint }) | null;
            } catch (error) {
              console.log(`Failed to check game ${gameAddr}:`, error);
              return null;
            }
          })
        );

        const validGames = gamesWithStatus
          .filter((result): result is PromiseFulfilledResult<GameData> => result.status === 'fulfilled' && result.value !== null)
          .map((result): GameData => result.value!);

        setUserGames(validGames);
      } catch (error) {
        console.log('Error fetching user games:', error);
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
          gameEndTime,
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
            functionName: 'gameEndTime',
          }),
          publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'creator',
          }),
        ]);

        // 获取玩家列表和 gameResults（包含提交时间）- 添加错误处理
        let playersList: Array<{ player: `0x${string}`, score: bigint, submittedAt: bigint }> = [];
        try {
          // 使用 getGameData 获取玩家数量
          const gameData = await publicClient.readContract({
            address: gameAddress,
            abi: GAME_INSTANCE_ABI,
            functionName: 'getGameData',
          }) as unknown as {
            playerCount: bigint;
            status: bigint;
            // ... 其他字段
          };

          const playerCount = Number(gameData.playerCount);
          console.log(`[useGameDetails] Fetched playerCount = ${playerCount}`);

          // 逐个获取玩家数据
          if (playerCount > 0) {
            const playersPromises = [];
            for (let i = 0; i < playerCount; i++) {
              playersPromises.push(
                publicClient.readContract({
                  address: gameAddress,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'players',
                  args: [i] as any,
                }) as unknown as { player: `0x${string}`, score: bigint }
              );
            }

            const players = await Promise.all(playersPromises);

            // 获取每个玩家的 gameResults（包含提交时间）
            playersList = await Promise.all(players.map(async (p) => {
              try {
                const gameResult = await publicClient.readContract({
                  address: gameAddress,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'gameResults',
                  args: [p.player],
                }) as unknown as {
                  gameType: bigint;
                  player: `0x${string}`;
                  score: bigint;
                  timestamp: bigint;
                  gameHash: `0x${string}`;
                  metadata: bigint[];
                } | undefined;

                // 如果 gameResults 存在且分数大于 0，使用其中的 timestamp
                // 否则使用 0（表示未提交或使用 submitScore 而非 submitGameResult）
                const submittedAt = gameResult && gameResult.score > BigInt(0) ? gameResult.timestamp : BigInt(0);

                return {
                  player: p.player,
                  score: p.score,
                  submittedAt,
                };
              } catch (err) {
                console.warn(`[useGameDetails] Failed to fetch gameResult for player ${p.player}:`, err);
                // 如果获取失败，返回基本数据（submittedAt 为 0）
                return {
                  player: p.player,
                  score: p.score,
                  submittedAt: BigInt(0),
                };
              }
            }));

            console.log(`[useGameDetails] Processed ${playersList.length} players with submittedAt`);
          }
        } catch (err) {
          console.warn('[useGameDetails] Failed to fetch players:', err);
          playersList = [];
        }

        let myScore: bigint | undefined;
        let hasSubmitted = false;
        let isJoined = false;
        let prizeToClaim: bigint | undefined;

        if (address) {
          try {
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
          } catch (err) {
            console.warn('Failed to fetch user data:', err);
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
          gameEndTime: gameEndTime as bigint,
          creator: creator as `0x${string}`,
          playersList: playersList,
          players: playersList.length,
          myScore,
          hasSubmitted,
          isJoined,
          canStartGame,
          prizeToClaim,
        });
      } catch (error) {
        console.log('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameAddress, publicClient, address]);

  return { gameDetails, loading };
}

/**
 * 获取单个比赛完整详情的 hook - 带 refetch 功能
 */
export function useGameDetailsWithRefetch(gameAddress: `0x${string}` | null) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGameDetails = async () => {
    if (!gameAddress || !publicClient) {
      setGameDetails(null);
      return;
    }

    setLoading(true);
    try {
      // 使用非空断言，因为已经在上面检查了 publicClient 的存在性
      const client = publicClient;

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
        gameEndTime,
        creator,
      ] = await Promise.all([
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'title',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'description',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'status',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'gameType',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'entryFee',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'prizePool',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'minPlayers',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'maxPlayers',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'registrationEndTime',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'gameStartTime',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'gameEndTime',
        }),
        client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'creator',
        }),
      ]);

      // 获取玩家列表和 gameResults（包含提交时间）- 添加错误处理
      let playersList: Array<{ player: `0x${string}`, score: bigint, submittedAt: bigint }> = [];
      try {
        // 使用 getGameData 获取玩家数量
        const gameData = await client.readContract({
          address: gameAddress,
          abi: GAME_INSTANCE_ABI,
          functionName: 'getGameData',
        }) as unknown as {
          playerCount: bigint;
          status: bigint;
          // ... 其他字段
        };

        const playerCount = Number(gameData.playerCount);
        console.log(`[useGameDetailsWithRefetch] Fetched playerCount = ${playerCount}`);

        // 逐个获取玩家数据
        if (playerCount > 0) {
          const playersPromises = [];
          for (let i = 0; i < playerCount; i++) {
            playersPromises.push(
              client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'players',
                args: [i] as any,
              }) as unknown as { player: `0x${string}`, score: bigint }
            );
          }

          const players = await Promise.all(playersPromises);

          // 获取每个玩家的 gameResults（包含提交时间）
          playersList = await Promise.all(players.map(async (p) => {
            try {
              const gameResult = await client.readContract({
                address: gameAddress,
                abi: GAME_INSTANCE_ABI,
                functionName: 'gameResults',
                args: [p.player],
              }) as unknown as {
                gameType: bigint;
                player: `0x${string}`;
                score: bigint;
                timestamp: bigint;
                gameHash: `0x${string}`;
                metadata: bigint[];
              } | undefined;

              const submittedAt = gameResult && gameResult.score > BigInt(0) ? gameResult.timestamp : BigInt(0);

              return {
                player: p.player,
                score: p.score,
                submittedAt,
              };
            } catch (err) {
              console.warn(`[useGameDetailsWithRefetch] Failed to fetch gameResult for player ${p.player}:`, err);
              return {
                player: p.player,
                score: p.score,
                submittedAt: BigInt(0),
              };
            }
          }));

          console.log(`[useGameDetailsWithRefetch] Processed ${playersList.length} players with submittedAt`);
        }
      } catch (err) {
        console.warn('[useGameDetailsWithRefetch] Failed to fetch players:', err);
        playersList = [];
      }

      let myScore: bigint | undefined;
      let hasSubmitted = false;
      let isJoined = false;
      let prizeToClaim: bigint | undefined;

      if (address) {
        try {
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
        } catch (err) {
          console.warn('[useGameDetailsWithRefetch] Failed to fetch user data:', err);
        }
      }

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
        playersList: playersList,
        players: playersList.length,
        myScore,
        hasSubmitted,
        isJoined,
        canStartGame,
        prizeToClaim,
      });
    } catch (error) {
      console.log('Error fetching game details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameDetails();
  }, [gameAddress, publicClient, address]);

  return { gameDetails, loading, refetch: fetchGameDetails };
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
    isPending: isPending || isConfirming,
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
    isPending: isPending || isConfirming,
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
    isPending: isPending || isConfirming,
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
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}
