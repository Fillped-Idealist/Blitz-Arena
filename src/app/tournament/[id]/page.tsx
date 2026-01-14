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
import { Tournament } from '@/lib/tournamentStore';

// Game type enum
export enum GameType {
  None = 0,
  NumberGuess = 1,
  RockPaperScissors = 2,
  QuickClick = 3,
  RoguelikeSurvival = 4,
  InfiniteMatch = 5
}
import { getAllTournaments, joinTournament, getUserTournaments } from '@/lib/tournamentStore';
import NumberGuessGame, { GameResult as NumberGuessResult } from '@/components/games/NumberGuessGame';
import RockPaperScissorsGame, { GameResult as RPSResult } from '@/components/games/RockPaperScissorsGame';
import QuickClickGame, { GameResult as QCResult } from '@/components/games/QuickClickGame';
import RoguelikeSurvivalGame, { GameResult as RLSResult } from '@/components/games/RoguelikeSurvivalGame';
import InfiniteMatchGame, { GameResult as IMResult } from '@/components/games/InfiniteMatchGame';
import { Loader2, Gamepad2, Flame, Skull, AlertCircle, CheckCircle, Trophy } from 'lucide-react';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [activeGame, setActiveGame] = useState<number | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const tournamentId = params.id as string;

  // 加载比赛数据
  useEffect(() => {
    const loadTournament = () => {
      try {
        const tournaments = getAllTournaments();
        const found = tournaments.find(t => t.id === tournamentId);
        if (!found) {
          toast.error('Tournament not found');
          router.push('/tournaments');
          return;
        }
        setTournament(found);

        // 检查用户是否已加入
        if (address) {
          const userTournaments = getUserTournaments(address);
          setHasJoined(userTournaments.some(t => t.id === tournamentId));
        }
      } catch (error) {
        console.error('Failed to load tournament:', error);
        toast.error('Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId, address, router]);

  // 游戏类型映射
  const gameTypeLabels: Record<string, string> = {
    '1': 'Number Guess',
    '2': 'Rock Paper Scissors',
    '3': 'Quick Click',
    '4': 'Cycle Rift (轮回裂隙)',
    '5': 'Infinite Match'
  };

  const gameTypeIcons: Record<string, string> = {
    '1': '🔢',
    '2': '✊✋✌️',
    '3': '🎯',
    '4': '🌀',
    '5': '🧩'
  };

  // 结果排序函数：分数高的排前面，分数相同则提交时间早的排前面
  const sortResults = (results: { playerAddress: string; score: number; timestamp: number }[]) => {
    return [...results].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // 分数高的排前面
      }
      return a.timestamp - b.timestamp; // 分数相同则提交时间早的排前面
    });
  };

  const gameTypeEnum: Record<string, GameType> = {
    '1': GameType.NumberGuess,
    '2': GameType.RockPaperScissors,
    '3': GameType.QuickClick,
    '4': GameType.RoguelikeSurvival,
    '5': GameType.InfiniteMatch
  };

  // 处理游戏结果提交
  const handleGameComplete = async (result: NumberGuessResult | RPSResult | QCResult | RLSResult | IMResult) => {
    try {
      // 模拟提交到链上
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 提交到localStorage
      if (address && tournament) {
        const tournaments = getAllTournaments();
        const updatedTournament = tournaments.find(t => t.id === tournamentId);
        if (updatedTournament) {
          const existingResult = updatedTournament.results.find(r => r.playerAddress === address);
          if (existingResult) {
            toast.error('You have already submitted your result');
            return;
          }

          updatedTournament.results.push({
            playerAddress: address,
            score: result.score,
            timestamp: Date.now()
          });

          // 保存到localStorage
          localStorage.setItem('tournaments', JSON.stringify(tournaments));

          setActiveGame(null);
          toast.success('Game result submitted successfully!', {
            description: `Score: ${result.score}`,
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to submit game result:', error);
      toast.error('Failed to submit game result', {
        description: 'Please try again',
      });
    }
  };

  // 加入比赛
  const handleJoinTournament = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setJoining(true);
    try {
      toast.info('Processing your registration...', {
        duration: 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const success = joinTournament(tournamentId, address);
      if (success) {
        setHasJoined(true);
        toast.success('Successfully joined the tournament!', {
          duration: 3000,
        });
        // 重新加载比赛数据
        const tournaments = getAllTournaments();
        const found = tournaments.find(t => t.id === tournamentId);
        if (found) setTournament(found);
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
      toast.error('Failed to join tournament', {
        description: 'Please try again',
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

    if (!hasJoined) {
      toast.error('Please join the tournament first');
      return;
    }

    if (!tournament) return;

    // 检查比赛状态：只有正在进行的比赛才能开始游戏
    if (tournament.status !== 'Ongoing') {
      const statusMessages: Record<string, string> = {
        'Open': 'The tournament has not started yet. Please wait.',
        'Full': 'The tournament has not started yet. Please wait.',
        'Ended': 'This tournament has already ended.',
        'Canceled': 'This tournament has been canceled.'
      };
      toast.error(statusMessages[tournament.status] || 'Cannot start game at this time');
      return;
    }

    // 检查是否已提交结果
    if (address && tournament.results.some(r => r.playerAddress === address)) {
      toast.info('You have already submitted your result');
      return;
    }

    setActiveGame(gameTypeEnum[tournament.gameType] || 0);
  };

  // 取消游戏
  const handleCancelGame = () => {
    setActiveGame(null);
    toast.info('Game cancelled');
  };

  // 体验游戏
  const handleTryGame = () => {
    // 跳转到体验游戏页面并自动选择对应游戏
    const gameTypeMap: Record<string, string> = {
      '1': 'number-guess',
      '2': 'rock-paper-scissors',
      '3': 'quick-click',
      '4': 'roguelike-survival',
      '5': 'infinite-match'
    };
    const gameId = gameTypeMap[tournament?.gameType || '1'];
    router.push(`/test?game=${gameId}`);
  };

  // 状态显示
  const statusLabels: Record<string, string> = {
    'Open': 'Open for Registration',
    'Full': 'Full',
    'Ongoing': 'In Progress',
    'Ended': 'Ended',
    'Canceled': 'Canceled'
  };

  const statusColors: Record<string, string> = {
    'Open': 'bg-blue-500/20 text-blue-400',
    'Full': 'bg-red-500/20 text-red-400',
    'Ongoing': 'bg-green-500/20 text-green-400',
    'Ended': 'bg-gray-500/20 text-gray-400',
    'Canceled': 'bg-red-500/20 text-red-400'
  };

  // 奖金分配方式标签
  const distributionLabels: Record<string, string> = {
    '0': 'Winner Takes All',
    '1': 'Average Split',
    '2': 'Top 3 Ranked'
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
  if (!tournament) {
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
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400">Loading tournament data...</div>
          </div>
        )}

        {/* Tournament Display */}
        {!loading && tournament && (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {/* Status Banner */}
              {tournament.status === 'Ended' || tournament.status === 'Canceled' ? (
                <div className="mb-6 bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Skull className="w-6 h-6 text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-bold text-lg">{tournament.status === 'Canceled' ? 'Tournament Canceled' : 'Tournament Ended'}</h3>
                    <p className="text-gray-300 text-sm">
                      {tournament.status === 'Canceled' ? 'This tournament has been canceled by the organizer.' : 'The competition period has ended. Check the leaderboard for final results.'}
                    </p>
                  </div>
                </div>
              ) : tournament.status === 'Ongoing' ? (
                <div className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Flame className="w-6 h-6 text-white flex-shrink-0 animate-pulse" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Tournament In Progress</h3>
                    <p className="text-green-100 text-sm">
                      The competition period is active. Submit your best score before time runs out!
                    </p>
                  </div>
                </div>
              ) : tournament.status === 'Full' ? (
                <div className="mb-6 bg-gradient-to-r from-red-600 to-orange-600 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-bold text-lg">Tournament Full</h3>
                    <p className="text-red-100 text-sm">
                      All player slots have been filled. The tournament will start soon.
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

              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={statusColors[tournament.status]}>
                      {statusLabels[tournament.status]}
                    </Badge>
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                      {gameTypeLabels[tournament.gameType]}
                    </Badge>
                  </div>

                  <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
                    tournament.status === 'Ended' || tournament.status === 'Canceled' ? 'text-gray-400' : 'text-white'
                  }`}>
                    {tournament.title}
                  </h1>

                  <p className={`text-lg max-w-3xl ${
                    tournament.status === 'Ended' || tournament.status === 'Canceled' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {tournament.description || 'Join this exciting blockchain gaming tournament!'}
                  </p>
                </div>

                {/* Join Button */}
                {tournament.status === 'Open' && !hasJoined && (
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
                        `Join Tournament (${tournament.entryFee} tokens)`
                      )}
                    </Button>
                  </motion.div>
                )}

                {hasJoined && tournament.status !== 'Ended' && tournament.status !== 'Canceled' && (
                  <Badge className="bg-green-500/20 text-green-400 text-lg py-2 px-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Joined
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Game Area */}
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
                  {/* 游戏信息卡片 */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Tournament Info</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Game Type:</span>
                          <span className="text-white">
                            {gameTypeLabels[tournament.gameType]}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Players:</span>
                          <span className="text-white">
                            {tournament.currentPlayers} / {tournament.maxPlayers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Entry Fee:</span>
                          <span className="text-white">
                            {tournament.entryFee} tokens
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Prize Pool:</span>
                          <span className="text-white">
                            {tournament.prize} tokens
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Distribution:</span>
                          <span className="text-white">
                            {distributionLabels[tournament.distributionType] || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className={`p-6 ${
                      tournament.status === 'Ended' || tournament.status === 'Canceled'
                        ? 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/20'
                        : tournament.status === 'Ongoing'
                        ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20'
                        : tournament.status === 'Full'
                        ? 'bg-gradient-to-br from-red-500/10 to-orange-600/10 border-red-500/20'
                        : 'bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20'
                    }`}>
                      <h3 className="text-xl font-bold text-white mb-4">Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {tournament.status === 'Ended' || tournament.status === 'Canceled' ? (
                            <Skull className="w-5 h-5 text-gray-400" />
                          ) : tournament.status === 'Ongoing' ? (
                            <Flame className="w-5 h-5 text-green-400 animate-pulse" />
                          ) : tournament.status === 'Full' ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                          <span className={`font-medium ${
                            tournament.status === 'Ended' || tournament.status === 'Canceled'
                              ? 'text-gray-400'
                              : 'text-white'
                          }`}>{statusLabels[tournament.status]}</span>
                        </div>
                        <div className={`text-sm mt-4 ${
                          tournament.status === 'Ended' || tournament.status === 'Canceled'
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        }`}>
                          Tournament ID: <span className={`font-mono ${
                            tournament.status === 'Ended' || tournament.status === 'Canceled'
                              ? 'text-gray-400'
                              : 'text-white'
                          }`}>{tournament.id}</span>
                        </div>
                        <div className={`text-sm ${
                          tournament.status === 'Ended' || tournament.status === 'Canceled'
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        }`}>
                          Created: <span className={`${
                            tournament.status === 'Ended' || tournament.status === 'Canceled'
                              ? 'text-gray-400'
                              : 'text-white'
                          }`}>{new Date(tournament.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Game Rules */}
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📜</span>
                      Game Rules
                    </h3>
                    <div className="space-y-4 text-gray-300">
                      {tournament.gameType === '1' && (
                        <div className="space-y-2">
                          <p className="font-semibold text-white">🎮 Number Guessing Game</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Guess a number between 1 and 100</li>
                            <li>You have 10 attempts to guess correctly</li>
                            <li>Higher score = more accurate guesses with fewer attempts</li>
                            <li>Submit your best score to compete in the tournament</li>
                          </ul>
                        </div>
                      )}
                      {tournament.gameType === '2' && (
                        <div className="space-y-2">
                          <p className="font-semibold text-white">🎮 Rock Paper Scissors</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Classic Rock Paper Scissors against AI</li>
                            <li>Best of 10 rounds to determine your score</li>
                            <li>Win a round = +1 point, Lose = 0 points, Tie = 0.5 points</li>
                            <li>Submit your best score to compete in the tournament</li>
                          </ul>
                        </div>
                      )}
                      {tournament.gameType === '3' && (
                        <div className="space-y-2">
                          <p className="font-semibold text-white">🎮 Quick Click</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Click the target as fast as you can</li>
                            <li>You have 30 seconds to click as many targets as possible</li>
                            <li>Higher score = more clicks in the time limit</li>
                            <li>Submit your best score to compete in the tournament</li>
                          </ul>
                        </div>
                      )}
                      {tournament.gameType === '4' && (
                        <div className="space-y-2">
                          <p className="font-semibold text-white">🎮 Cycle Rift (轮回裂隙) - Roguelike Survival</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li><strong>Objective:</strong> Survive as long as possible against waves of monsters</li>
                            <li><strong>Movement:</strong> WASD or Arrow keys to move your character</li>
                            <li><strong>Combat:</strong> Auto-attack nearby enemies when in range</li>
                            <li><strong>Level Up:</strong> Choose from 3 random skill upgrades each time you level up</li>
                            <li><strong>Skills:</strong> Various offensive and defensive abilities (fireballs, lightning, shields, etc.)</li>
                            <li><strong>Legendary Skills:</strong> Unlocked at level 25, gold border with powerful effects</li>
                            <li><strong>Mythic Skills:</strong> Unlocked at level 30, red border with ultimate power</li>
                            <li><strong>Monster Scaling:</strong> Monsters get stronger over time (HP & damage increase)</li>
                            <li><strong>Bosses:</strong> Boss enemies spawn periodically with special abilities</li>
                            <li><strong>Score:</strong> Based on survival time, enemies killed, and achievements</li>
                            <li><strong>Strategy:</strong> Balance offense, defense, and mobility to survive longer</li>
                          </ul>
                        </div>
                      )}
                      {tournament.gameType === '5' && (
                        <div className="space-y-2">
                          <p className="font-semibold text-white">🎮 Infinite Match - 连连看无限消除</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li><strong>Objective:</strong> 消除所有匹配的方块，进入下一关卡</li>
                            <li><strong>Matching:</strong> 点击两个相同的方块，如果它们可以通过不超过2个转弯的路径连接，则消除</li>
                            <li><strong>Time Limit:</strong> 初始8分钟，每关减少10秒（最低60秒）</li>
                            <li><strong>Levels:</strong> 无限关卡，难度递增，直到时间耗尽</li>
                            <li><strong>Combo System:</strong> 连续消除获得连击加成，得分递增（最高100%加成）</li>
                            <li><strong>Score:</strong> 基础分10分 + 连击加成（1-3连击+10%，4-7连击+30%，8-15连击+60%，16+连击+100%）</li>
                            <li><strong>Strategy:</strong> 保持高连击数，快速消除，合理规划路径</li>
                            <li><strong>Solubility:</strong> 每个关卡保证有解</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* 玩家成绩显示 */}
                  {address && tournament.results.length > 0 && tournament.results.some(r => r.playerAddress === address) && (
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Your Result</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-yellow-400">
                            {tournament.results.find(r => r.playerAddress === address)?.score || 0}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Score</div>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-blue-400">
                            {new Date(tournament.results.find(r => r.playerAddress === address)?.timestamp || Date.now()).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Submitted</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-green-400">
                            #{(sortResults(tournament.results).findIndex(r => r.playerAddress === address) ?? 0) + 1}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Rank</div>
                        </div>
                        <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-purple-400">
                            {gameTypeLabels[tournament.gameType]}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Game</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Action Buttons - Vertical Layout */}
                  {!activeGame && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Start Game Card */}
                      {hasJoined && tournament.status !== 'Ended' && !tournament.results.some(r => r.playerAddress === address) && (
                        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
                          <div className="p-8 text-center">
                            <div className="mb-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Gamepad2 className="w-8 h-8 text-white" />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">Start Game</h3>
                              <p className="text-gray-400 text-sm">
                                Compete in the tournament and submit your score to the leaderboard
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
                              Practice mode without joining the tournament
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

                      {/* Status Card - Only show if cannot start game */}
                      {(!hasJoined || tournament.status === 'Ended' || tournament.results.some(r => r.playerAddress === address)) && (
                        <Card className="md:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10">
                          <div className="p-8 text-center">
                            <div className="mb-6">
                              {tournament.status === 'Ended' && (
                                <>
                                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-500/20 mb-4">
                                    <span className="text-3xl">🏆</span>
                                  </div>
                                  <h3 className="text-2xl font-bold text-white mb-2">Tournament Ended</h3>
                                  <p className="text-gray-400 text-sm">
                                    Check the leaderboard for the final results
                                  </p>
                                </>
                              )}
                              {!hasJoined && tournament.status !== 'Ended' && (
                                <>
                                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                                    <span className="text-3xl">⚡</span>
                                  </div>
                                  <h3 className="text-2xl font-bold text-white mb-2">Join to Compete</h3>
                                  <p className="text-gray-400 text-sm">
                                    Register for the tournament to submit your official score
                                  </p>
                                </>
                              )}
                              {tournament.results.some(r => r.playerAddress === address) && tournament.status !== 'Ended' && (
                                <>
                                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                                    <span className="text-3xl">✓</span>
                                  </div>
                                  <h3 className="text-2xl font-bold text-white mb-2">Score Submitted</h3>
                                  <p className="text-gray-400 text-sm">
                                    Your result has been recorded. Good luck!
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Full Leaderboard */}
                  {tournament.results.length > 0 && (
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
                      <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            {tournament.results.length} Participants
                          </Badge>
                        </div>
                      </div>

                      {/* Leaderboard List */}
                      <div className="max-h-96 overflow-y-auto">
                        {sortResults(tournament.results)
                          .map((result, index) => {
                            const rank = index + 1;
                            const isCurrentPlayer = result.playerAddress === address;

                            return (
                              <div
                                key={result.playerAddress}
                                className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                                  isCurrentPlayer ? 'bg-blue-500/10' : ''
                                }`}
                              >
                                <div className="w-12 text-center">
                                  <span className={`text-lg font-bold ${
                                    rank === 1 ? 'text-yellow-400' :
                                    rank === 2 ? 'text-gray-300' :
                                    rank === 3 ? 'text-amber-600' :
                                    'text-gray-400'
                                  }`}>
                                    #{rank}
                                  </span>
                                </div>

                                <div className="flex-1">
                                  <div className="font-mono text-sm text-white">
                                    {result.playerAddress.slice(0, 6)}...{result.playerAddress.slice(-4)}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-xl font-bold text-white">
                                    {result.score}
                                  </div>
                                  {isCurrentPlayer && (
                                    <Badge className="mt-1 bg-blue-500 text-white text-xs">
                                      You
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </Card>
                  )}

                  {/* No Results Placeholder */}
                  {tournament.results.length === 0 && (
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-12 text-center">
                      <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No Scores Yet</h3>
                      <p className="text-gray-400">
                        {hasJoined
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
                          {gameTypeLabels[tournament.gameType]}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Tournament: {tournament.title}
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
                      {activeGame === GameType.RoguelikeSurvival && (
                        <RoguelikeSurvivalGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                      )}
                      {activeGame === GameType.InfiniteMatch && (
                        <InfiniteMatchGame onComplete={handleGameComplete} onCancel={handleCancelGame} />
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
