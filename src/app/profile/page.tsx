"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Gamepad2,
  ArrowRight,
  Medal,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { getUserTournaments, getUserStats, Tournament } from "@/lib/tournamentStore";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [userTournaments, setUserTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    totalPrizes: 0,
    wins: 0,
    averageScore: 0,
  });

  useEffect(() => {
    setIsMounted(true);
    if (address) {
      setUserTournaments(getUserTournaments(address));
      setStats(getUserStats(address));
    }
  }, [address]);

  const gameTypeIcons: Record<string, string> = {
    "1": "🔢",
    "2": "✊✋✌️",
    "3": "🎯"
  };

  const gameTypeLabels: Record<string, string> = {
    "1": "Number Guess",
    "2": "Rock Paper Scissors",
    "3": "Quick Click"
  };

  const formatTime = (startTimeOffset: number) => {
    if (!isMounted) return "";
    const startTime = Date.now() + startTimeOffset * 60 * 1000;
    const date = new Date(startTime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (startTimeOffset: number) => {
    if (!isMounted) return "";
    const startTime = Date.now() + startTimeOffset * 60 * 1000;
    const diff = startTime - Date.now();

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="bg-white/5 border-white/10 p-12">
              <Gamepad2 className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-8">
                Please connect your wallet to view your profile and tournament history
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              My Profile
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Track your gaming journey and achievements
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Tournaments</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.totalTournaments}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Total Prizes</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.totalPrizes}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Medal className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-sm text-gray-400">Wins</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.wins}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.totalTournaments > 0
                ? `${Math.round((stats.wins / stats.totalTournaments) * 100)}%`
                : "0%"}
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="tournaments" className="w-full">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="tournaments" className="text-gray-300">
                My Tournaments
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-gray-300">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tournaments" className="mt-6">
              {userTournaments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Card className="bg-white/5 border-white/10 p-12 max-w-md mx-auto">
                    <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      No Tournaments Yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Start your gaming journey by joining a tournament!
                    </p>
                    <Link href="/tournaments">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Browse Tournaments
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTournaments.map((tournament, index) => (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group h-full flex flex-col">
                        <div className="p-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <Badge
                              className={`${tournament.statusColor} text-white border-none`}
                            >
                              {tournament.status}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-400">
                              <Clock className="w-4 h-4 mr-1" />
                              {getTimeRemaining(tournament.startTimeOffset)}
                            </div>
                          </div>

                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {tournament.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            {tournament.description}
                          </p>

                          <Badge
                            variant="outline"
                            className="border-white/20 text-gray-300 mb-4"
                          >
                            {gameTypeIcons[tournament.gameType]} {gameTypeLabels[tournament.gameType]}
                          </Badge>
                        </div>

                        <div className="px-6 pb-4 flex-1">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs text-gray-400">Prize Pool</span>
                              </div>
                              <div className="text-lg font-bold text-white">
                                {tournament.prize}
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-gray-400">Players</span>
                              </div>
                              <div className="text-lg font-bold text-white">
                                {tournament.currentPlayers}/{tournament.maxPlayers}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-0 border-t border-white/10 mt-auto">
                          <Link href={`/tournament/${tournament.id}`}>
                            <Button
                              variant="outline"
                              className="w-full border-white/20 text-white hover:bg-white/10"
                            >
                              View Tournament
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="bg-white/5 border-white/10 p-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  Recent Activity
                </h3>
                {userTournaments.length === 0 ? (
                  <p className="text-gray-400">
                    No recent activity. Join a tournament to start tracking your progress!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userTournaments.slice(0, 10).map((tournament) => (
                      <div
                        key={tournament.id}
                        className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Gamepad2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white mb-1">
                            {tournament.title}
                          </div>
                          <div className="text-sm text-gray-400">
                            Joined tournament • {new Date(tournament.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={`${tournament.statusColor} text-white border-none`}>
                          {tournament.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
