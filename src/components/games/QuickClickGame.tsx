'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Target } from 'lucide-react';

interface QuickClickGameProps {
  onComplete: (result: GameResult) => void;
  onCancel: () => void;
}

export interface GameResult {
  gameType: number;
  score: number;
  timestamp: number;
  gameHash: string;
  metadata: number[];
  playerAddress: string;
}

const GAME_DURATION = 30; // 30秒

export default function QuickClickGame({ onComplete, onCancel }: QuickClickGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [clicks, setClicks] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [showTutorial, setShowTutorial] = useState(true);

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // 生成新的目标位置
  const generateNewTarget = useCallback(() => {
    // 确保目标在容器范围内，距离边缘至少60px（目标大小的一半）
    const minX = 15;
    const maxX = 85;
    const minY = 15;
    const maxY = 85;

    setTargetPosition({
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY
    });
  }, []);

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setClicks(0);
    setShowTutorial(false);
    generateNewTarget();
    lastClickTimeRef.current = Date.now();

    // 启动倒计时
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 结束游戏
  const endGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameOver(true);
    setGameStarted(false);
    toast.success(`游戏结束！总点击次数：${clicks}`);
  };

  // 处理点击
  const handleTargetClick = () => {
    if (!gameStarted || gameOver) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    // 防作弊：最小点击间隔600ms（30秒内最多50次）
    if (timeSinceLastClick < 600) {
      toast.warning('点击太快了！');
      return;
    }

    setClicks(prev => prev + 1);
    lastClickTimeRef.current = now;
    generateNewTarget();

    // 点击反馈
    if (gameContainerRef.current) {
      const container = gameContainerRef.current;
      container.style.transform = 'scale(0.98)';
      setTimeout(() => {
        container.style.transform = 'scale(1)';
      }, 50);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 提交结果
  const handleSubmit = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const metadata = [clicks];
      const gameHash = computeHash(3, clicks, timestamp, metadata);

      // 获取当前连接的钱包地址
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          toast.error('请先连接钱包');
          return;
        }

        const result: GameResult = {
          gameType: 3, // QuickClick
          score: clicks,
          timestamp,
          gameHash,
          metadata,
          playerAddress: accounts[0]
        };

        onComplete(result);
      } else {
        toast.error('未检测到Web3钱包');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      toast.error('提交结果失败');
    }
  };

  // 计算哈希
  const computeHash = (gameType: number, score: number, timestamp: number, metadata: number[]): string => {
    const data = `${gameType}-${score}-${timestamp}-${metadata.join(',')}`;
    return '0x' + Array.from(new TextEncoder().encode(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // 计算点击速度
  const getClicksPerSecond = () => {
    const elapsed = GAME_DURATION - timeLeft;
    return elapsed > 0 ? (clicks / elapsed).toFixed(2) : '0.00';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="space-y-6">
          {/* 游戏标题 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              快速点击
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              30秒内尽可能多地点击目标，手速越快得分越高
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!gameStarted && !gameOver ? (
              // 游戏开始前/教程
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {showTutorial ? (
                  <div className="bg-orange-500/5 rounded-lg p-6 text-center">
                    <p className="text-gray-300 mb-4">游戏规则：</p>
                    <ul className="text-left text-sm text-gray-400 space-y-2">
                      <li>• 游戏时间：30秒</li>
                      <li>• 点击屏幕上出现的红色目标</li>
                      <li>• 每次成功点击得1分</li>
                      <li>• 目标会随机出现在不同位置</li>
                      <li>• 最高得分：50分（理论最大值）</li>
                    </ul>
                  </div>
                ) : null}
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  开始游戏
                </Button>
              </motion.div>
            ) : gameStarted ? (
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
                  <div className="bg-orange-500/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{timeLeft}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余时间</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{clicks}</div>
                    <div className="text-xs text-gray-400 mt-1">点击次数</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{getClicksPerSecond()}</div>
                    <div className="text-xs text-gray-400 mt-1">次/秒</div>
                  </div>
                </div>

                {/* 游戏区域 */}
                <div
                  ref={gameContainerRef}
                  className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden"
                  style={{ aspectRatio: '16/9' }}
                >
                  {/* 游戏目标 */}
                  <motion.div
                    animate={{
                      x: `calc(${targetPosition.x}% - 40px)`,
                      y: `calc(${targetPosition.y}% - 40px)`,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 25 },
                      y: { type: 'spring', stiffness: 300, damping: 25 },
                      scale: { duration: 0.8, repeat: Infinity }
                    }}
                    onClick={handleTargetClick}
                    className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 cursor-pointer flex items-center justify-center shadow-lg hover:shadow-red-500/50 transition-shadow"
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                  >
                    <Target className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* 背景网格效果 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                      backgroundImage: `
                        linear-gradient(to right, #ffffff 1px, transparent 1px),
                        linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px'
                    }} />
                  </div>
                </div>

                {/* 取消按钮 */}
                <Button
                  onClick={() => {
                    if (timerRef.current) {
                      clearInterval(timerRef.current);
                    }
                    setGameStarted(false);
                    setGameOver(false);
                    onCancel();
                  }}
                  variant="outline"
                  className="w-full h-12 border-gray-600 hover:bg-gray-800"
                >
                  取消游戏
                </Button>
              </motion.div>
            ) : (
              // 游戏结束
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="mb-4"
                  >
                    <div className="text-6xl mb-4">🎯</div>
                  </motion.div>
                  <p className="text-2xl font-bold text-white mb-2">游戏结束！</p>
                  <div className="space-y-3">
                    <p className="text-4xl font-bold text-orange-400">{clicks}</p>
                    <p className="text-gray-300">总点击次数</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>平均速度：{getClicksPerSecond()} 次/秒</p>
                      <p>总耗时：30秒</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={startGame}
                    className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    再玩一次
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                  >
                    提交成绩
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
