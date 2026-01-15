"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from 'viem';
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Users,
  Clock,
  Zap,
  Search,
  Plus,
  Loader2,
  CheckCircle2,
  Flame,
  Skull,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { useGameFactory, useGamesBatch, useJoinGame } from "@/hooks/useGameContract";

export default function TournamentsPage() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [joining, setJoining] = useState<string | null>(null);

  const { allGames, refetchGames } = useGameFactory();
  const { gamesData, loading, refetch: refetchGamesBatch } = useGamesBatch(allGames);
  const { joinGame, isSuccess: joinSuccess } = useJoinGame();

  // Filter games
  const filteredGames = gamesData.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "open" && game.status === BigInt(0)) || // Created
      (selectedTab === "ongoing" && game.status === BigInt(1)) || // Ongoing
      (selectedTab === "ended" && (game.status === BigInt(2) || game.status === BigInt(4))); // Ended or Canceled
    return matchesSearch && matchesTab;
  });

  const handleJoin = async (gameAddress: `0x${string}`, entryFee: string) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setJoining(gameAddress);
    try {
      await joinGame(gameAddress, entryFee);
      // Success toast is handled by useJoinGame hook
      // The useGamesBatch hook will automatically refetch when allGames changes
    } catch (error) {
      console.log('Failed to join tournament:', error);
      // Error toast is already handled by useJoinGame hook
    } finally {
      setJoining(null);
    }
  };

  // 监听加入比赛成功，刷新比赛列表
  useEffect(() => {
    if (joinSuccess) {
      // 同时刷新游戏列表和批量数据
      refetchGames();
      setTimeout(() => {
        refetchGamesBatch();
      }, 1000); // 延迟1秒刷新批量数据，确保合约状态已更新
    }
  }, [joinSuccess, refetchGames, refetchGamesBatch]);

  // Format time
  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (timestamp: bigint) => {
    const diff = Number(timestamp) * 1000 - Date.now();

    if (diff <= 0) return "Started";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const getGameTypeLabel = (gameType: bigint): string => {
    switch (gameType) {
      case BigInt(1):
        return "Number Guess";
      case BigInt(2):
        return "Rock Paper Scissors";
      case BigInt(3):
        return "Quick Click";
      case BigInt(4):
        return "Infinite Match";
      default:
        return "Unknown";
    }
  };

  const getStatusLabel = (status: bigint): string => {
    switch (status) {
      case BigInt(0):
        return "Open";
      case BigInt(1):
        return "Ongoing";
      case BigInt(2):
        return "Ended";
      case BigInt(3):
        return "Prize Distributed";
      case BigInt(4):
        return "Canceled";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Tournaments
                </span>
              </h1>
              <p className="text-xl text-gray-400">
                Browse and join exciting gaming competitions
              </p>
            </div>
            <Link href="/create">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-white/5 border-white/10">
                <TabsTrigger value="all" className="text-gray-300">All</TabsTrigger>
                <TabsTrigger value="open" className="text-gray-300">Open</TabsTrigger>
                <TabsTrigger value="ongoing" className="text-gray-300">Ongoing</TabsTrigger>
                <TabsTrigger value="ended" className="text-gray-300">Ended</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : /* Empty State */
        filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400 mb-4">No tournaments found</p>
            <Link href="/create">
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Create First Tournament
              </Button>
            </Link>
          </div>
        ) : /* Tournament Grid */
        null}

        {/* Tournament Grid */}
        {!loading && filteredGames.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game, index) => {
              const isEnded = game.status === BigInt(2) || game.status === BigInt(4);
              const isOngoing = game.status === BigInt(1);
              const isFull = game.players >= Number(game.maxPlayers);
              const isJoined = game.isJoined === true;

              return (
                <motion.div
                  key={game.address}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card
                    className={`backdrop-blur-sm overflow-hidden hover:border-white/20 transition-all duration-300 group h-full flex flex-col relative ${
                      isEnded
                        ? 'bg-gradient-to-br from-gray-500/5 to-gray-600/[0.02] border-gray-500/20 opacity-75'
                        : isOngoing
                        ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 shadow-lg shadow-green-500/10'
                        : isJoined
                        ? 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : isFull
                        ? 'bg-gradient-to-br from-red-500/10 to-orange-600/10 border-red-500/30'
                        : 'bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10'
                    }`}
                  >
                    {/* Status Banner */}
                    {isEnded && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gray-600 to-gray-700 py-2 px-4 flex items-center justify-center gap-2">
                        <Skull className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Ended</span>
                      </div>
                    )}
                    {isOngoing && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 py-2 px-4 flex items-center justify-center gap-2">
                        <Flame className="w-4 h-4 text-white animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">In Progress</span>
                      </div>
                    )}
                    {isJoined && !isEnded && !isOngoing && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-4 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Joined</span>
                      </div>
                    )}
                    {isFull && !isEnded && !isOngoing && !isJoined && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-orange-600 py-2 px-4 flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Full</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className={`p-6 pb-4 ${isEnded || isOngoing || isJoined || isFull ? 'pt-10' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <Badge
                          className={`${
                            isEnded
                              ? 'bg-gray-600 text-white border-none'
                              : isOngoing
                              ? 'bg-green-600 text-white border-none'
                              : isJoined
                              ? 'bg-blue-600 text-white border-none'
                              : isFull
                              ? 'bg-red-600 text-white border-none'
                              : 'bg-blue-600 text-white border-none'
                          }`}
                        >
                          {getStatusLabel(game.status)}
                        </Badge>
                        <div className={`flex items-center text-sm ${
                          isEnded ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          <Clock className="w-4 h-4 mr-1" />
                          {isEnded ? 'Completed' : getTimeRemaining(game.gameStartTime)}
                        </div>
                      </div>

                      <Link href={`/tournament/${game.address}`}>
                        <h3 className={`text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors cursor-pointer ${
                          isEnded ? 'text-gray-400' : isJoined ? 'text-blue-300' : 'text-white'
                        }`}>
                          {game.title}
                        </h3>
                      </Link>

                      <Badge
                        variant="outline"
                        className={`${
                          isEnded
                            ? 'border-gray-600/30 text-gray-400'
                            : isJoined
                            ? 'border-blue-600/30 text-blue-300'
                            : 'border-white/20 text-gray-300'
                        } mb-4`}
                      >
                        {getGameTypeLabel(game.gameType)}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="px-6 pb-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className={`w-4 h-4 ${
                              isEnded ? 'text-gray-500' : isJoined ? 'text-blue-400' : 'text-yellow-400'
                            }`} />
                            <span className="text-xs text-gray-400">Prize Pool</span>
                          </div>
                          <div className={`text-lg font-bold ${
                            isEnded ? 'text-gray-400' : isJoined ? 'text-blue-200' : 'text-white'
                          }`}>
                            {formatUnits(game.prizePool, 18)} tokens
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className={`w-4 h-4 ${
                              isEnded ? 'text-gray-500' : isJoined ? 'text-blue-400' : 'text-blue-400'
                            }`} />
                            <span className="text-xs text-gray-400">Players</span>
                          </div>
                          <div className={`text-lg font-bold ${
                            isEnded ? 'text-gray-400' : isJoined ? 'text-blue-200' : 'text-white'
                          }`}>
                            {game.players}/{game.maxPlayers}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0 border-t border-white/10 mt-auto space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${
                            isEnded ? 'text-gray-500' : isJoined ? 'text-blue-400' : 'text-purple-400'
                          }`} />
                          <span className={`text-sm ${
                            isEnded ? 'text-gray-500' : isJoined ? 'text-blue-300' : 'text-gray-400'
                          }`}>Entry Fee:</span>
                          <span className={`font-semibold ${
                            isEnded ? 'text-gray-400' : isJoined ? 'text-blue-200' : 'text-white'
                          }`}>
                            {formatUnits(game.entryFee, 18)} tokens
                          </span>
                        </div>
                        <div className={`text-sm ${
                          isEnded ? 'text-gray-500' : isJoined ? 'text-blue-300' : 'text-gray-400'
                        }`}>
                          {formatTime(game.registrationEndTime)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className={`flex-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isEnded || isOngoing || isFull || isJoined
                              ? 'bg-gray-700 hover:bg-gray-800 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          }`}
                          onClick={() => handleJoin(game.address, formatUnits(game.entryFee, 18))}
                          disabled={
                            joining === game.address ||
                            isFull ||
                            isOngoing ||
                            isJoined
                          }
                        >
                          {joining === game.address ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : isJoined ? (
                            "Joined"
                          ) : isFull ? (
                            "Full"
                          ) : isOngoing ? (
                            "In Progress"
                          ) : (
                            "Join"
                          )}
                        </Button>
                        <Link href={`/tournament/${game.address}`} className="flex-1">
                          <Button
                            variant="outline"
                            className={`w-full ${
                              isEnded
                                ? 'border-gray-600/30 text-gray-400 hover:bg-gray-600/10'
                                : isJoined
                                ? 'border-blue-600/30 text-blue-300 hover:bg-blue-600/10'
                                : 'border-white/20 text-white hover:bg-white/10'
                            }`}
                          >
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
