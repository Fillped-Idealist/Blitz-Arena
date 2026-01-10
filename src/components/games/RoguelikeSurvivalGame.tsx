'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Swords, Zap, Heart, Target, Play, X, Maximize2, Volume2, Flame, Sparkles, Skull, TrendingUp, Shield, Crown, Ghost, Crosshair, ShieldAlert, Gauge } from 'lucide-react';

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
const PLAYER_SIZE = 24;
const MAX_MONSTERS = 80;
const MAX_PROJECTILES = 80;
const MAX_PARTICLES = 500;
const MAX_DAMAGE_NUMBERS = 60;
const MONSTER_SPAWN_MARGIN = 200;

// ==================== 颜色配置 ====================
const COLORS = {
  player: '#FF4757',
  playerGlow: 'rgba(255, 71, 87, 0.3)',
  playerOutline: '#C92A2A',
  playerWeapon: '#7BED9F',
  slimeMonster: '#2ED573',
  skeletonMonster: '#A4B0BE',
  ghostMonster: '#70A1FF',
  bossMonster: '#9B59B6',
  projectile: '#FFA502',
  projectileGlow: 'rgba(255, 165, 2, 0.5)',
  fireball: '#FF6B6B',
  blood: '#8B0000',
  spark: '#FFD700',
  levelUp: '#00FF00',
  slash: '#FFFFFF',
  hpBar: '#00CEC9',
  hpBarLow: '#FF7675',
  expBar: '#7BED9F',
  expBarBackground: '#2D3436',
  common: '#95A5A6',
  rare: '#3498DB',
  epic: '#9B59B6',
  legendary: '#F1C40F',
  mythic: '#E74C3C'
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
  regenRate: number;
  skills: Skill[];
  totalKills: number;
  totalDamage: number;
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
  type: 'slime' | 'skeleton' | 'ghost' | 'boss' | 'elite';
  scale: number;
  angle: number;
  animationOffset: number;
  isStunned: boolean;
  stunnedTime: number;
  hasShield: boolean;
  shieldHp: number;
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
  type: 'arrow' | 'fireball' | 'lightning' | 'ice';
  pierceCount: number;
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
  type: 'blood' | 'spark' | 'explosion' | 'magic' | 'dust' | 'slash' | 'ice' | 'fire';
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

interface DamageNumber {
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  life: number;
  maxLife: number;
  color: string;
  isHeal: boolean;
}

interface ScreenShake {
  intensity: number;
  duration: number;
  x: number;
  y: number;
}

interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  life: number;
  maxLife: number;
  type: 'horizontal' | 'vertical' | 'diagonal';
}

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  apply: (player: Player) => Player;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  color: string;
}

