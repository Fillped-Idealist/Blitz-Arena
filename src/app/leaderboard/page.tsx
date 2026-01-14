"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Crown,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { getLeaderboardData } from "@/lib/tournamentStore";

type LeaderboardEntry = {
  rank: number;
  address: string;
  totalPrizes: number;
  tournaments: number;
  wins: number;
  gameType?: string;
};

// 游戏类型配置（无图标）
const GAME_TYPES = [
  { id: 'all', label: 'All Games' },
  { id: '1', label: 'Number Guess' },
  { id: '2', label: 'Rock Paper Scissors' },
  { id: '3', label: 'Quick Click' },
  { id: '4', label: 'Cycle Rift' },
  { id: '5', label: 'Infinite Match' },
];

// 时间范围配置
const TIME_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

export default function LeaderboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedGameType, setSelectedGameType] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setLeaderboard(getLeaderboardData({
        gameType: selectedGameType,
        timeRange: selectedTimeRange
      }));
    }
  }, [isMounted, selectedGameType, selectedTimeRange]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-2xl text-gray-400">Loading leaderboard...</div>
          </div>
        </div>
      </div>
    );
  }

  // Top 3 players
  const topThree = leaderboard.slice(0, 3);
  const remainingPlayers = leaderboard.slice(3);

  // Get rank icon
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  // Get rank color
  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-500/20 to-amber-600/20 border-yellow-500/50 shadow-yellow-500/20";
    if (rank === 2) return "from-gray-400/20 to-gray-300/20 border-gray-400/50 shadow-gray-400/20";
    if (rank === 3) return "from-amber-700/20 to-orange-600/20 border-amber-700/50 shadow-amber-700/20";
    return "from-white/5 to-white/[0.02] border-white/10";
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-500 to-amber-500";
    if (rank === 2) return "bg-gradient-to-br from-gray-400 to-gray-300";
    if (rank === 3) return "bg-gradient-to-br from-amber-700 to-orange-600";
    return "bg-gradient-to-br from-blue-600 to-purple-600";
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-600 border-none text-white">
            Top Performers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            The most successful players on the platform
          </p>
        </motion.div>

        {/* Filters - GitHub Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Game Type Filter */}
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Filter by game type
              </label>
              <select
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-white/10 transition-colors"
              >
                {GAME_TYPES.map((game) => (
                  <option
                    key={game.id}
                    value={game.id}
                    className="bg-gray-900 text-white"
                  >
                    {game.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Filter by time range
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as 'all' | 'week' | 'month')}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer hover:bg-white/10 transition-colors"
              >
                {TIME_RANGES.map((range) => (
                  <option
                    key={range.id}
                    value={range.id}
                    className="bg-gray-900 text-white"
                  >
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {topThree.map((player, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={player.address}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${rank === 1 ? 'md:-mt-4' : ''}`}
              >
                <Card
                  className={`bg-gradient-to-br ${getRankColor(rank)} backdrop-blur-sm border-2 overflow-hidden h-full hover:scale-105 transition-transform duration-300`}
                >
                  <div className="p-8">
                    {/* Rank */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="flex items-center gap-3">
                        {getRankIcon(rank)}
                        <span className={`text-4xl font-bold ${
                          rank === 1 ? 'text-yellow-400' :
                          rank === 2 ? 'text-gray-300' :
                          'text-amber-600'
                        }`}>
                          #{rank}
                        </span>
                      </div>
                    </div>

                    {/* Avatar Placeholder */}
                    <div className="flex justify-center mb-6">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${
                        rank === 1 ? 'from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/30' :
                        rank === 2 ? 'from-gray-400 to-gray-300 shadow-lg shadow-gray-400/30' :
                        'from-amber-700 to-orange-600 shadow-lg shadow-amber-700/30'
                      } flex items-center justify-center transition-transform hover:scale-110 duration-300`}>
                        <span className="text-3xl font-bold text-white">
                          {player.address.slice(2, 4)}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="text-center mb-6">
                      <div className="text-xl font-bold text-white mb-2">
                        {player.address}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Total Prizes</span>
                        <span className="text-lg font-bold text-white">{player.totalPrizes}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Tournaments</span>
                        <span className="text-lg font-bold text-white">{player.tournaments}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Wins</span>
                        <span className="text-lg font-bold text-white">{player.wins}</span>
                      </div>
                      {player.gameType && selectedGameType === 'all' && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-sm text-gray-400">Best Game</span>
                          <span className="text-lg font-bold text-white">
                            {GAME_TYPES.find(g => g.id === player.gameType)?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Remaining Players List */}
        {remainingPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">
                  Rankings {topThree.length + 1} - {leaderboard.length}
                </h2>
              </div>

              <div className="divide-y divide-white/10">
                {remainingPlayers.map((player, index) => (
                  <motion.div
                    key={player.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-4 p-6 hover:bg-white/5 transition-all duration-200 hover:scale-[1.01]"
                  >
                    {/* Rank */}
                    <div className="w-14 flex justify-center">
                      <Badge className={`${getRankBadgeColor(player.rank)} text-white border-none w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg`}>
                        #{player.rank}
                      </Badge>
                    </div>

                    {/* Address */}
                    <div className="flex-1">
                      <div className="font-bold text-white text-base">
                        {player.address}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Prizes</div>
                        <div className="font-bold text-white text-lg">{player.totalPrizes}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Tournaments</div>
                        <div className="font-bold text-white text-lg">{player.tournaments}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Wins</div>
                        <div className="font-bold text-white text-lg">{player.wins}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Card className="bg-white/5 border-white/10 p-12 max-w-md mx-auto">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">
                No Rankings Yet
              </h3>
              <p className="text-gray-400 mb-6">
                {selectedGameType !== 'all' || selectedTimeRange !== 'all'
                  ? 'No rankings for this filter. Try a different category.'
                  : 'Be the first to compete and claim the top spot!'
                }
              </p>
            </Card>
          </motion.div>
        )}

        {/* Call to Action */}
        {leaderboard.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8"
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={() => window.location.href = "/tournaments"}
            >
              Join a Tournament
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
