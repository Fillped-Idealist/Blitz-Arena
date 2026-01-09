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
};

export default function LeaderboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setLeaderboard(getLeaderboardData());
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="text-center">Loading...</div>
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
    if (rank === 1) return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
    if (rank === 2) return "from-gray-400/20 to-gray-300/20 border-gray-400/30";
    if (rank === 3) return "from-amber-700/20 to-orange-600/20 border-amber-700/30";
    return "from-white/5 to-white/[0.02] border-white/10";
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-gray-400";
    if (rank === 3) return "bg-amber-700";
    return "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 border-none text-white">
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

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {topThree.map((player, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={player.address}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${rank === 1 ? 'md:-mt-8' : ''}`}
              >
                <Card
                  className={`bg-gradient-to-br ${getRankColor(rank)} backdrop-blur-sm border overflow-hidden h-full`}
                >
                  <div className="p-6">
                    {/* Rank */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(rank)}
                        <span className={`text-3xl font-bold ${
                          rank === 1 ? 'text-yellow-400' :
                          rank === 2 ? 'text-gray-300' :
                          'text-amber-600'
                        }`}>
                          #{rank}
                        </span>
                      </div>
                    </div>

                    {/* Avatar Placeholder */}
                    <div className="flex justify-center mb-4">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                        rank === 1 ? 'from-yellow-500 to-amber-500' :
                        rank === 2 ? 'from-gray-400 to-gray-300' :
                        'from-amber-700 to-orange-600'
                      } flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-white">
                          {player.address.slice(2, 4)}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="text-center mb-4">
                      <div className="text-lg font-bold text-white mb-1">
                        {player.address}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total Prizes</span>
                        <span className="font-bold text-white">{player.totalPrizes}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Tournaments</span>
                        <span className="font-bold text-white">{player.tournaments}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Wins</span>
                        <span className="font-bold text-white">{player.wins}</span>
                      </div>
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
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
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
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-12 flex justify-center">
                      <Badge className={`${getRankBadgeColor(player.rank)} text-white border-none w-8 h-8 flex items-center justify-center`}>
                        #{player.rank}
                      </Badge>
                    </div>

                    {/* Address */}
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {player.address}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Prizes</div>
                        <div className="font-bold text-white">{player.totalPrizes}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Tournaments</div>
                        <div className="font-bold text-white">{player.tournaments}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Wins</div>
                        <div className="font-bold text-white">{player.wins}</div>
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
                Be the first to compete and claim the top spot!
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
