'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Maximize, Minimize, Volume2, VolumeX, 
  Languages, Play, RefreshCw, Trophy, 
  Clock, Flame, Zap, Sparkles, Home
} from 'lucide-react';

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
const TIME_REDUCTION = 45; // 第4关起每关减少45秒
const MIN_TIME = 60; // 最短关卡时间（秒）
const EASY_MODE_LEVELS = 3; // 简单模式（前3关）不减少时间
const BOARD_ROWS = 10;
const BOARD_COLS = 12;
const ICON_TYPES = 18; // 图标种类数量
const COMBO_TIMEOUT = 2000; // 连击超时时间（毫秒）

// 连线路径点
interface PathPoint {
  x: number;
  y: number;
}

// 多语言配置
const I18N = {
  zh: {
    title: '无限消除',
    subtitle: '连接相同的方块，挑战无限关卡',
    rules: {
      title: '游戏规则',
      rule1: '连连看规则：点击两个相同的方块，如果它们可以通过两个以内的转弯连接，即可消除',
      rule2: '时间限制：每关需要在限定时间内消除所有方块，前3关保持8分钟，之后每关减少45秒',
      rule3: '难度递增：完成当前关卡后进入下一关，关卡越高方块种类越多，挑战越大',
      rule4: '连击系统：连续消除可以累积连击，获得非线性分数加成（最高100%加成）',
      rule5: '无限挑战：挑战你能到达的极限关卡，获取高分排名！'
    },
    ui: {
      startGame: '开始游戏',
      playAgain: '再玩一次',
      submitScore: '提交成绩',
      timeLeft: '剩余时间',
      score: '得分',
      level: '关卡',
      tilesLeft: '剩余方块',
      maxCombo: '最大连击',
      finalScore: '最终得分',
      reachedLevel: '到达关卡',
      rating: '评价',
      combo: '连击',
      gameOver: '游戏结束',
      reshuffle: '已重新洗牌',
      nextLevel: '进入第 X 关！'
    }
  },
  en: {
    title: 'Infinite Match',
    subtitle: 'Connect matching tiles, challenge infinite levels',
    rules: {
      title: 'Game Rules',
      rule1: 'Link Rule: Click two identical tiles. If they can be connected with two or fewer turns, they will be eliminated',
      rule2: 'Time Limit: Eliminate all tiles within the time limit. First 3 levels: 8 minutes, then -45s per level',
      rule3: 'Difficulty Progression: Complete current level to advance. Higher levels have more tile types and greater challenges',
      rule4: 'Combo System: Chain eliminations to build combos and get non-linear score bonuses (up to 100%)',
      rule5: 'Infinite Challenge: Push your limits to reach the highest levels and top the leaderboards!'
    },
    ui: {
      startGame: 'Start Game',
      playAgain: 'Play Again',
      submitScore: 'Submit Score',
      timeLeft: 'Time Left',
      score: 'Score',
      level: 'Level',
      tilesLeft: 'Tiles Left',
      maxCombo: 'Max Combo',
      finalScore: 'Final Score',
      reachedLevel: 'Level Reached',
      rating: 'Rating',
      combo: 'COMBO',
      gameOver: 'Game Over',
      reshuffle: 'Reshuffled',
      nextLevel: 'Level X!'
    }
  }
};

