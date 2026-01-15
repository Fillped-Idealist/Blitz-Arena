'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import {
  useGameDetailsWithRefetch,
  useJoinGame,
  useSubmitScore,
  useStartGame,
  useCancelGame,
  useDistributePrize,
  useClaimPrize,
  GameType,
  GameStatus,
} from '@/hooks/useGameContract';
import NumberGuessGame, { GameResult as NumberGuessResult } from '@/components/games/NumberGuessGame';
import RockPaperScissorsGame, { GameResult as RPSResult } from '@/components/games/RockPaperScissorsGame';
import QuickClickGame, { GameResult as QCResult } from '@/components/games/QuickClickGame';
import RoguelikeSurvivalGame, { GameResult as RLSResult } from '@/components/games/RoguelikeSurvivalGame';
import InfiniteMatchGame, { GameResult as IMResult } from '@/components/games/InfiniteMatchGame';
import { Loader2, Gamepad2, Flame, Skull, AlertCircle, CheckCircle, Trophy } from 'lucide-react';
import { formatUnits } from 'viem';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const gameAddress = params.id as `0x${string}`;

  const [activeGame, setActiveGame] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [lastJoinHash, setLastJoinHash] = useState<`0x${string}` | null>(null);

  // 使用合约数据
  const { gameDetails, loading, refetch: refetchGameDetails } = useGameDetailsWithRefetch(gameAddress);
  const { joinGame, hash: joinHash, isSuccess: joinSuccess, isPending: joinPending } = useJoinGame();
  const { submitScore, isSuccess: submitSuccess } = useSubmitScore();
  const { startGame, isSuccess: startSuccess } = useStartGame();
  const { cancelGame, isSuccess: cancelSuccess } = useCancelGame();
  const { distributePrize, isSuccess: distributeSuccess } = useDistributePrize();
  const { claimPrize, isSuccess: claimSuccess } = useClaimPrize();

  // 监听加入成功 - 只在 hash 匹配时显示成功消息并刷新数据
  useEffect(() => {
    if (joinSuccess && joinHash && joinHash !== lastJoinHash) {
      toast.success('Successfully joined the tournament!');
      setLastJoinHash(joinHash);
      // 延迟刷新游戏详情数据，确保合约状态已更新
      setTimeout(() => {
        refetchGameDetails();
      }, 1000);
    }
  }, [joinSuccess, joinHash, lastJoinHash, refetchGameDetails]);

  // 监听提交成功
  useEffect(() => {
    if (submitSuccess) {
      toast.success('Score submitted successfully!');
      setActiveGame(null);
      window.location.reload(); // 重新加载页面以刷新数据
    }
  }, [submitSuccess]);

  // 监听开始游戏成功
  useEffect(() => {
    if (startSuccess) {
      toast.success('Game started successfully!');
      refetchGameDetails();
    }
  }, [startSuccess, refetchGameDetails]);

  // 监听取消比赛成功
  useEffect(() => {
    if (cancelSuccess) {
      toast.success('Game canceled successfully!');
      refetchGameDetails();
    }
  }, [cancelSuccess, refetchGameDetails]);

  // 监听分发奖励成功
  useEffect(() => {
    if (distributeSuccess) {
      toast.success('Prizes distributed successfully!');
      refetchGameDetails();
    }
  }, [distributeSuccess, refetchGameDetails]);

  // 监听领取奖励成功
  useEffect(() => {
    if (claimSuccess) {
      toast.success('Prize claimed successfully!');
      refetchGameDetails();
    }
  }, [claimSuccess, refetchGameDetails]);

  // 游戏类型映射
  const gameTypeLabels: Record<number, string> = {
    [GameType.NumberGuess]: 'Number Guess',
    [GameType.RockPaperScissors]: 'Rock Paper Scissors',
    [GameType.QuickClick]: 'Quick Click',
    [GameType.RoguelikeSurvival]: 'Cycle Rift',
    [GameType.InfiniteMatch]: 'Infinite Match',
  };

  const gameTypeIcons: Record<number, string> = {
    [GameType.NumberGuess]: '🔢',
    [GameType.RockPaperScissors]: '✊✋✌️',
    [GameType.QuickClick]: '🎯',
    [GameType.RoguelikeSurvival]: '🌀', // Cycle Rift
    [GameType.InfiniteMatch]: '🧩', // Infinite Match
  };

  // 结果排序函数：分数高的排前面，分数相同则提交时间早的排前面
  // 只显示已提交分数的玩家（score > 0 且 submittedAt > 0）
  const sortResults = (results: Array<{ player: `0x${string}`, score: bigint, submittedAt: bigint }>) => {
    // 过滤掉未提交分数的玩家
    const validResults = results.filter(r => r.score > BigInt(0) && r.submittedAt > BigInt(0));

    // 排序：分数高的排前面，分数相同则提交时间早的排前面
    return validResults.sort((a, b) => {
      if (b.score !== a.score) {
        return Number(b.score) - Number(a.score);
      }
      return Number(a.submittedAt) - Number(b.submittedAt);
    });
  };

  // 处理游戏结果提交
  const handleGameComplete = async (result: NumberGuessResult | RPSResult | QCResult | RLSResult | IMResult) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await submitScore(gameAddress, result.score);
    } catch (error) {
      console.error('Failed to submit game result:', error);
      toast.error('Failed to submit game result', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  // 加入比赛
  const handleJoinTournament = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!gameDetails) return;

    setJoining(true);
    try {
      // 检查是否需要授权
      // 这里应该先检查授权额度，如果不足则先授权
      // 简化版：假设已经授权或合约会自动授权

      await joinGame(gameAddress, formatUnits(gameDetails.entryFee, 18));
    } catch (error) {
      console.error('Failed to join tournament:', error);
      toast.error('Failed to join tournament', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setJoining(false);
    }
  };

  // 开始游戏
  const handleStartGame = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!gameDetails || !gameDetails.isJoined) {
      toast.error('Please join the tournament first');
      return;
    }

    if (gameDetails.status !== BigInt(GameStatus.Ongoing)) {
      const statusMessages: Record<string, string> = {
        [String(BigInt(GameStatus.Created))]: 'The tournament has not started yet. Please wait.',
        [String(BigInt(GameStatus.Ended))]: 'This tournament has already ended.',
        [String(BigInt(GameStatus.Canceled))]: 'This tournament has been canceled.',
        [String(BigInt(GameStatus.PrizeDistributed))]: 'Prizes have been distributed.',
      };
      toast.error(statusMessages[String(gameDetails.status)] || 'Cannot start game at this time');
      return;
    }

    if (gameDetails.hasSubmitted) {
      toast.info('You have already submitted your result');
      return;
    }

    setActiveGame(Number(gameDetails.gameType));
  };

  // 取消游戏
  const handleCancelGame = () => {
    setActiveGame(null);
    toast.info('Game cancelled');
  };

  // 体验游戏
  const handleTryGame = () => {
    if (!gameDetails) return;

    // 跳转到体验游戏页面并自动选择对应游戏
    const gameTypeMap: Record<number, string> = {
      [GameType.NumberGuess]: 'number-guess',
      [GameType.RockPaperScissors]: 'rock-paper-scissors',
      [GameType.QuickClick]: 'quick-click',
      [GameType.RoguelikeSurvival]: 'roguelike-survival',
      [GameType.InfiniteMatch]: 'infinite-match',
    };
    const gameId = gameTypeMap[Number(gameDetails.gameType)] || 'number-guess';
    router.push(`/test?game=${gameId}`);
  };

  // 状态显示
  const statusLabels: Record<string, string> = {
    [String(BigInt(GameStatus.Created))]: 'Open for Registration',
    [String(BigInt(GameStatus.Ongoing))]: 'In Progress',
    [String(BigInt(GameStatus.Ended))]: 'Ended',
    [String(BigInt(GameStatus.Canceled))]: 'Canceled',
    [String(BigInt(GameStatus.PrizeDistributed))]: 'Prizes Distributed',
  };

  const statusColors: Record<string, string> = {
    [String(BigInt(GameStatus.Created))]: 'bg-blue-500/20 text-blue-400',
    [String(BigInt(GameStatus.Ongoing))]: 'bg-green-500/20 text-green-400',
    [String(BigInt(GameStatus.Ended))]: 'bg-gray-500/20 text-gray-400',
    [String(BigInt(GameStatus.Canceled))]: 'bg-red-500/20 text-red-400',
    [String(BigInt(GameStatus.PrizeDistributed))]: 'bg-purple-500/20 text-purple-400',
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <div className="text-2xl text-gray-400">Loading tournament data...</div>
          </div>
        </div>
      </div>
    );
  }

  // 未找到比赛
  if (!gameDetails) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <Card className="max-w-2xl mx-auto bg-white/5 border-white/10 p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Tournament Not Found</h2>
            <p className="text-gray-400 mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => router.push('/tournaments')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Browse Tournaments
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            // 默认显示比赛信息
            <motion.div
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              {gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled) ? (
                <div className="mb-6 bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Skull className="w-6 h-6 text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-bold text-lg">{gameDetails.status === BigInt(GameStatus.Canceled) ? 'Tournament Canceled' : 'Tournament Ended'}</h3>
                    <p className="text-gray-300 text-sm">
                      {gameDetails.status === BigInt(GameStatus.Canceled) ? 'This tournament has been canceled by organizer.' : 'The competition period has ended. Check the leaderboard for final results.'}
                    </p>
                  </div>
                </div>
              ) : gameDetails.status === BigInt(GameStatus.Ongoing) ? (
                <div className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Flame className="w-6 h-6 text-white flex-shrink-0 animate-pulse" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Tournament In Progress</h3>
                    <p className="text-green-100 text-sm">
                      The competition period is active. Submit your best score before time runs out!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Open for Registration</h3>
                    <p className="text-blue-100 text-sm">
                      Join now to secure your spot in this exciting tournament!
                    </p>
                  </div>
                </div>
              )}

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={statusColors[String(gameDetails.status)]}>
                        {statusLabels[String(gameDetails.status)]}
                      </Badge>
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                        {gameTypeLabels[Number(gameDetails.gameType)] || 'Unknown'}
                      </Badge>
                    </div>

                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
                      gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled) ? 'text-gray-400' : 'text-white'
                    }`}>
                      {gameDetails.title}
                    </h1>

                    <p className={`text-lg max-w-3xl ${
                      gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled) ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {gameDetails.description || 'Join this exciting blockchain gaming tournament!'}
                    </p>
                  </div>

                  {/* Join Button */}
                  {gameDetails.status === BigInt(GameStatus.Created) && !gameDetails.isJoined && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Button
                        size="lg"
                        disabled={joining}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
                        onClick={handleJoinTournament}
                      >
                        {joining ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          `Join Tournament (${formatUnits(gameDetails.entryFee, 18)} tokens)`
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {gameDetails.isJoined && gameDetails.status !== BigInt(GameStatus.Ended) && gameDetails.status !== BigInt(GameStatus.Canceled) && (
                    <Badge className="bg-green-500/20 text-green-400 text-lg py-2 px-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Joined
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* Tournament Info Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Tournament Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Game Type:</span>
                      <span className="text-white">
                        {gameTypeLabels[Number(gameDetails.gameType)] || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-white">
                        {gameDetails.players} / {gameDetails.maxPlayers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-white">
                        {formatUnits(gameDetails.entryFee, 18)} tokens
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prize Pool:</span>
                      <span className="text-white">
                        {formatUnits(gameDetails.prizePool, 18)} tokens
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Creator:</span>
                      <span className="text-white font-mono text-sm">
                        {gameDetails.creator?.slice(0, 6)}...{gameDetails.creator?.slice(-4)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className={`p-6 ${
                  gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled)
                    ? 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/20'
                    : gameDetails.status === BigInt(GameStatus.Ongoing)
                    ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20'
                    : 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-blue-500/20'
                }`}>
                  <h3 className="text-xl font-bold text-white mb-4">Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled) ? (
                        <Skull className="w-5 h-5 text-gray-400" />
                      ) : gameDetails.status === BigInt(GameStatus.Ongoing) ? (
                        <Flame className="w-5 h-5 text-green-400 animate-pulse" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      <span className={`font-medium ${
                        gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled)
                          ? 'text-gray-400'
                          : 'text-white'
                      }`}>{statusLabels[String(gameDetails.status)]}</span>
                    </div>
                    <div className={`text-sm mt-4 ${
                      gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled)
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    }`}>
                      Contract: <span className={`font-mono ${
                        gameDetails.status === BigInt(GameStatus.Ended) || gameDetails.status === BigInt(GameStatus.Canceled)
                          ? 'text-gray-400'
                          : 'text-white'
                      }`}>{gameDetails.address.slice(0, 10)}...{gameDetails.address.slice(-8)}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 玩家成绩显示 */}
              {address && gameDetails.hasSubmitted && (
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Your Result</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400">
                        {formatUnits(gameDetails.myScore || BigInt(0), 0)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Score</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 text-center">
                      <div className="text-xl font-bold text-green-400">
                        {gameDetails.isJoined ? 'Submitted' : 'Not Submitted'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Status</div>
                    </div>
                    {gameDetails.prizeToClaim && gameDetails.prizeToClaim > BigInt(0) && (
                      <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-purple-400">
                          {formatUnits(gameDetails.prizeToClaim, 18)} tokens
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Prize to Claim</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              {!activeGame && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Start Game Card */}
                  {gameDetails.isJoined && gameDetails.status === BigInt(GameStatus.Ongoing) && !gameDetails.hasSubmitted && (
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
                      <div className="p-8 text-center">
                        <div className="mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Gamepad2 className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Start Game</h3>
                          <p className="text-gray-400 text-sm">
                            Compete in tournament and submit your score to leaderboard
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={handleStartGame}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                        >
                          Play Now
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Try Game Card */}
                  <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20 overflow-hidden group hover:border-green-500/40 transition-all duration-300">
                    <div className="p-8 text-center">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Gamepad2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Try Game</h3>
                        <p className="text-gray-400 text-sm">
                          Practice mode without joining tournament
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleTryGame}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
                      >
                        Practice
                      </Button>
                    </div>
                  </Card>

                  {/* Creator Actions - Start Game */}
                  {address === gameDetails.creator && gameDetails.status === BigInt(GameStatus.Created) && gameDetails.canStartGame && (
                    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 overflow-hidden group hover:border-orange-500/40 transition-all duration-300">
                      <div className="p-8 text-center">
                        <div className="mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Flame className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Start Tournament</h3>
                          <p className="text-gray-400 text-sm">
                            Start the tournament now. Registration is closed.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => startGame(gameAddress)}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold"
                        >
                          Start Now
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Creator Actions - Cancel Game */}
                  {address === gameDetails.creator && (gameDetails.status === BigInt(GameStatus.Created) || gameDetails.status === BigInt(GameStatus.Ongoing)) && (
                    <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20 overflow-hidden group hover:border-red-500/40 transition-all duration-300">
                      <div className="p-8 text-center">
                        <div className="mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Skull className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Cancel Tournament</h3>
                          <p className="text-gray-400 text-sm">
                            Cancel the tournament and refund all players.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => cancelGame(gameAddress)}
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold"
                        >
                          Cancel Tournament
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Creator Actions - Distribute Prizes */}
                  {address === gameDetails.creator && gameDetails.status === BigInt(GameStatus.Ended) && (
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 overflow-hidden group hover:border-yellow-500/40 transition-all duration-300">
                      <div className="p-8 text-center">
                        <div className="mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Distribute Prizes</h3>
                          <p className="text-gray-400 text-sm">
                            Distribute prizes to winners.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => distributePrize(gameAddress)}
                          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold"
                        >
                          Distribute Prizes
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Player Actions - Claim Prize */}
                  {gameDetails.prizeToClaim && gameDetails.prizeToClaim > BigInt(0) && (
                    <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20 overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
                      <div className="p-8 text-center">
                        <div className="mb-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Claim Prize</h3>
                          <p className="text-gray-400 text-sm">
                            You have {formatUnits(gameDetails.prizeToClaim, 18)} tokens to claim.
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => claimPrize(gameAddress)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
                        >
                          Claim Now
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Full Leaderboard */}
              {gameDetails.playersList && gameDetails.playersList.length > 0 && (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {gameDetails.playersList.length} Participants
                      </Badge>
                    </div>
                  </div>

                  {/* Leaderboard List - Two sections: Ranked and Not Yet Submitted */}
                  <div className="max-h-96 overflow-y-auto">
                    {/* Ranked Players (Submitted Score) */}
                    {sortResults(gameDetails.playersList).map((result, index) => {
                      const rank = index + 1;
                      const isCurrentPlayer = result.player === address;
                      const submittedTime = new Date(Number(result.submittedAt) * 1000);

                      return (
                        <div
                          key={result.player}
                          className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                            isCurrentPlayer ? 'bg-blue-500/10' : ''
                          }`}
                        >
                          <div className="w-12 text-center">
                            <span className="text-lg font-bold text-gray-400">
                              #{rank}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="font-mono text-sm text-white">
                              {result.player.slice(0, 6)}...{result.player.slice(-4)}
                            </div>
                            {isCurrentPlayer && (
                              <Badge className="mt-1 bg-blue-500/20 text-blue-400 text-xs">
                                You
                              </Badge>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              {formatUnits(result.score, 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {submittedTime.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Players Not Yet Submitted */}
                    {gameDetails.playersList.filter(r => r.score === BigInt(0) || r.submittedAt === BigInt(0)).map((result) => {
                      const isCurrentPlayer = result.player === address;

                      return (
                        <div
                          key={result.player}
                          className={`flex items-center gap-4 p-4 bg-gray-500/5 border-t border-white/5 ${
                            isCurrentPlayer ? 'bg-blue-500/10' : ''
                          }`}
                        >
                          <div className="w-12 text-center">
                            <span className="text-gray-500">-</span>
                          </div>

                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-400">
                              {result.player.slice(0, 6)}...{result.player.slice(-4)}
                            </div>
                            {isCurrentPlayer && (
                              <Badge className="mt-1 bg-blue-500/20 text-blue-400 text-xs">
                                You
                              </Badge>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-500">Not yet submitted</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* No Results Placeholder */}
              {(!gameDetails.playersList || gameDetails.playersList.length === 0) && (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-12 text-center">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Participants Yet</h3>
                  <p className="text-gray-400">
                    {gameDetails.isJoined
                      ? "You've joined this tournament. Start the game and submit your score to appear on the leaderboard!"
                      : "Join this tournament and submit your score to compete for prizes!"
                    }
                  </p>
                </Card>
              )}
            </motion.div>
          ) : (
            // 游戏界面
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {gameTypeLabels[activeGame] || 'Unknown Game'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Tournament: {gameDetails.title}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveGame(null)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Back to Tournament
                  </Button>
                </div>
                <div className="p-6">
                  {activeGame === GameType.NumberGuess && (
                    <NumberGuessGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                  )}
                  {activeGame === GameType.RockPaperScissors && (
                    <RockPaperScissorsGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                  )}
                  {activeGame === GameType.QuickClick && (
                    <QuickClickGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                  )}
                  {activeGame === 4 && (
                    <RoguelikeSurvivalGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                  )}
                  {activeGame === 5 && (
                    <InfiniteMatchGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
