'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface InfiniteMatchGameProps {
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

// 游戏配置
const INITIAL_TIME = 480; // 初始时间（秒）= 8分钟
const TIME_REDUCTION = 10; // 每关减少的时间（秒）
const MIN_TIME = 60; // 最短关卡时间（秒）
const EASY_MODE_LEVELS = 3; // 简单模式（前3关）不减少时间
const BOARD_ROWS = 10;
const BOARD_COLS = 12;
const ICON_TYPES = 18; // 图标种类数量
const COMBO_TIMEOUT = 2000; // 连击超时时间（毫秒）

// 方案一：使用精美的SVG图标替代emoji
const TILE_ICONS = ['star', 'moon', 'sun', 'spark', 'rainbow', 'fire', 'diamond', 'clover', 'flower', 'butterfly', 'wave', 'bolt', 'mask', 'palette', 'target', 'circus', 'dice', 'guitar'];

// 方向枚举
enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4
}

// 连线路径点
interface PathPoint {
  x: number;
  y: number;
}

export default function InfiniteMatchGame({ onComplete, onCancel }: InfiniteMatchGameProps) {
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [tilesLeft, setTilesLeft] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // 游戏板状态
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [matchedPath, setMatchedPath] = useState<PathPoint[]>([]);

  // 动画和效果
  const [eliminationTiles, setEliminationTiles] = useState<{ x: number; y: number }[]>([]);
  const [showTutorial, setShowTutorial] = useState(true);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化游戏
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(INITIAL_TIME);
    setScore(0);
    setLevel(1);
    setComboCount(0);
    setMaxCombo(0);
    setShowTutorial(false);
    generateLevel(1);

    // 启动倒计时
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // 生成关卡
  const generateLevel = useCallback((currentLevel: number) => {
    // 计算当前关卡的图标种类
    const iconCount = Math.min(6 + currentLevel, ICON_TYPES);
    const activeIcons = TILE_ICONS.slice(0, iconCount);

    // 初始化空板（外围一圈空路径）
    const newBoard: number[][] = [];
    for (let y = 0; y < BOARD_ROWS + 2; y++) {
      newBoard[y] = [];
      for (let x = 0; x < BOARD_COLS + 2; x++) {
        // 外围一圈为0（空），中间随机填充
        if (y === 0 || y === BOARD_ROWS + 1 || x === 0 || x === BOARD_COLS + 1) {
          newBoard[y][x] = 0;
        } else {
          newBoard[y][x] = Math.floor(Math.random() * iconCount) + 1;
        }
      }
    }

    // 确保方块总数为偶数
    let totalTiles = BOARD_ROWS * BOARD_COLS;
    if (totalTiles % 2 !== 0) {
      totalTiles--;
      newBoard[1][1] = 0;
    }

    // 确保每种图标都有偶数个
    const iconCounts = new Map<number, number>();
    for (let y = 1; y <= BOARD_ROWS; y++) {
      for (let x = 1; x <= BOARD_COLS; x++) {
        const icon = newBoard[y][x];
        if (icon > 0) {
          iconCounts.set(icon, (iconCounts.get(icon) || 0) + 1);
        }
      }
    }

    // 修正奇数个的图标
    let fixNeeded = true;
    while (fixNeeded) {
      fixNeeded = false;
      for (const [icon, count] of iconCounts) {
        if (count % 2 !== 0) {
          // 找到另一个奇数个的图标进行交换
          for (const [otherIcon, otherCount] of iconCounts) {
            if (otherIcon !== icon && otherCount % 2 !== 0) {
              // 找到两个方块并交换
              for (let y = 1; y <= BOARD_ROWS; y++) {
                for (let x = 1; x <= BOARD_COLS; x++) {
                  if (newBoard[y][x] === icon) {
                    for (let y2 = 1; y2 <= BOARD_ROWS; y2++) {
                      for (let x2 = 1; x2 <= BOARD_COLS; x2++) {
                        if (newBoard[y2][x2] === otherIcon) {
                          newBoard[y][x] = otherIcon;
                          newBoard[y2][x2] = icon;
                          iconCounts.set(icon, count + 1);
                          iconCounts.set(otherIcon, otherCount + 1);
                          fixNeeded = true;
                          break;
                        }
                      }
                      if (fixNeeded) break;
                    }
                    if (fixNeeded) break;
                  }
                  if (fixNeeded) break;
                }
                if (fixNeeded) break;
              }
              if (fixNeeded) break;
            }
            if (fixNeeded) break;
          }
          if (fixNeeded) break;
        }
      }
    }

    // 确保关卡有解
    if (!hasSolvableMatch(newBoard)) {
      generateLevel(currentLevel);
      return;
    }

    setBoard(newBoard);
    setTilesLeft(totalTiles);
    setSelectedTile(null);
    setMatchedPath([]);
  }, []);

  // 检查是否有可消除的对
  const hasSolvableMatch = (currentBoard: number[][]): boolean => {
    for (let y1 = 1; y1 <= BOARD_ROWS; y1++) {
      for (let x1 = 1; x1 <= BOARD_COLS; x1++) {
        const tile1 = currentBoard[y1][x1];
        if (tile1 === 0) continue;

        for (let y2 = y1; y2 <= BOARD_ROWS; y2++) {
          for (let x2 = (y2 === y1 ? x1 + 1 : 1); x2 <= BOARD_COLS; x2++) {
            const tile2 = currentBoard[y2][x2];
            if (tile2 !== tile1) continue;

            if (canConnect(currentBoard, x1, y1, x2, y2)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // 检查两点是否可以连接（最多两个转弯）
  const canConnect = (currentBoard: number[][], x1: number, y1: number, x2: number, y2: number): boolean => {
    return findPath(currentBoard, x1, y1, x2, y2).length > 0;
  }

  // 寻找连接路径
  const findPath = (currentBoard: number[][], x1: number, y1: number, x2: number, y2: number): PathPoint[] => {
    // 0转弯：直线连接
    if (x1 === x2 || y1 === y2) {
      if (isLineClear(currentBoard, x1, y1, x2, y2)) {
        return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
      }
    }

    // 1转弯：一个拐角
    const oneCornerPaths = [
      { cx: x1, cy: y2 }, // 先垂直后水平
      { cx: x2, cy: y1 }  // 先水平后垂直
    ];

    for (const corner of oneCornerPaths) {
      if ((currentBoard[corner.cy][corner.cx] === 0 || (corner.cx === x2 && corner.cy === y2)) &&
          isLineClear(currentBoard, x1, y1, corner.cx, corner.cy) &&
          isLineClear(currentBoard, corner.cx, corner.cy, x2, y2)) {
        return [{ x: x1, y: y1 }, { x: corner.cx, y: corner.cy }, { x: x2, y: y2 }];
      }
    }

    // 2转弯：两个拐角
    // 水平方向扫描
    for (let x = 0; x <= BOARD_COLS + 1; x++) {
      if (x !== x1 && x !== x2 &&
          currentBoard[y1][x] === 0 &&
          currentBoard[y2][x] === 0 &&
          isLineClear(currentBoard, x1, y1, x, y1) &&
          isLineClear(currentBoard, x, y1, x, y2) &&
          isLineClear(currentBoard, x, y2, x2, y2)) {
        return [{ x: x1, y: y1 }, { x: x, y: y1 }, { x: x, y: y2 }, { x: x2, y: y2 }];
      }
    }

    // 垂直方向扫描
    for (let y = 0; y <= BOARD_ROWS + 1; y++) {
      if (y !== y1 && y !== y2 &&
          currentBoard[y][x1] === 0 &&
          currentBoard[y][x2] === 0 &&
          isLineClear(currentBoard, x1, y1, x1, y) &&
          isLineClear(currentBoard, x1, y, x2, y) &&
          isLineClear(currentBoard, x2, y, x2, y2)) {
        return [{ x: x1, y: y1 }, { x: x1, y: y }, { x: x2, y: y }, { x: x2, y: y2 }];
      }
    }

    return [];
  }

  // 检查两点之间的直线是否畅通（不包括起点和终点）
  const isLineClear = (currentBoard: number[][], x1: number, y1: number, x2: number, y2: number): boolean => {
    if (x1 === x2) {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      for (let y = minY + 1; y < maxY; y++) {
        if (currentBoard[y][x1] !== 0) return false;
      }
    } else if (y1 === y2) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      for (let x = minX + 1; x < maxX; x++) {
        if (currentBoard[y1][x] !== 0) return false;
      }
    } else {
      return false;
    }
    return true;
  }

  // 处理方块点击
  const handleTileClick = (x: number, y: number) => {
    if (!gameStarted || gameOver) return;

    const tileValue = board[y][x];
    if (tileValue === 0) return;

    // 如果没有选中的方块
    if (!selectedTile) {
      setSelectedTile({ x, y });
      return;
    }

    // 如果点击了同一个方块
    if (selectedTile.x === x && selectedTile.y === y) {
      setSelectedTile(null);
      return;
    }

    // 如果点击了相同类型的方块
    if (board[selectedTile.y][selectedTile.x] === tileValue) {
      // 检查是否可以连接
      const path = findPath(board, selectedTile.x, selectedTile.y, x, y);
      if (path.length > 0) {
        // 消除这两个方块
        eliminateTiles(selectedTile, { x, y }, path);
        setSelectedTile(null);
        return;
      }
    }

    // 不能消除，切换选中
    setSelectedTile({ x, y });
  }

  // 计算连击加成（非线性增长）
  const getComboMultiplier = (combo: number): number => {
    if (combo <= 3) return 1.1; // 1-3连击：10%加成
    if (combo <= 7) return 1.3; // 4-7连击：30%加成
    if (combo <= 15) return 1.6; // 8-15连击：60%加成
    return 2.0; // 16+连击：100%加成
  }

  // 消除方块
  const eliminateTiles = (tile1: { x: number; y: number }, tile2: { x: number; y: number }, path: PathPoint[]) => {
    const newBoard = board.map(row => [...row]);
    newBoard[tile1.y][tile1.x] = 0;
    newBoard[tile2.y][tile2.x] = 0;

    // 显示消除动画
    setEliminationTiles([tile1, tile2]);
    setMatchedPath(path);

    // 计算分数（非线性连击加成）
    const baseScore = 10;
    const comboMultiplier = getComboMultiplier(comboCount);
    const earnedScore = Math.floor(baseScore * comboMultiplier);

    setScore(prev => prev + earnedScore);
    setComboCount(prev => {
      const newCombo = prev + 1;
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      return newCombo;
    });

    // 重置连击计时器
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    comboTimerRef.current = setTimeout(() => {
      setComboCount(0);
    }, COMBO_TIMEOUT);

    // 更新剩余方块数
    const newTilesLeft = tilesLeft - 2;
    setTilesLeft(newTilesLeft);

    // 延迟更新游戏板
    setTimeout(() => {
      setBoard(newBoard);
      setEliminationTiles([]);
      setMatchedPath([]);

      // 检查是否完成当前关卡
      if (newTilesLeft === 0) {
        nextLevel();
      } else if (!hasSolvableMatch(newBoard)) {
        // 如果无解，重新洗牌
        reshuffleBoard(newBoard);
      }
    }, 300);
  }

  // 重新洗牌
  const reshuffleBoard = (currentBoard: number[][]) => {
    const tiles: number[] = [];
    const positions: { x: number; y: number }[] = [];

    // 收集所有非空方块
    for (let y = 1; y <= BOARD_ROWS; y++) {
      for (let x = 1; x <= BOARD_COLS; x++) {
        if (currentBoard[y][x] !== 0) {
          tiles.push(currentBoard[y][x]);
          positions.push({ x, y });
        }
      }
    }

    // 随机打乱
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // 重新填充
    const newBoard = currentBoard.map(row => [...row]);
    for (let i = 0; i < positions.length; i++) {
      newBoard[positions[i].y][positions[i].x] = tiles[i];
    }

    // 如果还是无解，重新生成整个关卡
    if (!hasSolvableMatch(newBoard)) {
      generateLevel(level);
    } else {
      setBoard(newBoard);
      toast.success('已重新洗牌');
    }
  }

  // 进入下一关
  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);

    // 计算新关卡的时间（前3关不减少时间，从第4关开始减少）
    let newTime: number;
    if (newLevel <= EASY_MODE_LEVELS) {
      newTime = INITIAL_TIME;
    } else {
      newTime = Math.max(MIN_TIME, INITIAL_TIME - (newLevel - EASY_MODE_LEVELS) * TIME_REDUCTION);
    }
    setTimeLeft(newTime);

    // 重置连击
    setComboCount(0);

    // 生成新关卡
    generateLevel(newLevel);

    toast.success(`进入第 ${newLevel} 关！`);
  }

  // 结束游戏
  const endGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }

    setGameOver(true);
    setGameStarted(false);
    toast.success(`游戏结束！最终得分：${score}，到达第 ${level} 关`);
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
    };
  }, []);

  // 提交结果
  const handleSubmit = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const metadata = [score, level, maxCombo];
      const gameHash = computeHash(4, score, timestamp, metadata);

      // 获取当前连接的钱包地址
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          toast.error('请先连接钱包');
          return;
        }

        const result: GameResult = {
          gameType: 4, // InfiniteMatch
          score,
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
  }

  // 计算哈希
  const computeHash = (gameType: number, score: number, timestamp: number, metadata: number[]): string => {
    const data = `${gameType}-${score}-${timestamp}-${metadata.join(',')}`;
    return '0x' + Array.from(new TextEncoder().encode(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // 获取分数的时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <div className="space-y-6">
          {/* 游戏标题 */}
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              无限消除
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              连接相同的方块，挑战无限关卡
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
                  <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-8 text-center backdrop-blur-sm border border-indigo-500/20">
                    <p className="text-gray-300 mb-6 font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      🎮 游戏规则
                    </p>
                    <ul className="text-left text-sm text-gray-300 space-y-4">
                      <li className="flex items-start group">
                        <span className="text-indigo-400 mr-3 text-lg group-hover:scale-110 transition-transform">🔗</span>
                        <span className="flex-1">
                          <span className="font-semibold text-white">连连看规则：</span>点击两个相同的方块，如果它们可以通过两个以内的转弯连接，即可消除
                        </span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-purple-400 mr-3 text-lg group-hover:scale-110 transition-transform">⏱️</span>
                        <span className="flex-1">
                          <span className="font-semibold text-white">时间限制：</span>每关需要在限定时间内消除所有方块，前3关保持8分钟，之后每关减少10秒
                        </span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-pink-400 mr-3 text-lg group-hover:scale-110 transition-transform">⬆️</span>
                        <span className="flex-1">
                          <span className="font-semibold text-white">难度递增：</span>完成当前关卡后进入下一关，关卡越高方块种类越多，挑战越大
                        </span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-orange-400 mr-3 text-lg group-hover:scale-110 transition-transform">💫</span>
                        <span className="flex-1">
                          <span className="font-semibold text-white">连击系统：</span>连续消除可以累积连击，获得非线性分数加成（最高100%加成）
                        </span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-yellow-400 mr-3 text-lg group-hover:scale-110 transition-transform">🏆</span>
                        <span className="flex-1">
                          <span className="font-semibold text-white">无限挑战：</span>挑战你能到达的极限关卡，获取高分排名！
                        </span>
                      </li>
                    </ul>
                  </div>
                ) : null}
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
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
                {/* 时间进度条 */}
                <div className="relative">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full transition-all duration-1000 ${
                        timeLeft < 30 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        timeLeft < 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timeLeft / INITIAL_TIME) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {timeLeft < 30 && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute -top-1 left-0 right-0 h-4 bg-red-500/20 blur-sm rounded-full"
                    />
                  )}
                </div>

                {/* 状态显示 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-indigo-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-indigo-400">{formatTime(timeLeft)}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余时间</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-purple-400">{score}</div>
                    <div className="text-xs text-gray-400 mt-1">得分</div>
                  </div>
                  <div className="bg-pink-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-pink-400">{level}</div>
                    <div className="text-xs text-gray-400 mt-1">关卡</div>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-orange-400">{tilesLeft}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余方块</div>
                  </div>
                </div>

                {/* 连击显示 */}
                {comboCount > 1 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold">
                      {comboCount} 连击！
                    </div>
                  </motion.div>
                )}

                {/* 游戏区域 */}
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 overflow-hidden shadow-2xl backdrop-blur-sm">
                  {/* 动态背景效果 */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="w-full h-full" style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)
                      `,
                      backgroundSize: '100% 100%',
                      animation: 'pulse 8s ease-in-out infinite'
                    }} />
                  </div>

                  <div
                    className="grid gap-1.5 relative z-10"
                    style={{
                      gridTemplateColumns: `repeat(${BOARD_COLS + 2}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${BOARD_ROWS + 2}, minmax(0, 1fr))`
                    }}
                  >
                    {board.map((row, y) =>
                      row.map((tile, x) => (
                        <motion.button
                          key={`${x}-${y}`}
                          type="button"
                          onClick={() => handleTileClick(x, y)}
                          disabled={tile === 0}
                          className={`
                            aspect-square rounded-lg flex items-center justify-center text-2xl font-bold
                            transition-all duration-200 relative overflow-hidden
                            ${tile === 0 ? 'invisible' : 'visible'}
                            ${selectedTile?.x === x && selectedTile?.y === y
                              ? 'ring-4 ring-yellow-400 scale-110 z-10 shadow-lg shadow-yellow-400/20'
                              : ''}
                            ${eliminationTiles.some(t => t.x === x && t.y === y)
                              ? 'scale-0 opacity-0'
                              : ''}
                            hover:scale-105 active:scale-95
                            ${tile > 0 ? 'cursor-pointer' : 'cursor-default'}
                          `}
                          style={{
                            backgroundColor: tile > 0
                              ? `linear-gradient(135deg, hsl(${(tile * 25) % 360}, 70%, 55%) 0%, hsl(${(tile * 25) % 360}, 70%, 45%) 100%)`
                              : 'transparent',
                            boxShadow: tile > 0
                              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                              : 'none',
                            border: tile > 0 ? '2px solid rgba(255, 255, 255, 0.1)' : 'none'
                          }}
                          whileHover={tile > 0 ? { scale: 1.08, boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.3)' } : {}}
                          whileTap={tile > 0 ? { scale: 0.92 } : {}}
                        >
                          {tile > 0 && (
                            <span className="relative z-10 text-2xl select-none">
                              {TILE_ICONS[tile - 1] === 'star' ? '⭐' :
                               TILE_ICONS[tile - 1] === 'moon' ? '🌙' :
                               TILE_ICONS[tile - 1] === 'sun' ? '☀️' :
                               TILE_ICONS[tile - 1] === 'spark' ? '✨' :
                               TILE_ICONS[tile - 1] === 'rainbow' ? '🌈' :
                               TILE_ICONS[tile - 1] === 'fire' ? '🔥' :
                               TILE_ICONS[tile - 1] === 'diamond' ? '💎' :
                               TILE_ICONS[tile - 1] === 'clover' ? '🍀' :
                               TILE_ICONS[tile - 1] === 'flower' ? '🌺' :
                               TILE_ICONS[tile - 1] === 'butterfly' ? '🦋' :
                               TILE_ICONS[tile - 1] === 'wave' ? '🌊' :
                               TILE_ICONS[tile - 1] === 'bolt' ? '⚡' :
                               TILE_ICONS[tile - 1] === 'mask' ? '🎭' :
                               TILE_ICONS[tile - 1] === 'palette' ? '🎨' :
                               TILE_ICONS[tile - 1] === 'target' ? '🎯' :
                               TILE_ICONS[tile - 1] === 'circus' ? '🎪' :
                               TILE_ICONS[tile - 1] === 'dice' ? '🎲' : '🎸'}
                            </span>
                          )}
                          {/* 内发光效果 */}
                          {tile > 0 && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)'
                              }}
                            />
                          )}
                        </motion.button>
                      ))
                    )}
                  </div>

                  {/* 连接线层 */}
                  <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                    {matchedPath.length > 1 && (
                      <motion.path
                        d={matchedPath.map((point, index) => {
                          const x = ((point.x - 0.5) / (BOARD_COLS + 2)) * 100 + '%';
                          const y = ((point.y - 0.5) / (BOARD_ROWS + 2)) * 100 + '%';
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </motion.div>
            ) : (
              // 游戏结束
              <motion.div
                key="gameover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-8 text-center backdrop-blur-sm border border-indigo-500/30 shadow-2xl">
                  <motion.h3
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
                  >
                    🎮 游戏结束
                  </motion.h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gray-900/50 rounded-lg p-5 backdrop-blur-sm border border-purple-500/20"
                    >
                      <div className="text-3xl font-bold text-purple-400">{score}</div>
                      <div className="text-sm text-gray-400 mt-2">最终得分</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-900/50 rounded-lg p-5 backdrop-blur-sm border border-pink-500/20"
                    >
                      <div className="text-3xl font-bold text-pink-400">{level}</div>
                      <div className="text-sm text-gray-400 mt-2">到达关卡</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gray-900/50 rounded-lg p-5 backdrop-blur-sm border border-orange-500/20"
                    >
                      <div className="text-3xl font-bold text-orange-400">{maxCombo}</div>
                      <div className="text-sm text-gray-400 mt-2">最大连击</div>
                    </motion.div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-yellow-400">
                        {score > 1000 ? 'S' : score > 500 ? 'A' : score > 300 ? 'B' : 'C'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">评价</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={startGame}
                      className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                      再玩一次
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      提交成绩
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
