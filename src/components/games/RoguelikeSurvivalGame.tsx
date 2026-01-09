'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Swords, Zap, Heart, Shield, TrendingUp, Target, Play, X, Maximize2, Volume2, Flame, Sparkles, Skull } from 'lucide-react';

interface RoguelikeSurvivalGameProps {
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

// ==================== 游戏常量 ====================
const GAME_DURATION = 600;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PLAYER_SIZE = 32;
const MAX_MONSTERS = 80;
const MAX_PROJECTILES = 60;
const MAX_PARTICLES = 300;

// ==================== 颜色配置 ====================
const COLORS = {
  // 玩家颜色
  player: '#FF6B6B',
  playerGlow: 'rgba(255, 107, 107, 0.3)',
  playerOutline: '#C92A2A',

  // 怪物颜色 - 不同类型
  meleeMonster: '#FF4757',
  rangedMonster: '#70A1FF',
  bossMonster: '#9B59B6',

  // 投射物颜色
  projectile: '#FFEAA7',
  projectileGlow: 'rgba(255, 234, 167, 0.6)',

  // 特效颜色
  blood: '#8B0000',
  spark: '#FFD700',
  levelUp: '#00FF00',

  // UI颜色
  hpBar: '#00CEC9',
  hpBarLow: '#FF7675',
  expBar: '#00FF00',
  expBarBackground: '#2D3436'
};

// ==================== 游戏状态接口 ====================
interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  expToNext: number;
  speed: number;
  attackSpeed: number;
  lastAttack: number;
  meleeDamage: number;
  rangedDamage: number;
  critRate: number;
  critMultiplier: number;
  attackRange: number;
  arrowCount: number;
  skills: Skill[];
}

interface Monster {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  exp: number;
  lastAttack: number;
  size: number;
  color: string;
  type: 'melee' | 'ranged' | 'boss';
  scale: number;
  angle: number;
  animationOffset: number;
  isStunned: boolean;
  stunnedTime: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  speed: number;
  bounceCount: number;
  angle: number;
  trail: { x: number; y: number; life: number }[];
  type: 'arrow' | 'fireball' | 'lightning';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'blood' | 'spark' | 'explosion' | 'magic' | 'dust';
  alpha: number;
}

interface DamageNumber {
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  life: number;
  maxLife: number;
  color: string;
}

interface ScreenShake {
  intensity: number;
  duration: number;
  x: number;
  y: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  apply: (player: Player) => Player;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

// ==================== 技能池 ====================
const SKILL_POOL: Skill[] = [
  {
    id: 'melee_damage',
    name: '剑术精通',
    description: '近战伤害 +25%',
    icon: <Swords className="w-6 h-6" />,
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.25 }),
    rarity: 'common',
    color: '#BDC3C7'
  },
  {
    id: 'ranged_damage',
    name: '箭术精通',
    description: '远程伤害 +25%',
    icon: <Target className="w-6 h-6" />,
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.25 }),
    rarity: 'common',
    color: '#BDC3C7'
  },
  {
    id: 'attack_speed',
    name: '迅捷之击',
    description: '攻击速度 +20%',
    icon: <Zap className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackSpeed: p.attackSpeed * 1.2 }),
    rarity: 'rare',
    color: '#3498DB'
  },
  {
    id: 'movement_speed',
    name: '疾风步',
    description: '移动速度 +15%',
    icon: <TrendingUp className="w-6 h-6" />,
    apply: (p) => ({ ...p, speed: p.speed * 1.15 }),
    rarity: 'rare',
    color: '#3498DB'
  },
  {
    id: 'max_hp',
    name: '钢铁之躯',
    description: '最大生命值 +50',
    icon: <Heart className="w-6 h-6" />,
    apply: (p) => ({ ...p, maxHp: p.maxHp + 50, hp: p.hp + 50 }),
    rarity: 'common',
    color: '#BDC3C7'
  },
  {
    id: 'crit_rate',
    name: '致命一击',
    description: '暴击率 +15%',
    icon: <Target className="w-6 h-6" />,
    apply: (p) => ({ ...p, critRate: Math.min(p.critRate + 0.15, 1) }),
    rarity: 'epic',
    color: '#9B59B6'
  },
  {
    id: 'attack_range',
    name: '范围扩大',
    description: '攻击范围 +25%',
    icon: <Shield className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.25 }),
    rarity: 'rare',
    color: '#3498DB'
  },
  {
    id: 'arrow_bounce',
    name: '弹射之箭',
    description: '箭矢可弹射 +2 次',
    icon: <Sparkles className="w-6 h-6" />,
    apply: (p) => ({ ...p, arrowCount: p.arrowCount + 2 }),
    rarity: 'epic',
    color: '#9B59B6'
  },
  {
    id: 'fire_mastery',
    name: '火焰掌握',
    description: '远程投射物变为火球，伤害+50%',
    icon: <Flame className="w-6 h-6" />,
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.5 }),
    rarity: 'legendary',
    color: '#E74C3C'
  },
  {
    id: 'critical_mastery',
    name: '暴击精通',
    description: '暴击伤害 +50%',
    icon: <Skull className="w-6 h-6" />,
    apply: (p) => ({ ...p, critMultiplier: p.critMultiplier * 1.5 }),
    rarity: 'legendary',
    color: '#E74C3C'
  }
];

