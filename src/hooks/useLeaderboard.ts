"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { useGameFactory } from "./useGameContract";
import { GAME_INSTANCE_ABI } from "@/lib/contracts";

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalPrizes: string;
  tournaments: number;
  wins: number;
}

export function useLeaderboard(options?: {
  gameType?: string;
  timeRange?: 'all' | 'week' | 'month';
}) {
  const publicClient = usePublicClient();
  const { allGames } = useGameFactory();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!allGames || allGames.length === 0 || !publicClient) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const { gameType, timeRange } = options || {};

        // 批量获取所有游戏数据
        const gamesData = await Promise.allSettled(
          allGames.map(async (address) => {
            try {
              const [status, gameTypeVal, prizePool, winners, players] = await Promise.all([
                publicClient.readContract({
                  address,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'status',
                }) as unknown as Promise<bigint>,
                publicClient.readContract({
                  address,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'gameType',
                }) as unknown as Promise<bigint>,
                publicClient.readContract({
                  address,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'prizePool',
                }) as unknown as Promise<bigint>,
                publicClient.readContract({
                  address,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'winners',
                }) as Promise<`0x${string}`[]>,
                publicClient.readContract({
                  address,
                  abi: GAME_INSTANCE_ABI,
                  functionName: 'players',
                }) as Promise<Array<{ player: `0x${string}`, score: bigint }>>,
              ]);

              return {
                address,
                status,
                gameType: gameTypeVal,
                prizePool,
                winners,
                players,
              };
            } catch (error) {
              console.error(`Failed to fetch game ${address}:`, error);
              return null;
            }
          })
        );

        const successfulGames = gamesData
          .filter((result): result is PromiseFulfilledResult<any> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);

        // 筛选游戏类型
        let filteredGames = successfulGames;
        if (gameType && gameType !== 'all') {
          filteredGames = successfulGames.filter(game => 
            String(game.gameType) === gameType
          );
        }

        // 时间范围筛选（简单版：暂不支持，返回全部）
        // TODO: 如果需要时间范围筛选，需要在合约中添加 createdAt 时间戳

        const playerStats = new Map<string, { prizes: bigint; tournaments: number; wins: number }>();

        // 统计所有玩家数据
        filteredGames.forEach(game => {
          // 只统计已结束的游戏（status = 2）
          if (game.status !== BigInt(2)) return;

          if (!game.winners || game.winners.length === 0) return;

          // 胜者获得奖金
          const prizePerWinner = game.prizePool / BigInt(game.winners.length);

          game.winners.forEach((winner: `0x${string}`, index: number) => {
            const stats = playerStats.get(winner) || { 
              prizes: BigInt(0), 
              tournaments: 0, 
              wins: 0 
            };
            stats.tournaments += 1;
            stats.prizes += prizePerWinner;

            if (index === 0) {
              stats.wins += 1;
            }

            playerStats.set(winner, stats);
          });
        });

        // 转换为数组并排序
        const sortedLeaderboard = Array.from(playerStats.entries())
          .map(([address, stats]) => ({
            address,
            totalPrizes: stats.prizes,
            tournaments: stats.tournaments,
            wins: stats.wins,
          }))
          .sort((a, b) => {
            // 按奖金降序排序
            if (b.totalPrizes > a.totalPrizes) return 1;
            if (b.totalPrizes < a.totalPrizes) return -1;
            // 奖金相同按获胜次数降序
            return b.wins - a.wins;
          })
          .slice(0, 50); // 只显示前50名

        // 添加排名和格式化地址
        const formattedLeaderboard: LeaderboardEntry[] = sortedLeaderboard.map((player, index) => ({
          rank: index + 1,
          address: `${player.address.slice(0, 6)}...${player.address.slice(-4)}`,
          totalPrizes: String(player.totalPrizes),
          tournaments: player.tournaments,
          wins: player.wins,
        }));

        setLeaderboard(formattedLeaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [allGames, publicClient, options?.gameType, options?.timeRange]);

  return { leaderboard, loading, error, refetch: () => {} };
}