export default function InfiniteMatchGame({ onComplete, onCancel }: InfiniteMatchGameProps) {
  // 语言和UI状态
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bgMusicPlaying, setBgMusicPlaying] = useState(false);
  
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicOscillatorRef = useRef<OscillatorNode | null>(null);
  const bgMusicGainRef = useRef<GainNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const tileElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 初始化音效系统
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // 播放背景音乐
  const playBackgroundMusic = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current || bgMusicPlaying) return;

    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // 创建简单的背景音乐（使用多个振荡器产生和弦）
    const now = ctx.currentTime;
    const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4 (C大调和弦)
    
    const oscillators: OscillatorNode[] = [];
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.03; // 背景音乐音量较低

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start(now + i * 0.5);
      oscillators.push(osc);
    });

    // 使用GainNode控制音量包络，产生淡入淡出效果
    const createLoop = (time: number, duration: number) => {
      const loopOsc = ctx.createOscillator();
      const loopGain = ctx.createGain();
      loopOsc.connect(loopGain);
      loopGain.connect(ctx.destination);
      loopGain.gain.value = 0.02;
      loopOsc.frequency.value = frequencies[0];
      loopOsc.start(time);
      loopOsc.stop(time + duration);
    };

    // 创建循环播放的背景音乐
    let loopTime = now;
    const loopDuration = 4;
    for (let i = 0; i < 100; i++) {
      createLoop(loopTime + i * loopDuration, loopDuration);
    }

    bgMusicOscillatorRef.current = oscillators[0];
    bgMusicGainRef.current = gainNode;
    setBgMusicPlaying(true);
  }, [soundEnabled, bgMusicPlaying]);

  // 停止背景音乐
  const stopBackgroundMusic = useCallback(() => {
    if (bgMusicOscillatorRef.current) {
      bgMusicOscillatorRef.current.stop();
      bgMusicOscillatorRef.current = null;
    }
    if (bgMusicGainRef.current) {
      bgMusicGainRef.current.disconnect();
      bgMusicGainRef.current = null;
    }
    setBgMusicPlaying(false);
  }, []);

  // 播放音效
  const playSound = useCallback(async (type: 'match' | 'combo' | 'levelup' | 'gameover' | 'select') => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('Failed to resume AudioContext:', e);
        return;
      }
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'match':
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
      case 'combo':
        const comboFreqs = [523.25, 659.25, 783.99, 1046.50];
        comboFreqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.15);
        });
        break;
      case 'levelup':
        oscillator.frequency.setValueAtTime(392, now);
        oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
      case 'gameover':
        oscillator.frequency.setValueAtTime(392, now);
        oscillator.frequency.exponentialRampToValueAtTime(130.81, now + 0.5);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;
      case 'select':
        oscillator.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
    }
  }, [soundEnabled]);

  // 生成关卡（完全重写：成对生成）
  const generateLevel = useCallback((currentLevel: number) => {
    // 计算当前关卡的图标种类
    const iconCount = Math.min(6 + currentLevel, ICON_TYPES);
    const activeIcons = Array.from({ length: iconCount }, (_, i) => i + 1);

    // 收集所有可用位置（1-BOARD_ROWS 行，1-BOARD_COLS 列）
    const positions: { x: number; y: number }[] = [];
    for (let y = 1; y <= BOARD_ROWS; y++) {
      for (let x = 1; x <= BOARD_COLS; x++) {
        positions.push({ x, y });
      }
    }

    // 确保位置数量为偶数
    const tileCount = positions.length;
    if (tileCount % 2 !== 0) {
      positions.pop(); // 移除一个位置
    }

    // 成对生成方块
    const tiles: number[] = [];
    for (let i = 0; i < tileCount; i += 2) {
      // 随机选择一个图标类型
      const iconType = activeIcons[Math.floor(Math.random() * iconCount)];
      tiles.push(iconType, iconType); // 成对添加
    }

    // 随机打乱方块顺序
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // 随机打乱位置顺序
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // 创建游戏板（外围一圈为0）
    const newBoard: number[][] = [];
    for (let y = 0; y < BOARD_ROWS + 2; y++) {
      newBoard[y] = [];
      for (let x = 0; x < BOARD_COLS + 2; x++) {
        newBoard[y][x] = 0;
      }
    }

    // 填充方块
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      newBoard[y][x] = tiles[i];
    }

    // 确保关卡有解
    const solvableBoard = ensureSolvable(newBoard);
    
    setBoard(solvableBoard);
    setTilesLeft(positions.length);
    setSelectedTile(null);
    setMatchedPath([]);
  }, []);

  // 确保关卡有解的算法
  const ensureSolvable = (board: number[][]): number[][] => {
    const newBoard = board.map(row => [...row]);
    let attempts = 0;
    const maxAttempts = 200;

    while (!hasSolvableMatch(newBoard) && attempts < maxAttempts) {
      // 收集所有非空方块的位置
      const tiles: { x: number; y: number; value: number }[] = [];
      for (let y = 1; y <= BOARD_ROWS; y++) {
        for (let x = 1; x <= BOARD_COLS; x++) {
          if (newBoard[y][x] !== 0) {
            tiles.push({ x, y, value: newBoard[y][x] });
          }
        }
      }

      if (tiles.length < 2) break;

      // 随机交换两个方块
      const idx1 = Math.floor(Math.random() * tiles.length);
      let idx2 = Math.floor(Math.random() * tiles.length);
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * tiles.length);
      }

      const temp = newBoard[tiles[idx1].y][tiles[idx1].x];
      newBoard[tiles[idx1].y][tiles[idx1].x] = newBoard[tiles[idx2].y][tiles[idx2].x];
      newBoard[tiles[idx2].y][tiles[idx2].x] = temp;

      attempts++;
    }

    return newBoard;
  };

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

            if (findPath(currentBoard, x1, y1, x2, y2).length > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

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
      { cx: x1, cy: y2 },
      { cx: x2, cy: y1 }
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
  };

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
  };

  // 处理方块点击
  const handleTileClick = (x: number, y: number) => {
    if (!gameStarted || gameOver) return;

    const tileValue = board[y][x];
    if (tileValue === 0) return;

    if (!selectedTile) {
      playSound('select');
      setSelectedTile({ x, y });
      return;
    }

    if (selectedTile.x === x && selectedTile.y === y) {
      setSelectedTile(null);
      return;
    }

    if (board[selectedTile.y][selectedTile.x] === tileValue) {
      const path = findPath(board, selectedTile.x, selectedTile.y, x, y);
      if (path.length > 0) {
        eliminateTiles(selectedTile, { x, y }, path);
        setSelectedTile(null);
        return;
      }
    }

    playSound('select');
    setSelectedTile({ x, y });
  };

  // 计算连击加成（非线性增长）
  const getComboMultiplier = (combo: number): number => {
    if (combo <= 3) return 1.1;
    if (combo <= 7) return 1.3;
    if (combo <= 15) return 1.6;
    return 2.0;
  };

  // 消除方块
  const eliminateTiles = (tile1: { x: number; y: number }, tile2: { x: number; y: number }, path: PathPoint[]) => {
    const newBoard = board.map(row => [...row]);
    newBoard[tile1.y][tile1.x] = 0;
    newBoard[tile2.y][tile2.x] = 0;

    setEliminationTiles([tile1, tile2]);
    setMatchedPath(path);

    const newCombo = comboCount + 1;
    if (newCombo >= 8) {
      playSound('combo');
    } else {
      playSound('match');
    }

    const baseScore = 10;
    const comboMultiplier = getComboMultiplier(newCombo);
    const earnedScore = Math.floor(baseScore * comboMultiplier);

    setScore(prev => prev + earnedScore);
    setComboCount(prev => {
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      return newCombo;
    });

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    comboTimerRef.current = setTimeout(() => {
      setComboCount(0);
    }, COMBO_TIMEOUT);

    const newTilesLeft = tilesLeft - 2;
    setTilesLeft(newTilesLeft);

    setTimeout(() => {
      setBoard(newBoard);
      setEliminationTiles([]);
      setMatchedPath([]);

      if (newTilesLeft === 0) {
        nextLevel();
      } else if (!hasSolvableMatch(newBoard)) {
        smartReshuffle(newBoard);
      }
    }, 400);
  };

  // 智能重新洗牌
  const smartReshuffle = (currentBoard: number[][]) => {
    const tiles: number[] = [];
    const positions: { x: number; y: number }[] = [];

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

    const newBoard = currentBoard.map(row => [...row]);
    for (let i = 0; i < positions.length; i++) {
      newBoard[positions[i].y][positions[i].x] = tiles[i];
    }

    // 如果还是无解，使用 ensureSolvable
    if (!hasSolvableMatch(newBoard)) {
      const solvableBoard = ensureSolvable(newBoard);
      setBoard(solvableBoard);
      toast.success(I18N[lang].ui.reshuffle);
    } else {
      setBoard(newBoard);
      toast.success(I18N[lang].ui.reshuffle);
    }
  };

  // 进入下一关
  const nextLevel = () => {
    playSound('levelup');
    
    const newLevel = level + 1;
    setLevel(newLevel);

    let newTime: number;
    if (newLevel <= EASY_MODE_LEVELS) {
      newTime = INITIAL_TIME;
    } else {
      newTime = Math.max(MIN_TIME, INITIAL_TIME - (newLevel - EASY_MODE_LEVELS) * TIME_REDUCTION);
    }
    setTimeLeft(newTime);

    setComboCount(0);
    generateLevel(newLevel);

    toast.success(I18N[lang].ui.nextLevel.replace('X', newLevel.toString()));
  };

  // 结束游戏
  const endGame = () => {
    playSound('gameover');
    stopBackgroundMusic();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }

    setGameOver(true);
    setGameStarted(false);
  };

  // 初始化游戏
  const startGame = useCallback(() => {
    initAudio();
    playBackgroundMusic();
    
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(INITIAL_TIME);
    setScore(0);
    setLevel(1);
    setComboCount(0);
    setMaxCombo(0);
    setShowTutorial(false);
    generateLevel(1);

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
  }, [initAudio, generateLevel, playBackgroundMusic]);

  // 清理定时器和音频资源
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      stopBackgroundMusic();
    };
  }, [stopBackgroundMusic]);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 切换音效
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      if (!newValue) {
        stopBackgroundMusic();
      }
      return newValue;
    });
  }, [stopBackgroundMusic]);

  // 切换语言
  const toggleLanguage = useCallback(() => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  }, []);

  // 提交结果
  const handleSubmit = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const metadata = [score, level, maxCombo];
      const gameHash = computeHash(5, score, timestamp, metadata);

      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          toast.error('Please connect your wallet first');
          return;
        }

        const result: GameResult = {
          gameType: 5,
          score,
          timestamp,
          gameHash,
          metadata,
          playerAddress: accounts[0]
        };

        onComplete(result);
      } else {
        toast.error('No Web3 wallet detected');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      toast.error('Failed to submit result');
    }
  };

  // 计算哈希
  const computeHash = (gameType: number, score: number, timestamp: number, metadata: number[]): string => {
    const data = `${gameType}-${score}-${timestamp}-${metadata.join(',')}`;
    return '0x' + Array.from(new TextEncoder().encode(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // 获取分数的时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取评价等级
  const getRating = (score: number): string => {
    if (score > 1000) return 'S';
    if (score > 500) return 'A';
    if (score > 300) return 'B';
    return 'C';
  };

  // 获取方块中心点坐标
  const getTileCenterPixel = (x: number, y: number): { x: number; y: number } | null => {
    const tileKey = `${x}-${y}`;
    const tileElement = tileElementsRef.current.get(tileKey);
    const gameBoard = gameBoardRef.current;

    if (!tileElement || !gameBoard) {
      console.warn(`Tile element or game board not found for position (${x}, ${y})`);
      return null;
    }

    const tileRect = tileElement.getBoundingClientRect();
    const boardRect = gameBoard.getBoundingClientRect();

    // 计算相对于游戏板的坐标
    const x1 = tileRect.left - boardRect.left + tileRect.width / 2;
    const y1 = tileRect.top - boardRect.top + tileRect.height / 2;

    // 确保坐标在合理范围内
    if (x1 < 0 || y1 < 0 || x1 > boardRect.width || y1 > boardRect.height) {
      console.warn(`Calculated point out of bounds: (${x1}, ${y1})`);
    }

    return {
      x: x1,
      y: y1
    };
  };

  // SVG图标组件
  const TileIcon = ({ type }: { type: number }) => {
    const icons = [
      <svg viewBox="0 0 24 24" className="w-full h-full" key="star">
        <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="moon">
        <path fill="currentColor" d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="sun">
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
        <path fill="currentColor" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="bolt">
        <path fill="currentColor" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="rainbow">
        <path fill="none" stroke="currentColor" strokeWidth="2" d="M4.93 19.07a10 10 0 010-14.14M19.07 4.93a10 10 0 010 14.14"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="fire">
        <path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="diamond">
        <path fill="currentColor" d="M12 2L2 9l10 13 10-13-10-7z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="clover">
        <path fill="currentColor" d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="flower">
        <circle cx="12" cy="8" r="3" fill="currentColor"/>
        <circle cx="8" cy="12" r="3" fill="currentColor"/>
        <circle cx="12" cy="16" r="3" fill="currentColor"/>
        <circle cx="16" cy="12" r="3" fill="currentColor"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="butterfly">
        <path fill="currentColor" d="M12 12c-1.5-2-5-2-6.5 0s-2 4.5 0 6.5c2 2 6.5 1.5 6.5-2.5 0 4 4.5 4.5 6.5 2.5s2-4.5 0-6.5c-1.5-2-5-2-6.5 0z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="wave">
        <path fill="none" stroke="currentColor" strokeWidth="2" d="M2 12c2-3 5-3 7 0s5 3 7 0 5-3 7 0"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="target">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="mask">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="palette">
        <path fill="currentColor" d="M12 3a9 9 0 00-9 9c0 4.97 4.03 9 9 9 4.17 0 7.68-2.84 8.73-6.68a1 1 0 00-.5-1.14c-.56-.3-1.07-.75-1.46-1.28-.25-.34-.56-.5-.92-.5-.73 0-1.85.5-2.35 1.5-.5 1 .5 2 1.5 2 1 0 1.5-.5 2-1.5.5-1 1-1.5 2-1.5 1.5 0 2.5 2 2.5 4 0 3-2.5 5.5-5.5 5.5S5 15.5 5 12.5 7.5 7 12 7c3.5 0 6 2.5 6 6 0 1.5-.5 2.5-1 3.5s-1.5 1.5-2.5 1.5c-1 0-1.5-.5-2-1.5s-1-1.5-2-1.5-1.5.5-2 1.5-.5 1.5-1.5 1.5c-1 0-1.5-.5-2-1.5S6.5 15 7.5 15s1.5.5 2 1.5 1 1.5 2 1.5 1.5-.5 2-1.5.5-1.5 1.5-1.5c1 0 1.5.5 2 1.5s1 1.5 2 1.5 1.5-.5 2-1.5.5-1.5 1.5-1.5c1.5 0 2.5-2 2.5-4 0-3-2.5-5.5-5.5-5.5H12z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="music">
        <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="planet">
        <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.8"/>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="heart">
        <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="snowflake">
        <path fill="currentColor" d="M22 11h-2.17l1.58-1.59L20 8l-4 4 4 4 1.41-1.41L19.83 13H22v-2zm-8.66 0L9.41 6.76l-1.41 1.41L12.41 12H7.17l1.58-1.59L7.34 8 3.34 12l4 4 1.41-1.41L7.17 13h5.24l-4.41 3.83 1.41 1.41 3.93-4.24V20h2v-6l3.93 4.24 1.41-1.41L12.41 13h5.24l-1.58 1.59L17.66 16l4-4-4-4-1.41 1.41L17.66 11h-5.24L17.83 7.59 16.41 6.18l-4.07 4.82z"/>
      </svg>,
      <svg viewBox="0 0 24 24" className="w-full h-full" key="key">
        <path fill="currentColor" d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
      </svg>
    ];

    return icons[(type - 1) % icons.length] || icons[0];
  };

  const t = I18N[lang];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`w-full mx-auto ${isFullscreen ? 'h-screen p-6' : 'max-w-7xl'}`}
    >
      <Card className={`p-6 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 backdrop-blur-xl border-purple-500/20 shadow-2xl overflow-hidden relative ${isFullscreen ? 'h-full' : ''}`}>
        {/* 动态背景光晕 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              top: '-20%',
              left: '-10%'
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              bottom: '-20%',
              right: '-10%'
            }}
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        <div className={`relative z-10 flex flex-col ${isFullscreen ? 'h-full' : 'gap-6'}`}>
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {t.title}
            </h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSound}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLanguage}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <Languages className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onCancel}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Home className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!gameStarted && !gameOver ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {showTutorial && (
                  <div className="bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/20 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        {t.rules.title}
                      </h3>
                    </div>
                    <ul className="space-y-4 text-gray-300">
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-violet-500/20 rounded-lg mt-0.5">
                          <Zap className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="flex-1">{t.rules.rule1}</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-pink-500/20 rounded-lg mt-0.5">
                          <Clock className="w-5 h-5 text-pink-400" />
                        </div>
                        <span className="flex-1">{t.rules.rule2}</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-fuchsia-500/20 rounded-lg mt-0.5">
                          <Trophy className="w-5 h-5 text-fuchsia-400" />
                        </div>
                        <span className="flex-1">{t.rules.rule3}</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-orange-500/20 rounded-lg mt-0.5">
                          <Flame className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="flex-1">{t.rules.rule4}</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-cyan-500/20 rounded-lg mt-0.5">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="flex-1">{t.rules.rule5}</span>
                      </li>
                    </ul>
                  </div>
                )}
                <Button
                  onClick={startGame}
                  size="lg"
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
                >
                  <Play className="w-6 h-6 mr-2" />
                  {t.ui.startGame}
                </Button>
              </motion.div>
            ) : gameStarted ? (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col gap-4 ${isFullscreen ? 'flex-1 min-h-0' : ''}`}
              >
                {/* 时间进度条 */}
                <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden shrink-0">
                  <motion.div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft < 30 
                        ? 'bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600' 
                        : timeLeft < 60 
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600' 
                        : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600'
                    }`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / INITIAL_TIME) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  {timeLeft < 30 && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute inset-0 bg-red-500/20 blur-sm"
                    />
                  )}
                </div>

                {/* 状态显示栏 */}
                <div className="grid grid-cols-4 gap-4 shrink-0">
                  <div className="p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl text-center backdrop-blur-sm border border-violet-500/20">
                    <div className="font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent text-2xl">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{t.ui.timeLeft}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/5 rounded-xl text-center backdrop-blur-sm border border-fuchsia-500/20">
                    <div className="font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent text-2xl">
                      {score}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{t.ui.score}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl text-center backdrop-blur-sm border border-pink-500/20">
                    <div className="font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent text-2xl">
                      {level}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{t.ui.level}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl text-center backdrop-blur-sm border border-cyan-500/20">
                    <div className="font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-2xl">
                      {tilesLeft}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{t.ui.tilesLeft}</div>
                  </div>
                </div>

                {/* 游戏区域 */}
                <div className={`relative bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm border border-slate-700/50 flex items-center justify-center ${isFullscreen ? 'flex-1 min-h-0 p-4' : 'p-4'}`}>
                  {/* 游戏板容器 - 全屏时使用h-full而非aspectRatio */}
                  <div 
                    ref={gameBoardRef} 
                    className={`relative ${isFullscreen ? 'h-full w-full' : 'w-full max-w-4xl'}`} 
                    style={!isFullscreen ? { aspectRatio: `${BOARD_COLS + 2} / ${BOARD_ROWS + 2}` } : {}}
                  >
                    {/* 连击显示 */}
                    {comboCount > 1 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                      >
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-600 rounded-full shadow-lg shadow-orange-500/30">
                          <Flame className="w-5 h-5 text-white" />
                          <span className="text-2xl font-bold text-white">
                            {comboCount} {t.ui.combo}!
                          </span>
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    )}

                    {/* 连接线层 */}
                    <svg className="absolute inset-0 pointer-events-none z-50 w-full h-full">
                      {matchedPath.length > 1 && (() => {
                        const pathPoints = matchedPath.map((point) => getTileCenterPixel(point.x, point.y));
                        const validPoints = pathPoints.filter(p => p !== null) as Array<{ x: number; y: number }>;

                        if (validPoints.length < 2) return null;

                        const pathD = validPoints.map((point, index) => {
                          return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
                        }).join(' ');

                        return (
                          <>
                            <defs>
                              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                                <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                                <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
                              </linearGradient>
                              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            <motion.path
                              d={pathD}
                              stroke="url(#lineGradient)"
                              strokeWidth={isFullscreen ? "12" : "8"}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#glow)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.1 }}
                            />
                            {validPoints.map((point, index) => (
                              <motion.circle
                                key={`point-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={isFullscreen ? "6" : "4"}
                                fill="#fcd34d"
                                filter="url(#glow)"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.1 }}
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>

                    {/* 游戏网格 */}
                    <div
                      className={`grid ${isFullscreen ? 'gap-2' : 'gap-1'} w-full h-full`}
                      style={{
                        gridTemplateColumns: `repeat(${BOARD_COLS + 2}, 1fr)`,
                        gridTemplateRows: `repeat(${BOARD_ROWS + 2}, 1fr)`
                      }}
                    >
                      {board.map((row, y) =>
                        row.map((tile, x) => (
                          <div
                            key={`${x}-${y}`}
                            className="relative"
                            style={{ aspectRatio: '1/1' }}
                            ref={(el) => {
                              if (el) {
                                tileElementsRef.current.set(`${x}-${y}`, el);
                              }
                            }}
                          >
                            <motion.button
                              type="button"
                              onClick={() => handleTileClick(x, y)}
                              disabled={tile === 0}
                              className={`
                                w-full h-full rounded-md flex items-center justify-center relative overflow-hidden
                                transition-all duration-200
                                ${tile === 0 ? 'invisible' : 'visible'}
                                ${selectedTile?.x === x && selectedTile?.y === y
                                  ? 'ring-2 ring-yellow-400 z-10 scale-105 shadow-lg shadow-yellow-400/20'
                                  : ''}
                                ${eliminationTiles.some(t => t.x === x && t.y === y)
                                  ? 'scale-0 opacity-0'
                                  : ''}
                                hover:scale-105 active:scale-95
                                ${tile > 0 ? 'cursor-pointer' : 'cursor-default'}
                              `}
                              style={{
                                background: selectedTile?.x === x && selectedTile?.y === y
                                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.85) 0%, rgba(234, 179, 8, 0.85) 50%, rgba(202, 138, 4, 0.85) 100%)'
                                  : tile > 0
                                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.65) 0%, rgba(236, 72, 153, 0.65) 50%, rgba(249, 115, 22, 0.65) 100%)'
                                  : 'transparent',
                                boxShadow: selectedTile?.x === x && selectedTile?.y === y
                                  ? '0 6px 16px -2px rgba(251, 191, 36, 0.4), 0 3px 8px -2px rgba(251, 191, 36, 0.3)'
                                  : tile > 0
                                  ? '0 2px 4px -1px rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)'
                                  : 'none',
                                border: selectedTile?.x === x && selectedTile?.y === y
                                  ? '2px solid rgba(254, 243, 199, 0.6)'
                                  : tile > 0
                                  ? '1px solid rgba(255, 255, 255, 0.15)'
                                  : 'none'
                              }}
                              whileHover={tile > 0 ? { scale: 1.08 } : {}}
                              whileTap={tile > 0 ? { scale: 0.92 } : {}}
                            >
                              {tile > 0 && (
                                <div className="relative z-10" style={{ width: '70%', height: '70%' }}>
                                  <TileIcon type={tile} />
                                </div>
                              )}
                              {tile > 0 && (
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.35) 0%, transparent 65%)'
                                  }}
                                />
                              )}
                            </motion.button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-2xl p-8 text-center backdrop-blur-sm border border-purple-500/30 shadow-2xl">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="mb-6"
                  >
                    <div className="inline-block p-4 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-8">
                    {t.ui.gameOver}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border border-purple-500/20"
                    >
                      <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        {score}
                      </div>
                      <div className="text-sm text-gray-400 mt-2">{t.ui.finalScore}</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border border-pink-500/20"
                    >
                      <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                        {level}
                      </div>
                      <div className="text-sm text-gray-400 mt-2">{t.ui.reachedLevel}</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-slate-900/50 rounded-xl p-6 backdrop-blur-sm border border-orange-500/20"
                    >
                      <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                        {maxCombo}
                      </div>
                      <div className="text-sm text-gray-400 mt-2">{t.ui.maxCombo}</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 backdrop-blur-sm border border-yellow-500/30"
                    >
                      <div className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {getRating(score)}
                      </div>
                      <div className="text-sm text-gray-400 mt-2">{t.ui.rating}</div>
                    </motion.div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={startGame}
                      size="lg"
                      className="flex-1 h-14 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      {t.ui.playAgain}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      size="lg"
                      className="flex-1 h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 shadow-lg shadow-green-500/25"
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      {t.ui.submitScore}
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