// ==================== 主组件 ====================
export default function RoguelikeSurvivalGame({ onComplete, onCancel }: RoguelikeSurvivalGameProps) {
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [availableSkill, setAvailableSkill] = useState<Skill | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 游戏数据引用
  const playerRef = useRef<Player>({
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
    meleeDamage: 20,
    rangedDamage: 15,
    critRate: 0.1,
    critMultiplier: 2,
    attackRange: 80,
    arrowCount: 0,
    skills: []
  });

  const monstersRef = useRef<Monster[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const screenShakeRef = useRef<ScreenShake>({ intensity: 0, duration: 0, x: 0, y: 0 });
  const monsterIdCounterRef = useRef(0);
  const projectileIdCounterRef = useRef(0);
  const gameTimeRef = useRef(0);

  // 音频上下文
  const audioContextRef = useRef<AudioContext | null>(null);

  // 输入状态
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  // Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const monsterSpawnTimerRef = useRef<number>(0);
  const gameTimerRef = useRef<number>(0);
  const autoAttackTimerRef = useRef<number>(0);

  // ==================== 音频系统 ====================
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = useCallback((type: 'hit' | 'kill' | 'levelup' | 'shoot' | 'damage' | 'crit' | 'explosion') => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'hit':
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.08);
          break;
        case 'kill':
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.12);
          break;
        case 'crit':
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'levelup':
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
          oscillator.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'shoot':
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.04);
          break;
        case 'damage':
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'explosion':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(150, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

  // ==================== 难度计算 ====================
  const getDifficultyMultiplier = useCallback((): number => {
    const elapsed = GAME_DURATION - timeLeft;
    return 1 + (elapsed / 60) * 0.25;
  }, [timeLeft]);

  // ==================== 屏幕震动 ====================
  const triggerScreenShake = useCallback((intensity: number, duration: number) => {
    screenShakeRef.current = {
      intensity,
      duration,
      x: (Math.random() - 0.5) * 2 * intensity,
      y: (Math.random() - 0.5) * 2 * intensity
    };
  }, []);

  // ==================== 粒子系统 ====================
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8, type: Particle['type'] = 'spark') => {
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const size = 2 + Math.random() * 4;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.4,
        color,
        size,
        type,
        alpha: 1
      });
    }
  }, []);

  // ==================== 伤害数字 ====================
  const createDamageNumber = useCallback((x: number, y: number, damage: number, isCrit: boolean) => {
    const color = isCrit ? '#FF6B6B' : '#FFFFFF';
    damageNumbersRef.current.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      damage: Math.floor(damage),
      isCrit,
      life: 1,
      maxLife: 0.8,
      color
    });
  }, []);

  // ==================== 碰撞检测 ====================
  const checkCollision = useCallback((x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
  }, []);

  // ==================== 自动攻击 ====================
  const autoMeleeAttack = useCallback(() => {
    const player = playerRef.current;
    const now = Date.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;

    let nearestMonster: Monster | null = null;
    let nearestDist = Infinity;

    for (const monster of monstersRef.current) {
      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.attackRange && dist < nearestDist) {
        nearestDist = dist;
        nearestMonster = monster;
      }
    }

    if (!nearestMonster) return;

    player.lastAttack = now;
    const isCrit = Math.random() < player.critRate;
    const damage = isCrit ? player.meleeDamage * player.critMultiplier : player.meleeDamage;

    nearestMonster.hp -= damage;
    nearestMonster.isStunned = true;
    nearestMonster.stunnedTime = 500;

    createParticles(nearestMonster.x, nearestMonster.y, COLORS.blood, 12, 'blood');
    createDamageNumber(nearestMonster.x, nearestMonster.y, damage, isCrit);
    triggerScreenShake(3, 0.1);
    playSound(isCrit ? 'crit' : 'hit');

    if (nearestMonster.hp <= 0) {
      player.exp += nearestMonster.exp;
      createParticles(nearestMonster.x, nearestMonster.y, nearestMonster.color, 20, 'explosion');
      triggerScreenShake(5, 0.15);
      setScore(prev => prev + Math.floor(nearestMonster.exp));
      playSound('kill');
    }
  }, [createParticles, createDamageNumber, playSound, triggerScreenShake]);

  const autoRangedAttack = useCallback(() => {
    const player = playerRef.current;
    const now = Date.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;

    const dx = mouseRef.current.x - player.x;
    const dy = mouseRef.current.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) return;

    player.lastAttack = now;
    const angle = Math.atan2(dy, dx);

    if (projectilesRef.current.length < MAX_PROJECTILES) {
      projectilesRef.current.push({
        id: projectileIdCounterRef.current++,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 12,
        damage: player.rangedDamage,
        speed: 12,
        bounceCount: player.arrowCount,
        angle,
        trail: [],
        type: 'arrow'
      });
      playSound('shoot');
    }
  }, [playSound]);

  // ==================== 升级处理 ====================
  const handleLevelUp = useCallback(() => {
    const player = playerRef.current;
    player.level++;
    player.exp = 0;
    player.expToNext = Math.floor(player.expToNext * 1.6);

    const shuffled = [...SKILL_POOL].sort(() => Math.random() - 0.5);
    setAvailableSkill(shuffled[0]);
    setShowLevelUp(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    createParticles(player.x, player.y, COLORS.levelUp, 50, 'magic');
    playSound('levelup');
  }, [createParticles, playSound]);

  const selectSkill = useCallback((skill: Skill) => {
    playerRef.current = skill.apply(playerRef.current);
    playerRef.current.skills.push(skill);
    setShowLevelUp(false);

    lastTimeRef.current = performance.now();
    gameLoop();
  }, []);

  // ==================== 生成怪物 ====================
  const spawnMonster = useCallback(() => {
    const difficulty = getDifficultyMultiplier();
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

    const typeRoll = Math.random();
    let type: Monster['type'] = 'melee';
    if (typeRoll > 0.85) type = 'ranged';
    if (typeRoll > 0.98) type = 'boss';

    const baseHp = type === 'boss' ? 200 : type === 'ranged' ? 25 : 40;
    const baseDamage = type === 'boss' ? 20 : type === 'ranged' ? 8 : 12;
    const baseSpeed = type === 'boss' ? 1.5 : type === 'ranged' ? 2.5 : 2;
    const baseExp = type === 'boss' ? 100 : type === 'ranged' ? 15 : 10;
    const baseSize = type === 'boss' ? 45 : type === 'ranged' ? 20 : 28;

    const color = type === 'boss' ? COLORS.bossMonster : type === 'ranged' ? COLORS.rangedMonster : COLORS.meleeMonster;

    const monster: Monster = {
      id: monsterIdCounterRef.current++,
      x,
      y,
      hp: baseHp * difficulty,
      maxHp: baseHp * difficulty,
      damage: baseDamage * difficulty,
      speed: baseSpeed * (0.8 + Math.random() * 0.4),
      exp: Math.floor(baseExp * difficulty),
      lastAttack: 0,
      size: baseSize,
      color,
      type,
      scale: 1,
      angle: 0,
      animationOffset: Math.random() * Math.PI * 2,
      isStunned: false,
      stunnedTime: 0
    };

    if (monstersRef.current.length < MAX_MONSTERS) {
      monstersRef.current.push(monster);
    }
  }, [getDifficultyMultiplier]);

  // ==================== 游戏主循环 ====================
  const gameLoop = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = performance.now();
      const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;
      gameTimeRef.current += deltaTime;

      // 屏幕震动
      let shakeX = 0, shakeY = 0;
      if (screenShakeRef.current.duration > 0) {
        screenShakeRef.current.duration -= deltaTime;
        shakeX = screenShakeRef.current.x * (screenShakeRef.current.duration / 0.15);
        shakeY = screenShakeRef.current.y * (screenShakeRef.current.duration / 0.15);
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 清空画布 - 使用渐变背景
      const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1A1A2E');
      gradient.addColorStop(0.5, '#16213E');
      gradient.addColorStop(1, '#0F3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 绘制网格背景
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

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

      // 生成怪物
      const difficulty = getDifficultyMultiplier();
      monsterSpawnTimerRef.current += deltaTime;
      const spawnInterval = Math.max(0.4, 1.8 - difficulty * 0.4);

      if (monsterSpawnTimerRef.current >= spawnInterval) {
        spawnMonster();
        monsterSpawnTimerRef.current = 0;
      }

      // 自动攻击
      autoAttackTimerRef.current += deltaTime;
      const autoAttackInterval = 1 / player.attackSpeed;

      if (autoAttackTimerRef.current >= autoAttackInterval) {
        autoAttackTimerRef.current = 0;

        let hasNearbyEnemy = false;
        for (const monster of monstersRef.current) {
          const mdx = monster.x - player.x;
          const mdy = monster.y - player.y;
          const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mDistance < player.attackRange) {
            hasNearbyEnemy = true;
            break;
          }
        }

        if (hasNearbyEnemy) {
          autoMeleeAttack();
        } else {
          autoRangedAttack();
        }
      }

      // 更新和绘制怪物
      monstersRef.current = monstersRef.current.filter(monster => {
        const mdx = player.x - monster.x;
        const mdy = player.y - monster.y;
        const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDistance > 0) {
          monster.x += (mdx / mDistance) * monster.speed * (monster.isStunned ? 0 : 1);
          monster.y += (mdy / mDistance) * monster.speed * (monster.isStunned ? 0 : 1);
        }

        if (monster.isStunned) {
          monster.stunnedTime -= deltaTime * 1000;
          if (monster.stunnedTime <= 0) {
            monster.isStunned = false;
          }
        }

        // 碰撞检测
        const now = Date.now();
        if (checkCollision(player.x, player.y, PLAYER_SIZE, monster.x, monster.y, monster.size)) {
          if (now - monster.lastAttack > 1000) {
            player.hp -= monster.damage;
            monster.lastAttack = now;
            createDamageNumber(player.x, player.y, monster.damage, false);
            triggerScreenShake(5, 0.2);
            playSound('damage');
            createParticles(player.x, player.y, COLORS.player, 10, 'blood');

            if (player.hp <= 0) {
              endGame();
              return false;
            }
          }
        }

        // 绘制怪物阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(monster.x, monster.y + monster.size * 0.3, monster.size * 0.8, monster.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制怪物
        monster.angle += deltaTime * 2;
        const bounce = Math.sin(gameTimeRef.current * 5 + monster.animationOffset) * 2;

        ctx.save();
        ctx.translate(monster.x, monster.y + bounce);
        ctx.scale(monster.scale, monster.scale);

        // 怪物身体
        ctx.fillStyle = monster.color;
        ctx.beginPath();
        if (monster.type === 'boss') {
          // Boss - 复杂形状
          ctx.arc(0, 0, monster.size, 0, Math.PI * 2);
        } else {
          // 普通怪物
          ctx.moveTo(0, -monster.size);
          ctx.lineTo(monster.size * 0.7, monster.size * 0.5);
          ctx.lineTo(-monster.size * 0.7, monster.size * 0.5);
          ctx.closePath();
        }
        ctx.fill();

        // 怪物边框
        ctx.strokeStyle = monster.isStunned ? '#FFFFFF' : 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 怪物眼睛
        ctx.fillStyle = monster.isStunned ? '#FFFFFF' : '#FF6B6B';
        const eyeOffset = monster.size * 0.3;
        const eyeSize = monster.size * 0.15;

        ctx.beginPath();
        ctx.arc(-eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 怪物血条
        const hpPercent = monster.hp / monster.maxHp;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 12, monster.size * 2, 6);
        ctx.fillStyle = hpPercent > 0.3 ? '#4CAF50' : '#FF5252';
        ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 12, monster.size * 2 * hpPercent, 6);

        return monster.hp > 0;
      });

      // 更新和绘制投射物
      projectilesRef.current = projectilesRef.current.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        // 添加拖尾
        projectile.trail.push({ x: projectile.x, y: projectile.y, life: 1 });
        if (projectile.trail.length > 10) projectile.trail.shift();
        projectile.trail.forEach(t => t.life -= deltaTime * 8);

        // 边界反弹
        if (projectile.x <= 0 || projectile.x >= CANVAS_WIDTH) {
          projectile.vx *= -1;
          projectile.bounceCount--;
        }
        if (projectile.y <= 0 || projectile.y >= CANVAS_HEIGHT) {
          projectile.vy *= -1;
          projectile.bounceCount--;
        }

        // 绘制拖尾
        ctx.strokeStyle = COLORS.projectileGlow;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        projectile.trail.forEach((t, i) => {
          if (t.life > 0) {
            ctx.globalAlpha = t.life * 0.5;
            if (i === 0) {
              ctx.moveTo(t.x, t.y);
            } else {
              ctx.lineTo(t.x, t.y);
            }
          }
        });
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 绘制投射物光晕
        const glow = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, 15);
        glow.addColorStop(0, COLORS.projectileGlow);
        glow.addColorStop(1, 'rgba(255, 234, 167, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // 绘制投射物
        ctx.fillStyle = projectile.type === 'fireball' ? '#FF6B6B' : COLORS.projectile;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // 碰撞检测
        for (const monster of monstersRef.current) {
          if (checkCollision(projectile.x, projectile.y, 8, monster.x, monster.y, monster.size)) {
            const isCrit = Math.random() < player.critRate;
            const damage = isCrit ? projectile.damage * player.critMultiplier : projectile.damage;

            monster.hp -= damage;
            createParticles(projectile.x, projectile.y, COLORS.spark, 8, 'spark');
            createDamageNumber(monster.x, monster.y, damage, isCrit);
            playSound(isCrit ? 'crit' : 'hit');
            triggerScreenShake(2, 0.08);

            if (projectile.bounceCount <= 0) {
              return false;
            }

            if (monster.hp <= 0) {
              player.exp += monster.exp;
              createParticles(monster.x, monster.y, monster.color, 15, 'explosion');
              setScore(prev => prev + Math.floor(monster.exp));
              playSound('kill');
            }
            break;
          }
        }

        if (projectile.x < -50 || projectile.x > CANVAS_WIDTH + 50 ||
            projectile.y < -50 || projectile.y > CANVAS_HEIGHT + 50 ||
            projectile.bounceCount < 0) {
          return false;
        }

        return true;
      });

      // 更新和绘制粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life -= deltaTime;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.15;

        if (particle.life <= 0) return false;

        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;

        if (particle.type === 'blood') {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'spark') {
          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'rgba(255, 234, 167, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'magic') {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'explosion') {
          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        return true;
      });

      // 更新和绘制伤害数字
      damageNumbersRef.current = damageNumbersRef.current.filter(dn => {
        dn.life -= deltaTime;
        dn.y -= 2;

        if (dn.life <= 0) return false;

        const alpha = dn.life / dn.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = dn.color;
        ctx.font = dn.isCrit ? 'bold 32px "Press Start 2P", monospace' : 'bold 24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = dn.color;
        ctx.shadowBlur = 8;
        ctx.fillText(dn.damage.toString(), dn.x, dn.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        return true;
      });

      // 绘制玩家阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + PLAYER_SIZE * 0.3, PLAYER_SIZE * 0.8, PLAYER_SIZE * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 绘制玩家光晕
      const playerGlow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, PLAYER_SIZE * 2);
      playerGlow.addColorStop(0, COLORS.playerGlow);
      playerGlow.addColorStop(1, 'rgba(255, 107, 107, 0)');
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_SIZE * 2, 0, Math.PI * 2);
      ctx.fill();

      // 绘制玩家
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // 玩家边框
      ctx.strokeStyle = COLORS.playerOutline;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 玩家方向指示器
      const angle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x);
      ctx.strokeStyle = COLORS.player;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(
        player.x + Math.cos(angle) * PLAYER_SIZE * 1.5,
        player.y + Math.sin(angle) * PLAYER_SIZE * 1.5
      );
      ctx.stroke();

      // 玩家血条
      const hpPercent = player.hp / player.maxHp;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(player.x - 35, player.y - PLAYER_SIZE - 18, 70, 8);
      ctx.fillStyle = hpPercent > 0.3 ? COLORS.hpBar : COLORS.hpBarLow;
      ctx.fillRect(player.x - 35, player.y - PLAYER_SIZE - 18, 70 * hpPercent, 8);

      // 经验条
      const expPercent = player.exp / player.expToNext;
      ctx.fillStyle = COLORS.expBarBackground;
      ctx.fillRect(player.x - 35, player.y - PLAYER_SIZE - 26, 70, 6);
      ctx.fillStyle = COLORS.expBar;
      ctx.fillRect(player.x - 35, player.y - PLAYER_SIZE - 26, 70 * expPercent, 6);

      ctx.restore();

      // 检查升级
      if (player.exp >= player.expToNext) {
        handleLevelUp();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error('Game loop error:', error);
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [checkCollision, createDamageNumber, createParticles, getDifficultyMultiplier, handleLevelUp, autoMeleeAttack, autoRangedAttack, spawnMonster, playSound, triggerScreenShake]);

  // ==================== 游戏控制 ====================
  const startGame = () => {
    console.log('Starting game...');
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setShowTutorial(false);
    setShowLevelUp(false);

    initAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

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
      meleeDamage: 20,
      rangedDamage: 15,
      critRate: 0.1,
      critMultiplier: 2,
      attackRange: 80,
      arrowCount: 0,
      skills: []
    };

    monstersRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageNumbersRef.current = [];
    screenShakeRef.current = { intensity: 0, duration: 0, x: 0, y: 0 };
    monsterIdCounterRef.current = 0;
    projectileIdCounterRef.current = 0;
    monsterSpawnTimerRef.current = 0;
    autoAttackTimerRef.current = 0;
    gameTimeRef.current = 0;

    gameTimerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        console.log('Canvas found, starting game loop...');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          gradient.addColorStop(0, '#1A1A2E');
          gradient.addColorStop(1, '#0F3460');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        lastTimeRef.current = performance.now();
        gameLoop();
      } else {
        console.error('Canvas still not found after timeout!');
        toast.error('游戏启动失败，请重试');
        endGame();
      }
    }, 100);
  };

  const endGame = () => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setGameOver(true);
    setGameStarted(false);
    setShowLevelUp(false);
    toast.success(`游戏结束！得分：${score}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ==================== 副作用 ====================
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      mouseRef.current.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameStarted, showLevelUp]);

  // ==================== 提交结果 ====================
  const handleSubmit = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const player = playerRef.current;
      const metadata = [score, player.level];
      const gameHash = computeHash(4, score, timestamp, metadata);

      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          toast.error('请先连接钱包');
          return;
        }

        const result: GameResult = {
          gameType: 4,
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
  };

  const computeHash = (gameType: number, score: number, timestamp: number, metadata: number[]): string => {
    const data = `${gameType}-${score}-${timestamp}-${metadata.join(',')}`;
    return '0x' + Array.from(new TextEncoder().encode(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const player = playerRef.current;

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
          {/* 游戏标题 */}
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              肉鸽割草
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              无限挑战，生存下去，击败无尽怪物
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!gameStarted && !gameOver ? (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {showTutorial ? (
                  <div className="bg-purple-500/10 rounded-lg p-6 backdrop-blur-sm border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      游戏规则
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="font-semibold mb-3 text-white">操作方式</p>
                        <ul className="space-y-2 text-gray-300">
                          <li className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs">W</div>
                            <span>移动：WASD 或 方向键</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            <span>瞄准：鼠标移动</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Swords className="w-4 h-4" />
                            <span>近战：靠近怪物自动攻击</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span>远程：自动向鼠标方向射击</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-3 text-white">游戏机制</p>
                        <ul className="space-y-2 text-gray-300">
                          <li>• 游戏时间：10分钟</li>
                          <li>• 击杀怪物获得经验升级</li>
                          <li>• 每次升级选择 1 个技能</li>
                          <li>• 难度随时间逐渐增加</li>
                          <li>• 不同类型怪物：近战、远程、Boss</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                >
                  <Play className="w-5 h-5 mr-2" />
                  开始游戏
                </Button>
              </motion.div>
            ) : gameStarted ? (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* 状态显示 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-purple-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-400">{formatTime(timeLeft)}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余时间</div>
                  </div>
                  <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">{score}</div>
                    <div className="text-xs text-gray-400 mt-1">得分</div>
                  </div>
                  <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-yellow-500/20">
                    <div className="text-2xl font-bold text-yellow-400">{player.level}</div>
                    <div className="text-xs text-gray-400 mt-1">等级</div>
                  </div>
                  <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-3 text-center border border-red-500/20">
                    <div className="text-xl font-bold text-red-400">{Math.floor(player.hp)}/{player.maxHp}</div>
                    <div className="text-xs text-gray-400 mt-1">生命值</div>
                  </div>
                  <div className="bg-green-500/10 backdrop-blur-sm rounded-lg p-3 text-center flex items-center justify-center gap-2 border border-green-500/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/10"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="text-white hover:bg-white/10"
                    >
                      <Volume2 className={`w-4 h-4 ${!soundEnabled ? 'opacity-50' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* 游戏画布 */}
                <div ref={containerRef} className="relative rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto"
                    style={{ imageRendering: 'pixelated', background: '#0F0F1E' }}
                  />
                </div>

                {/* 经验显示 */}
                <div className="bg-purple-500/10 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>经验值</span>
                    <span>{player.exp} / {player.expToNext}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(player.exp / player.expToNext) * 100}%` }}
                    />
                  </div>
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
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
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
                  <div className="space-y-3">
                    <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {score}
                    </p>
                    <p className="text-gray-300">总得分</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>最终等级：{player.level}</p>
                      <p>存活时间：{formatTime(GAME_DURATION - timeLeft)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={startGame}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    再玩一次
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-600"
                  >
                    提交成绩
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 升级选择界面 */}
          <AnimatePresence>
            {showLevelUp && availableSkill && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl"
                >
                  <h3 className="text-2xl font-bold text-center text-yellow-400 mb-6 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    升级了！
                  </h3>
                  <Button
                    onClick={() => selectSkill(availableSkill)}
                    className="w-full h-auto p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 flex items-center gap-4 transition-all hover:scale-105"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                      {availableSkill.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white text-lg">{availableSkill.name}</p>
                        <div
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: availableSkill.color, color: '#FFFFFF' }}
                        >
                          {availableSkill.rarity.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{availableSkill.description}</p>
                    </div>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