// ==================== 像素艺术定义 ====================
const PIXEL_ART = {
  // 玩家像素图案（16x16网格，每像素4x4屏幕像素）
  player: {
    body: [
      { x: -3, y: -3, color: '#FF4757' }, { x: -2, y: -3, color: '#FF4757' }, { x: -1, y: -3, color: '#FF4757' },
      { x: 0, y: -3, color: '#FF4757' }, { x: 1, y: -3, color: '#FF4757' }, { x: 2, y: -3, color: '#FF4757' },
      { x: 3, y: -3, color: '#FF4757' },
      { x: -3, y: -2, color: '#FF4757' }, { x: -2, y: -2, color: '#FFF' }, { x: -1, y: -2, color: '#FFF' },
      { x: 0, y: -2, color: '#FFF' }, { x: 1, y: -2, color: '#FFF' }, { x: 2, y: -2, color: '#FF4757' },
      { x: 3, y: -2, color: '#FF4757' },
      { x: -3, y: -1, color: '#FF4757' }, { x: -2, y: -1, color: '#FFF' }, { x: -1, y: -1, color: '#C92A2A' },
      { x: 0, y: -1, color: '#C92A2A' }, { x: 1, y: -1, color: '#FFF' }, { x: 2, y: -1, color: '#FF4757' },
      { x: 3, y: -1, color: '#FF4757' },
      { x: -3, y: 0, color: '#FF4757' }, { x: -2, y: 0, color: '#FF4757' }, { x: -1, y: 0, color: '#FF4757' },
      { x: 0, y: 0, color: '#FF4757' }, { x: 1, y: 0, color: '#FF4757' }, { x: 2, y: 0, color: '#FF4757' },
      { x: 3, y: 0, color: '#FF4757' },
      { x: -2, y: 1, color: '#FF4757' }, { x: -1, y: 1, color: '#FF4757' }, { x: 0, y: 1, color: '#FF4757' },
      { x: 1, y: 1, color: '#FF4757' }, { x: 2, y: 1, color: '#FF4757' },
      { x: -1, y: 2, color: '#FF4757' }, { x: 0, y: 2, color: '#FF4757' }, { x: 1, y: 2, color: '#FF4757' },
    ],
    shadow: [
      { x: -2, y: 5, color: 'rgba(0,0,0,0.3)' }, { x: -1, y: 5, color: 'rgba(0,0,0,0.4)' },
      { x: 0, y: 5, color: 'rgba(0,0,0,0.5)' }, { x: 1, y: 5, color: 'rgba(0,0,0,0.4)' },
      { x: 2, y: 5, color: 'rgba(0,0,0,0.3)' },
      { x: -1, y: 6, color: 'rgba(0,0,0,0.2)' }, { x: 0, y: 6, color: 'rgba(0,0,0,0.3)' },
      { x: 1, y: 6, color: 'rgba(0,0,0,0.2)' },
    ]
  },
  sword: {
    handle: [
      { x: 0, y: 6, color: '#8B4513' }, { x: 0, y: 7, color: '#8B4513' }, { x: 0, y: 8, color: '#8B4513' },
      { x: 0, y: 9, color: '#8B4513' }, { x: 0, y: 10, color: '#8B4513' },
      { x: -1, y: 11, color: '#8B4513' }, { x: 0, y: 11, color: '#DAA520' }, { x: 1, y: 11, color: '#8B4513' },
    ],
    blade: [
      { x: 0, y: -8, color: '#C0C0C0' }, { x: 0, y: -7, color: '#E8E8E8' }, { x: 0, y: -6, color: '#C0C0C0' },
      { x: 0, y: -5, color: '#E8E8E8' }, { x: 0, y: -4, color: '#C0C0C0' }, { x: 0, y: -3, color: '#E8E8E8' },
      { x: 0, y: -2, color: '#C0C0C0' }, { x: 0, y: -1, color: '#E8E8E8' }, { x: 0, y: 0, color: '#DAA520' },
      { x: 0, y: 1, color: '#E8E8E8' }, { x: 0, y: 2, color: '#C0C0C0' }, { x: 0, y: 3, color: '#E8E8E8' },
      { x: 0, y: 4, color: '#C0C0C0' },
      { x: -1, y: -9, color: '#E8E8E8' }, { x: 0, y: -9, color: '#FFFFFF' }, { x: 1, y: -9, color: '#E8E8E8' },
    ]
  },
  monsters: {
    slime: [
      { x: -2, y: 2, color: '#2ED573' }, { x: -1, y: 2, color: '#2ED573' }, { x: 0, y: 2, color: '#2ED573' },
      { x: 1, y: 2, color: '#2ED573' }, { x: 2, y: 2, color: '#2ED573' },
      { x: -2, y: 1, color: '#2ED573' }, { x: -1, y: 1, color: '#5DF078' }, { x: 0, y: 1, color: '#5DF078' },
      { x: 1, y: 1, color: '#5DF078' }, { x: 2, y: 1, color: '#2ED573' },
      { x: -2, y: 0, color: '#2ED573' }, { x: -1, y: 0, color: '#5DF078' }, { x: 0, y: 0, color: '#FFFFFF' },
      { x: 1, y: 0, color: '#5DF078' }, { x: 2, y: 0, color: '#2ED573' },
      { x: -1, y: -1, color: '#2ED573' }, { x: 0, y: -1, color: '#2ED573' }, { x: 1, y: -1, color: '#2ED573' },
    ],
    skeleton: [
      { x: 0, y: -4, color: '#A4B0BE' },
      { x: -2, y: -3, color: '#A4B0BE' }, { x: -1, y: -3, color: '#A4B0BE' }, { x: 0, y: -3, color: '#A4B0BE' },
      { x: 1, y: -3, color: '#A4B0BE' }, { x: 2, y: -3, color: '#A4B0BE' },
      { x: -2, y: -2, color: '#A4B0BE' }, { x: -1, y: -2, color: '#FFFFFF' }, { x: 0, y: -2, color: '#A4B0BE' },
      { x: 1, y: -2, color: '#FFFFFF' }, { x: 2, y: -2, color: '#A4B0BE' },
      { x: -2, y: -1, color: '#A4B0BE' }, { x: -1, y: -1, color: '#FFFFFF' }, { x: 0, y: -1, color: '#FF6B6B' },
      { x: 1, y: -1, color: '#FFFFFF' }, { x: 2, y: -1, color: '#A4B0BE' },
      { x: -2, y: 0, color: '#A4B0BE' }, { x: -1, y: 0, color: '#FFFFFF' }, { x: 0, y: 0, color: '#FF6B6B' },
      { x: 1, y: 0, color: '#FFFFFF' }, { x: 2, y: 0, color: '#A4B0BE' },
      { x: -1, y: 1, color: '#A4B0BE' }, { x: 0, y: 1, color: '#A4B0BE' }, { x: 1, y: 1, color: '#A4B0BE' },
      { x: -1, y: 2, color: '#A4B0BE' }, { x: 0, y: 2, color: '#A4B0BE' }, { x: 1, y: 2, color: '#A4B0BE' },
    ],
    ghost: [
      { x: 0, y: -3, color: '#70A1FF' },
      { x: -2, y: -2, color: '#70A1FF' }, { x: -1, y: -2, color: '#70A1FF' }, { x: 0, y: -2, color: '#70A1FF' },
      { x: 1, y: -2, color: '#70A1FF' }, { x: 2, y: -2, color: '#70A1FF' },
      { x: -2, y: -1, color: '#70A1FF' }, { x: -1, y: -1, color: '#FFFFFF' }, { x: 0, y: -1, color: '#70A1FF' },
      { x: 1, y: -1, color: '#FFFFFF' }, { x: 2, y: -1, color: '#70A1FF' },
      { x: -2, y: 0, color: '#70A1FF' }, { x: -1, y: 0, color: '#FFFFFF' }, { x: 0, y: 0, color: '#70A1FF' },
      { x: 1, y: 0, color: '#FFFFFF' }, { x: 2, y: 0, color: '#70A1FF' },
      { x: -2, y: 1, color: '#70A1FF' }, { x: -1, y: 1, color: '#FFFFFF' }, { x: 0, y: 1, color: '#70A1FF' },
      { x: 1, y: 1, color: '#FFFFFF' }, { x: 2, y: 1, color: '#70A1FF' },
      { x: -2, y: 2, color: '#70A1FF' }, { x: 0, y: 2, color: '#70A1FF' }, { x: 2, y: 2, color: '#70A1FF' },
    ],
    boss: [
      { x: -4, y: -5, color: '#9B59B6' }, { x: -3, y: -5, color: '#9B59B6' }, { x: 3, y: -5, color: '#9B59B6' },
      { x: 4, y: -5, color: '#9B59B6' },
      { x: -4, y: -4, color: '#9B59B6' }, { x: -3, y: -4, color: '#BB6BB6' }, { x: -2, y: -4, color: '#9B59B6' },
      { x: 2, y: -4, color: '#9B59B6' }, { x: 3, y: -4, color: '#BB6BB6' }, { x: 4, y: -4, color: '#9B59B6' },
      { x: -4, y: -3, color: '#9B59B6' }, { x: -3, y: -3, color: '#FFFFFF' }, { x: -2, y: -3, color: '#9B59B6' },
      { x: 2, y: -3, color: '#9B59B6' }, { x: 3, y: -3, color: '#FFFFFF' }, { x: 4, y: -3, color: '#9B59B6' },
      { x: -4, y: -2, color: '#9B59B6' }, { x: -3, y: -2, color: '#FF6B6B' }, { x: -2, y: -2, color: '#9B59B6' },
      { x: -1, y: -2, color: '#9B59B6' }, { x: 0, y: -2, color: '#9B59B6' }, { x: 1, y: -2, color: '#9B59B6' },
      { x: 2, y: -2, color: '#9B59B6' }, { x: 3, y: -2, color: '#FF6B6B' }, { x: 4, y: -2, color: '#9B59B6' },
      { x: -4, y: -1, color: '#9B59B6' }, { x: -3, y: -1, color: '#FF6B6B' }, { x: -2, y: -1, color: '#9B59B6' },
      { x: -1, y: -1, color: '#FFFFFF' }, { x: 0, y: -1, color: '#9B59B6' }, { x: 1, y: -1, color: '#FFFFFF' },
      { x: 2, y: -1, color: '#9B59B6' }, { x: 3, y: -1, color: '#FF6B6B' }, { x: 4, y: -1, color: '#9B59B6' },
      { x: -4, y: 0, color: '#9B59B6' }, { x: -3, y: 0, color: '#FF6B6B' }, { x: -2, y: 0, color: '#9B59B6' },
      { x: -1, y: 0, color: '#9B59B6' }, { x: 0, y: 0, color: '#9B59B6' }, { x: 1, y: 0, color: '#9B59B6' },
      { x: 2, y: 0, color: '#9B59B6' }, { x: 3, y: 0, color: '#FF6B6B' }, { x: 4, y: 0, color: '#9B59B6' },
      { x: -3, y: 1, color: '#9B59B6' }, { x: -2, y: 1, color: '#9B59B6' }, { x: -1, y: 1, color: '#9B59B6' },
      { x: 0, y: 1, color: '#9B59B6' }, { x: 1, y: 1, color: '#9B59B6' }, { x: 2, y: 1, color: '#9B59B6' },
      { x: 3, y: 1, color: '#9B59B6' },
      { x: -2, y: 2, color: '#9B59B6' }, { x: -1, y: 2, color: '#9B59B6' }, { x: 0, y: 2, color: '#9B59B6' },
      { x: 1, y: 2, color: '#9B59B6' }, { x: 2, y: 2, color: '#9B59B6' },
    ],
    elite: [
      { x: -3, y: -4, color: '#E74C3C' }, { x: -2, y: -4, color: '#E74C3C' }, { x: 2, y: -4, color: '#E74C3C' },
      { x: 3, y: -4, color: '#E74C3C' },
      { x: -3, y: -3, color: '#E74C3C' }, { x: -2, y: -3, color: '#FF6B6B' }, { x: -1, y: -3, color: '#E74C3C' },
      { x: 1, y: -3, color: '#E74C3C' }, { x: 2, y: -3, color: '#FF6B6B' }, { x: 3, y: -3, color: '#E74C3C' },
      { x: -3, y: -2, color: '#E74C3C' }, { x: -2, y: -2, color: '#FFFFFF' }, { x: -1, y: -2, color: '#E74C3C' },
      { x: 0, y: -2, color: '#E74C3C' }, { x: 1, y: -2, color: '#E74C3C' }, { x: 2, y: -2, color: '#FFFFFF' },
      { x: 3, y: -2, color: '#E74C3C' },
      { x: -3, y: -1, color: '#E74C3C' }, { x: -2, y: -1, color: '#FF6B6B' }, { x: -1, y: -1, color: '#E74C3C' },
      { x: 0, y: -1, color: '#E74C3C' }, { x: 1, y: -1, color: '#E74C3C' }, { x: 2, y: -1, color: '#FF6B6B' },
      { x: 3, y: -1, color: '#E74C3C' },
      { x: -3, y: 0, color: '#E74C3C' }, { x: -2, y: 0, color: '#FFFFFF' }, { x: -1, y: 0, color: '#E74C3C' },
      { x: 0, y: 0, color: '#E74C3C' }, { x: 1, y: 0, color: '#E74C3C' }, { x: 2, y: 0, color: '#FFFFFF' },
      { x: 3, y: 0, color: '#E74C3C' },
      { x: -2, y: 1, color: '#E74C3C' }, { x: -1, y: 1, color: '#E74C3C' }, { x: 0, y: 1, color: '#E74C3C' },
      { x: 1, y: 1, color: '#E74C3C' }, { x: 2, y: 1, color: '#E74C3C' },
    ]
  }
};

