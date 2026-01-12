'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Zap, Shield, Target } from 'lucide-react';

interface RockPaperScissorsGameTestProps {
  onCancel: () => void;
}

const CHOICES = [
  { id: 'rock', icon: Zap, name: '石头', emoji: '✊' },
  { id: 'paper', icon: Shield, name: '布', emoji: '✋' },
  { id: 'scissors', icon: Target, name: '剪刀', emoji: '✌️' }
] as const;

type Choice = typeof CHOICES[number]['id'];

export default function RockPaperScissorsGameTest({ onCancel }: RockPaperScissorsGameTestProps) {
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(10);
  const [wins, setWins] = useState(0);
  const [draws, setDraws] = useState(0);
  const [losses, setLosses] = useState(0);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [roundResult, setRoundResult] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // 电脑选择
  const getComputerChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * 3)];
  };

  // 判断胜负
  const determineWinner = (player: Choice, computer: Choice): 'win' | 'lose' | 'draw' => {
    if (player === computer) return 'draw';
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  };

  // 开始游戏
  const startGame = () => {
    setRound(1);
    setWins(0);
    setDraws(0);
    setLosses(0);
    setPlayerChoice(null);
    setComputerChoice(null);
    setRoundResult('');
    setIsAnimating(false);
    setGameOver(false);
    setGameStarted(true);
  };

  // 处理玩家选择
  const handleChoice = (choice: Choice) => {
    if (isAnimating || gameOver) return;

    const computer = getComputerChoice();
    const result = determineWinner(choice, computer);

    setIsAnimating(true);
    setPlayerChoice(choice);
    setComputerChoice(computer);

    // 动画延迟后显示结果
    setTimeout(() => {
      const resultText = {
        win: '你赢了！',
        lose: '电脑赢了！',
        draw: '平局！'
      }[result];

      setRoundResult(resultText);

      if (result === 'win') setWins(wins + 1);
      else if (result === 'draw') setDraws(draws + 1);
      else setLosses(losses + 1);

      setIsAnimating(false);

      // 下一轮或结束游戏
      setTimeout(() => {
        if (round < totalRounds) {
          setRound(round + 1);
          setPlayerChoice(null);
          setComputerChoice(null);
          setRoundResult('');
        } else {
          setGameOver(true);
          const finalScore = (wins * 10) + (draws * 5);
          toast.success(`游戏结束！得分：${finalScore}`);
        }
      }, 1500);
    }, 1000);
  };

  const currentScore = (wins * 10) + (draws * 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-8 bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20">
        <div className="space-y-6">
          {/* 游戏标题 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              石头剪刀布
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              与AI进行10轮对决，胜者得10分，平局得5分
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!gameStarted ? (
              // 游戏开始前
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-green-500/5 rounded-lg p-6 text-center">
                  <p className="text-gray-300 mb-4">游戏规则：</p>
                  <ul className="text-left text-sm text-gray-400 space-y-2">
                    <li>• 与AI进行10轮石头剪刀布对决</li>
                    <li>• 胜一局得10分，平局得5分</li>
                    <li>• 石头克剪刀，剪刀克布，布克石头</li>
                    <li>• 最高得分：100分（全胜）</li>
                  </ul>
                </div>
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                >
                  开始游戏
                </Button>
              </motion.div>
            ) : (
              // 游戏进行中
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* 状态显示 */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-green-500/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-400">{wins}</div>
                    <div className="text-xs text-gray-400">胜</div>
                  </div>
                  <div className="bg-gray-500/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-400">{draws}</div>
                    <div className="text-xs text-gray-400">平</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-400">{losses}</div>
                    <div className="text-xs text-gray-400">负</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-yellow-400">{currentScore}</div>
                    <div className="text-xs text-gray-400">得分</div>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-sm text-gray-400">第</span>
                  <span className="text-2xl font-bold text-white mx-2">{round}</span>
                  <span className="text-sm text-gray-400">/ {totalRounds} 轮</span>
                </div>

                {/* 对决显示区域 */}
                <div className="bg-gray-500/5 rounded-xl p-8 space-y-6">
                  {/* 结果提示 */}
                  {roundResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-center py-3 rounded-lg ${
                        roundResult.includes('赢') ? 'bg-green-500/20 text-green-400' :
                        roundResult.includes('平') ? 'bg-gray-500/20 text-gray-300' :
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <p className="text-xl font-bold">{roundResult}</p>
                    </motion.div>
                  )}

                  {/* 选项展示 */}
                  <div className="flex justify-center items-center gap-8">
                    {/* 玩家选择 */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-3">你的选择</div>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-5xl">
                        {playerChoice ? CHOICES.find(c => c.id === playerChoice)!.emoji : '?'}
                      </div>
                    </div>

                    {/* VS */}
                    <div className="text-2xl font-bold text-gray-500">VS</div>

                    {/* 电脑选择 */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-3">电脑选择</div>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center text-5xl">
                        {computerChoice ? CHOICES.find(c => c.id === computerChoice)!.emoji : '?'}
                      </div>
                    </div>
                  </div>

                  {/* 玩家选项按钮 */}
                  {!gameOver && !isAnimating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center gap-4"
                    >
                      {CHOICES.map((choice) => {
                        const Icon = choice.icon;
                        return (
                          <Button
                            key={choice.id}
                            onClick={() => handleChoice(choice.id)}
                            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br ${
                              choice.id === 'rock' ? 'from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30' :
                              choice.id === 'paper' ? 'from-green-500/20 to-teal-500/20 hover:from-green-500/30 hover:to-teal-500/30' :
                              'from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30'
                            } border border-gray-600 hover:border-gray-500`}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs">{choice.emoji}</span>
                          </Button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* 游戏结束后的操作 */}
                {gameOver && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg p-6 text-center">
                      <p className="text-2xl font-bold text-white mb-2">🎮 游戏结束</p>
                      <div className="space-y-2 text-gray-300">
                        <p>总得分：<span className="font-bold text-green-400">{currentScore}</span></p>
                        <p className="text-sm">
                          {wins} 胜 / {draws} 平 / {losses} 负
                        </p>
                        <p className="text-xs text-gray-500 mt-2">测试模式：成绩不会保存</p>
                      </div>
                    </div>
                    <Button
                      onClick={startGame}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                    >
                      再玩一次
                    </Button>
                  </motion.div>
                )}

                {/* 取消按钮 */}
                {!gameOver && (
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="w-full h-12 border-gray-600 hover:bg-gray-800"
                  >
                    返回游戏列表
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
