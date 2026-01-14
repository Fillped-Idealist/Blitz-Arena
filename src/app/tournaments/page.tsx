"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Users,
  Clock,
  Zap,
  Filter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { getAllTournaments, joinTournament, Tournament } from "@/lib/tournamentStore";

export default function TournamentsPage() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [joining, setJoining] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // Load tournaments from storage
  useEffect(() => {
    setIsMounted(true);
    setTournaments(getAllTournaments());
  }, []);

  // Filter tournaments
  const filteredGames = tournaments.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.gameTypeLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "open" && game.status === "Open") ||
      (selectedTab === "full" && game.status === "Full");
    return matchesSearch && matchesTab;
  });

  const handleJoin = async (gameId: string, entryFee: string) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setJoining(gameId);
    try {
      // Simulate blockchain transaction with clear feedback
      toast.info("Processing your registration...", {
        duration: 1000,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Join tournament with real storage
      const success = joinTournament(gameId, address);
      if (success) {
        toast.success("Successfully joined the tournament!", {
          description: `Entry fee of ${entryFee} tokens has been paid`,
          duration: 3000,
        });

        // Reload tournaments
        setTournaments(getAllTournaments());
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
      toast.error("Failed to join tournament", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setJoining(null);
    }
  };

  // Format time - only calculate on client side
  const formatTime = (startTimeOffset: number) => {
    if (!isMounted) return "";
    // startTimeOffset is in minutes, convert to milliseconds
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
    // startTimeOffset is in minutes, convert to milliseconds
    const startTime = Date.now() + startTimeOffset * 60 * 1000;
    const diff = startTime - Date.now();

    if (diff <= 0) return "Started";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
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
                <TabsTrigger value="all" className="text-gray-300">
                  All
                </TabsTrigger>
                <TabsTrigger value="open" className="text-gray-300">
                  Open
                </TabsTrigger>
                <TabsTrigger value="full" className="text-gray-300">
                  Full
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Tournament Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, index) => {
            // Determine card style based on status
            const isEnded = game.status === 'Ended' || game.status === 'Canceled';
            const isOngoing = game.status === 'Ongoing';
            const isFull = game.status === 'Full';

            return (
              <motion.div
                key={game.id}
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
                  {isFull && game.status !== 'Ended' && game.status !== 'Ongoing' && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-orange-600 py-2 px-4 flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Full</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`p-6 pb-4 ${isEnded || isOngoing || isFull ? 'pt-10' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className={`${
                          isEnded
                            ? 'bg-gray-600 text-white border-none'
                            : isOngoing
                            ? 'bg-green-600 text-white border-none'
                            : isFull
                            ? 'bg-red-600 text-white border-none'
                            : game.statusColor
                        } text-white border-none`}
                      >
                        {game.status}
                      </Badge>
                      <div className={`flex items-center text-sm ${
                        isEnded ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <Clock className="w-4 h-4 mr-1" />
                        {isEnded ? 'Completed' : getTimeRemaining(game.startTimeOffset)}
                      </div>
                    </div>

                    {/* Title and Description - Clickable */}
                    <Link href={`/tournament/${game.id}`}>
                      <h3 className={`text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors cursor-pointer ${
                        isEnded ? 'text-gray-400' : 'text-white'
                      }`}>
                        {game.title}
                      </h3>
                    </Link>
                    <p className={`text-sm mb-4 ${
                      isEnded ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {game.description}
                    </p>

                    {/* Game Type */}
                    <Badge
                      variant="outline"
                      className={`${
                        isEnded
                          ? 'border-gray-600/30 text-gray-400'
                          : 'border-white/20 text-gray-300'
                      } mb-4`}
                    >
                      {game.gameTypeLabel}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="px-6 pb-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className={`w-4 h-4 ${
                            isEnded ? 'text-gray-500' : 'text-yellow-400'
                          }`} />
                          <span className="text-xs text-gray-400">Prize Pool</span>
                        </div>
                        <div className={`text-lg font-bold ${
                          isEnded ? 'text-gray-400' : 'text-white'
                        }`}>
                          {game.prize} tokens
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className={`w-4 h-4 ${
                            isEnded ? 'text-gray-500' : 'text-blue-400'
                          }`} />
                          <span className="text-xs text-gray-400">Players</span>
                        </div>
                        <div className={`text-lg font-bold ${
                          isEnded ? 'text-gray-400' : 'text-white'
                        }`}>
                          {game.currentPlayers}/{game.maxPlayers}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 pt-0 border-t border-white/10 mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${
                          isEnded ? 'text-gray-500' : 'text-purple-400'
                        }`} />
                        <span className={`text-sm ${
                          isEnded ? 'text-gray-500' : 'text-gray-400'
                        }`}>Entry Fee:</span>
                        <span className={`font-semibold ${
                          isEnded ? 'text-gray-400' : 'text-white'
                        }`}>
                          {game.entryFee} tokens
                        </span>
                      </div>
                      <div className={`text-sm ${
                        isEnded ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {formatTime(game.startTimeOffset)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className={`flex-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isEnded || isOngoing || isFull
                            ? 'bg-gray-700 hover:bg-gray-800 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                        }`}
                        onClick={() => handleJoin(game.id, game.entryFee)}
                        disabled={
                          joining === game.id ||
                          game.status === "Full" ||
                          game.status === "Ongoing" ||
                          game.participants.includes(address || "")
                        }
                      >
                        {joining === game.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : game.status === "Full" ? (
                          "Full"
                        ) : game.status === "Ongoing" ? (
                          "In Progress"
                        ) : game.participants.includes(address || "") ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Joined</span>
                          </div>
                        ) : (
                          "Join"
                        )}
                      </Button>
                      <Link href={`/tournament/${game.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          className={`w-full ${
                            isEnded
                              ? 'border-gray-600/30 text-gray-400 hover:bg-gray-600/10'
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

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white/5 rounded-2xl p-12 max-w-md mx-auto">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">
                No tournaments found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search or filters to find tournaments
              </p>
              <Link href="/create">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Create a Tournament
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
