"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { toast } from 'sonner';
import {
  GAME_FACTORY_ABI,
  GAME_INSTANCE_ABI,
} from '@/lib/contracts';

// 事件类型定义
export interface GameEvent {
  type: 'GameCreated' | 'PlayerJoined' | 'GameStarted' | 'ScoreSubmitted' | 'GameEnded' | 'GameCanceled' | 'PrizeDistributed';
  gameAddress: `0x${string}`;
  timestamp: bigint;
  data: any;
}

/**
 * 监听游戏工厂事件的 hook
 */
export function useGameFactoryEvents(onEvent?: (event: GameEvent) => void) {
  const publicClient = usePublicClient();
  const eventListenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    if (!publicClient) return;

    // 清理之前的监听器
    eventListenersRef.current.forEach(unwatch => unwatch());
    eventListenersRef.current.clear();

    // 监听 GameCreated 事件
    const unwatchGameCreated = publicClient.watchContractEvent({
      address: undefined as any, // 将在使用时动态设置
      abi: GAME_FACTORY_ABI,
      eventName: 'GameCreated',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          const event: GameEvent = {
            type: 'GameCreated',
            gameAddress: log.args.gameInstance,
            timestamp: log.args.timestamp || BigInt(Math.floor(Date.now() / 1000)),
            data: {
              creator: log.args.creator,
              title: log.args.title,
              gameType: log.args.gameType,
              prizePool: log.args.prizePool,
            },
          };
          console.log('GameCreated event:', event);
          toast.success('New tournament created!', {
            description: `"${event.data.title}" by ${event.data.creator.slice(0, 6)}...${event.data.creator.slice(-4)}`,
          });
          onEvent?.(event);
        });
      },
    });

    eventListenersRef.current.add(unwatchGameCreated);

    // 清理函数
    return () => {
      eventListenersRef.current.forEach(unwatch => unwatch());
      eventListenersRef.current.clear();
    };
  }, [publicClient, onEvent]);
}

/**
 * 监听特定游戏事件的 hook
 */
export function useGameInstanceEvents(
  gameAddress: `0x${string}` | null,
  onEvent?: (event: GameEvent) => void
) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const eventListenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    if (!publicClient || !gameAddress) return;

    // 清理之前的监听器
    eventListenersRef.current.forEach(unwatch => unwatch());
    eventListenersRef.current.clear();

    // 监听 PlayerJoined 事件
    const unwatchPlayerJoined = publicClient.watchContractEvent({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      eventName: 'PlayerJoined',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          const isCurrentUser = log.args.player.toLowerCase() === address?.toLowerCase();
          const event: GameEvent = {
            type: 'PlayerJoined',
            gameAddress,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            data: {
              player: log.args.player,
              isCurrentUser,
            },
          };
          console.log('PlayerJoined event:', event);
          if (isCurrentUser) {
            toast.success('You joined the tournament!', {
              description: 'Good luck!',
            });
          } else {
            toast.info('New player joined', {
              description: `${log.args.player.slice(0, 6)}...${log.args.player.slice(-4)} joined the tournament`,
            });
          }
          onEvent?.(event);
        });
      },
    });

    // 监听 GameStarted 事件
    const unwatchGameStarted = publicClient.watchContractEvent({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      eventName: 'GameStarted',
      onLogs: () => {
        const event: GameEvent = {
          type: 'GameStarted',
          gameAddress,
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          data: {},
        };
        console.log('GameStarted event:', event);
        toast.success('Tournament started!', {
          description: 'The game is now in progress',
        });
        onEvent?.(event);
      },
    });

    // 监听 ScoreSubmitted 事件
    const unwatchScoreSubmitted = publicClient.watchContractEvent({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      eventName: 'ScoreSubmitted',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          const isCurrentUser = log.args.player.toLowerCase() === address?.toLowerCase();
          const event: GameEvent = {
            type: 'ScoreSubmitted',
            gameAddress,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            data: {
              player: log.args.player,
              score: log.args.score,
              isCurrentUser,
            },
          };
          console.log('ScoreSubmitted event:', event);
          onEvent?.(event);
        });
      },
    });

    // 监听 WinnersSet 事件（游戏结束）
    const unwatchWinnersSet = publicClient.watchContractEvent({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      eventName: 'WinnersSet',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          const winners = log.args.winners as `0x${string}`[];
          const isWinner = winners.some(w => w.toLowerCase() === address?.toLowerCase());
          const event: GameEvent = {
            type: 'GameEnded',
            gameAddress,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            data: {
              winners,
              isWinner,
            },
          };
          console.log('WinnersSet event:', event);
          if (isWinner) {
            toast.success('Congratulations! You won!', {
              description: 'Check your prizes',
            });
          } else {
            toast.info('Tournament ended', {
              description: `${winners.length} winner(s) selected`,
            });
          }
          onEvent?.(event);
        });
      },
    });

    // 监听 GameCanceled 事件
    const unwatchGameCanceled = publicClient.watchContractEvent({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      eventName: 'GameCanceled',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          const event: GameEvent = {
            type: 'GameCanceled',
            gameAddress,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            data: {
              creator: log.args.creator,
              refundAmount: log.args.refundAmount,
            },
          };
          console.log('GameCanceled event:', event);
          toast.warning('Tournament canceled', {
            description: 'Refunds have been processed',
          });
          onEvent?.(event);
        });
      },
    });

    // 监听 PrizeDistributed 事件
    const unwatchPrizeDistributed = publicClient.watchContractEvent({
      address: gameAddress,
      abi: GAME_INSTANCE_ABI,
      eventName: 'PrizeDistributed',
      onLogs: (logs) => {
        logs.forEach((log: any) => {
          const isCurrentUser = log.args.winner.toLowerCase() === address?.toLowerCase();
          const event: GameEvent = {
            type: 'PrizeDistributed',
            gameAddress,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            data: {
              winner: log.args.winner,
              amount: log.args.amount,
              isCurrentUser,
            },
          };
          console.log('PrizeDistributed event:', event);
          if (isCurrentUser) {
            toast.success('Prize distributed!', {
              description: `You received ${log.args.amount.toString()} tokens`,
            });
          }
          onEvent?.(event);
        });
      },
    });

    // 添加所有监听器到清理集合
    eventListenersRef.current.add(unwatchPlayerJoined);
    eventListenersRef.current.add(unwatchGameStarted);
    eventListenersRef.current.add(unwatchScoreSubmitted);
    eventListenersRef.current.add(unwatchWinnersSet);
    eventListenersRef.current.add(unwatchGameCanceled);
    eventListenersRef.current.add(unwatchPrizeDistributed);

    // 清理函数
    return () => {
      eventListenersRef.current.forEach(unwatch => unwatch());
      eventListenersRef.current.clear();
    };
  }, [publicClient, gameAddress, address, onEvent]);
}

/**
 * 全局事件监听器 - 监听所有游戏事件
 */
export function useGlobalGameEvents() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const maxEvents = 50;

  const addEvent = useCallback((event: GameEvent) => {
    setRecentEvents(prev => {
      const newEvents = [event, ...prev];
      return newEvents.slice(0, maxEvents);
    });
  }, [maxEvents]);

  useEffect(() => {
    if (!publicClient || !address) return;

    // 监听所有 GameInstance 合约的取消事件（通过工厂）
    // 注意：实际实现需要根据工厂地址监听
    // 这里简化处理，仅演示逻辑

    return () => {
      // 清理逻辑
    };
  }, [publicClient, address]);

  return { recentEvents, addEvent, clearEvents: () => setRecentEvents([]) };
}
