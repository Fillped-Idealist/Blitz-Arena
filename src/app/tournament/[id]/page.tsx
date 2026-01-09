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
import { useGetGameData, useGetPlayerGameResult, GameType } from '@/hooks/useGameSubmission';
import NumberGuessGame, { GameResult as NumberGuessResult } from '@/components/games/NumberGuessGame';
import RockPaperScissorsGame, { GameResult as RPSResult } from '@/components/games/RockPaperScissorsGame';
import QuickClickGame, { GameResult as QCResult } from '@/components/games/QuickClickGame';
import { useSubmitGameResult } from '@/hooks/useGameSubmission';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [activeGame, setActiveGame] = useState<number | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [playerScore, setPlayerScore] = useState<number | null>(null);

  // 使用合约地址（这里需要从URL参数获取或从路由中获取）
  const gameInstanceAddress = params.id as `0x${string}`;

  // 获取比赛数据
  const { data: gameData, isLoading: loadingGameData } = useGetGameData(gameInstanceAddress);

  // 获取玩家的游戏结果
  const { data: playerGameResult, isLoading: loadingPlayerResult } = useGetPlayerGameResult(
    gameInstanceAddress,
    address as `0x${string}`
  );

  // 提交游戏结果
  const { submitGameResult, isPending: submittingResult } = useSubmitGameResult(gameInstanceAddress);

  // 游戏类型显示名称
  const gameTypeLabels: Record<number, string> = {
    [GameType.NumberGuess]: '猜数字游戏',
    [GameType.RockPaperScissors]: '石头剪刀布',
    [GameType.QuickClick]: '快速点击'
  };

  const gameTypeIcons: Record<number, string> = {
    [GameType.NumberGuess]: '🔢',
    [GameType.RockPaperScissors]: '✊✋✌️',
    [GameType.QuickClick]: '🎯'
  };

  // 处理游戏结果提交
  const handleGameComplete = async (result: NumberGuessResult | RPSResult | QCResult) => {
    try {
      await submitGameResult(result);
      setActiveGame(null);
      toast.success('游戏成绩已提交到链上！');
    } catch (error) {
      console.error('Failed to submit game result:', error);
      toast.error('提交游戏成绩失败，请重试');
    }
  };

  // 开始游戏
  const handleStartGame = (gameType: number) => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }

    if (!hasJoined) {
      toast.error('请先报名参加比赛');
      return;
    }

    // 检查游戏是否开始（需要gameData来判断）
    // 这里暂时直接启动游戏
    setActiveGame(gameType);
  };

  // 状态显示
  const statusLabels: Record<number, string> = {
    0: 'Created',
    1: 'Ongoing',
    2: 'Ended',
    3: 'Prize Distributed',
    4: 'Canceled'
  };

  const statusColors: Record<number, string> = {
    0: 'bg-blue-500/20 text-blue-400',
    1: 'bg-green-500/20 text-green-400',
    2: 'bg-orange-500/20 text-orange-400',
    3: 'bg-purple-500/20 text-purple-400',
    4: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Loading State */}
        {loadingGameData && (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400">加载比赛信息中...</div>
          </div>
        )}

        {/* Game Data Display */}
        {gameData && (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={statusColors[gameData.status as number]}>
                      {statusLabels[gameData.status as number]}
                    </Badge>
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                      {gameTypeLabels[gameData.gameType as number]} {gameTypeIcons[gameData.gameType as number]}
                    </Badge>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {gameData.title}
                  </h1>

                  <p className="text-lg text-gray-400 max-w-3xl">
                    {gameData.description || '参加这场激动人心的区块链游戏竞技！'}
                  </p>
                </div>

                {/* Join Button */}
                {gameData.status === 0 && !hasJoined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      onClick={() => {
                        // TODO: 实现报名逻辑
                        setHasJoined(true);
                        toast.success('报名成功！');
                      }}
                    >
                      立即报名
                    </Button>
                  </motion.div>
                )}

                {hasJoined && (
                  <Badge className="bg-green-500/20 text-green-400 text-lg py-2 px-4">
                    已报名
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
                      <h3 className="text-xl font-bold text-white mb-4">比赛信息</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">游戏类型:</span>
                          <span className="text-white">
                            {gameTypeLabels[gameData.gameType as number]}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">参与人数:</span>
                          <span className="text-white">
                            {Number(gameData.playerCount)} / {Number(gameData.maxPlayers)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">报名费:</span>
                          <span className="text-white">
                            {Number(gameData.entryFee)} tokens
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">奖池:</span>
                          <span className="text-white">
                            {Number(gameData.prizePool)} tokens
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">时间安排</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">报名截止:</span>
                          <span className="text-white">
                            {new Date(Number(gameData.registrationEndTime) * 1000).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">比赛开始:</span>
                          <span className="text-white">
                            {new Date(Number(gameData.gameStartTime) * 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* 玩家成绩显示 */}
                  {playerGameResult && playerGameResult.score > 0 && (
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">你的成绩</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-yellow-400">
                            {playerGameResult.score}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">得分</div>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-blue-400">
                            {new Date(Number(playerGameResult.timestamp) * 1000).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">提交时间</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-green-400">
                            {gameTypeLabels[playerGameResult.gameType as number]}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">游戏类型</div>
                        </div>
                        <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                          <div className="text-xl font-bold text-purple-400">
                            ✓
                          </div>
                          <div className="text-sm text-gray-400 mt-1">已上链</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* 开始游戏按钮 */}
                  {hasJoined && gameData.status === 1 && (
                    <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20 p-8 text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">开始游戏</h3>
                      <p className="text-gray-400 mb-6">
                        比赛已开始！点击下方按钮开始你的挑战
                      </p>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-lg px-12"
                        onClick={() => handleStartGame(gameData.gameType as number)}
                      >
                        开始游戏
                      </Button>
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
                  {activeGame === GameType.NumberGuess && (
                    <NumberGuessGame
                      onComplete={handleGameComplete}
                      onCancel={() => setActiveGame(null)}
                    />
                  )}
                  {activeGame === GameType.RockPaperScissors && (
                    <RockPaperScissorsGame
                      onComplete={handleGameComplete}
                      onCancel={() => setActiveGame(null)}
                    />
                  )}
                  {activeGame === GameType.QuickClick && (
                    <QuickClickGame
                      onComplete={handleGameComplete}
                      onCancel={() => setActiveGame(null)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