// ==================== 绘制像素艺术的函数 ====================
const drawPixelArt = (ctx: CanvasRenderingContext2D, pixels: { x: number; y: number; color: string }[], x: number, y: number, scale: number = 1) => {
  pixels.forEach(pixel => {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(
      x + pixel.x * scale * 4,
      y + pixel.y * scale * 4,
      4 * scale,
      4 * scale
    );
  });
};

// ==================== 技能池 ====================
const SKILL_POOL: Skill[] = [
  {
    id: 'melee_damage',
    name: '剑术精通',
    description: '近战伤害 +25%',
    icon: <Swords className="w-6 h-6" />,
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.25 }),
    rarity: 'common',
    color: COLORS.common
  },
  {
    id: 'ranged_damage',
    name: '箭术精通',
    description: '远程伤害 +25%',
    icon: <Target className="w-6 h-6" />,
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.25 }),
    rarity: 'common',
    color: COLORS.common
  },
  {
    id: 'attack_speed',
    name: '迅捷之击',
    description: '攻击速度 +25%',
    icon: <Zap className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackSpeed: p.attackSpeed * 1.25 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'movement_speed',
    name: '疾风步',
    description: '移动速度 +20%',
    icon: <TrendingUp className="w-6 h-6" />,
    apply: (p) => ({ ...p, speed: p.speed * 1.2 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'max_hp',
    name: '钢铁之躯',
    description: '最大生命值 +50',
    icon: <Heart className="w-6 h-6" />,
    apply: (p) => ({ ...p, maxHp: p.maxHp + 50, hp: p.hp + 50 }),
    rarity: 'common',
    color: COLORS.common
  },
  {
    id: 'crit_rate',
    name: '致命一击',
    description: '暴击率 +15%',
    icon: <Crosshair className="w-6 h-6" />,
    apply: (p) => ({ ...p, critRate: Math.min(p.critRate + 0.15, 1) }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'attack_range',
    name: '范围扩大',
    description: '攻击范围 +30%',
    icon: <Shield className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.3 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'arrow_bounce',
    name: '弹射之箭',
    description: '箭矢可弹射 +3 次',
    icon: <Sparkles className="w-6 h-6" />,
    apply: (p) => ({ ...p, arrowCount: p.arrowCount + 3 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'fire_mastery',
    name: '火焰掌握',
    description: '远程投射物变为火球，伤害+50%',
    icon: <Flame className="w-6 h-6" />,
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.5 }),
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'critical_mastery',
    name: '暴击精通',
    description: '暴击伤害 +75%',
    icon: <Skull className="w-6 h-6" />,
    apply: (p) => ({ ...p, critMultiplier: p.critMultiplier * 1.75 }),
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'regen_boost',
    name: '生命恢复',
    description: '每秒回复生命值 +3',
    icon: <Heart className="w-6 h-6" />,
    apply: (p) => ({ ...p, regenRate: p.regenRate + 3 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'giant_slayer',
    name: '巨人杀手',
    description: '对Boss伤害 +100%',
    icon: <ShieldAlert className="w-6 h-6" />,
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.5, rangedDamage: p.rangedDamage * 1.5 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'blade_dance',
    name: '剑舞',
    description: '近战可以同时攻击3个敌人',
    icon: <Sparkles className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.4 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'berserker',
    name: '狂战士',
    description: '生命值越低，伤害越高（最高+100%）',
    icon: <Flame className="w-6 h-6" />,
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.5, rangedDamage: p.rangedDamage * 1.5 }),
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'champion',
    name: '冠军之心',
    description: '所有属性 +15%（生命值、伤害、速度）',
    icon: <Crown className="w-6 h-6" />,
    apply: (p) => ({
      ...p,
      maxHp: p.maxHp * 1.15,
      hp: p.hp * 1.15,
      meleeDamage: p.meleeDamage * 1.15,
      rangedDamage: p.rangedDamage * 1.15,
      speed: p.speed * 1.15
    }),
    rarity: 'mythic',
    color: COLORS.mythic
  },
  {
    id: 'vampirism',
    name: '吸血鬼之触',
    description: '造成伤害的10%转化为生命值',
    icon: <Ghost className="w-6 h-6" />,
    apply: (p) => ({ ...p, regenRate: p.regenRate + 5 }),
    rarity: 'epic',
    color: COLORS.epic
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
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uiUpdate, setUiUpdate] = useState(0);
  const [playerStats, setPlayerStats] = useState<Player | null>(null);

  // 游戏数据引用
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    expToNext: 80,
    speed: 5,
    attackSpeed: 1.5,
    lastAttack: 0,
    meleeDamage: 25,
    rangedDamage: 20,
    critRate: 0.12,
    critMultiplier: 2,
    attackRange: 100,
    arrowCount: 0,
    regenRate: 1.5,
    skills: [],
    totalKills: 0,
    totalDamage: 0
  });

  const monstersRef = useRef<Monster[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const slashEffectsRef = useRef<SlashEffect[]>([]);
  const screenShakeRef = useRef<ScreenShake>({ intensity: 0, duration: 0, x: 0, y: 0 });
  const monsterIdCounterRef = useRef(0);
  const projectileIdCounterRef = useRef(0);
  const gameTimeRef = useRef(0);
  const lastRegenTimeRef = useRef(0);

  // 音频上下文
  const audioContextRef = useRef<AudioContext | null>(null);

  // 输入状态
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const mouseAngleRef = useRef(0);

  // Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const monsterSpawnTimerRef = useRef<number>(0);
  const gameTimerRef = useRef<number>(0);
  const autoAttackTimerRef = useRef<number>(0);
  const uiUpdateTimerRef = useRef<number>(0);

  // ==================== 音频系统 ====================
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = useCallback((type: 'hit' | 'kill' | 'levelup' | 'shoot' | 'damage' | 'crit' | 'explosion' | 'slash' | 'heal') => {
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
        case 'slash':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.04);
          break;
        case 'hit':
          oscillator.frequency.setValueAtTime(250, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.06);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.06);
          break;
        case 'kill':
          oscillator.frequency.setValueAtTime(350, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.10);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.10);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.10);
          break;
        case 'crit':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.12);
          break;
        case 'levelup':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
          oscillator.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.25);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.25);
          break;
        case 'shoot':
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.03);
          break;
        case 'damage':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(150, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.12);
          break;
        case 'explosion':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(100, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'heal':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.10);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.10);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.10);
          break;
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

  // ==================== 难度计算 ====================
  const getDifficultyMultiplier = useCallback((): number => {
    const elapsed = GAME_DURATION - timeLeft;
    return 1 + (elapsed / 120) * 0.5;
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
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10, type: Particle['type'] = 'spark') => {
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const size = 2 + Math.random() * 3;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        color,
        size,
        type,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      });
    }
  }, []);

  // ==================== 刀光特效 ====================
  const createSlashEffect = useCallback((x: number, y: number, angle: number, type: SlashEffect['type'] = 'diagonal') => {
    slashEffectsRef.current.push({
      x,
      y,
      angle,
      life: 1,
      maxLife: 0.2,
      type
    });
  }, []);

  // ==================== 伤害数字 ====================
  const createDamageNumber = useCallback((x: number, y: number, damage: number, isCrit: boolean, isHeal: boolean = false) => {
    if (damageNumbersRef.current.length >= MAX_DAMAGE_NUMBERS) {
      damageNumbersRef.current.shift();
    }

    let color = isHeal ? '#00FF00' : (isCrit ? '#FF4757' : '#FFFFFF');
    damageNumbersRef.current.push({
      x: x + (Math.random() - 0.5) * 15,
      y,
      damage: Math.floor(damage),
      isCrit,
      life: 1,
      maxLife: 0.7,
      color,
      isHeal
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

    // 找到攻击范围内的所有敌人
    const targets = monstersRef.current
      .map(monster => ({
        monster,
        distance: Math.sqrt(Math.pow(monster.x - player.x, 2) + Math.pow(monster.y - player.y, 2))
      }))
      .filter(({ distance }) => distance < player.attackRange)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // 最多攻击3个敌人

    if (targets.length === 0) return;

    player.lastAttack = now;

    targets.forEach(({ monster, distance }) => {
      const isCrit = Math.random() < player.critRate;
      const damage = isCrit ? player.meleeDamage * player.critMultiplier : player.meleeDamage;

      const angle = Math.atan2(monster.y - player.y, monster.x - player.x);
      createSlashEffect(player.x, player.y, angle, 'diagonal');

      monster.hp -= damage;
      monster.isStunned = true;
      monster.stunnedTime = 400;

      createParticles(monster.x, monster.y, COLORS.blood, 8, 'blood');
      createDamageNumber(monster.x, monster.y, damage, isCrit);
      triggerScreenShake(isCrit ? 4 : 2, isCrit ? 0.12 : 0.08);
      playSound(isCrit ? 'crit' : 'slash');

      player.totalDamage += damage;

      if (monster.hp <= 0) {
        player.exp += monster.exp;
        player.totalKills++;
        createParticles(monster.x, monster.y, monster.color, 15, 'explosion');
        triggerScreenShake(4, 0.12);
        setScore(prev => prev + Math.floor(monster.exp));
        playSound('kill');
      }
    });
  }, [createParticles, createDamageNumber, createSlashEffect, playSound, triggerScreenShake]);

  const autoRangedAttack = useCallback(() => {
    const player = playerRef.current;
    const now = Date.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;

    player.lastAttack = now;

    // 使用预计算的鼠标角度
    const angle = mouseAngleRef.current;

    const isFireball = player.rangedDamage > 30;

    if (projectilesRef.current.length < MAX_PROJECTILES) {
      projectilesRef.current.push({
        id: projectileIdCounterRef.current++,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 15,
        vy: Math.sin(angle) * 15,
        damage: player.rangedDamage,
        speed: 15,
        bounceCount: player.arrowCount,
        angle,
        trail: [],
        type: isFireball ? 'fireball' : 'arrow',
        pierceCount: 0
      });
      playSound('shoot');
    }
  }, [playSound]);

  // ==================== 升级处理 ====================
  const handleLevelUp = useCallback(() => {
    const player = playerRef.current;
    player.level++;
    player.exp = 0;
    player.expToNext = Math.floor(player.expToNext * 1.5);

    const shuffled = [...SKILL_POOL].sort(() => Math.random() - 0.5);
    const selectedSkills = shuffled.slice(0, 3);
    setAvailableSkills(selectedSkills);
    setShowLevelUp(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    createParticles(player.x, player.y, COLORS.levelUp, 40, 'magic');
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
    const player = playerRef.current;

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    const margin = MONSTER_SPAWN_MARGIN;
    switch (side) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = -margin; break;
      case 1: x = CANVAS_WIDTH + margin; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + margin; break;
      case 3: x = -margin; y = Math.random() * CANVAS_HEIGHT; break;
      default: x = CANVAS_WIDTH / 2; y = -margin;
    }

    // 根据等级调整怪物类型概率
    const typeRoll = Math.random();
    let type: Monster['type'] = 'slime';

    if (player.level >= 2 && typeRoll > 0.60) type = 'skeleton';
    if (player.level >= 4 && typeRoll > 0.75) type = 'ghost';
    if (player.level >= 5 && typeRoll > 0.88) type = 'elite';
    if (player.level >= 7 && typeRoll > 0.96) type = 'boss';

    const monsterStats = {
      slime: { baseHp: 35, baseDamage: 10, baseSpeed: 2.5, baseExp: 15, baseSize: 20, color: COLORS.slimeMonster },
      skeleton: { baseHp: 50, baseDamage: 15, baseSpeed: 3, baseExp: 25, baseSize: 22, color: COLORS.skeletonMonster },
      ghost: { baseHp: 40, baseDamage: 18, baseSpeed: 3.5, baseExp: 30, baseSize: 20, color: COLORS.ghostMonster },
      elite: { baseHp: 80, baseDamage: 22, baseSpeed: 3, baseExp: 60, baseSize: 26, color: '#E74C3C' },
      boss: { baseHp: 300, baseDamage: 30, baseSpeed: 2, baseExp: 150, baseSize: 40, color: COLORS.bossMonster }
    };

    const stats = monsterStats[type];

    const monster: Monster = {
      id: monsterIdCounterRef.current++,
      x,
      y,
      hp: stats.baseHp * difficulty,
      maxHp: stats.baseHp * difficulty,
      damage: stats.baseDamage * difficulty,
      speed: stats.baseSpeed * (0.9 + Math.random() * 0.2),
      exp: Math.floor(stats.baseExp * difficulty),
      lastAttack: 0,
      size: stats.baseSize,
      color: stats.color,
      type,
      scale: 1,
      angle: 0,
      animationOffset: Math.random() * Math.PI * 2,
      isStunned: false,
      stunnedTime: 0,
      hasShield: type === 'elite' || type === 'boss',
      shieldHp: type === 'boss' ? 50 : 30
    };

    if (monstersRef.current.length < MAX_MONSTERS) {
      monstersRef.current.push(monster);
    }
  }, [getDifficultyMultiplier]);

  // ==================== 绘制背景 ====================
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // 深空渐变背景
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    gradient.addColorStop(0, '#1A1A2E');
    gradient.addColorStop(0.5, '#16213E');
    gradient.addColorStop(1, '#0F0F23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 滚动网格
    const tileSize = 60;
    const gridOffset = (gameTimeRef.current * 20) % tileSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;

    for (let x = -tileSize + gridOffset; x < CANVAS_WIDTH + tileSize; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = -tileSize + gridOffset; y < CANVAS_HEIGHT + tileSize; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 闪烁的星星
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137) % CANVAS_WIDTH);
      const y = ((i * 97) % CANVAS_HEIGHT);
      const twinkle = (Math.sin(gameTimeRef.current * 3 + i * 0.5) + 1) * 0.5;
      const size = (twinkle * 1.5 + 0.5);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

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

      let shakeX = 0, shakeY = 0;
      if (screenShakeRef.current.duration > 0) {
        const shakeRatio = screenShakeRef.current.duration / 0.15;
        screenShakeRef.current.duration -= deltaTime;
        shakeX = screenShakeRef.current.x * shakeRatio;
        shakeY = screenShakeRef.current.y * shakeRatio;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      drawBackground(ctx);

      const player = playerRef.current;

      // 玩家移动
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

        player.x = Math.max(PLAYER_SIZE + 10, Math.min(CANVAS_WIDTH - PLAYER_SIZE - 10, player.x));
        player.y = Math.max(PLAYER_SIZE + 10, Math.min(CANVAS_HEIGHT - PLAYER_SIZE - 10, player.y));

        if (Math.random() < 0.25) {
          createParticles(player.x, player.y + PLAYER_SIZE, '#555', 1, 'dust');
        }
      }

      // 生命恢复
      lastRegenTimeRef.current += deltaTime;
      if (lastRegenTimeRef.current >= 1 && player.regenRate > 0) {
        lastRegenTimeRef.current = 0;
        if (player.hp < player.maxHp) {
          const healAmount = Math.min(player.regenRate, player.maxHp - player.hp);
          player.hp += healAmount;
          if (healAmount > 0.5) {
            createDamageNumber(player.x, player.y - 20, healAmount, false, true);
            playSound('heal');
          }
        }
      }

      // UI更新
      uiUpdateTimerRef.current += deltaTime;
      if (uiUpdateTimerRef.current >= 0.1) {
        uiUpdateTimerRef.current = 0;
        setUiUpdate(prev => prev + 1);
        setPlayerStats({ ...player });
      }

      // 生成怪物
      const difficulty = getDifficultyMultiplier();
      monsterSpawnTimerRef.current += deltaTime;
      const spawnInterval = Math.max(0.3, 1.5 - difficulty * 0.4);

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

      // 更新怪物
      monstersRef.current = monstersRef.current.filter(monster => {
        const mdx = player.x - monster.x;
        const mdy = player.y - monster.y;
        const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDistance > 1) {
          const moveSpeed = monster.speed * (monster.isStunned ? 0 : 1);
          monster.x += (mdx / mDistance) * moveSpeed;
          monster.y += (mdy / mDistance) * moveSpeed;
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
          if (now - monster.lastAttack > 800) {
            // 护盾优先吸收伤害
            let damage = monster.damage;
            if (monster.hasShield && monster.shieldHp > 0) {
              const absorbed = Math.min(damage, monster.shieldHp);
              monster.shieldHp -= absorbed;
              damage -= absorbed;
              createParticles(monster.x, monster.y, '#3498DB', 5, 'spark');
            }

            if (damage > 0) {
              player.hp -= damage;
              monster.lastAttack = now;
              createDamageNumber(player.x, player.y, damage, false);
              triggerScreenShake(6, 0.25);
              playSound('damage');
              createParticles(player.x, player.y, COLORS.player, 8, 'blood');
            }

            if (player.hp <= 0) {
              endGame();
              return false;
            }
          }
        }

        // 绘制怪物（使用像素艺术）
        ctx.save();
        ctx.translate(monster.x, monster.y);

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, monster.size * 0.4, monster.size * 0.7, monster.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 动画偏移
        const bounce = Math.sin(gameTimeRef.current * 6 + monster.animationOffset) * 2;
        const scale = monster.type === 'boss' ? 1.5 : (monster.type === 'elite' ? 1.2 : 1);
        ctx.translate(0, bounce);
        ctx.scale(scale, scale);

        // 绘制像素艺术怪物
        const monsterArt = PIXEL_ART.monsters[monster.type];
        if (monsterArt) {
          drawPixelArt(ctx, monsterArt, -8, -8, 1);
        } else {
          // 回退到圆形
          ctx.fillStyle = monster.color;
          ctx.beginPath();
          ctx.arc(0, 0, monster.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 护盾效果
        if (monster.hasShield && monster.shieldHp > 0) {
          ctx.strokeStyle = '#3498DB';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.7 + Math.sin(gameTimeRef.current * 4) * 0.3;
          ctx.beginPath();
          ctx.arc(0, 0, monster.size + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.restore();

        // 怪物血条
        const hpPercent = monster.hp / monster.maxHp;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(monster.x - monster.size - 2, monster.y - monster.size - 12, monster.size * 2 + 4, 6);
        ctx.fillStyle = hpPercent > 0.3 ? '#4CAF50' : '#FF5252';
        ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 10, monster.size * 2 * hpPercent, 4);

        // 护盾条
        if (monster.hasShield && monster.shieldHp > 0) {
          const shieldMaxHp = monster.type === 'boss' ? 50 : 30;
          const shieldPercent = monster.shieldHp / shieldMaxHp;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(monster.x - monster.size - 2, monster.y - monster.size - 18, monster.size * 2 + 4, 4);
          ctx.fillStyle = '#3498DB';
          ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 17, monster.size * 2 * shieldPercent, 2);
        }

        return monster.hp > 0;
      });

      // 更新投射物
      projectilesRef.current = projectilesRef.current.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        projectile.trail.push({ x: projectile.x, y: projectile.y, life: 1 });
        if (projectile.trail.length > 20) projectile.trail.shift();
        projectile.trail.forEach(t => t.life -= deltaTime * 10);

        // 边界弹射
        if (projectile.x <= 0 || projectile.x >= CANVAS_WIDTH) {
          projectile.vx *= -1;
          projectile.bounceCount--;
        }
        if (projectile.y <= 0 || projectile.y >= CANVAS_HEIGHT) {
          projectile.vy *= -1;
          projectile.bounceCount--;
        }

        // 绘制轨迹
        ctx.strokeStyle = projectile.type === 'fireball' ? '#FF6B6B' : COLORS.projectileGlow;
        ctx.lineWidth = 3;
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

        // 绘制投射物
        const glowColor = projectile.type === 'fireball' ? '#FF6B6B' : COLORS.projectileGlow;
        const glowSize = projectile.type === 'fireball' ? 16 : 12;
        const glow = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, glowSize);
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, 'rgba(255, 165, 2, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = projectile.type === 'fireball' ? COLORS.fireball : COLORS.projectile;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.type === 'fireball' ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // 碰撞检测
        let hit = false;
        for (const monster of monstersRef.current) {
          const hitRadius = projectile.type === 'fireball' ? 10 : 6;
          if (checkCollision(projectile.x, projectile.y, hitRadius, monster.x, monster.y, monster.size)) {
            const isCrit = Math.random() < player.critRate;
            let damage = isCrit ? projectile.damage * player.critMultiplier : projectile.damage;

            // 护盾优先吸收伤害
            if (monster.hasShield && monster.shieldHp > 0) {
              const absorbed = Math.min(damage, monster.shieldHp);
              monster.shieldHp -= absorbed;
              damage -= absorbed;
              createParticles(monster.x, monster.y, '#3498DB', 5, 'spark');
            }

            if (damage > 0) {
              monster.hp -= damage;
              createParticles(projectile.x, projectile.y, COLORS.spark, 6, 'spark');
              createDamageNumber(monster.x, monster.y, damage, isCrit);
              playSound(isCrit ? 'crit' : 'hit');
              triggerScreenShake(isCrit ? 3 : 1.5, isCrit ? 0.1 : 0.06);
            }

            player.totalDamage += damage;

            if (monster.hp <= 0) {
              player.exp += monster.exp;
              player.totalKills++;
              createParticles(monster.x, monster.y, monster.color, 12, 'explosion');
              setScore(prev => prev + Math.floor(monster.exp));
              playSound('kill');
            }

            hit = true;
            break;
          }
        }

        if (hit) {
          if (projectile.pierceCount > 0) {
            projectile.pierceCount--;
            return true;
          }
          if (projectile.bounceCount <= 0) {
            return false;
          }
        }

        if (projectile.x < -60 || projectile.x > CANVAS_WIDTH + 60 ||
            projectile.y < -60 || projectile.y > CANVAS_HEIGHT + 60 ||
            projectile.bounceCount < 0) {
          return false;
        }

        return true;
      });

      // 更新刀光特效
      slashEffectsRef.current = slashEffectsRef.current.filter(slash => {
        slash.life -= deltaTime / slash.maxLife;

        if (slash.life <= 0) return false;

        const alpha = slash.life;
        ctx.globalAlpha = alpha;

        ctx.save();
        ctx.translate(slash.x, slash.y);
        ctx.rotate(slash.angle);

        ctx.strokeStyle = COLORS.slash;
        ctx.lineWidth = 4;
        ctx.shadowColor = COLORS.slash;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(35, -25, 70, 0);
        ctx.quadraticCurveTo(35, 8, 0, 0);
        ctx.stroke();

        ctx.restore();
        ctx.globalAlpha = 1;

        return true;
      });

      // 更新粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life -= deltaTime;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2;
        particle.rotation += particle.rotationSpeed;

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
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
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
        } else if (particle.type === 'dust') {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        return true;
      });

      // 更新伤害数字
      damageNumbersRef.current = damageNumbersRef.current.filter(dn => {
        dn.life -= deltaTime;
        dn.y -= 2.5;

        if (dn.life <= 0) return false;

        const alpha = dn.life / dn.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = dn.color;
        ctx.font = dn.isCrit ? 'bold 36px Arial, sans-serif' : 'bold 28px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = dn.color;
        ctx.shadowBlur = dn.isHeal ? 6 : 10;
        ctx.fillText(dn.damage.toString(), dn.x, dn.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        return true;
      });

      // 绘制玩家
      ctx.save();
      ctx.translate(player.x, player.y);

      // 阴影
      drawPixelArt(ctx, PIXEL_ART.player.shadow, 0, 0, 1);

      // 玩家光晕
      const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, PLAYER_SIZE * 2.5);
      playerGlow.addColorStop(0, COLORS.playerGlow);
      playerGlow.addColorStop(1, 'rgba(255, 71, 87, 0)');
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_SIZE * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 绘制像素艺术玩家
      drawPixelArt(ctx, PIXEL_ART.player.body, -8, -8, 1);

      // 武器（指向鼠标方向）
      ctx.save();
      ctx.rotate(mouseAngleRef.current);
      ctx.translate(0, -8);
      drawPixelArt(ctx, PIXEL_ART.sword.handle, 0, 0, 0.8);
      drawPixelArt(ctx, PIXEL_ART.sword.blade, 0, 0, 0.8);
      ctx.restore();

      ctx.restore();

      // 玩家血条
      const hpPercent = player.hp / player.maxHp;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 20, 60, 8);
      ctx.fillStyle = hpPercent > 0.3 ? COLORS.hpBar : COLORS.hpBarLow;
      ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 20, 60 * hpPercent, 8);

      // 玩家经验条
      const expPercent = player.exp / player.expToNext;
      ctx.fillStyle = COLORS.expBarBackground;
      ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 28, 60, 5);
      ctx.fillStyle = COLORS.expBar;
      ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 28, 60 * expPercent, 5);

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
  }, [checkCollision, createDamageNumber, createParticles, getDifficultyMultiplier, handleLevelUp, autoMeleeAttack, autoRangedAttack, spawnMonster, playSound, triggerScreenShake, createSlashEffect, drawBackground]);

  // ==================== 游戏控制 ====================
  const startGame = () => {
    console.log('Starting game...');
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setShowTutorial(false);
    setShowLevelUp(false);
    setUiUpdate(0);
    setPlayerStats(null);

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
      expToNext: 80,
      speed: 5,
      attackSpeed: 1.5,
      lastAttack: 0,
      meleeDamage: 25,
      rangedDamage: 20,
      critRate: 0.12,
      critMultiplier: 2,
      attackRange: 100,
      arrowCount: 0,
      regenRate: 1.5,
      skills: [],
      totalKills: 0,
      totalDamage: 0
    };

    monstersRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageNumbersRef.current = [];
    slashEffectsRef.current = [];
    screenShakeRef.current = { intensity: 0, duration: 0, x: 0, y: 0 };
    monsterIdCounterRef.current = 0;
    projectileIdCounterRef.current = 0;
    monsterSpawnTimerRef.current = 0;
    autoAttackTimerRef.current = 0;
    gameTimeRef.current = 0;
    lastRegenTimeRef.current = 0;
    uiUpdateTimerRef.current = 0;

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
          drawBackground(ctx);
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
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      mouseRef.current.x = mouseX;
      mouseRef.current.y = mouseY;

      // 预计算角度，避免每帧重复计算
      const dx = mouseX - playerRef.current.x;
      const dy = mouseY - playerRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 1) {
        mouseAngleRef.current = Math.atan2(dy, dx);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ==================== 提交结果 ====================
  const handleSubmit = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const player = playerRef.current;
      const metadata = [score, player.level, player.totalKills, player.totalDamage];
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

  const player = playerStats || playerRef.current;

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
                          <li>• 每次升级从3个技能中选择1个</li>
                          <li>• 难度随时间逐渐增加</li>
                          <li>• 主角会缓慢恢复生命值</li>
                          <li>• 5种怪物类型：史莱姆、骷髅、幽灵、精英、Boss</li>
                          <li>• 精英和Boss拥有护盾</li>
                          <li>• 护盾优先承受伤害</li>
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

                <div ref={containerRef} className="relative rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10 aspect-video bg-black">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

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
                      <p>击杀数：{player.totalKills}</p>
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

          <AnimatePresence>
            {showLevelUp && availableSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-4xl w-full border border-purple-500/30 shadow-2xl"
                >
                  <h3 className="text-2xl font-bold text-center text-yellow-400 mb-6 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    升级了！选择一个技能
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availableSkills.map((skill, index) => (
                      <Button
                        key={skill.id}
                        onClick={() => selectSkill(skill)}
                        className="h-auto p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 flex flex-col items-center gap-4 transition-all hover:scale-105"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                          {skill.icon}
                        </div>
                        <div className="text-left w-full">
                          <div className="flex items-center gap-2 mb-1 justify-center">
                            <p className="font-semibold text-white text-lg">{skill.name}</p>
                          </div>
                          <div className="flex justify-center mb-2">
                            <div
                              className="px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor: skill.color, color: '#FFFFFF' }}
                            >
                              {skill.rarity.toUpperCase()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 text-center">{skill.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
