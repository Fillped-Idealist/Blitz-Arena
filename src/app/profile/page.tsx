"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Users,
  DollarSign,
  Star,
  Heart,
  UserPlus,
  Gamepad2,
  ArrowRight,
  Award,
  Zap,
  Clock,
} from "lucide-react";
import { GameStatus } from "@/hooks/useGameContract";
import { useUserLevel, formatUserLevelData } from "@/hooks/useUserLevel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { useUserGames, GameType } from "@/hooks/useGameContract";
import {
  getAllAchievements,
  getUserAchievements,
  getUserFriends,
  getProfileLikes,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/lib/socialStore";
import { formatUnits } from "viem";
import { ERC20_ABI } from "@/lib/contracts";
import { getContractAddresses } from "@/lib/chainConfig";

export default function ProfilePage() {
  const { address, isConnected, chainId } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  // 检查网络是否支持
  const isSupportedChain = chainId === 31337 || chainId === 5003;

  // 使用合约获取用户比赛数据（只在支持的网络）
  const { userGames, loading: gamesLoading } = useUserGames();

  // 从链上获取用户等级数据（只在支持的网络）
  const { userData, isLoading: levelLoading } = useUserLevel();

  // 从链上获取 BLZ 代币余额（只在支持的网络）
  const addresses = isSupportedChain && chainId ? getContractAddresses(chainId) : null;
  const { data: tokenBalanceRaw } = useReadContract({
    address: addresses?.BLZ_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!addresses,
    },
  });

  // 社交数据（保持使用 localStorage，因为社交数据应该存储在链下）
  const [achievements, setAchievements] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [likes, setLikes] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [newFriendAddress, setNewFriendAddress] = useState("");

  useEffect(() => {
    setIsMounted(true);
    if (address) {
      setAchievements(getUserAchievements(address));
      setFriends(getUserFriends(address));
      setLikes(getProfileLikes(address));
      setPendingRequests(getPendingFriendRequests(address));
    }
  }, [address]);

  // 格式化用户等级数据
  const levelData = formatUserLevelData(userData);
  const tokenBalance = tokenBalanceRaw ? Number(formatUnits(tokenBalanceRaw as bigint, 18)) : 0;

  // 从比赛数据计算统计数据
  const stats = {
    totalTournaments: userGames.length,
    totalPrizes: userGames.reduce((sum, game) => {
      // 计算奖金（这里需要从合约获取实际奖金，简化处理）
      return sum + Number(formatUnits(game.prizePool, 18));
    }, 0),
    wins: userGames.filter(game => {
      // 判断是否获胜（需要根据比赛结果判断）
      // 简化处理：假设结束的比赛中有分数的就是参与者
      return game.status === BigInt(2) || game.status === BigInt(3);
    }).length,
    averageScore: 0, // 需要从合约获取实际分数
  };

  // 处理添加好友
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendAddress.trim()) return;

    if (newFriendAddress === address) {
      alert("You cannot add yourself as a friend");
      return;
    }

    sendFriendRequest(address!, newFriendAddress);
    setNewFriendAddress("");
  };

  // 处理接受好友请求
  const handleAcceptRequest = (relationId: string) => {
    acceptFriendRequest(relationId);
    setPendingRequests(getPendingFriendRequests(address!));
    setFriends(getUserFriends(address!));
  };

  // 处理拒绝好友请求
  const handleRejectRequest = (relationId: string) => {
    rejectFriendRequest(relationId);
    setPendingRequests(getPendingFriendRequests(address!));
  };

  const gameTypeIcons: Record<number, string> = {
    [GameType.NumberGuess]: "🔢",
    [GameType.RockPaperScissors]: "✊✋✌️",
    [GameType.QuickClick]: "🎯",
    4: "🌀",
    5: "🧩",
  };

  const gameTypeLabels: Record<number, string> = {
    [GameType.NumberGuess]: "Number Guess",
    [GameType.RockPaperScissors]: "Rock Paper Scissors",
    [GameType.QuickClick]: "Quick Click",
    4: "Cycle Rift",
    5: "Infinite Match",
  };

  const statusLabels: Record<number, string> = {
    [GameStatus.Created]: "Open",
    [GameStatus.Ongoing]: "Ongoing",
    [GameStatus.Ended]: "Ended",
    [GameStatus.Canceled]: "Canceled",
    [GameStatus.PrizeDistributed]: "Completed",
  };

  const statusColors: Record<number, string> = {
    [GameStatus.Created]: "bg-blue-500/20 text-blue-400",
    [GameStatus.Ongoing]: "bg-green-500/20 text-green-400",
    [GameStatus.Ended]: "bg-gray-500/20 text-gray-400",
    [GameStatus.Canceled]: "bg-red-500/20 text-red-400",
    [GameStatus.PrizeDistributed]: "bg-purple-500/20 text-purple-400",
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
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
              {stats.totalPrizes.toFixed(2)}
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

        {/* Experience Bar with Level and Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Level */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{levelData.level}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-400 mb-1">Level</div>
                  <div className="text-lg font-bold text-white">
                    {levelData.experience} / {levelData.expForNextLevel} EXP
                  </div>
                </div>
              </div>

              {/* Experience Progress Bar */}
              <div className="md:col-span-2 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    Experience Progress
                  </span>
                  <span className="text-sm text-gray-400">
                    {levelData.level} / 100
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelData.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {levelData.expForNextLevel - levelData.experience} EXP to next level
                </div>
              </div>

              {/* Token Balance */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-400 mb-1">BLZ Balance</div>
                  <div className="text-lg font-bold text-white">
                    {tokenBalance.toFixed(2)} BLZ
                  </div>
                </div>
              </div>
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
            <TabsList className="bg-white/5 border-white/10 flex-wrap">
              <TabsTrigger value="tournaments" className="text-gray-300">
                My Tournaments
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-gray-300">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="friends" className="text-gray-300">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="social" className="text-gray-300">
                Social
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tournaments" className="mt-6">
              {gamesLoading ? (
                <div className="text-center py-20">
                  <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                  <div className="text-xl text-gray-400">Loading tournaments...</div>
                </div>
              ) : userGames.length === 0 ? (
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
                  {userGames.map((game, index) => (
                    <motion.div
                      key={game.address}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group h-full flex flex-col">
                        <div className="p-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={statusColors[Number(game.status)]}>
                              {statusLabels[Number(game.status)]}
                            </Badge>
                          </div>

                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                            {game.title}
                          </h3>

                          <Badge
                            variant="outline"
                            className="border-white/20 text-gray-300 mb-4"
                          >
                            {gameTypeIcons[Number(game.gameType)]} {gameTypeLabels[Number(game.gameType)]}
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
                                {formatUnits(game.prizePool, 18)}
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-gray-400">Entry Fee</span>
                              </div>
                              <div className="text-lg font-bold text-white">
                                {formatUnits(game.entryFee, 18)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-0 border-t border-white/10 mt-auto">
                          <Link href={`/tournament/${game.address}`}>
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

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <Card className="bg-white/5 border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Achievements</h3>
                  <Badge className="bg-violet-500/20 text-violet-400">
                    {achievements.length} / {getAllAchievements().length}
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getAllAchievements().map((achievement) => {
                    const unlocked = achievements.some((a) => a.achievementId === achievement.id);
                    return (
                      <Card
                        key={achievement.id}
                        className={`p-6 ${
                          unlocked
                            ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20"
                            : "bg-white/5 border-white/10 opacity-50"
                        }`}
                      >
                        <h4 className="text-lg font-bold text-white mb-2">{achievement.name}</h4>
                        <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                        <div className="flex items-center gap-2">
                          {unlocked ? (
                            <Badge className="bg-green-500/20 text-green-400">Unlocked</Badge>
                          ) : (
                            <Badge variant="outline" className="border-white/20 text-gray-400">
                              Locked
                            </Badge>
                          )}
                          <Badge className="bg-violet-500/20 text-violet-400">
                            +{achievement.reward} BLZ
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Add Friend Card */}
                <Card className="bg-white/5 border-white/10 p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Add Friend</h3>
                  <form onSubmit={handleAddFriend} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Wallet Address
                      </label>
                      <Input
                        type="text"
                        placeholder="0x..."
                        value={newFriendAddress}
                        onChange={(e) => setNewFriendAddress(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Send Request
                    </Button>
                  </form>

                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-bold text-white mb-4">Pending Requests</h4>
                      <div className="space-y-3">
                        {pendingRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {request.requester.slice(0, 6)}...{request.requester.slice(-4)}
                                </div>
                                <div className="text-xs text-gray-400">Wants to be your friend</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                                className="border-white/20 text-gray-400"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Friends List Card */}
                <Card className="bg-white/5 border-white/10 p-8">
                  <h3 className="text-xl font-bold text-white mb-6">
                    My Friends ({friends.length})
                  </h3>
                  {friends.length === 0 ? (
                    <p className="text-gray-400">No friends yet. Add someone to get started!</p>
                  ) : (
                    <div className="space-y-3">
                      {friends.map((friend) => {
                        const friendAddress = friend.requester === address ? friend.accepter : friend.requester;
                        return (
                          <div
                            key={friend.id}
                            className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">
                                {friendAddress.slice(0, 6)}...{friendAddress.slice(-4)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Friend since {new Date(friend.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const profileUrl = `/profile?address=${friendAddress}`;
                                window.open(profileUrl, "_blank");
                              }}
                              className="border-white/20 text-gray-400"
                            >
                              View Profile
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="mt-6">
              <Card className="bg-white/5 border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Social Stats</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/5 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-500/20 rounded-full">
                      <Heart className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{likes}</div>
                    <div className="text-sm text-gray-400">Profile Likes</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-500/20 rounded-full">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{friends.length}</div>
                    <div className="text-sm text-gray-400">Friends</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-violet-500/20 rounded-full">
                      <Award className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{achievements.length}</div>
                    <div className="text-sm text-gray-400">Achievements</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Token Balance</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-violet-400">
                          {tokenBalance.toFixed(2)} BLZ
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          BLZ tokens from blockchain
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Level Progress</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">{levelData.level}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Experience</span>
                          <span className="text-sm font-medium text-white">
                            {levelData.experience} / {levelData.expForNextLevel}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${levelData.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {levelData.expForNextLevel - levelData.experience} EXP to next level
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
