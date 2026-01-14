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
import { Loader2, Gamepad2 } from 'lucide-react';

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
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={statusColors[tournament.status]}>
                      {statusLabels[tournament.status]}
                    </Badge>
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                      {gameTypeLabels[tournament.gameType]} {gameTypeIcons[tournament.gameType]}
                    </Badge>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {tournament.title}
                  </h1>

                  <p className="text-lg text-gray-400 max-w-3xl">
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

                {hasJoined && (
                  <Badge className="bg-green-500/20 text-green-400 text-lg py-2 px-4">
                    ✓ Joined
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
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-white font-medium">{tournament.status}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-4">
                          Tournament ID: <span className="text-white font-mono">{tournament.id}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Created: <span className="text-white">{new Date(tournament.createdAt).toLocaleString()}</span>
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
                  {address && tournament.results.some(r => r.playerAddress === address) && (
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
                            {new Date(tournament.results.find(r => r.playerAddress === address)?.timestamp || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Submitted</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-green-400">
                            #{tournament.results.sort((a, b) => b.score - a.score).findIndex(r => r.playerAddress === address)! + 1}
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

                  {/* Start Game Button */}
                  {hasJoined && tournament.status !== 'Ended' && !tournament.results.some(r => r.playerAddress === address) && (
                    <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 p-8 text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">Ready to Play?</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Join the {gameTypeLabels[tournament.gameType]} game and compete for the prize pool!
                      </p>
                      <Button
                        size="lg"
                        onClick={handleStartGame}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <Gamepad2 className="w-5 h-5 mr-2" />
                        Start Game
                      </Button>
                    </Card>
                  )}

                  {/* Try Game Button - Always visible */}
                  {!activeGame && (
                    <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20 p-8 text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">Want to Try First?</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Experience the {gameTypeLabels[tournament.gameType]} game in practice mode without joining the tournament.
                      </p>
                      <Button
                        size="lg"
                        onClick={handleTryGame}
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                      >
                        <Gamepad2 className="w-5 h-5 mr-2" />
                        Try Game
                      </Button>
                    </Card>
                  )}

                  {/* Leaderboard Preview */}
                  {tournament.results.length > 0 && (
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
                      <div className="p-6 border-b border-white/10">
                        <h3 className="text-xl font-bold text-white">Current Leaderboard</h3>
                      </div>
                      <div className="divide-y divide-white/10">
                        {tournament.results
                          .sort((a, b) => b.score - a.score)
                          .slice(0, 10)
                          .map((result, index) => (
                            <div key={result.playerAddress} className="flex items-center gap-4 p-4 hover:bg-white/5">
                              <div className="w-8 text-center">
                                <Badge className={`${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-blue-500'} text-white border-none`}>
                                  #{index + 1}
                                </Badge>
                              </div>
                              <div className="flex-1 font-mono text-sm text-white">
                                {result.playerAddress.slice(0, 6)}...{result.playerAddress.slice(-4)}
                              </div>
                              <div className="text-xl font-bold text-white">
                                {result.score}
                              </div>
                            </div>
                          ))}
                      </div>
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
