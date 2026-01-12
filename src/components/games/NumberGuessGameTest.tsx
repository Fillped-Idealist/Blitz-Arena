'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface NumberGuessGameTestProps {
  onCancel: () => void;
}

export default function NumberGuessGameTest({ onCancel }: NumberGuessGameTestProps) {
  const [targetNumber, setTargetNumber] = useState(0);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化游戏
  const startGame = () => {
    const newTarget = Math.floor(Math.random() * 100) + 1;
    setTargetNumber(newTarget);
    setAttempts(0);
    setGuess('');
    setFeedback('请输入1-100之间的数字');
    setIsGameOver(false);
    setScore(0);
    setGameStarted(true);

    // 生成随机种子（防作弊）
    const seed = Date.now() + Math.random() * 10000;
    console.log('Game seed:', seed);
    console.log('Debug - Target number:', newTarget); // 方便测试，实际应删除
  };

  // 处理猜测
  const handleGuess = () => {
    const num = parseInt(guess);

    if (isNaN(num) || num < 1 || num > 100) {
      toast.error('请输入1-100之间的有效数字');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (num === targetNumber) {
      // 猜对了
      const earnedScore = (6 - newAttempts) * 20;
      setScore(earnedScore);
      setFeedback(`恭喜！你猜对了！数字是 ${targetNumber}，得分：${earnedScore}`);
      setIsGameOver(true);
      toast.success(`恭喜！你用了${newAttempts}次猜中，得分：${earnedScore}`);
    } else if (newAttempts >= maxAttempts) {
      // 用完所有机会
      setFeedback(`游戏结束！正确的数字是 ${targetNumber}`);
      setIsGameOver(true);
      setScore(0);
      toast.error(`游戏结束！正确的数字是 ${targetNumber}，得分为0`);
    } else if (num < targetNumber) {
      setFeedback(`太小了！你还有 ${maxAttempts - newAttempts} 次机会`);
      setGuess('');
      inputRef.current?.focus();
    } else {
      setFeedback(`太大了！你还有 ${maxAttempts - newAttempts} 次机会`);
      setGuess('');
      inputRef.current?.focus();
    }
  };

  // 键盘事件处理
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGameOver) {
      handleGuess();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="space-y-6">
          {/* 游戏标题 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              猜数字游戏
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              系统已随机生成1-100的数字，请在{maxAttempts}次内猜中它
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
                <div className="bg-purple-500/5 rounded-lg p-6 text-center">
                  <p className="text-gray-300 mb-4">游戏规则：</p>
                  <ul className="text-left text-sm text-gray-400 space-y-2">
                    <li>• 系统随机生成1-100之间的数字</li>
                    <li>• 最多5次猜测机会</li>
                    <li>• 第1次猜中得100分，第2次80分，以此类推</li>
                    <li>• 猜中次数越少，得分越高</li>
                  </ul>
                </div>
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{attempts}</div>
                    <div className="text-xs text-gray-400 mt-1">已用次数</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{maxAttempts - attempts}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余次数</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{score}</div>
                    <div className="text-xs text-gray-400 mt-1">当前得分</div>
                  </div>
                </div>

                {/* 反馈信息 */}
                <div className={`text-center py-4 px-6 rounded-lg ${
                  feedback.includes('恭喜') ? 'bg-green-500/20 text-green-400' :
                  feedback.includes('游戏结束') ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/10 text-gray-300'
                }`}>
                  <p className="text-lg font-medium">{feedback}</p>
                </div>

                {/* 游戏输入区域 */}
                {!isGameOver && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        ref={inputRef}
                        type="number"
                        min="1"
                        max="100"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入1-100之间的数字"
                        className="flex-1 h-12 text-center text-lg"
                        disabled={isGameOver}
                      />
                      <Button
                        onClick={handleGuess}
                        disabled={!guess || isGameOver}
                        className="h-12 px-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      >
                        猜测
                      </Button>
                    </div>
                  </div>
                )}

                {/* 游戏结束后的操作 */}
                {isGameOver && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 text-center">
                      <p className="text-2xl font-bold text-white mb-2">
                        {score > 0 ? '🎉 恭喜过关！' : '😔 游戏结束'}
                      </p>
                      <p className="text-gray-300">最终得分：{score} 分</p>
                      <p className="text-xs text-gray-500 mt-2">测试模式：成绩不会保存</p>
                    </div>
                    <Button
                      onClick={startGame}
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      再玩一次
                    </Button>
                  </motion.div>
                )}

                {/* 取消按钮 */}
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full h-12 border-gray-600 hover:bg-gray-800"
                >
                  返回游戏列表
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
