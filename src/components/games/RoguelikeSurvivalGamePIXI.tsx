'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Zap, Target, Play, X, Maximize2, Volume2, Sparkles } from 'lucide-react';
import * as PIXI from 'pixi.js';

interface RoguelikeSurvivalGamePIXIProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
}

// 游戏常量
const GAME_DURATION = 600;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PLAYER_SIZE = 32;

// 颜色配置
const COLORS = {
  player: 0xFF6B6B,
  playerGlow: 0xFF6B6B,
  slime: 0x00FF88,
  skeleton: 0xF5F5DC,
  ghost: 0x70A1FF,
  boss: 0x9B59B6,
  projectile: 0xFFEAA7,
  blood: 0x8B0000,
  spark: 0xFFD700,
  levelUp: 0x00FF00
};

export default function RoguelikeSurvivalGamePIXI({ onComplete, onCancel }: RoguelikeSurvivalGamePIXIProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PixiJS 引用
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const playerSpriteRef = useRef<PIXI.Sprite | null>(null);
  const monstersRef = useRef<Array<{ sprite: PIXI.Sprite; data: any }>>([]);
  const projectilesRef = useRef<Array<{ sprite: PIXI.Sprite; data: any }>>([]);
  const screenShakeContainerRef = useRef<PIXI.Container | null>(null);
  const gameTimeRef = useRef(0);

  // 游戏数据
  const playerRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    expToNext: 50,
    speed: 4,
    attackSpeed: 1,
    lastAttack: 0,
    damage: 20,
    attackRange: 80
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  // 音频
  const audioContextRef = useRef<AudioContext | null>(null);

  // ==================== 初始化PixiJS ====================
  const initPixiApp = useCallback((canvas: HTMLCanvasElement) => {
    if (pixiAppRef.current) return;

    const app = new PIXI.Application({
      view: canvas,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      background: 0x1A1A2E,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    pixiAppRef.current = app;

    // 创建屏幕震动容器
    const shakeContainer = new PIXI.Container();
    app.stage.addChild(shakeContainer);
    screenShakeContainerRef.current = shakeContainer;

    // 创建背景
    const background = createBackground();
    shakeContainer.addChild(background);

    // 创建玩家
    createPlayerSprite(shakeContainer);

    // 开始游戏循环
    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const createBackground = (): PIXI.Container => {
    const container = new PIXI.Container();

    // 背景渐变
    const bgGraphics = new PIXI.Graphics();
    bgGraphics.beginFill(0x1A1A2E);
    bgGraphics.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    container.addChild(bgGraphics);

    // 网格
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.lineStyle(1, 0xFFFFFF, 0.03);
    for (let x = 0; x < CANVAS_WIDTH; x += 60) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 60) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(CANVAS_WIDTH, y);
    }
    container.addChild(gridGraphics);

    // 装饰性圆形
    const decorGraphics = new PIXI.Graphics();
    decorGraphics.lineStyle(2, 0x3d3d5c, 0.5);
    decorGraphics.drawCircle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 48);
    decorGraphics.drawCircle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 32);
    decorGraphics.drawCircle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 16);
    container.addChild(decorGraphics);

    return container;
  };

  const createPlayerSprite = (container: PIXI.Container) => {
    // 创建玩家Sprite
    const playerGraphics = new PIXI.Graphics();

    // 光晕
    const glow = playerGraphics.beginFill(COLORS.playerGlow, 0.4);
    playerGraphics.drawCircle(0, 0, 40);
    playerGraphics.endFill();

    // 身体
    playerGraphics.beginFill(COLORS.player);
    playerGraphics.lineStyle(3, 0xC92A2A);
    playerGraphics.drawCircle(0, 0, PLAYER_SIZE);
    playerGraphics.endFill();

    const texture = pixiAppRef.current!.renderer.generateTexture(playerGraphics);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = CANVAS_WIDTH / 2;
    sprite.y = CANVAS_HEIGHT / 2;
    sprite.scale.set(1);

    container.addChild(sprite);
    playerSpriteRef.current = sprite;
  };

  const createMonsterSprite = (type: 'slime' | 'skeleton' | 'ghost' | 'boss', x: number, y: number): PIXI.Sprite => {
    const graphics = new PIXI.Graphics();

    const color = type === 'slime' ? COLORS.slime :
                  type === 'skeleton' ? COLORS.skeleton :
                  type === 'ghost' ? COLORS.ghost : COLORS.boss;

    const size = type === 'boss' ? 45 : type === 'skeleton' ? 24 : type === 'ghost' ? 20 : 28;

    // 阴影
    graphics.beginFill(0x000000, 0.3);
    graphics.drawEllipse(0, size * 0.3, size * 0.8, size * 0.3);
    graphics.endFill();

    // 身体
    graphics.beginFill(color);
    graphics.lineStyle(2, 0x000000, 0.3);

    if (type === 'slime') {
      // 史莱姆 - 半圆形
      graphics.moveTo(-size, 0);
      graphics.quadraticCurveTo(0, -size, size, 0);
      graphics.lineTo(size, 0);
      graphics.lineTo(-size, 0);
    } else if (type === 'skeleton') {
      // 骷髅 - 圆形
      graphics.drawCircle(0, -size * 0.2, size);
    } else if (type === 'ghost') {
      // 幽灵 - 椭圆形
      graphics.drawEllipse(0, 0, size, size * 1.2);
    } else {
      // Boss - 大圆形
      graphics.drawCircle(0, 0, size);
    }
    graphics.endFill();

    // 眼睛
    graphics.beginFill(0xFF6B6B);
    const eyeOffset = size * 0.3;
    const eyeSize = size * 0.15;
    graphics.drawCircle(-eyeOffset, -eyeOffset, eyeSize);
    graphics.drawCircle(eyeOffset, -eyeOffset, eyeSize);
    graphics.endFill();

    const texture = pixiAppRef.current!.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;

    return sprite;
  };

  const createProjectileSprite = (x: number, y: number): PIXI.Sprite => {
    const graphics = new PIXI.Graphics();

    // 光晕
    graphics.beginFill(COLORS.projectile, 0.6);
    graphics.drawCircle(0, 0, 15);
    graphics.endFill();

    // 核心
    graphics.beginFill(0xFFFFFF);
    graphics.drawCircle(0, 0, 6);
    graphics.endFill();

    const texture = pixiAppRef.current!.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;

    return sprite;
  };

  const createExplosion = (x: number, y: number, color: number) => {
    const container = screenShakeContainerRef.current;
    if (!container) return;

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const size = 3 + Math.random() * 5;

      const particle = new PIXI.Graphics();
      particle.beginFill(color, 0.8);
      particle.drawCircle(0, 0, size);
      particle.endFill();

      particle.x = x;
      particle.y = y;
      particle.alpha = 1;
      particle.scale.set(1);

      container.addChild(particle);

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      let life = 1;

      const animateParticle = () => {
        particle.x += vx;
        particle.y += vy;
        particle.alpha -= 0.03;
        particle.scale.x *= 0.97;
        particle.scale.y *= 0.97;

        if (particle.alpha > 0) {
          requestAnimationFrame(animateParticle);
        } else {
          container.removeChild(particle);
          particle.destroy();
        }
      };

      animateParticle();
    }
  };

  // ==================== 游戏循环 ====================
  const lastTimeRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);

  const gameLoop = useCallback(() => {
    const now = performance.now();
    const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;
    gameTimeRef.current += deltaTime;

    const player = playerRef.current;

    // 更新玩家位置
    let dx = 0, dy = 0;
    if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
    if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
    if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
    if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;

      player.x += dx * player.speed;
      player.y += dy * player.speed;

      player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, player.x));
      player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, player.y));
    }

    // 更新玩家Sprite
    if (playerSpriteRef.current) {
      playerSpriteRef.current.x = player.x;
      playerSpriteRef.current.y = player.y;

      // 呼吸效果
      const scale = 1 + Math.sin(gameTimeRef.current * 3) * 0.02;
      playerSpriteRef.current.scale.set(scale);
    }

    // 更新怪物
    monstersRef.current.forEach(monster => {
      const mdx = player.x - monster.sprite.x;
      const mdy = player.y - monster.sprite.y;
      const distance = Math.sqrt(mdx * mdx + mdy * mdy);

      if (distance > 0) {
        monster.sprite.x += (mdx / distance) * monster.data.speed * deltaTime * 60;
        monster.sprite.y += (mdy / distance) * monster.data.speed * deltaTime * 60;
      }

      // 呼吸效果
      const bounce = Math.sin(gameTimeRef.current * 5 + monster.data.offset) * 0.05;
      monster.sprite.scale.set(1 + bounce);

      // 碰撞检测
      if (distance < PLAYER_SIZE + monster.data.size) {
        if (now - monster.data.lastAttack > 1000) {
          player.hp -= monster.data.damage;
          monster.data.lastAttack = now;
          setPlayerHp(player.hp);
          createExplosion(player.x, player.y, COLORS.blood);

          if (player.hp <= 0) {
            endGame();
            return;
          }
        }
      }
    });

    // 更新投射物
    projectilesRef.current = projectilesRef.current.filter(proj => {
      proj.sprite.x += proj.data.vx;
      proj.sprite.y += proj.data.vy;

      // 检测碰撞
      for (let i = monstersRef.current.length - 1; i >= 0; i--) {
        const monster = monstersRef.current[i];
        const dx = proj.sprite.x - monster.sprite.x;
        const dy = proj.sprite.y - monster.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 8 + monster.data.size) {
          // 命中
          monster.data.hp -= player.damage;

          createExplosion(monster.sprite.x, monster.sprite.y, COLORS.spark);

          if (monster.data.hp <= 0) {
            // 怪物死亡
            createExplosion(monster.sprite.x, monster.sprite.y, parseInt(monster.data.color.replace('#', '0x')));
            screenShakeContainerRef.current?.removeChild(monster.sprite);
            monster.sprite.destroy();
            monstersRef.current.splice(i, 1);
            setScore(prev => prev + monster.data.exp);
          }

          screenShakeContainerRef.current?.removeChild(proj.sprite);
          proj.sprite.destroy();
          return false;
        }
      }

      // 边界检测
      if (proj.sprite.x < -50 || proj.sprite.x > CANVAS_WIDTH + 50 ||
          proj.sprite.y < -50 || proj.sprite.y > CANVAS_HEIGHT + 50) {
        screenShakeContainerRef.current?.removeChild(proj.sprite);
        proj.sprite.destroy();
        return false;
      }

      return true;
    });

    // 自动射击
    const currentTime = Date.now();
    if (currentTime - player.lastAttack > 1000 / player.attackSpeed) {
      const dx = mouseRef.current.x - player.x;
      const dy = mouseRef.current.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        const angle = Math.atan2(dy, dx);
        const speed = 12;

        const projectileSprite = createProjectileSprite(player.x, player.y);
        if (screenShakeContainerRef.current) {
          screenShakeContainerRef.current.addChild(projectileSprite);

          projectilesRef.current.push({
            sprite: projectileSprite,
            data: {
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed
            }
          });
        }

        player.lastAttack = now;
      }
    }

    // 持续游戏循环
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ==================== 生成怪物 ====================
  const spawnMonster = useCallback(() => {
    if (!screenShakeContainerRef.current || monstersRef.current.length >= 50) return;

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    const margin = 50;
    switch (side) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = -margin; break;
      case 1: x = CANVAS_WIDTH + margin; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + margin; break;
      case 3: x = -margin; y = Math.random() * CANVAS_HEIGHT; break;
      default: x = CANVAS_WIDTH / 2; y = -margin;
    }

    const roll = Math.random();
    let type: 'slime' | 'skeleton' | 'ghost' | 'boss' = 'slime';
    if (roll > 0.85) type = 'skeleton';
    if (roll > 0.95) type = 'ghost';
    if (roll > 0.98) type = 'boss';

    const baseHp = type === 'boss' ? 200 : type === 'ghost' ? 20 : type === 'skeleton' ? 35 : 40;
    const baseDamage = type === 'boss' ? 20 : type === 'ghost' ? 8 : type === 'skeleton' ? 12 : 10;
    const baseSpeed = type === 'boss' ? 1.5 : type === 'ghost' ? 3 : type === 'skeleton' ? 2 : 2;
    const baseExp = type === 'boss' ? 100 : type === 'ghost' ? 15 : type === 'skeleton' ? 12 : 10;
    const baseSize = type === 'boss' ? 45 : type === 'ghost' ? 20 : type === 'skeleton' ? 24 : 28;

    const color = type === 'slime' ? '#00FF88' :
                  type === 'skeleton' ? '#F5F5DC' :
                  type === 'ghost' ? '#70A1FF' : '#9B59B6';

    const monsterSprite = createMonsterSprite(type, x, y);
    screenShakeContainerRef.current.addChild(monsterSprite);

    monstersRef.current.push({
      sprite: monsterSprite,
      data: {
        hp: baseHp,
        maxHp: baseHp,
        damage: baseDamage,
        speed: baseSpeed,
        exp: baseExp,
        size: baseSize,
        type,
        color,
        lastAttack: 0,
        offset: Math.random() * Math.PI * 2
      }
    });
  }, []);

  // ==================== 游戏控制 ====================
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setPlayerLevel(1);
    setPlayerHp(100);

    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      hp: 100,
      maxHp: 100,
      level: 1,
      exp: 0,
      expToNext: 50,
      speed: 4,
      attackSpeed: 1,
      lastAttack: 0,
      damage: 20,
      attackRange: 80
    };

    monstersRef.current.forEach(m => {
      screenShakeContainerRef.current?.removeChild(m.sprite);
      m.sprite.destroy();
    });
    monstersRef.current = [];

    projectilesRef.current.forEach(p => {
      screenShakeContainerRef.current?.removeChild(p.sprite);
      p.sprite.destroy();
    });
    projectilesRef.current = [];

    // 定期生成怪物
    spawnTimerRef.current = setInterval(spawnMonster, 1500);

    // 倒计时
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const endGame = () => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);

    setGameOver(true);
    setGameStarted(false);
    toast.success(`游戏结束！得分：${score}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ==================== 事件监听 ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      mouseRef.current.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // 初始化PixiJS
    initPixiApp(canvas);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameStarted, initPixiApp]);

  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
      }
    };
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto"
    >
      <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 backdrop-blur-sm">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              轮回裂隙 (PixiJS版)
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              使用PixiJS渲染引擎的升级版本
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!gameStarted && !gameOver ? (
              <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-purple-500/10 rounded-lg p-6 backdrop-blur-sm border border-purple-500/20 mb-4">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    PixiJS 增强功能
                  </h3>
                  <ul className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <li>✓ WebGL硬件加速渲染</li>
                    <li>✓ 专业的Sprite动画系统</li>
                    <li>✓ 高级粒子特效系统</li>
                    <li>✓ 流畅的60FPS游戏体验</li>
                    <li>✓ 基于SVG的矢量素材</li>
                    <li>✓ 屏幕震动和视觉反馈</li>
                  </ul>
                </div>
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                >
                  <Play className="w-5 h-5 mr-2" />
                  开始游戏
                </Button>
              </motion.div>
            ) : gameStarted ? (
              <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-purple-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-400">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余时间</div>
                  </div>
                  <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">{score}</div>
                    <div className="text-xs text-gray-400 mt-1">得分</div>
                  </div>
                  <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-yellow-500/20">
                    <div className="text-2xl font-bold text-yellow-400">{playerLevel}</div>
                    <div className="text-xs text-gray-400 mt-1">等级</div>
                  </div>
                  <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-red-500/20">
                    <div className="text-xl font-bold text-red-400">{Math.floor(playerHp)}/100</div>
                    <div className="text-xs text-gray-400 mt-1">生命值</div>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto"
                    style={{ background: '#1A1A2E' }}
                  />
                </div>

                <Button
                  onClick={() => {
                    endGame();
                    onCancel();
                  }}
                  variant="outline"
                  className="w-full h-12 border-gray-600 hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  退出游戏
                </Button>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-8 text-center backdrop-blur-sm border border-purple-500/30">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="mb-4"
                  >
                    <div className="text-6xl mb-4">⚔️</div>
                  </motion.div>
                  <p className="text-2xl font-bold text-white mb-2">游戏结束！</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {score}
                  </p>
                  <p className="text-gray-300">总得分</p>
                </div>
                <Button onClick={startGame} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-600">
                  <Play className="w-4 h-4 mr-2" />
                  再玩一次
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
