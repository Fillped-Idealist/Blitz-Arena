'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

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
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
const WORLD_WIDTH = 3200;  // 游戏世界总宽度
const WORLD_HEIGHT = 1800;  // 游戏世界总高度
const PLAYER_SIZE = 20;
const MAX_MONSTERS = 120;
const MAX_PROJECTILES = 100;
const MAX_PARTICLES = 500;
const MAX_DAMAGE_NUMBERS = 80;
const MONSTER_SPAWN_MARGIN = 250;

// ==================== 颜色配置 ====================
const COLORS = {
  player: '#FF4757',
  playerGlow: 'rgba(255, 71, 87, 0.35)',
  playerOutline: '#C92A2A',
  playerWeapon: '#7ED6DF',
  slimeMonster: '#2ED573',
  skeletonMonster: '#A4B0BE',
  ghostMonster: '#70A1FF',
  bossMonster: '#9B59B6',
  eliteMonster: '#E74C3C',
  projectile: '#FFA502',
  projectileGlow: 'rgba(255, 165, 2, 0.6)',
  fireball: '#FF6B6B',
  blood: '#8B0000',
  spark: '#FFD700',
  levelUp: '#00FF00',
  slash: '#FFFFFF',
  hpBar: '#00CEC9',
  hpBarLow: '#FF7675',
  expBar: '#7ED6DF',
  expBarBackground: '#2D3436',
  shieldBar: '#3498DB',
  common: '#95A5A6',
  rare: '#3498DB',
  epic: '#9B59B6',
  legendary: '#F1C40F',
  mythic: '#E74C3C',
  backgroundStart: '#1A1A2E',
  backgroundEnd: '#0F0F23',
  obstacle: '#57606F',
  obstacleHighlight: '#747D8C'
};

// ==================== 游戏状态枚举 ====================
enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_UP = 'LEVEL_UP',
  GAME_OVER = 'GAME_OVER'
}

// ==================== 游戏状态接口 ====================
interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  expToNext: number;
  speed: number;
  baseSpeed: number;
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
  gameTime: number;
  invincible: boolean;
  invincibleTime: number;
  autoLockLevel: number;  // 自动锁敌技能等级（0=未解锁，1=已解锁）
  trackingMasteryLevel: number;  // 追踪精通等级（每级+20%伤害）
}

interface Monster {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  exp: number;
  lastAttack: number;
  size: number;
  color: string;
  type: 'slime' | 'skeleton' | 'ghost' | 'boss' | 'elite' | 'melee_boss';
  scale: number;
  angle: number;
  animationOffset: number;
  isStunned: boolean;
  stunnedTime: number;
  hasShield: boolean;
  shieldHp: number;
  shieldMaxHp: number;
  currentPhase: number;
  phaseTimer: number;
  abilityCooldown: number;
  lastAbilityTime: number;
  // 近战Boss冲刺技能相关
  isCharging: boolean;
  chargeStartTime: number;
  chargeDirection: { x: number; y: number };
  chargeTrail: { x: number; y: number; life: number }[];
  meleeBossSpawnIndex: number; // 近战Boss生成序号（用于计算属性成长）
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
  owner: 'player' | 'monster';
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
  type: 'blood' | 'spark' | 'explosion' | 'magic' | 'dust' | 'slash' | 'ice' | 'fire' | 'heal' | 'shield';
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
  scale: number;
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
  type: 'horizontal' | 'vertical' | 'diagonal' | 'spin';
}

interface MagicCircle {
  id: number;
  monsterId: number;  // 锁定的怪物ID
  x: number;  // 怪物的当前位置
  y: number;
  damage: number;  // 法阵造成的伤害
  duration: number;  // 法阵持续时间
  startTime: number;  // 法阵开始时间
  radius: number;  // 法阵半径
  rotation: number;  // 当前旋转角度
  particles: { angle: number; distance: number; speed: number; life: number; maxLife: number; color: string; }[];  // 法阵粒子
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'rock' | 'tree';
  health: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive';
  apply: (player: Player) => Player;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  color: string;
  icon?: { x: number; y: number; color: string }[];
}

// ==================== 像素艺术数据 ====================
const PIXEL_ART = {
  player: {
    body: [
      { x: -3, y: -2, color: '#FF4757' }, { x: -2, y: -2, color: '#FF4757' }, { x: -1, y: -2, color: '#FF6B6B' },
      { x: 0, y: -2, color: '#FF6B6B' }, { x: 1, y: -2, color: '#FF6B6B' }, { x: 2, y: -2, color: '#FF4757' },
      { x: 3, y: -2, color: '#FF4757' },
      { x: -3, y: -1, color: '#FF4757' }, { x: -2, y: -1, color: '#FFF' }, { x: -1, y: -1, color: '#FF4757' },
      { x: 0, y: -1, color: '#C92A2A' }, { x: 1, y: -1, color: '#FF4757' }, { x: 2, y: -1, color: '#FFF' },
      { x: 3, y: -1, color: '#FF4757' },
      { x: -3, y: 0, color: '#FF4757' }, { x: -2, y: 0, color: '#FF4757' }, { x: -1, y: 0, color: '#FF4757' },
      { x: 0, y: 0, color: '#FF4757' }, { x: 1, y: 0, color: '#FF4757' }, { x: 2, y: 0, color: '#FF4757' },
      { x: 3, y: 0, color: '#FF4757' },
      { x: -2, y: 1, color: '#FF4757' }, { x: -1, y: 1, color: '#FF4757' }, { x: 0, y: 1, color: '#FF4757' },
      { x: 1, y: 1, color: '#FF4757' }, { x: 2, y: 1, color: '#FF4757' },
      { x: -1, y: 2, color: '#FF4757' }, { x: 0, y: 2, color: '#FF4757' }, { x: 1, y: 2, color: '#FF4757' },
    ],
    weapon: {
      sword: [
        { x: 0, y: -8, color: '#C0C0C0' },
        { x: 0, y: -7, color: '#E8E8E8' }, { x: -1, y: -7, color: '#C0C0C0' }, { x: 1, y: -7, color: '#C0C0C0' },
        { x: 0, y: -6, color: '#C0C0C0' }, { x: -1, y: -6, color: '#E8E8E8' }, { x: 1, y: -6, color: '#E8E8E8' },
        { x: 0, y: -5, color: '#E8E8E8' }, { x: -1, y: -5, color: '#C0C0C0' }, { x: 1, y: -5, color: '#C0C0C0' },
        { x: 0, y: -4, color: '#C0C0C0' }, { x: -1, y: -4, color: '#E8E8E8' }, { x: 1, y: -4, color: '#E8E8E8' },
        { x: 0, y: -3, color: '#E8E8E8' }, { x: -1, y: -3, color: '#C0C0C0' }, { x: 1, y: -3, color: '#C0C0C0' },
        { x: 0, y: -2, color: '#C0C0C0' }, { x: -1, y: -2, color: '#E8E8E8' }, { x: 1, y: -2, color: '#E8E8E8' },
        { x: 0, y: -1, color: '#DAA520' }, { x: -1, y: -1, color: '#8B4513' }, { x: 1, y: -1, color: '#8B4513' },
        { x: 0, y: 0, color: '#DAA520' },
        { x: 0, y: 1, color: '#8B4513' },
        { x: -1, y: 2, color: '#8B4513' }, { x: 0, y: 2, color: '#8B4513' }, { x: 1, y: 2, color: '#8B4513' },
      ],
      bow: [
        { x: 0, y: -8, color: '#8B4513' },
        { x: -1, y: -7, color: '#8B4513' }, { x: 0, y: -7, color: '#A0522D' }, { x: 1, y: -7, color: '#8B4513' },
        { x: -2, y: -6, color: '#8B4513' }, { x: 2, y: -6, color: '#8B4513' },
        { x: -2, y: -5, color: '#8B4513' }, { x: 2, y: -5, color: '#8B4513' },
        { x: -2, y: -4, color: '#8B4513' }, { x: 2, y: -4, color: '#8B4513' },
        { x: -1, y: -3, color: '#8B4513' }, { x: 0, y: -3, color: '#A0522D' }, { x: 1, y: -3, color: '#8B4513' },
        { x: 0, y: -2, color: '#8B4513' },
      ],
      staff: [
        { x: 0, y: -8, color: '#70A1FF' }, { x: -1, y: -8, color: '#5DADE2' }, { x: 1, y: -8, color: '#5DADE2' },
        { x: 0, y: -7, color: '#70A1FF' },
        { x: 0, y: -6, color: '#8B4513' },
        { x: 0, y: -5, color: '#A0522D' },
        { x: 0, y: -4, color: '#8B4513' },
        { x: 0, y: -3, color: '#A0522D' },
        { x: 0, y: -2, color: '#8B4513' },
        { x: 0, y: -1, color: '#DAA520' }, { x: -1, y: -1, color: '#8B4513' }, { x: 1, y: -1, color: '#8B4513' },
        { x: 0, y: 0, color: '#DAA520' },
        { x: 0, y: 1, color: '#8B4513' },
      ]
    }
  },
  monsters: {
    slime: [
      { x: -2, y: 2, color: '#2ED573' }, { x: -1, y: 2, color: '#2ED573' }, { x: 0, y: 2, color: '#2ED573' },
      { x: 1, y: 2, color: '#2ED573' }, { x: 2, y: 2, color: '#2ED573' },
      { x: -2, y: 1, color: '#2ED573' }, { x: -1, y: 1, color: '#5DF078' }, { x: 0, y: 1, color: '#5DF078' },
      { x: 1, y: 1, color: '#5DF078' }, { x: 2, y: 1, color: '#2ED573' },
      { x: -2, y: 0, color: '#2ED573' }, { x: -1, y: 0, color: '#5DF078' }, { x: 0, y: 0, color: '#7ED6DF' },
      { x: 1, y: 0, color: '#5DF078' }, { x: 2, y: 0, color: '#2ED573' },
      { x: -1, y: -1, color: '#2ED573' }, { x: 0, y: -1, color: '#2ED573' }, { x: 1, y: -1, color: '#2ED573' },
    ],
    skeleton: [
      { x: 0, y: -4, color: '#A4B0BE' },
      { x: -2, y: -3, color: '#A4B0BE' }, { x: -1, y: -3, color: '#D4DBE0' }, { x: 0, y: -3, color: '#A4B0BE' },
      { x: 1, y: -3, color: '#D4DBE0' }, { x: 2, y: -3, color: '#A4B0BE' },
      { x: -2, y: -2, color: '#A4B0BE' }, { x: -1, y: -2, color: '#FF6B6B' }, { x: 0, y: -2, color: '#A4B0BE' },
      { x: 1, y: -2, color: '#FF6B6B' }, { x: 2, y: -2, color: '#A4B0BE' },
      { x: -2, y: -1, color: '#A4B0BE' }, { x: -1, y: -1, color: '#FF6B6B' }, { x: 0, y: -1, color: '#A4B0BE' },
      { x: 1, y: -1, color: '#FF6B6B' }, { x: 2, y: -1, color: '#A4B0BE' },
      { x: -2, y: 0, color: '#A4B0BE' }, { x: -1, y: 0, color: '#A4B0BE' }, { x: 0, y: 0, color: '#A4B0BE' },
      { x: 1, y: 0, color: '#A4B0BE' }, { x: 2, y: 0, color: '#A4B0BE' },
      { x: -1, y: 1, color: '#A4B0BE' }, { x: 0, y: 1, color: '#A4B0BE' }, { x: 1, y: 1, color: '#A4B0BE' },
      { x: -1, y: 2, color: '#A4B0BE' }, { x: 0, y: 2, color: '#A4B0BE' }, { x: 1, y: 2, color: '#A4B0BE' },
    ],
    ghost: [
      { x: 0, y: -3, color: '#70A1FF' },
      { x: -2, y: -2, color: '#70A1FF' }, { x: -1, y: -2, color: '#85C1E9' }, { x: 0, y: -2, color: '#70A1FF' },
      { x: 1, y: -2, color: '#85C1E9' }, { x: 2, y: -2, color: '#70A1FF' },
      { x: -2, y: -1, color: '#70A1FF' }, { x: -1, y: -1, color: '#FFFFFF' }, { x: 0, y: -1, color: '#70A1FF' },
      { x: 1, y: -1, color: '#FFFFFF' }, { x: 2, y: -1, color: '#70A1FF' },
      { x: -2, y: 0, color: '#70A1FF' }, { x: -1, y: 0, color: '#FFFFFF' }, { x: 0, y: 0, color: '#70A1FF' },
      { x: 1, y: 0, color: '#FFFFFF' }, { x: 2, y: 0, color: '#70A1FF' },
      { x: -2, y: 1, color: '#70A1FF' }, { x: -1, y: 1, color: '#FFFFFF' }, { x: 0, y: 1, color: '#70A1FF' },
      { x: 1, y: 1, color: '#FFFFFF' }, { x: 2, y: 1, color: '#70A1FF' },
      { x: -2, y: 2, color: '#70A1FF' }, { x: 0, y: 2, color: '#70A1FF' }, { x: 2, y: 2, color: '#70A1FF' },
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
    ],
    boss: [
      { x: -4, y: -5, color: '#9B59B6' }, { x: -3, y: -5, color: '#9B59B6' }, { x: 3, y: -5, color: '#9B59B6' },
      { x: 4, y: -5, color: '#9B59B6' },
      { x: -4, y: -4, color: '#9B59B6' }, { x: -3, y: -4, color: '#BB6BB6' }, { x: -2, y: -4, color: '#9B59B6' },
      { x: 2, y: -4, color: '#9B59B6' }, { x: 3, y: -4, color: '#BB6BB6' }, { x: 4, y: -4, color: '#9B59B6' },
      { x: -4, y: -3, color: '#9B59B6' }, { x: -3, y: -3, color: '#BB6BB6' }, { x: -2, y: -3, color: '#9B59B6' },
      { x: 2, y: -3, color: '#9B59B6' }, { x: 3, y: -3, color: '#BB6BB6' }, { x: 4, y: -3, color: '#9B59B6' },
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
    melee_boss: [
      // 近战Boss像素艺术（更大体型）
      { x: -6, y: -6, color: '#E74C3C' }, { x: -5, y: -6, color: '#E74C3C' }, { x: -4, y: -6, color: '#C0392B' },
      { x: 4, y: -6, color: '#E74C3C' }, { x: 5, y: -6, color: '#E74C3C' }, { x: 6, y: -6, color: '#C0392B' },
      { x: -6, y: -5, color: '#E74C3C' }, { x: -5, y: -5, color: '#FF6B6B' }, { x: -4, y: -5, color: '#E74C3C' },
      { x: -3, y: -5, color: '#C0392B' }, { x: 3, y: -5, color: '#C0392B' }, { x: 4, y: -5, color: '#E74C3C' },
      { x: 5, y: -5, color: '#FF6B6B' }, { x: 6, y: -5, color: '#E74C3C' },
      { x: -5, y: -4, color: '#E74C3C' }, { x: -4, y: -4, color: '#FF6B6B' }, { x: -3, y: -4, color: '#E74C3C' },
      { x: -2, y: -4, color: '#C0392B' }, { x: -1, y: -4, color: '#E74C3C' }, { x: 1, y: -4, color: '#E74C3C' },
      { x: 2, y: -4, color: '#C0392B' }, { x: 3, y: -4, color: '#E74C3C' }, { x: 4, y: -4, color: '#FF6B6B' },
      { x: 5, y: -4, color: '#E74C3C' },
      { x: -4, y: -3, color: '#E74C3C' }, { x: -3, y: -3, color: '#FFFFFF' }, { x: -2, y: -3, color: '#E74C3C' },
      { x: -1, y: -3, color: '#C0392B' }, { x: 0, y: -3, color: '#E74C3C' }, { x: 1, y: -3, color: '#C0392B' },
      { x: 2, y: -3, color: '#E74C3C' }, { x: 3, y: -3, color: '#FFFFFF' }, { x: 4, y: -3, color: '#E74C3C' },
      { x: -3, y: -2, color: '#E74C3C' }, { x: -2, y: -2, color: '#FF6B6B' }, { x: -1, y: -2, color: '#E74C3C' },
      { x: 0, y: -2, color: '#C0392B' }, { x: 1, y: -2, color: '#E74C3C' }, { x: 2, y: -2, color: '#FF6B6B' },
      { x: 3, y: -2, color: '#E74C3C' },
      { x: -3, y: -1, color: '#E74C3C' }, { x: -2, y: -1, color: '#FFFFFF' }, { x: -1, y: -1, color: '#E74C3C' },
      { x: 0, y: -1, color: '#C0392B' }, { x: 1, y: -1, color: '#E74C3C' }, { x: 2, y: -1, color: '#FFFFFF' },
      { x: 3, y: -1, color: '#E74C3C' },
      { x: -4, y: 0, color: '#E74C3C' }, { x: -3, y: 0, color: '#FF6B6B' }, { x: -2, y: 0, color: '#E74C3C' },
      { x: -1, y: 0, color: '#C0392B' }, { x: 0, y: 0, color: '#E74C3C' }, { x: 1, y: 0, color: '#C0392B' },
      { x: 2, y: 0, color: '#E74C3C' }, { x: 3, y: 0, color: '#FF6B6B' }, { x: 4, y: 0, color: '#E74C3C' },
      { x: -3, y: 1, color: '#E74C3C' }, { x: -2, y: 1, color: '#FFFFFF' }, { x: -1, y: 1, color: '#E74C3C' },
      { x: 0, y: 1, color: '#C0392B' }, { x: 1, y: 1, color: '#E74C3C' }, { x: 2, y: 1, color: '#FFFFFF' },
      { x: 3, y: 1, color: '#E74C3C' },
      { x: -3, y: 2, color: '#E74C3C' }, { x: -2, y: 2, color: '#FF6B6B' }, { x: -1, y: 2, color: '#E74C3C' },
      { x: 0, y: 2, color: '#C0392B' }, { x: 1, y: 2, color: '#E74C3C' }, { x: 2, y: 2, color: '#FF6B6B' },
      { x: 3, y: 2, color: '#E74C3C' },
      { x: -2, y: 3, color: '#E74C3C' }, { x: -1, y: 3, color: '#E74C3C' }, { x: 0, y: 3, color: '#E74C3C' },
      { x: 1, y: 3, color: '#E74C3C' }, { x: 2, y: 3, color: '#E74C3C' },
    ]
  },
  magicCircle: {
    // 外圈（金色）
    outerRing: [
      // 上方弧
      { x: -12, y: 0, color: '#F1C40F' }, { x: -11, y: -3, color: '#FFD700' },
      { x: -10, y: -5, color: '#F1C40F' }, { x: -9, y: -6, color: '#FFD700' },
      { x: -8, y: -7, color: '#F1C40F' }, { x: -7, y: -8, color: '#FFD700' },
      { x: -6, y: -9, color: '#F1C40F' }, { x: -5, y: -10, color: '#FFD700' },
      { x: -4, y: -11, color: '#F1C40F' }, { x: -3, y: -11, color: '#FFD700' },
      { x: -2, y: -12, color: '#F1C40F' }, { x: -1, y: -12, color: '#FFD700' },
      { x: 0, y: -12, color: '#F1C40F' }, { x: 1, y: -12, color: '#FFD700' },
      { x: 2, y: -12, color: '#F1C40F' }, { x: 3, y: -11, color: '#FFD700' },
      { x: 4, y: -11, color: '#F1C40F' }, { x: 5, y: -10, color: '#FFD700' },
      { x: 6, y: -9, color: '#F1C40F' }, { x: 7, y: -8, color: '#FFD700' },
      { x: 8, y: -7, color: '#F1C40F' }, { x: 9, y: -6, color: '#FFD700' },
      { x: 10, y: -5, color: '#F1C40F' }, { x: 11, y: -3, color: '#FFD700' },
      { x: 12, y: 0, color: '#F1C40F' },
      // 下方弧
      { x: 11, y: 3, color: '#FFD700' }, { x: 10, y: 5, color: '#F1C40F' },
      { x: 9, y: 6, color: '#FFD700' }, { x: 8, y: 7, color: '#F1C40F' },
      { x: 7, y: 8, color: '#FFD700' }, { x: 6, y: 9, color: '#F1C40F' },
      { x: 5, y: 10, color: '#FFD700' }, { x: 4, y: 11, color: '#F1C40F' },
      { x: 3, y: 11, color: '#FFD700' }, { x: 2, y: 12, color: '#F1C40F' },
      { x: 1, y: 12, color: '#FFD700' }, { x: 0, y: 12, color: '#F1C40F' },
      { x: -1, y: 12, color: '#FFD700' }, { x: -2, y: 12, color: '#F1C40F' },
      { x: -3, y: 11, color: '#FFD700' }, { x: -4, y: 11, color: '#F1C40F' },
      { x: -5, y: 10, color: '#FFD700' }, { x: -6, y: 9, color: '#F1C40F' },
      { x: -7, y: 8, color: '#FFD700' }, { x: -8, y: 7, color: '#F1C40F' },
      { x: -9, y: 6, color: '#FFD700' }, { x: -10, y: 5, color: '#F1C40F' },
      { x: -11, y: 3, color: '#FFD700' },
    ],
    // 中圈（紫色）
    middleRing: [
      { x: -8, y: 0, color: '#9B59B6' }, { x: -7, y: -2, color: '#BB6BB6' },
      { x: -6, y: -4, color: '#9B59B6' }, { x: -5, y: -5, color: '#BB6BB6' },
      { x: -4, y: -6, color: '#9B59B6' }, { x: -3, y: -6, color: '#BB6BB6' },
      { x: -2, y: -7, color: '#9B59B6' }, { x: -1, y: -7, color: '#BB6BB6' },
      { x: 0, y: -7, color: '#9B59B6' }, { x: 1, y: -7, color: '#BB6BB6' },
      { x: 2, y: -7, color: '#9B59B6' }, { x: 3, y: -6, color: '#BB6BB6' },
      { x: 4, y: -6, color: '#9B59B6' }, { x: 5, y: -5, color: '#BB6BB6' },
      { x: 6, y: -4, color: '#9B59B6' }, { x: 7, y: -2, color: '#BB6BB6' },
      { x: 8, y: 0, color: '#9B59B6' },
      { x: 7, y: 2, color: '#BB6BB6' }, { x: 6, y: 4, color: '#9B59B6' },
      { x: 5, y: 5, color: '#BB6BB6' }, { x: 4, y: 6, color: '#9B59B6' },
      { x: 3, y: 6, color: '#BB6BB6' }, { x: 2, y: 7, color: '#9B59B6' },
      { x: 1, y: 7, color: '#BB6BB6' }, { x: 0, y: 7, color: '#9B59B6' },
      { x: -1, y: 7, color: '#BB6BB6' }, { x: -2, y: 7, color: '#9B59B6' },
      { x: -3, y: 6, color: '#BB6BB6' }, { x: -4, y: 6, color: '#9B59B6' },
      { x: -5, y: 5, color: '#BB6BB6' }, { x: -6, y: 4, color: '#9B59B6' },
      { x: -7, y: 2, color: '#BB6BB6' },
    ],
    // 内圈（金色）
    innerRing: [
      { x: -4, y: 0, color: '#F1C40F' }, { x: -3, y: -1, color: '#FFD700' },
      { x: -2, y: -2, color: '#F1C40F' }, { x: -1, y: -3, color: '#FFD700' },
      { x: 0, y: -3, color: '#F1C40F' }, { x: 1, y: -3, color: '#FFD700' },
      { x: 2, y: -2, color: '#F1C40F' }, { x: 3, y: -1, color: '#FFD700' },
      { x: 4, y: 0, color: '#F1C40F' },
      { x: 3, y: 1, color: '#FFD700' }, { x: 2, y: 2, color: '#F1C40F' },
      { x: 1, y: 3, color: '#FFD700' }, { x: 0, y: 3, color: '#F1C40F' },
      { x: -1, y: 3, color: '#FFD700' }, { x: -2, y: 2, color: '#F1C40F' },
      { x: -3, y: 1, color: '#FFD700' },
    ],
    // 中心符文（紫色）
    centerRune: [
      { x: 0, y: -2, color: '#9B59B6' },
      { x: -1, y: -1, color: '#BB6BB6' }, { x: 0, y: -1, color: '#F1C40F' }, { x: 1, y: -1, color: '#BB6BB6' },
      { x: -1, y: 0, color: '#F1C40F' }, { x: 0, y: 0, color: '#9B59B6' }, { x: 1, y: 0, color: '#F1C40F' },
      { x: -1, y: 1, color: '#BB6BB6' }, { x: 0, y: 1, color: '#F1C40F' }, { x: 1, y: 1, color: '#BB6BB6' },
      { x: 0, y: 2, color: '#9B59B6' },
    ],
    // 装饰性三角形（四个方向）
    triangles: [
      // 上
      { x: 0, y: -9, color: '#FFD700' }, { x: -1, y: -8, color: '#F1C40F' }, { x: 1, y: -8, color: '#F1C40F' },
      // 下
      { x: 0, y: 9, color: '#FFD700' }, { x: -1, y: 8, color: '#F1C40F' }, { x: 1, y: 8, color: '#F1C40F' },
      // 左
      { x: -9, y: 0, color: '#FFD700' }, { x: -8, y: -1, color: '#F1C40F' }, { x: -8, y: 1, color: '#F1C40F' },
      // 右
      { x: 9, y: 0, color: '#FFD700' }, { x: 8, y: -1, color: '#F1C40F' }, { x: 8, y: 1, color: '#F1C40F' },
    ],
    // 光点装饰（在圈之间）
    dots: [
      { x: -10, y: -5, color: '#BB6BB6' }, { x: 10, y: -5, color: '#BB6BB6' },
      { x: -10, y: 5, color: '#BB6BB6' }, { x: 10, y: 5, color: '#BB6BB6' },
      { x: -5, y: -10, color: '#BB6BB6' }, { x: 5, y: -10, color: '#BB6BB6' },
      { x: -5, y: 10, color: '#BB6BB6' }, { x: 5, y: 10, color: '#BB6BB6' },
      { x: -6, y: -6, color: '#FFD700' }, { x: 6, y: -6, color: '#FFD700' },
      { x: -6, y: 6, color: '#FFD700' }, { x: 6, y: 6, color: '#FFD700' },
    ]
  },
  bossShield: {
    // Boss护盾像素艺术
    shield: [
      // 外圈（蓝色半透明）
      { x: -6, y: 0, color: 'rgba(52, 152, 219, 0.6)' }, { x: -5, y: -2, color: 'rgba(41, 128, 185, 0.6)' },
      { x: -4, y: -4, color: 'rgba(52, 152, 219, 0.6)' }, { x: -3, y: -5, color: 'rgba(41, 128, 185, 0.6)' },
      { x: -2, y: -6, color: 'rgba(52, 152, 219, 0.6)' }, { x: -1, y: -6, color: 'rgba(41, 128, 185, 0.6)' },
      { x: 0, y: -6, color: 'rgba(52, 152, 219, 0.6)' }, { x: 1, y: -6, color: 'rgba(41, 128, 185, 0.6)' },
      { x: 2, y: -6, color: 'rgba(52, 152, 219, 0.6)' }, { x: 3, y: -5, color: 'rgba(41, 128, 185, 0.6)' },
      { x: 4, y: -4, color: 'rgba(52, 152, 219, 0.6)' }, { x: 5, y: -2, color: 'rgba(41, 128, 185, 0.6)' },
      { x: 6, y: 0, color: 'rgba(52, 152, 219, 0.6)' },
      { x: 5, y: 2, color: 'rgba(41, 128, 185, 0.6)' }, { x: 4, y: 4, color: 'rgba(52, 152, 219, 0.6)' },
      { x: 3, y: 5, color: 'rgba(41, 128, 185, 0.6)' }, { x: 2, y: 6, color: 'rgba(52, 152, 219, 0.6)' },
      { x: 1, y: 6, color: 'rgba(41, 128, 185, 0.6)' }, { x: 0, y: 6, color: 'rgba(52, 152, 219, 0.6)' },
      { x: -1, y: 6, color: 'rgba(41, 128, 185, 0.6)' }, { x: -2, y: 6, color: 'rgba(52, 152, 219, 0.6)' },
      { x: -3, y: 5, color: 'rgba(41, 128, 185, 0.6)' }, { x: -4, y: 4, color: 'rgba(52, 152, 219, 0.6)' },
      { x: -5, y: 2, color: 'rgba(41, 128, 185, 0.6)' },
    ],
    // 内圈（高亮）
    innerShield: [
      { x: -4, y: 0, color: 'rgba(93, 173, 226, 0.8)' }, { x: -3, y: -1, color: 'rgba(174, 214, 241, 0.8)' },
      { x: -2, y: -2, color: 'rgba(93, 173, 226, 0.8)' }, { x: -1, y: -3, color: 'rgba(174, 214, 241, 0.8)' },
      { x: 0, y: -3, color: 'rgba(93, 173, 226, 0.8)' }, { x: 1, y: -3, color: 'rgba(174, 214, 241, 0.8)' },
      { x: 2, y: -2, color: 'rgba(93, 173, 226, 0.8)' }, { x: 3, y: -1, color: 'rgba(174, 214, 241, 0.8)' },
      { x: 4, y: 0, color: 'rgba(93, 173, 226, 0.8)' },
      { x: 3, y: 1, color: 'rgba(174, 214, 241, 0.8)' }, { x: 2, y: 2, color: 'rgba(93, 173, 226, 0.8)' },
      { x: 1, y: 3, color: 'rgba(174, 214, 241, 0.8)' }, { x: 0, y: 3, color: 'rgba(93, 173, 226, 0.8)' },
      { x: -1, y: 3, color: 'rgba(174, 214, 241, 0.8)' }, { x: -2, y: 2, color: 'rgba(93, 173, 226, 0.8)' },
      { x: -3, y: 1, color: 'rgba(174, 214, 241, 0.8)' },
    ],
    // 护盾条（显示护盾值）
    shieldBar: [
      { x: -5, y: -7, color: '#3498DB' }, { x: -4, y: -7, color: '#5DADE2' },
      { x: -3, y: -7, color: '#3498DB' }, { x: -2, y: -7, color: '#5DADE2' },
      { x: -1, y: -7, color: '#3498DB' }, { x: 0, y: -7, color: '#5DADE2' },
      { x: 1, y: -7, color: '#3498DB' }, { x: 2, y: -7, color: '#5DADE2' },
      { x: 3, y: -7, color: '#3498DB' }, { x: 4, y: -7, color: '#5DADE2' },
    ]
  }
};

// ==================== 技能图标数据 ====================
const SKILL_ICONS = {
  sword: [
    { x: 0, y: -3, color: '#C0C0C0' },
    { x: 0, y: -2, color: '#E8E8E8' }, { x: -1, y: -2, color: '#C0C0C0' }, { x: 1, y: -2, color: '#C0C0C0' },
    { x: 0, y: -1, color: '#C0C0C0' },
    { x: 0, y: 0, color: '#DAA520' },
    { x: 0, y: 1, color: '#8B4513' }
  ],
  arrow: [
    { x: 0, y: -3, color: '#8B4513' },
    { x: 0, y: -2, color: '#A0522D' },
    { x: 0, y: -1, color: '#FFFFFF' },
    { x: 0, y: 0, color: '#8B4513' }
  ],
  heart: [
    { x: -1, y: 0, color: '#FF4757' }, { x: 1, y: 0, color: '#FF4757' },
    { x: 0, y: -1, color: '#FF4757' },
    { x: 0, y: 1, color: '#FF4757' }
  ],
  shield: [
    { x: 0, y: -2, color: '#3498DB' },
    { x: -2, y: -1, color: '#3498DB' }, { x: -1, y: -1, color: '#5DADE2' }, { x: 0, y: -1, color: '#3498DB' }, { x: 1, y: -1, color: '#5DADE2' }, { x: 2, y: -1, color: '#3498DB' },
    { x: -2, y: 0, color: '#3498DB' }, { x: 2, y: 0, color: '#3498DB' },
    { x: -1, y: 1, color: '#3498DB' }, { x: 1, y: 1, color: '#3498DB' }
  ],
  star: [
    { x: 0, y: -3, color: '#FFD700' },
    { x: -1, y: -1, color: '#FFD700' }, { x: 1, y: -1, color: '#FFD700' },
    { x: -2, y: 0, color: '#FFD700' }, { x: 0, y: 0, color: '#FFD700' }, { x: 2, y: 0, color: '#FFD700' },
    { x: -1, y: 1, color: '#FFD700' }, { x: 1, y: 1, color: '#FFD700' },
    { x: 0, y: 2, color: '#FFD700' }
  ],
  fire: [
    { x: 0, y: -3, color: '#FF6B6B' },
    { x: -1, y: -2, color: '#FF4757' }, { x: 0, y: -2, color: '#FFD93D' }, { x: 1, y: -2, color: '#FF4757' },
    { x: -1, y: -1, color: '#FFD93D' }, { x: 1, y: -1, color: '#FFD93D' },
    { x: 0, y: 0, color: '#FF4757' }
  ],
  speed: [
    { x: -2, y: -1, color: '#2ECC71' }, { x: -1, y: -1, color: '#2ECC71' }, { x: 0, y: -1, color: '#2ECC71' },
    { x: -1, y: 0, color: '#2ECC71' }, { x: 0, y: 0, color: '#2ECC71' }, { x: 1, y: 0, color: '#2ECC71' },
    { x: 0, y: 1, color: '#2ECC71' }, { x: 1, y: 1, color: '#2ECC71' }
  ],
  magic: [
    { x: 0, y: -3, color: '#9B59B6' },
    { x: -2, y: -1, color: '#9B59B6' }, { x: 2, y: -1, color: '#9B59B6' },
    { x: -1, y: 0, color: '#BB6BB6' }, { x: 0, y: 0, color: '#9B59B6' }, { x: 1, y: 0, color: '#BB6BB6' },
    { x: 0, y: 2, color: '#9B59B6' }
  ],
  skull: [
    { x: -1, y: -2, color: '#FFFFFF' }, { x: 0, y: -2, color: '#FFFFFF' }, { x: 1, y: -2, color: '#FFFFFF' },
    { x: -2, y: -1, color: '#FFFFFF' }, { x: -1, y: -1, color: '#FF4757' }, { x: 1, y: -1, color: '#FF4757' }, { x: 2, y: -1, color: '#FFFFFF' },
    { x: -1, y: 0, color: '#FFFFFF' }, { x: 0, y: 0, color: '#FFFFFF' }, { x: 1, y: 0, color: '#FFFFFF' },
    { x: -1, y: 1, color: '#FFFFFF' }, { x: 1, y: 1, color: '#FFFFFF' }
  ],
  bolt: [
    { x: -1, y: -3, color: '#F1C40F' },
    { x: 0, y: -2, color: '#FFD700' },
    { x: -1, y: -1, color: '#F1C40F' }, { x: 1, y: -1, color: '#F1C40F' },
    { x: -1, y: 0, color: '#FFD700' }, { x: 0, y: 0, color: '#F1C40F' },
    { x: 1, y: 1, color: '#FFD700' },
    { x: 2, y: 2, color: '#F1C40F' }
  ]
};

// ==================== 技能池 ====================
const SKILL_POOL: Skill[] = [
  // 基础属性提升（主动）
  {
    id: 'melee_damage',
    name: '剑术精通',
    description: '近战伤害永久+25%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.25 }),
    rarity: 'common',
    color: COLORS.common,
    icon: SKILL_ICONS.sword
  },
  {
    id: 'ranged_damage',
    name: '箭术精通',
    description: '远程伤害永久+25%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.25 }),
    rarity: 'common',
    color: COLORS.common,
    icon: SKILL_ICONS.arrow
  },
  {
    id: 'max_hp',
    name: '钢铁之躯',
    description: '最大生命值永久+50（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, maxHp: p.maxHp + 50, hp: p.hp + 50 }),
    rarity: 'common',
    color: COLORS.common,
    icon: SKILL_ICONS.heart
  },
  // 进阶属性提升（稀有）
  {
    id: 'attack_speed',
    name: '迅捷之击',
    description: '攻击速度永久+25%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, attackSpeed: p.attackSpeed * 1.25 }),
    rarity: 'rare',
    color: COLORS.rare,
    icon: SKILL_ICONS.star
  },
  {
    id: 'movement_speed',
    name: '疾风步',
    description: '移动速度永久+20%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, baseSpeed: p.baseSpeed * 1.2, speed: p.speed * 1.2 }),
    rarity: 'rare',
    color: COLORS.rare,
    icon: SKILL_ICONS.speed
  },
  {
    id: 'attack_range',
    name: '范围扩大',
    description: '攻击范围永久+30%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.3 }),
    rarity: 'rare',
    color: COLORS.rare,
    icon: SKILL_ICONS.star
  },
  {
    id: 'regen_boost',
    name: '生命恢复',
    description: '每秒回复生命值永久+3（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, regenRate: p.regenRate + 3 }),
    rarity: 'rare',
    color: COLORS.rare,
    icon: SKILL_ICONS.heart
  },
  // 史诗技能
  {
    id: 'crit_rate',
    name: '致命一击',
    description: '暴击率永久+20%（可累加，上限100%）',
    type: 'active',
    apply: (p) => ({ ...p, critRate: Math.min(p.critRate + 0.2, 1) }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.skull
  },
  {
    id: 'arrow_bounce',
    name: '弹射之箭',
    description: '箭矢弹射次数永久+4（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, arrowCount: p.arrowCount + 4 }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.arrow
  },
  {
    id: 'critical_mastery',
    name: '暴击精通',
    description: '暴击伤害永久+75%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, critMultiplier: p.critMultiplier * 1.75 }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.star
  },
  {
    id: 'blade_dance',
    name: '剑舞',
    description: '攻击范围永久+60%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.6 }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.sword
  },
  {
    id: 'vampirism',
    name: '吸血鬼之触',
    description: '生命回复永久+8（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, regenRate: p.regenRate + 8 }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.heart
  },
  // 传说技能
  {
    id: 'fire_mastery',
    name: '火焰掌握',
    description: '远程伤害永久+75%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.75 }),
    rarity: 'legendary',
    color: COLORS.legendary,
    icon: SKILL_ICONS.fire
  },
  {
    id: 'giant_slayer',
    name: '巨人杀手',
    description: '对Boss和精英伤害永久+50%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.5, rangedDamage: p.rangedDamage * 1.5 }),
    rarity: 'legendary',
    color: COLORS.legendary,
    icon: SKILL_ICONS.sword
  },
  {
    id: 'berserker',
    name: '狂战士',
    description: '伤害永久+75%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.75, rangedDamage: p.rangedDamage * 1.75 }),
    rarity: 'legendary',
    color: COLORS.legendary,
    icon: SKILL_ICONS.skull
  },
  // 神话技能
  {
    id: 'champion',
    name: '冠军之心',
    description: '所有属性 +20%（生命值、伤害、速度）',
    type: 'active',
    apply: (p) => ({
      ...p,
      maxHp: p.maxHp * 1.2,
      hp: p.hp * 1.2,
      meleeDamage: p.meleeDamage * 1.2,
      rangedDamage: p.rangedDamage * 1.2,
      baseSpeed: p.baseSpeed * 1.2,
      speed: p.speed * 1.2
    }),
    rarity: 'mythic',
    color: COLORS.mythic,
    icon: SKILL_ICONS.star
  },
  // 武器切换（主动）
  {
    id: 'change_bow',
    name: '弓箭手',
    description: '攻击范围永久+50%，攻击速度-15%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.5, attackSpeed: p.attackSpeed * 0.85 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'magic_power',
    name: '魔法强化',
    description: '远程伤害永久+40%（可累加）',
    type: 'active',
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.4 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'blade_mastery',
    name: '剑术精通',
    description: '近战伤害+30%，攻击范围+15%',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.3, attackRange: p.attackRange * 1.15 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  // 自动锁敌被动技能（多等级可升级）
  {
    id: 'auto_tracking',
    name: '天命法阵',
    description: '每6秒在画面内生命值最高的怪物脚下召唤法阵，1秒后造成约1000伤害（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, autoLockLevel: 1 }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.magic
  },
  // 追踪精通系列（增加伤害）
  {
    id: 'tracking_mastery_1',
    name: '法阵精通 I',
    description: '天命法阵伤害 +200（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, trackingMasteryLevel: p.trackingMasteryLevel + 1 }),
    rarity: 'rare',
    color: COLORS.rare,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_mastery_2',
    name: '法阵精通 II',
    description: '天命法阵伤害 +200（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, trackingMasteryLevel: p.trackingMasteryLevel + 1 }),
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_mastery_3',
    name: '法阵精通 III',
    description: '天命法阵伤害 +200（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, trackingMasteryLevel: p.trackingMasteryLevel + 1 }),
    rarity: 'legendary',
    color: COLORS.legendary,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_mastery_4',
    name: '法阵精通 IV',
    description: '天命法阵伤害 +200（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, trackingMasteryLevel: p.trackingMasteryLevel + 1 }),
    rarity: 'mythic',
    color: COLORS.mythic,
    icon: SKILL_ICONS.magic
  },
  // 追踪频率系列（缩短冷却）
  {
    id: 'tracking_speed_1',
    name: '法阵加速 I',
    description: '天命法阵冷却时间 -1秒（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'rare',
    color: COLORS.rare,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_speed_2',
    name: '法阵加速 II',
    description: '天命法阵冷却时间 -1秒（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_speed_3',
    name: '法阵加速 III',
    description: '天命法阵冷却时间 -1秒（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'legendary',
    color: COLORS.legendary,
    icon: SKILL_ICONS.magic
  },
  // 追踪多重（增加数量）
  {
    id: 'tracking_multishot_1',
    name: '法阵多重 I',
    description: '天命法阵同时锁定 +1个敌人（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'legendary',
    color: COLORS.legendary,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_multishot_2',
    name: '法阵多重 II',
    description: '天命法阵同时锁定 +1个敌人（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'mythic',
    color: COLORS.mythic,
    icon: SKILL_ICONS.magic
  },
  // 追踪穿透系列（法阵范围）
  {
    id: 'tracking_pierce_1',
    name: '法阵扩张 I',
    description: '天命法阵范围扩大30%（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic,
    icon: SKILL_ICONS.magic
  },
  {
    id: 'tracking_pierce_2',
    name: '法阵扩张 II',
    description: '天命法阵范围扩大30%（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'mythic',
    color: COLORS.mythic,
    icon: SKILL_ICONS.magic
  },
  // 被动技能
  {
    id: 'passive_armor',
    name: '坚韧',
    description: '受到的伤害减少20%（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'passive_thorns',
    name: '荆棘护甲',
    description: '受到伤害时反弹50%给攻击者（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'passive_speed',
    name: '迅捷',
    description: '生命值低于50%时移动速度+30%（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'passive_lifesteal',
    name: '生命汲取',
    description: '击杀怪物回复5点生命值（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'passive_exp',
    name: '快速学习',
    description: '获得的经验值+25%（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'passive_crit',
    name: '弱点识别',
    description: '暴击几率永久+10%（可累加）',
    type: 'passive',
    apply: (p) => ({ ...p, critRate: p.critRate + 0.1 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'passive_damage',
    name: '力量',
    description: '所有伤害永久+15%（可累加）',
    type: 'passive',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.15, rangedDamage: p.rangedDamage * 1.15 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'passive_shield',
    name: '护盾',
    description: '每15秒获得50点临时护盾（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'passive_freeze',
    name: '冰霜',
    description: '攻击有10%几率冻结敌人1秒（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'passive_chain',
    name: '连锁',
    description: '攻击有15%几率连锁到附近敌人（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'passive_revive',
    name: '不屈',
    description: '死亡时有20%几率回复50%生命值并继续战斗（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'mythic',
    color: COLORS.mythic
  },
  {
    id: 'passive_ultimate',
    name: '终极',
    description: '所有被动技能效果+50%（被动）',
    type: 'passive',
    apply: (p) => p,
    rarity: 'mythic',
    color: COLORS.mythic
  }
];

// ==================== 主组件 ====================
export default function RoguelikeSurvivalGame({ onComplete, onCancel }: RoguelikeSurvivalGameProps) {
  // UI状态
  const [showTutorial, setShowTutorial] = useState(true);
  const [score, setScore] = useState(0);
  const [playerStats, setPlayerStats] = useState<Player | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);

  // gameInitialized引用（用于键盘事件）
  const gameInitializedRef = useRef(false);

  // 同步gameInitialized到ref
  useEffect(() => {
    gameInitializedRef.current = gameInitialized;
  }, [gameInitialized]);

  // 游戏核心数据引用
  const gameStateRef = useRef<GameState>(GameState.START);
  const playerRef = useRef<Player | null>(null);
  const monstersRef = useRef<Monster[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const slashEffectsRef = useRef<SlashEffect[]>([]);
  const magicCirclesRef = useRef<MagicCircle[]>([]);
  const screenShakeRef = useRef<ScreenShake>({ intensity: 0, duration: 0, x: 0, y: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const monsterIdCounterRef = useRef(0);
  const projectileIdCounterRef = useRef(0);
  const gameTimeRef = useRef(0);
  const lastRegenTimeRef = useRef(0);
  const availableSkillsRef = useRef<Skill[]>([]);
  const selectedSkillIndexRef = useRef<number>(-1);
  const difficultyRef = useRef(1);
  const scoreRef = useRef(0);

  // 音频上下文
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Set<OscillatorNode>>(new Set());

  // 输入状态
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, angle: 0 });

  // Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const monsterSpawnTimerRef = useRef<number>(0);
  const autoAttackTimerRef = useRef<number>(0);
  const shieldTimerRef = useRef<number>(0);
  const lastDamageTimeRef = useRef(0);
  const autoLockUltimateTimerRef = useRef<number>(0);  // 大招冷却
  const lastScoreUpdateTimeRef = useRef(0);  // 上次更新分数的时间
  const lastStatsUpdateTimeRef = useRef(0);  // 上次更新玩家状态的时间
  const meleeBossSpawnTimerRef = useRef<number>(0);  // 近战Boss刷新计时器

  // 摄像机位置（左上角的世界坐标）
  const cameraRef = useRef({ x: 0, y: 0 });

  // ==================== 坐标转换函数 ====================
  const worldToScreenX = (worldX: number) => worldX - cameraRef.current.x;
  const worldToScreenY = (worldY: number) => worldY - cameraRef.current.y;
  const screenToWorldX = (screenX: number) => screenX + cameraRef.current.x;
  const screenToWorldY = (screenY: number) => screenY + cameraRef.current.y;

  // 音效冷却记录（防止重叠）
  const soundCooldownsRef = useRef<Record<string, number>>({});

  // ==================== 音频系统 ====================
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = useCallback((type: 'hit' | 'kill' | 'levelup' | 'shoot' | 'damage' | 'crit' | 'explosion' | 'slash' | 'heal' | 'select' | 'hover') => {
    if (!soundEnabled || !audioContextRef.current) return;

    // 音效冷却限制（大幅放宽，允许7个以下音效同时播放）
    const now = performance.now();
    const lastPlayTime = soundCooldownsRef.current[type] || 0;
    const cooldownMap: Record<string, number> = {
      'hit': 15,       // hit音效15ms冷却（从50ms降低）
      'kill': 30,      // kill音效30ms冷却（从150ms降低）
      'levelup': 0,    // levelup无冷却（重要事件）
      'shoot': 20,     // shoot音效20ms冷却（从80ms降低）
      'damage': 25,    // damage音效25ms冷却（从100ms降低）
      'crit': 40,      // crit音效40ms冷却（从200ms降低）
      'explosion': 0,  // explosion无冷却（重要事件）
      'slash': 15,     // slash音效15ms冷却（从60ms降低）
      'heal': 30,      // heal音效30ms冷却（从150ms降低）
      'select': 0,     // select无冷却（UI交互）
      'hover': 10      // hover音效10ms冷却（从30ms降低）
    };
    const cooldown = cooldownMap[type];

    if (cooldown > 0 && now - lastPlayTime < cooldown) {
      return;  // 冷却中，不播放
    }

    soundCooldownsRef.current[type] = now;

    try {
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        return;
      }

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 跟踪活动的oscillator
      activeOscillatorsRef.current.add(oscillator);

      // 确保oscillator停止时从集合中移除
      const duration = (() => {
        switch (type) {
          case 'select': return 0.08;
          case 'hover': return 0.03;
          case 'slash': return 0.04;
          case 'hit': return 0.06;
          case 'kill': return 0.10;
          case 'crit': return 0.12;
          case 'levelup': return 0.22;
          case 'shoot': return 0.03;
          case 'damage': return 0.12;
          case 'explosion': return 0.15;
          case 'heal': return 0.10;
          default: return 0.1;
        }
      })();

      switch (type) {
        case 'select':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'hover':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'slash':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'hit':
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'kill':
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'crit':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'levelup':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
          oscillator.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'shoot':
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'damage':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(120, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'explosion':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(80, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'heal':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + duration);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
      }

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration + 0.01);

      // 音效播放完成后清理
      setTimeout(() => {
        activeOscillatorsRef.current.delete(oscillator);
      }, (duration + 0.05) * 1000);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

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
      if (particlesRef.current.length >= MAX_PARTICLES) {
        particlesRef.current.shift();
      }

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
      maxLife: 0.18,
      type
    });
  }, []);

  // ==================== 法阵特效 ====================
  const createMagicCircle = useCallback((monsterId: number, x: number, y: number, damage: number, duration: number, radius: number) => {
    magicCirclesRef.current.push({
      id: Date.now() + Math.random(),
      monsterId,
      x,
      y,
      damage,
      duration,
      startTime: performance.now(),
      radius,
      rotation: 0,
      particles: []  // 不再使用粒子
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
      isHeal,
      scale: isCrit ? 1.3 : 1
    });
  }, []);

  // ==================== 碰撞检测 ====================
  const checkCollision = useCallback((x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
  }, []);

  const checkObstacleCollision = useCallback((x: number, y: number, radius: number): boolean => {
    for (const obs of obstaclesRef.current) {
      if (x + radius > obs.x && x - radius < obs.x + obs.width &&
          y + radius > obs.y && y - radius < obs.y + obs.height) {
        return true;
      }
    }
    return false;
  }, []);

  // ==================== 难度计算（非线性） ====================
  const getDifficultyMultiplier = useCallback((time: number): number => {
    // 使用指数增长，每分钟难度显著提升
    const minutes = time / 60;
    const baseMultiplier = 1 + Math.pow(minutes, 1.2) * 0.4;
    return Math.min(baseMultiplier, 10); // 上限10倍
  }, []);

  // ==================== 自动攻击 ====================
  const autoMeleeAttack = useCallback((player: Player) => {
    const now = performance.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;

    // 找到攻击范围内的所有敌人
    const targets = monstersRef.current
      .map(monster => ({
        monster,
        distance: Math.sqrt(Math.pow(monster.x - player.x, 2) + Math.pow(monster.y - player.y, 2))
      }))
      .filter(({ distance, monster }) => distance < player.attackRange && !checkObstacleCollision(playerRef.current!.x + (monster.x - player.x) * 0.5, playerRef.current!.y + (monster.y - player.y) * 0.5, 10))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // 最多攻击5个敌人

    if (targets.length === 0) return;

    player.lastAttack = now;

    targets.forEach(({ monster, distance }) => {
      let isCrit = Math.random() < player.critRate;
      let damage = isCrit ? player.meleeDamage * player.critMultiplier : player.meleeDamage;

      // 狂战士被动：生命值越低伤害越高
      const hasBerserker = player.skills.some(s => s.id === 'berserker');
      if (hasBerserker && player.hp < player.maxHp * 0.5) {
        const hpPercent = player.hp / player.maxHp;
        damage *= 1 + (1 - hpPercent) * 1.25;
      }

      const angle = Math.atan2(monster.y - player.y, monster.x - player.x);
      createSlashEffect(player.x, player.y, angle, 'diagonal');

      monster.hp = Math.max(0, Math.floor(monster.hp - damage));
      monster.isStunned = true;
      monster.stunnedTime = 350;

      createParticles(monster.x, monster.y, COLORS.blood, 8, 'blood');
      createDamageNumber(monster.x, monster.y, damage, isCrit);
      triggerScreenShake(isCrit ? 1.5 : 0.8, isCrit ? 0.05 : 0.03);
      playSound(isCrit ? 'crit' : 'slash');

      player.totalDamage += damage;

      // 荆棘护甲被动
      const hasThorns = player.skills.some(s => s.id === 'passive_thorns');
      if (hasThorns) {
        const thornsDamage = Math.floor(monster.damage * 0.5);
        monster.hp = Math.max(0, monster.hp - thornsDamage);
        createParticles(monster.x, monster.y, '#FF6B6B', 5, 'spark');
      }

      if (monster.hp < 0.1) {
        let expGain = monster.exp;

        // 快速学习被动
        const hasFastLearning = player.skills.some(s => s.id === 'passive_exp');
        if (hasFastLearning) {
          expGain *= 1.25;
        }

        player.exp += expGain;
        player.totalKills++;

        // 生命汲取被动
        const hasLifesteal = player.skills.some(s => s.id === 'passive_lifesteal');
        if (hasLifesteal) {
          const healAmount = 5;
          player.hp = Math.min(player.hp + healAmount, player.maxHp);
          createDamageNumber(player.x, player.y - 20, healAmount, false, true);
          playSound('heal');
        }

        createParticles(monster.x, monster.y, monster.color, 15, 'explosion');
        triggerScreenShake(1.5, 0.05);
        scoreRef.current += Math.floor(monster.exp);
        playSound('kill');
      }
    });
  }, [createParticles, createDamageNumber, createSlashEffect, playSound, triggerScreenShake, checkObstacleCollision]);

  const autoRangedAttack = useCallback((player: Player) => {
    const now = performance.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;

    player.lastAttack = now;

    const angle = mouseRef.current.angle;

    const isFireball = player.rangedDamage > 35;
    const isLightning = player.rangedDamage > 50;

    if (projectilesRef.current.length < MAX_PROJECTILES) {
      let projectileType: Projectile['type'] = 'arrow';
      if (isLightning) projectileType = 'lightning';
      else if (isFireball) projectileType = 'fireball';

      projectilesRef.current.push({
        id: projectileIdCounterRef.current++,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 18,
        vy: Math.sin(angle) * 18,
        damage: player.rangedDamage,
        speed: 18,
        bounceCount: player.arrowCount,
        angle,
        trail: [],
        type: projectileType,
        pierceCount: 0,
        owner: 'player'
      });
      playSound('shoot');
    }
  }, [playSound]);

  // ==================== 升级处理 ====================
  const handleLevelUp = useCallback((player: Player) => {
    try {
      console.log('[Level Up] Starting level up process', {
        currentLevel: player.level,
        currentExp: player.exp,
        expToNext: player.expToNext,
        gameStateBefore: gameStateRef.current
      });

      // 更新玩家等级
      const oldLevel = player.level;
      player.level++;
      player.exp = 0;
      player.expToNext = Math.floor(player.expToNext * 1.5);

      console.log('[Level Up] Player stats updated', {
        oldLevel,
        newLevel: player.level,
        newExpToNext: player.expToNext
      });

      // 过滤掉需要前置技能的选项和已拥有的被动技能
      const filteredSkills = SKILL_POOL.filter(skill => {
        // 检查是否已经拥有该技能（被动技能和天命法阵相关技能）
        if (skill.type === 'passive' ||
            skill.id === 'auto_tracking' ||
            skill.id.startsWith('tracking_mastery') ||
            skill.id.startsWith('tracking_speed') ||
            skill.id.startsWith('tracking_multishot') ||
            skill.id.startsWith('tracking_pierce')) {
          const hasSkill = player.skills.some(s => s.id === skill.id);
          if (hasSkill) return false;
        }

        // 天命法阵（自动追踪）需要先解锁
        if (skill.id.startsWith('tracking_mastery') ||
            skill.id.startsWith('tracking_speed') ||
            skill.id.startsWith('tracking_multishot') ||
            skill.id.startsWith('tracking_pierce')) {
          // 需要先解锁自动追踪
          return player.autoLockLevel >= 1;
        }
        return true;
      });

      console.log('[Level Up] Skill pool filtered', {
        totalSkills: SKILL_POOL.length,
        filteredCount: filteredSkills.length,
        autoLockLevel: player.autoLockLevel
      });

      // 随机选择3个技能
      const shuffled = [...filteredSkills].sort(() => Math.random() - 0.5);
      const selectedSkills = shuffled.slice(0, 3);

      console.log('[Level Up] Skills selected', {
        skillCount: selectedSkills.length,
        skills: selectedSkills.map(s => ({ id: s.id, name: s.name, rarity: s.rarity }))
      });

      availableSkillsRef.current = selectedSkills;
      selectedSkillIndexRef.current = -1;

      // 切换到升级状态
      gameStateRef.current = GameState.LEVEL_UP;

      console.log('[Level Up] Game state changed to LEVEL_UP', {
        newGameState: gameStateRef.current,
        availableSkills: availableSkillsRef.current.length
      });

      // 创建升级特效
      try {
        createParticles(player.x, player.y, COLORS.levelUp, 40, 'magic');
      } catch (error) {
        console.error('[Level Up] Error creating particles:', error);
        // 粒子特效失败不影响升级流程
      }

      // 播放升级音效
      try {
        playSound('levelup');
      } catch (error) {
        console.error('[Level Up] Error playing levelup sound:', error);
        // 音效失败不影响升级流程
      }

      console.log('[Level Up] Level up completed successfully');
    } catch (error) {
      console.error('[Level Up] Fatal error in level up process:', error);
      // 出现严重错误时，保持游戏继续运行
      gameStateRef.current = GameState.PLAYING;
    }
  }, [createParticles, playSound]);

  // ==================== 生成障碍物 ====================
  const spawnObstacles = useCallback(() => {
    obstaclesRef.current = [];
    const numObstacles = 12 + Math.floor(gameTimeRef.current / 30);

    for (let i = 0; i < numObstacles; i++) {
      let x, y, width, height;
      const typeRoll = Math.random();

      // 增加障碍物类型多样性
      let type: Obstacle['type'];
      if (typeRoll < 0.4) {
        type = 'rock';
      } else if (typeRoll < 0.7) {
        type = 'wall';
      } else {
        type = 'tree';
      }

      // 确保障碍物不在玩家初始位置附近（使用世界边界）
      do {
        x = 120 + Math.random() * (WORLD_WIDTH - 240);
        y = 120 + Math.random() * (WORLD_HEIGHT - 240);
      } while (Math.sqrt(Math.pow(x - WORLD_WIDTH / 2, 2) + Math.pow(y - WORLD_HEIGHT / 2, 2)) < 180);

      if (type === 'rock') {
        width = 50 + Math.random() * 50;
        height = 40 + Math.random() * 40;
      } else if (type === 'wall') {
        width = 25 + Math.random() * 25;
        height = 100 + Math.random() * 50;
      } else {
        // 树木 - 圆形障碍物（用矩形模拟）
        width = 40 + Math.random() * 30;
        height = 40 + Math.random() * 30;
      }

      obstaclesRef.current.push({
        x, y, width, height, type, health: type === 'wall' ? 100 : (type === 'tree' ? 80 : 60)
      });
    }
  }, []);

  // ==================== 生成怪物 ====================
  const spawnMonster = useCallback((player: Player) => {
    const difficulty = getDifficultyMultiplier(player.gameTime);

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    const margin = MONSTER_SPAWN_MARGIN;
    switch (side) {
      case 0: x = Math.random() * WORLD_WIDTH; y = -margin; break;
      case 1: x = WORLD_WIDTH + margin; y = Math.random() * WORLD_HEIGHT; break;
      case 2: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT + margin; break;
      case 3: x = -margin; y = Math.random() * WORLD_HEIGHT; break;
      default: x = WORLD_WIDTH / 2; y = -margin;
    }

    // 根据等级和难度调整怪物类型概率
    const typeRoll = Math.random();
    let type: Monster['type'] = 'slime';

    if (player.level >= 2 && typeRoll > 0.55 - difficulty * 0.05) type = 'skeleton';
    if (player.level >= 4 && typeRoll > 0.70 - difficulty * 0.05) type = 'ghost';
    if (player.level >= 5 && typeRoll > 0.82 - difficulty * 0.05) type = 'elite';
    // 降低远程Boss刷新概率（从0.93改为0.95）
    if (player.level >= 7 && typeRoll > 0.95 - difficulty * 0.05) type = 'boss';
    // 近战Boss不通过普通生成逻辑生成（使用独立刷新逻辑）

    const monsterStats = {
      slime: { baseHp: 40, baseDamage: 12, baseSpeed: 1.8, baseExp: 40, baseSize: 18, color: COLORS.slimeMonster },
      skeleton: { baseHp: 55, baseDamage: 18, baseSpeed: 2.0, baseExp: 60, baseSize: 20, color: COLORS.skeletonMonster },
      ghost: { baseHp: 45, baseDamage: 22, baseSpeed: 2.3, baseExp: 80, baseSize: 18, color: COLORS.ghostMonster },
      elite: { baseHp: 100, baseDamage: 28, baseSpeed: 1.9, baseExp: 150, baseSize: 24, color: COLORS.eliteMonster },
      boss: { baseHp: 800, baseDamage: 60, baseSpeed: 1.5, baseExp: 500, baseSize: 45, color: COLORS.bossMonster },
      melee_boss: { baseHp: 10000, baseDamage: 25, baseSpeed: 2.0, baseExp: 1000, baseSize: 72, color: '#E74C3C' } // 近战Boss：体型比远程Boss大60%（45 * 1.6 = 72）
    };

    const stats = monsterStats[type];

    // Boss额外成长乘数（1.3倍）
    const bossMultiplier = type === 'boss' ? 1.3 : 1;
    const finalDifficulty = difficulty * bossMultiplier;

    const monster: Monster = {
      id: monsterIdCounterRef.current++,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: Math.floor(stats.baseHp * finalDifficulty),
      maxHp: Math.floor(stats.baseHp * finalDifficulty),
      damage: Math.floor(stats.baseDamage * finalDifficulty),
      speed: stats.baseSpeed * (0.95 + Math.random() * 0.1),  // 基础速度 ±5% 随机波动，不受难度影响
      exp: Math.floor(stats.baseExp * finalDifficulty),
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
      shieldHp: type === 'boss' ? Math.floor(200 * finalDifficulty) : 50,
      shieldMaxHp: type === 'boss' ? Math.floor(200 * finalDifficulty) : 50,
      currentPhase: 0,
      phaseTimer: 0,
      abilityCooldown: type === 'boss' ? 5 : 0,
      lastAbilityTime: 0,
      // 近战Boss冲刺技能相关属性
      isCharging: false,
      chargeStartTime: 0,
      chargeDirection: { x: 0, y: 0 },
      chargeTrail: [],
      meleeBossSpawnIndex: monstersRef.current.filter(m => m.type === 'melee_boss').length // 近战Boss生成序号
    };

    if (monstersRef.current.length < MAX_MONSTERS) {
      monstersRef.current.push(monster);
    }
  }, [getDifficultyMultiplier]);

  // ==================== Boss AI ====================
  const updateBossAI = useCallback((monster: Monster, player: Player, deltaTime: number) => {
    if (monster.type !== 'boss' && monster.type !== 'melee_boss') return;

    // 近战Boss冲刺技能逻辑
    if (monster.type === 'melee_boss') {
      const now = performance.now();

      if (monster.isCharging) {
        // 冲刺中
        const chargeElapsed = now - monster.chargeStartTime;

        // 冲刺持续时间1.5秒（包括1秒前摇和0.5秒冲刺）
        if (chargeElapsed > 1500) {
          monster.isCharging = false;
          monster.vx = 0;
          monster.vy = 0;
          monster.lastAbilityTime = now;
        } else if (chargeElapsed > 1000) {
          // 实际冲刺阶段（0.5秒）
          monster.vx = monster.chargeDirection.x * 25; // 冲刺速度
          monster.vy = monster.chargeDirection.y * 25;

          // 记录冲刺轨迹
          monster.chargeTrail.push({ x: monster.x, y: monster.y, life: 2.0 });

          // 碰撞检测：冲刺造成双倍伤害并击退
          if (checkCollision(player.x, player.y, PLAYER_SIZE, monster.x, monster.y, monster.size)) {
            if (!player.invincible) {
              let damage = Math.floor(monster.damage * 2); // 冲刺伤害为普通攻击的2倍

              // 坚韧被动
              const hasArmor = player.skills.some(s => s.id === 'passive_armor');
              if (hasArmor) {
                damage = Math.floor(damage * 0.8);
              }

              if (monster.hasShield && monster.shieldHp > 0) {
                const absorbed = Math.min(damage, monster.shieldHp);
                monster.shieldHp = Math.max(0, Math.floor(monster.shieldHp - absorbed));
                damage = Math.max(0, damage - absorbed);
                createParticles(monster.x, monster.y, '#3498DB', 6, 'shield');
                playSound('shoot');
              }

              if (damage > 0) {
                player.hp = Math.max(0, Math.floor(player.hp - damage));

                // 击退效果
                const knockbackDistance = 150;
                const knockbackX = (player.x - monster.x) / Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2)) * knockbackDistance;
                const knockbackY = (player.y - monster.y) / Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2)) * knockbackDistance;
                player.x += knockbackX;
                player.y += knockbackY;

                player.invincible = true;
                player.invincibleTime = 500;
                createDamageNumber(player.x, player.y, damage, false);
                triggerScreenShake(3, 0.1);
                playSound('damage');
                createParticles(player.x, player.y, COLORS.player, 12, 'blood');
              }
            }
          }
        } else {
          // 冲刺前摇阶段（1秒），显示冲刺路径
          // 计算朝向玩家的方向
          const dx = player.x - monster.x;
          const dy = player.y - monster.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          monster.chargeDirection = { x: dx / distance, y: dy / distance };
        }
      } else {
        // 检查是否开始冲刺（CD结束且玩家在攻击范围内）
        if (now - monster.lastAbilityTime > monster.abilityCooldown * 1000) {
          const dx = player.x - monster.x;
          const dy = player.y - monster.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 攻击范围内开始冲刺
          if (distance < 250) {
            monster.isCharging = true;
            monster.chargeStartTime = now;
          }
        }
      }

      // 如果不在冲刺状态，正常移动（靠近玩家）
      if (!monster.isCharging) {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          const moveSpeed = monster.speed * (monster.isStunned ? 0 : 1);
          monster.vx = (dx / distance) * moveSpeed;
          monster.vy = (dy / distance) * moveSpeed;
        }
      }
    }

    // 远程Boss原有逻辑（仅对远程Boss生效）
    if (monster.type !== 'boss') return;

    monster.phaseTimer += deltaTime;

    // 阶段转换（每30秒）
    if (monster.phaseTimer > 30 && monster.currentPhase < 2) {
      monster.currentPhase++;
      monster.phaseTimer = 0;

      // 阶段转换特效
      createParticles(monster.x, monster.y, '#FF6B6B', 30, 'explosion');
      triggerScreenShake(3, 0.1);
      playSound('explosion');

      // 阶段转换增强
      monster.speed *= 1.3;
      monster.damage *= 1.5;
    }

    // Boss技能释放
    const now = performance.now();
    if (now - monster.lastAbilityTime > monster.abilityCooldown * 1000) {
      monster.lastAbilityTime = now;

      // 根据阶段释放不同技能
      if (monster.currentPhase === 0) {
        // 阶段1：扇形攻击
        for (let i = -2; i <= 2; i++) {
          const angle = Math.atan2(player.y - monster.y, player.x - monster.x) + i * 0.3;
          projectilesRef.current.push({
            id: projectileIdCounterRef.current++,
            x: monster.x,
            y: monster.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            damage: Math.floor(monster.damage * 0.5),
            speed: 8,
            bounceCount: 0,
            angle,
            trail: [],
            type: 'fireball',
            pierceCount: 2,
            owner: 'monster'
          });
        }
        playSound('shoot');
      } else if (monster.currentPhase === 1) {
        // 阶段2：环形攻击
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          projectilesRef.current.push({
            id: projectileIdCounterRef.current++,
            x: monster.x,
            y: monster.y,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            damage: Math.floor(monster.damage * 0.3),
            speed: 6,
            bounceCount: 0,
            angle,
            trail: [],
            type: 'ice',
            pierceCount: 1,
            owner: 'monster'
          });
        }
        playSound('shoot');
      } else {
        // 阶段3：召唤小怪
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const newMonster: Monster = {
            id: monsterIdCounterRef.current++,
            x: monster.x + Math.cos(angle) * 80,
            y: monster.y + Math.sin(angle) * 80,
            vx: 0,
            vy: 0,
            hp: Math.floor(50 * difficultyRef.current),
            maxHp: Math.floor(50 * difficultyRef.current),
            damage: Math.floor(15 * difficultyRef.current),
            speed: 3,
            exp: 30,
            lastAttack: 0,
            size: 15,
            color: COLORS.ghostMonster,
            type: 'ghost',
            scale: 0.8,
            angle: 0,
            animationOffset: Math.random() * Math.PI * 2,
            isStunned: false,
            stunnedTime: 0,
            hasShield: false,
            shieldHp: 0,
            shieldMaxHp: 0,
            currentPhase: 0,
            phaseTimer: 0,
            abilityCooldown: 0,
            lastAbilityTime: 0,
            // 近战Boss冲刺技能相关属性
            isCharging: false,
            chargeStartTime: 0,
            chargeDirection: { x: 0, y: 0 },
            chargeTrail: [],
            meleeBossSpawnIndex: 0
          };
          monstersRef.current.push(newMonster);
        }
        playSound('levelup');
      }
    }
  }, [createParticles, triggerScreenShake, playSound]);

  // ==================== 绘制像素艺术 ====================
  const drawPixelArt = useCallback((ctx: CanvasRenderingContext2D, pixels: { x: number; y: number; color: string }[], x: number, y: number, scale: number = 1) => {
    pixels.forEach(pixel => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        x + pixel.x * scale * 4,
        y + pixel.y * scale * 4,
        4 * scale,
        4 * scale
      );
    });
  }, []);

  // ==================== 重置Canvas上下文状态 ====================
  const resetContext = useCallback((ctx: CanvasRenderingContext2D) => {
    // 强制重置所有可能被修改的Canvas状态
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
  }, []);

  // ==================== 绘制背景（使用屏幕坐标） ====================
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // 深空渐变背景（覆盖整个屏幕）
    const screenCenterX = CANVAS_WIDTH / 2;
    const screenCenterY = CANVAS_HEIGHT / 2;

    const gradient = ctx.createRadialGradient(
      screenCenterX, screenCenterY, 0,
      screenCenterX, screenCenterY, CANVAS_WIDTH
    );
    gradient.addColorStop(0, COLORS.backgroundStart);
    gradient.addColorStop(0.5, '#16213E');
    gradient.addColorStop(1, COLORS.backgroundEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 滚动网格（根据摄像机位置偏移）
    const tileSize = 60;
    const gridOffsetX = cameraRef.current.x % tileSize;
    const gridOffsetY = cameraRef.current.y % tileSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
    ctx.lineWidth = 1;

    for (let x = -gridOffsetX; x < CANVAS_WIDTH + tileSize; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = -gridOffsetY; y < CANVAS_HEIGHT + tileSize; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 闪烁的星星（只绘制屏幕范围内的）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 100; i++) {
      const worldX = ((i * 137) % WORLD_WIDTH);
      const worldY = ((i * 97) % WORLD_HEIGHT);

      // 只绘制屏幕范围内的星星
      const screenX = worldToScreenX(worldX);
      const screenY = worldToScreenY(worldY);

      if (screenX >= -20 && screenX <= CANVAS_WIDTH + 20 &&
          screenY >= -20 && screenY <= CANVAS_HEIGHT + 20) {
        const twinkle = (Math.sin(gameTimeRef.current * 2.5 + i * 0.5) + 1) * 0.5;
        const size = (twinkle * 1.2 + 0.5);
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  // ==================== 绘制静态背景（用于开始和结束界面） ====================
  const drawStaticBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // 深空渐变背景（仅覆盖画布）
    // 使用对角线长度作为半径，确保渐变覆盖整个画布
    const diagonalLength = Math.sqrt(CANVAS_WIDTH * CANVAS_WIDTH + CANVAS_HEIGHT * CANVAS_HEIGHT);
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, diagonalLength / 2
    );
    gradient.addColorStop(0, COLORS.backgroundStart);
    gradient.addColorStop(0.5, '#16213E');
    gradient.addColorStop(1, COLORS.backgroundEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 静态网格（覆盖画布）
    const tileSize = 60;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_WIDTH; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= CANVAS_HEIGHT; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 闪烁的星星（覆盖画布）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137) % CANVAS_WIDTH);
      const y = ((i * 97) % CANVAS_HEIGHT);
      const twinkle = (Math.sin(Date.now() / 500 + i * 0.5) + 1) * 0.5;
      const size = (twinkle * 1.2 + 0.5);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // ==================== 绘制UI ====================
  const drawUI = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    const padding = 16;
    const uiHeight = 60;

    // 顶部信息栏背景（渐变）
    const uiGradient = ctx.createLinearGradient(0, 0, 0, uiHeight);
    uiGradient.addColorStop(0, 'rgba(20, 15, 30, 0.85)');
    uiGradient.addColorStop(1, 'rgba(10, 10, 20, 0.85)');
    ctx.fillStyle = uiGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, uiHeight);

    // 顶部边框装饰
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, uiHeight);
    ctx.lineTo(CANVAS_WIDTH, uiHeight);
    ctx.stroke();

    // 左侧：等级和血量
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 等级徽章
    const levelBgGradient = ctx.createRadialGradient(padding + 20, 20, 0, padding + 20, 20, 25);
    levelBgGradient.addColorStop(0, '#9B59B6');
    levelBgGradient.addColorStop(1, 'rgba(155, 89, 182, 0.6)');
    ctx.fillStyle = levelBgGradient;
    ctx.beginPath();
    ctx.arc(padding + 20, 20, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Lv.${player.level}`, padding + 20, 21);

    // 血量条背景
    const hpBarX = padding + 50;
    const hpBarWidth = 240;
    const hpBarHeight = 16;
    const hpBarY = 28;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(hpBarX - 2, hpBarY - 2, hpBarWidth + 4, hpBarHeight + 4, 8);
    ctx.fill();

    const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));

    // 血量条渐变
    const hpGradient = ctx.createLinearGradient(hpBarX, hpBarY, hpBarX + hpBarWidth * hpPercent, hpBarY);
    if (hpPercent > 0.5) {
      hpGradient.addColorStop(0, '#2ECC71');
      hpGradient.addColorStop(1, '#27AE60');
    } else if (hpPercent > 0.3) {
      hpGradient.addColorStop(0, '#F39C12');
      hpGradient.addColorStop(1, '#E67E22');
    } else {
      hpGradient.addColorStop(0, '#E74C3C');
      hpGradient.addColorStop(1, '#C0392B');
    }

    ctx.fillStyle = hpGradient;
    ctx.beginPath();
    ctx.roundRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 6);
    ctx.fill();

    // 血量文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, hpBarX + hpBarWidth / 2, hpBarY + hpBarHeight / 2);

    // 经验条（血量下方）
    const expBarX = hpBarX;
    const expBarWidth = hpBarWidth;
    const expBarHeight = 8;
    const expBarY = hpBarY + hpBarHeight + 6;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(expBarX - 1, expBarY - 1, expBarWidth + 2, expBarHeight + 2, 4);
    ctx.fill();

    const expPercent = Math.max(0, Math.min(1, player.exp / player.expToNext));
    const expGradient = ctx.createLinearGradient(expBarX, expBarY, expBarX + expBarWidth * expPercent, expBarY);
    expGradient.addColorStop(0, '#7ED6DF');
    expGradient.addColorStop(1, '#5DADE2');
    ctx.fillStyle = expGradient;
    ctx.beginPath();
    ctx.roundRect(expBarX, expBarY, expBarWidth * expPercent, expBarHeight, 4);
    ctx.fill();

    // 中间：击杀数和总伤害（更精美的设计）
    const centerX = CANVAS_WIDTH / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';

    // 击杀数
    const killsGradient = ctx.createLinearGradient(centerX - 80, 0, centerX - 80, 25);
    killsGradient.addColorStop(0, '#E74C3C');
    killsGradient.addColorStop(1, '#C0392B');
    ctx.fillStyle = killsGradient;
    ctx.beginPath();
    ctx.roundRect(centerX - 60, 8, 120, 18, 9);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`Kills: ${player.totalKills}`, centerX, 18);

    // 总伤害
    const damageGradient = ctx.createLinearGradient(centerX - 80, 0, centerX - 80, 25);
    damageGradient.addColorStop(0, '#F39C12');
    damageGradient.addColorStop(1, '#E67E22');
    ctx.fillStyle = damageGradient;
    ctx.beginPath();
    ctx.roundRect(centerX - 70, 32, 140, 18, 9);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`Damage: ${Math.floor(player.totalDamage)}`, centerX, 42);

    // 右侧：分数、时间、难度
    const difficulty = getDifficultyMultiplier(player.gameTime);
    const rightX = CANVAS_WIDTH - padding - 10;

    ctx.textAlign = 'right';

    // 分数（金色）
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(`⭐ ${scoreRef.current}`, rightX, 18);
    ctx.restore();

    // 时间
    ctx.fillStyle = '#BDC3C7';
    ctx.font = 'bold 12px Arial, sans-serif';
    const minutes = Math.floor(player.gameTime / 60);
    const seconds = Math.floor(player.gameTime % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(`⏱ ${timeStr}`, rightX, 36);

    // 难度（带颜色指示）
    const diffColor = difficulty < 2 ? '#2ECC71' : (difficulty < 4 ? '#F39C12' : '#E74C3C');
    ctx.fillStyle = diffColor;
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`⚡ ${difficulty.toFixed(1)}x`, rightX, 52);
  }, [getDifficultyMultiplier]);

  // ==================== 绘制升级面板 ====================
  const drawLevelUpPanel = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    console.log('[Draw Level Up Panel] Called', {
      playerLevel: player.level,
      availableSkills: availableSkillsRef.current.length,
      skills: availableSkillsRef.current.map(s => ({ id: s.id, name: s.name }))
    });

    // 半透明遮罩（渐变背景）
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    gradient.addColorStop(0, 'rgba(30, 20, 40, 0.95)');
    gradient.addColorStop(1, 'rgba(10, 10, 20, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 标题（带光晕）
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL UP`, CANVAS_WIDTH / 2, 60);
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(`Lv.${player.level} → Lv.${player.level + 1}`, CANVAS_WIDTH / 2, 110);
    ctx.restore();

    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#BDC3C7';
    ctx.fillText('选择一个技能', CANVAS_WIDTH / 2, 155);

    const skills = availableSkillsRef.current;

    // 检查技能数量
    if (skills.length === 0) {
      console.error('[Draw Level Up Panel] No skills available!');
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('错误：没有可选择的技能', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      return;
    }

    console.log('[Draw Level Up Panel] Drawing skill cards', { skillCount: skills.length });

    const panelWidth = 380;
    const panelHeight = 480;
    const panelGap = 40;
    const totalWidth = panelWidth * 3 + panelGap * 2;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = 190;

    skills.forEach((skill, index) => {
      const x = startX + index * (panelWidth + panelGap);
      const isSelected = selectedSkillIndexRef.current === index;

      // 背景面板（渐变）
      const panelGradient = ctx.createLinearGradient(x, startY, x, startY + panelHeight);
      if (isSelected) {
        panelGradient.addColorStop(0, 'rgba(155, 89, 182, 0.5)');
        panelGradient.addColorStop(1, 'rgba(155, 89, 182, 0.3)');
      } else {
        panelGradient.addColorStop(0, 'rgba(40, 35, 55, 0.95)');
        panelGradient.addColorStop(1, 'rgba(30, 25, 45, 0.95)');
      }
      ctx.fillStyle = panelGradient;

      ctx.strokeStyle = isSelected ? '#FFD700' : 'rgba(155, 89, 182, 0.6)';
      ctx.lineWidth = isSelected ? 5 : 2;

      // 绘制圆角矩形
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(x + radius, startY);
      ctx.lineTo(x + panelWidth - radius, startY);
      ctx.quadraticCurveTo(x + panelWidth, startY, x + panelWidth, startY + radius);
      ctx.lineTo(x + panelWidth, startY + panelHeight - radius);
      ctx.quadraticCurveTo(x + panelWidth, startY + panelHeight, x + panelWidth - radius, startY + panelHeight);
      ctx.lineTo(x + radius, startY + panelHeight);
      ctx.quadraticCurveTo(x, startY + panelHeight, x, startY + panelHeight - radius);
      ctx.lineTo(x, startY + radius);
      ctx.quadraticCurveTo(x, startY, x + radius, startY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 选中时的光晕效果
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 12;
        ctx.stroke();
        ctx.restore();
      }

      // 技能图标背景
      const iconBgX = x + panelWidth / 2 - 50;
      const iconBgY = startY + 40;
      const iconBgGradient = ctx.createRadialGradient(
        iconBgX + 50, iconBgY + 50, 0,
        iconBgX + 50, iconBgY + 50, 50
      );
      iconBgGradient.addColorStop(0, skill.color);
      iconBgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = iconBgGradient;
      ctx.beginPath();
      ctx.arc(iconBgX + 50, iconBgY + 50, 48, 0, Math.PI * 2);
      ctx.fill();

      // 绘制技能图标
      if (skill.icon) {
        ctx.save();
        ctx.translate(iconBgX + 50, iconBgY + 50);
        ctx.scale(6, 6);
        skill.icon.forEach(pixel => {
          ctx.fillStyle = pixel.color;
          ctx.fillRect(pixel.x, pixel.y, 1, 1);
        });
        ctx.restore();
      }

      // 稀有度标签
      ctx.fillStyle = skill.color;
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(skill.rarity.toUpperCase(), x + panelWidth / 2, startY + 150);

      // 技能名称
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(skill.name, x + panelWidth / 2, startY + 180);

      // 技能描述
      ctx.fillStyle = '#D5D8DC';
      ctx.font = '15px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // 文字换行处理
      const maxWidth = panelWidth - 40;
      const words = skill.description.split('');
      let line = '';
      let lineY = startY + 220;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, x + 20, lineY);
          line = words[i];
          lineY += 22;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x + 20, lineY);

      // 技能类型标签
      ctx.fillStyle = skill.type === 'passive' ? '#2ECC71' : '#3498DB';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      const typeBgGradient = ctx.createLinearGradient(x + panelWidth / 2 - 50, startY + panelHeight - 70, x + panelWidth / 2 + 50, startY + panelHeight - 70);
      typeBgGradient.addColorStop(0, skill.type === 'passive' ? 'rgba(46, 204, 113, 0.3)' : 'rgba(52, 152, 219, 0.3)');
      typeBgGradient.addColorStop(1, skill.type === 'passive' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(52, 152, 219, 0.1)');
      ctx.fillStyle = typeBgGradient;
      ctx.beginPath();
      ctx.roundRect(x + panelWidth / 2 - 50, startY + panelHeight - 82, 100, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(skill.type === 'passive' ? '被动' : '主动', x + panelWidth / 2, startY + panelHeight - 70);

      // 键盘快捷键提示
      ctx.fillStyle = '#7F8C8D';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(`按 ${index + 1} 或点击选择`, x + panelWidth / 2, startY + panelHeight - 30);
    });
  }, []);

  // ==================== 绘制开始屏幕 ====================
  const drawStartScreen = useCallback((ctx: CanvasRenderingContext2D) => {
    // 清空画布（避免之前的内容残留）
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawStaticBackground(ctx);

    // 标题
    ctx.fillStyle = '#FF4757';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('肉鸽割草', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

    // 副标题
    ctx.fillStyle = '#BDC3C7';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('生存 · 战斗 · 进化', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    // 操作说明
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial, sans-serif';
    ctx.textAlign = 'center';
    const instructions = [
      'WASD 或 方向键 - 移动',
      '鼠标移动 - 瞄准',
      '自动攻击 - 近战/远程自动切换',
      '按空格键开始游戏'
    ];
    instructions.forEach((instruction, index) => {
      ctx.fillText(instruction, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30 + index * 35);
    });

    // 闪烁的开始提示
    const alpha = 0.5 + Math.sin(Date.now() / 300) * 0.5;
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('按空格键开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 220);
  }, [drawBackground]);

  // ==================== 绘制游戏结束屏幕 ====================
  const drawGameOverScreen = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    // 清空画布（避免之前的内容残留）
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 标题
    ctx.fillStyle = '#FF4757';
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, 150);

    // 分数
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillText(scoreRef.current.toString(), CANVAS_WIDTH / 2, 240);

    ctx.fillStyle = '#BDC3C7';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('最终得分', CANVAS_WIDTH / 2, 285);

    // 统计信息
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial, sans-serif';
    const stats = [
      `等级: ${player.level}`,
      `击杀: ${player.totalKills}`,
      `存活: ${Math.floor(player.gameTime)}秒`,
      `总伤害: ${Math.floor(player.totalDamage)}`
    ];
    stats.forEach((stat, index) => {
      ctx.fillText(stat, CANVAS_WIDTH / 2, 340 + index * 35);
    });

    // 操作提示
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('按 R 重新开始', CANVAS_WIDTH / 2, 530);
    ctx.fillText('按 Q 退出', CANVAS_WIDTH / 2, 565);
  }, []);

  // ==================== 更新摄像机位置 ====================
  const updateCamera = useCallback((player: Player) => {
    // 摄像机中心跟随玩家，但限制在世界边界内
    // 摄像机x,y表示世界坐标中的左上角位置
    const targetX = player.x - CANVAS_WIDTH / 2;
    const targetY = player.y - CANVAS_HEIGHT / 2;

    // 限制摄像机不能超出世界边界
    cameraRef.current.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, targetX));
    cameraRef.current.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, targetY));
  }, []);

  // ==================== 游戏主循环 ====================
  const gameLoop = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn('Canvas not found, stopping game loop');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('Canvas context not found, stopping game loop');
        return;
      }

      const now = performance.now();
      const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const gameState = gameStateRef.current;
      const player = playerRef.current;

      // 根据游戏状态渲染不同内容
      if (gameState === GameState.START) {
        try {
          drawStartScreen(ctx);
        } catch (error) {
          console.error('Error drawing start screen:', error);
        }
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (!player) {
        console.warn('Player not initialized, stopping game loop');
        return;
      }

      // 游戏进行中：更新摄像机位置
      updateCamera(player);

      // 清空画布（避免重影）
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 移除屏幕震动，只保留摄像机跟随玩家移动（彻底解决偏移问题）
      ctx.save();

      // 绘制背景（使用屏幕坐标）
      drawBackground(ctx);

      if (gameState === GameState.PLAYING || gameState === GameState.LEVEL_UP) {
        // 更新游戏时间
        if (gameState === GameState.PLAYING) {
          player.gameTime += deltaTime;
          gameTimeRef.current = player.gameTime;
        }

        // 更新难度
        difficultyRef.current = getDifficultyMultiplier(player.gameTime);

        // 玩家移动（带惯性）- 仅在PLAYING状态下允许
        let dx = 0, dy = 0;
        if (gameState === GameState.PLAYING) {
          if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
          if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
          if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
          if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx /= length;
          dy /= length;

          // 惯性处理
          player.vx = player.vx * 0.85 + dx * player.speed * 0.15;
          player.vy = player.vy * 0.85 + dy * player.speed * 0.15;

          // 迅捷被动：低血量时加速
          const hasSpeed = player.skills.some(s => s.id === 'passive_speed');
          let speedMultiplier = 1;
          if (hasSpeed && player.hp < player.maxHp * 0.5) {
            speedMultiplier = 1.3;
          }

          const newX = player.x + player.vx * speedMultiplier * deltaTime * 60;
          const newY = player.y + player.vy * speedMultiplier * deltaTime * 60;

          // 边界和障碍物碰撞检测（使用世界边界）
          if (!checkObstacleCollision(newX, player.y, PLAYER_SIZE) &&
              newX > PLAYER_SIZE + 10 && newX < WORLD_WIDTH - PLAYER_SIZE - 10) {
            player.x = newX;
          }
          if (!checkObstacleCollision(player.x, newY, PLAYER_SIZE) &&
              newY > PLAYER_SIZE + 10 && newY < WORLD_HEIGHT - PLAYER_SIZE - 10) {
            player.y = newY;
          }

          if (Math.random() < 0.3) {
            createParticles(player.x, player.y + PLAYER_SIZE, '#555', 1, 'dust');
          }
        } else {
          player.vx *= 0.9;
          player.vy *= 0.9;
        }

        // 生命恢复（仅在PLAYING状态下）
        if (gameState === GameState.PLAYING) {
          lastRegenTimeRef.current += deltaTime;
          if (lastRegenTimeRef.current >= 1 && player.regenRate > 0) {
            lastRegenTimeRef.current = 0;
            if (player.hp < player.maxHp) {
              const healAmount = Math.min(Math.floor(player.regenRate), Math.floor(player.maxHp - player.hp));
              if (healAmount > 0) {
                player.hp = Math.min(player.maxHp, Math.floor(player.hp + healAmount));
                createDamageNumber(player.x, player.y - 25, healAmount, false, true);
                playSound('heal');
              }
            }
          }
        }

        // 护盾被动
        shieldTimerRef.current += deltaTime;
        const hasShieldPassive = player.skills.some(s => s.id === 'passive_shield');
        if (hasShieldPassive && shieldTimerRef.current >= 15) {
          shieldTimerRef.current = 0;
          // 这里可以添加护盾逻辑
          createParticles(player.x, player.y, '#3498DB', 20, 'shield');
          playSound('levelup');
        }

        // UI更新 - 降低更新频率（每0.1秒更新一次）
        lastStatsUpdateTimeRef.current += deltaTime;
        if (lastStatsUpdateTimeRef.current >= 0.1) {
          lastStatsUpdateTimeRef.current = 0;
          try {
            setPlayerStats({ ...player });
          } catch (error) {
            console.error('Error updating player stats:', error);
          }
        }

        // 生成怪物（仅在游戏中）
        if (gameState === GameState.PLAYING) {
          monsterSpawnTimerRef.current += deltaTime;

          // 根据难度动态调整生成间隔
          // 3分钟后开始线性增加刷怪速度
          const timeBonus = Math.max(0, (player.gameTime - 180) / 60 * 0.05); // 每分钟增加0.05
          const spawnInterval = Math.max(0.15, 1.2 - Math.pow(difficultyRef.current, 0.5) * 0.3 - timeBonus);

          if (monsterSpawnTimerRef.current >= spawnInterval) {
            spawnMonster(player);
            monsterSpawnTimerRef.current = 0;
          }

          // 近战Boss刷新逻辑：6分钟后每75秒刷新一个，属性递增50%
          if (player.gameTime >= 360) { // 6分钟后开始刷新
            meleeBossSpawnTimerRef.current += deltaTime;
            if (meleeBossSpawnTimerRef.current >= 75) { // 每75秒刷新一个
              meleeBossSpawnTimerRef.current = 0;

              // 手动生成近战Boss（覆盖默认类型）
              const side = Math.floor(Math.random() * 4);
              let bossX: number, bossY: number;
              const margin = MONSTER_SPAWN_MARGIN;

              switch (side) {
                case 0: bossX = Math.random() * WORLD_WIDTH; bossY = -margin; break;
                case 1: bossX = WORLD_WIDTH + margin; bossY = Math.random() * WORLD_HEIGHT; break;
                case 2: bossX = Math.random() * WORLD_WIDTH; bossY = WORLD_HEIGHT + margin; break;
                case 3: bossX = -margin; bossY = Math.random() * WORLD_HEIGHT; break;
                default: bossX = WORLD_WIDTH / 2; bossY = -margin;
              }

              const existingMeleeBossCount = monstersRef.current.filter(m => m.type === 'melee_boss').length;
              const meleeBossStats = {
                baseHp: 10000,
                baseDamage: 25,
                baseSpeed: 2.0,
                baseExp: 1000,
                baseSize: 72,
                color: '#E74C3C'
              };

              // 属性递增：每次刷新增加50%（不包括移速、CD、攻击距离）
              const growthMultiplier = Math.pow(1.5, existingMeleeBossCount);
              const difficulty = getDifficultyMultiplier(player.gameTime);

              const meleeBoss: Monster = {
                id: monsterIdCounterRef.current++,
                x: bossX,
                y: bossY,
                vx: 0,
                vy: 0,
                hp: Math.floor(meleeBossStats.baseHp * growthMultiplier * difficulty),
                maxHp: Math.floor(meleeBossStats.baseHp * growthMultiplier * difficulty),
                damage: Math.floor(meleeBossStats.baseDamage * growthMultiplier * difficulty),
                speed: meleeBossStats.baseSpeed * (0.95 + Math.random() * 0.1), // 基础速度不受成长影响
                exp: Math.floor(meleeBossStats.baseExp * growthMultiplier * difficulty),
                lastAttack: 0,
                size: meleeBossStats.baseSize,
                color: meleeBossStats.color,
                type: 'melee_boss',
                scale: 1,
                angle: 0,
                animationOffset: Math.random() * Math.PI * 2,
                isStunned: false,
                stunnedTime: 0,
                hasShield: true,
                shieldHp: Math.floor(5000 * growthMultiplier * difficulty),
                shieldMaxHp: Math.floor(5000 * growthMultiplier * difficulty),
                currentPhase: 0,
                phaseTimer: 0,
                abilityCooldown: 8, // 近战Boss冲刺CD
                lastAbilityTime: 0,
                // 近战Boss冲刺技能相关属性
                isCharging: false,
                chargeStartTime: 0,
                chargeDirection: { x: 0, y: 0 },
                chargeTrail: [],
                meleeBossSpawnIndex: existingMeleeBossCount
              };

              monstersRef.current.push(meleeBoss);
              createParticles(bossX, bossY, '#E74C3C', 30, 'explosion');
              triggerScreenShake(4, 0.12);
              playSound('explosion');
            }
          }

          // 自动攻击 - 近战和远程同时进行
          autoAttackTimerRef.current += deltaTime;
          const autoAttackInterval = 1 / player.attackSpeed;

          if (autoAttackTimerRef.current >= autoAttackInterval) {
            autoAttackTimerRef.current = 0;

            // 近战攻击（范围内有敌人时）
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
              autoMeleeAttack(player);
            }

            // 远程攻击（同时向鼠标方向射击）
            autoRangedAttack(player);
          }

          // 自动锁敌被动技能
          if (player.autoLockLevel > 0 && monstersRef.current.length > 0) {
            autoLockUltimateTimerRef.current += deltaTime;

            // 计算技能等级效果
            const trackingMasteryBonus = 1000 + player.trackingMasteryLevel * 200; // 基础1000，每级+200伤害

            // 计算速度加成（从技能中统计tracking_speed数量）
            const speedReduction = player.skills.filter(s => s.id.startsWith('tracking_speed')).length;
            const interval = Math.max(2, 6 - speedReduction); // 基础6秒，每级减少1秒，最低2秒

            // 计算多重攻击（从技能中统计tracking_multishot数量）
            const multishotBonus = player.skills.filter(s => s.id.startsWith('tracking_multishot')).length;
            const targetCount = 1 + multishotBonus; // 基础1个目标

            // 计算法阵范围加成（从技能中统计tracking_pierce数量）
            const radiusBonus = player.skills.filter(s => s.id.startsWith('tracking_pierce')).length;
            const radiusBonusMultiplier = 1 + radiusBonus * 0.3; // 每级扩大30%
            const baseRadius = 80; // 放大法阵基础半径从50到80

            if (autoLockUltimateTimerRef.current >= interval) {
              autoLockUltimateTimerRef.current = 0;

              // 筛选屏幕内的怪物（视野范围内）
              const visibleMonsters = monstersRef.current.filter(monster => {
                const screenX = worldToScreenX(monster.x);
                const screenY = worldToScreenY(monster.y);
                return screenX >= -100 && screenX <= CANVAS_WIDTH + 100 &&
                       screenY >= -100 && screenY <= CANVAS_HEIGHT + 100;
              });

              // 找到屏幕内生命值最高的N个怪物
              const sortedMonsters = visibleMonsters
                .map(m => ({
                  monster: m,
                  hp: m.hp
                }))
                .sort((a, b) => b.hp - a.hp)
                .slice(0, targetCount);

              sortedMonsters.forEach(({ monster }) => {
                // 在怪物脚下生成法阵，延迟1秒后造成伤害
                const damage = Math.floor(trackingMasteryBonus);
                const duration = 1;  // 法阵持续1秒
                const radius = baseRadius * radiusBonusMultiplier;  // 法阵半径（可升级）

                createMagicCircle(monster.id, monster.x, monster.y, damage, duration, radius);
              });

              createParticles(player.x, player.y, '#F1C40F', 20, 'magic');
              triggerScreenShake(2 * player.trackingMasteryLevel / 5, 0.06);
              playSound('levelup');
            }
          }
        }

        // 更新怪物（仅在PLAYING状态下，升级时暂停怪物移动和绘制）
        if (gameState === GameState.PLAYING) {
          monstersRef.current = monstersRef.current.filter(monster => {
            const mdx = player.x - monster.x;
            const mdy = player.y - monster.y;
            const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

            if (mDistance > 1) {
            const moveSpeed = monster.speed * (monster.isStunned ? 0 : 1);

            // 避障AI
            let targetX = player.x;
            let targetY = player.y;

            // 检查前方是否有障碍物
            const checkX = monster.x + (mdx / mDistance) * 30;
            const checkY = monster.y + (mdy / mDistance) * 30;

            if (checkObstacleCollision(checkX, checkY, monster.size)) {
              // 尝试绕过障碍物
              if (!checkObstacleCollision(monster.x + (mdy / mDistance) * 30, monster.y - (mdx / mDistance) * 30, monster.size)) {
                targetX = player.x + mdy;
                targetY = player.y - mdx;
              } else {
                targetX = player.x - mdy;
                targetY = player.y + mdx;
              }
            }

            const tdx = targetX - monster.x;
            const tdy = targetY - monster.y;
            const tDistance = Math.sqrt(tdx * tdx + tdy * tdy);

            if (tDistance > 1) {
              monster.vx = (tdx / tDistance) * moveSpeed;
              monster.vy = (tdy / tDistance) * moveSpeed;
            }

            const newX = monster.x + monster.vx;
            const newY = monster.y + monster.vy;

            if (!checkObstacleCollision(newX, monster.y, monster.size)) {
              monster.x = newX;
            }
            if (!checkObstacleCollision(monster.x, newY, monster.size)) {
              monster.y = newY;
            }
          }

          if (monster.isStunned) {
            monster.stunnedTime -= deltaTime * 1000;
            if (monster.stunnedTime <= 0) {
              monster.isStunned = false;
            }
          }

          // Boss AI
          updateBossAI(monster, player, deltaTime);

          // 玩家与怪物碰撞（仅在PLAYING状态下）
          if (checkCollision(player.x, player.y, PLAYER_SIZE, monster.x, monster.y, monster.size)) {
            if (performance.now() - monster.lastAttack > 700) {
              // 护盾优先吸收伤害
              let damage = Math.floor(monster.damage);

              // 坚韧被动
              const hasArmor = player.skills.some(s => s.id === 'passive_armor');
              if (hasArmor) {
                damage = Math.floor(damage * 0.8);
              }

              if (monster.hasShield && monster.shieldHp > 0) {
                const absorbed = Math.min(damage, monster.shieldHp);
                monster.shieldHp = Math.max(0, Math.floor(monster.shieldHp - absorbed));
                damage = Math.max(0, damage - absorbed);
                createParticles(monster.x, monster.y, '#3498DB', 6, 'shield');
                playSound('shoot');
              }

              // 无敌帧
              if (!player.invincible) {
                if (damage > 0) {
                  player.hp = Math.max(0, Math.floor(player.hp - damage));
                  monster.lastAttack = performance.now();
                  createDamageNumber(player.x, player.y, damage, false);
                  triggerScreenShake(2, 0.08);
                  playSound('damage');
                  createParticles(player.x, player.y, COLORS.player, 10, 'blood');

                  player.invincible = true;
                  player.invincibleTime = 500;

                  // 不屈被动检查
                  const hasRevive = player.skills.some(s => s.id === 'passive_revive');
                  if (hasRevive && player.hp < 0.1 && Math.random() < 0.2) {
                    player.hp = Math.floor(player.maxHp * 0.5);
                    createParticles(player.x, player.y, '#00FF00', 30, 'magic');
                    triggerScreenShake(4, 0.15);
                    playSound('levelup');
                    player.invincible = true;
                    player.invincibleTime = 2000;
                  }
                }
              }
            }
          }

          // 更新无敌帧
          if (player.invincible) {
            player.invincibleTime -= deltaTime * 1000;
            if (player.invincibleTime <= 0) {
              player.invincible = false;
            }
          }

          return monster.hp > 0;
          });

          // 绘制怪物（仅在PLAYING状态下，使用屏幕坐标）
          monstersRef.current.forEach(monster => {
            const monsterScreenX = worldToScreenX(monster.x);
            const monsterScreenY = worldToScreenY(monster.y);

            // 怪物阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(monsterScreenX, monsterScreenY + monster.size * 0.4, monster.size * 0.7, monster.size * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            // 怪物动画
            const animOffset = Math.sin(gameTimeRef.current * 5 + monster.animationOffset) * 2;

            // 根据怪物类型绘制
            const monsterPixels = PIXEL_ART.monsters[monster.type];
            if (monsterPixels) {
              ctx.save();
              ctx.translate(monsterScreenX, monsterScreenY + animOffset);
              ctx.scale(monster.scale * 1.2, monster.scale * 1.2);
              drawPixelArt(ctx, monsterPixels, -4, -4, 1);
              ctx.restore();
            }

            // Boss护盾视觉效果
            if (monster.type === 'boss' && monster.hasShield && monster.shieldHp > 0) {
              const shieldAlpha = 0.4 + Math.sin(gameTimeRef.current * 3) * 0.15;
              ctx.save();
              ctx.translate(monsterScreenX, monsterScreenY + animOffset);

              // 绘制外圈护盾
              const outerShield = PIXEL_ART.bossShield.shield;
              outerShield.forEach(pixel => {
                ctx.fillStyle = pixel.color.replace('0.6', shieldAlpha.toFixed(2));
                ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
              });

              // 绘制内圈护盾
              const innerShield = PIXEL_ART.bossShield.innerShield;
              innerShield.forEach(pixel => {
                ctx.fillStyle = pixel.color.replace('0.8', (shieldAlpha + 0.2).toFixed(2));
                ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
              });

              ctx.restore();
            }

            // 近战Boss特殊效果
            if (monster.type === 'melee_boss') {
              // 冲刺路径显示（前摇阶段）
              if (monster.isCharging) {
                const chargeElapsed = performance.now() - monster.chargeStartTime;
                if (chargeElapsed <= 1000) { // 前摇阶段
                  const pathLength = 200;
                  const dirX = monster.chargeDirection.x;
                  const dirY = monster.chargeDirection.y;
                  const progress = chargeElapsed / 1000;

                  // 绘制冲刺路径（虚线）
                  ctx.save();
                  ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)';
                  ctx.lineWidth = 6;
                  ctx.setLineDash([10, 10]);
                  ctx.lineDashOffset = -progress * 50;

                  ctx.beginPath();
                  ctx.moveTo(monsterScreenX, monsterScreenY);
                  ctx.lineTo(monsterScreenX + dirX * pathLength, monsterScreenY + dirY * pathLength);
                  ctx.stroke();

                  ctx.restore();
                }
              }

              // 冲刺残留痕迹
              if (monster.chargeTrail.length > 0) {
                monster.chargeTrail = monster.chargeTrail.filter(point => {
                  point.life -= deltaTime;

                  if (point.life > 0) {
                    const pointScreenX = worldToScreenX(point.x);
                    const pointScreenY = worldToScreenY(point.y);

                    ctx.fillStyle = `rgba(231, 76, 60, ${point.life * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(pointScreenX, pointScreenY, 12, 0, Math.PI * 2);
                    ctx.fill();

                    return true;
                  }
                  return false;
                });
              }

              // 近战Boss护盾（红色）
              if (monster.hasShield && monster.shieldHp > 0) {
                const shieldAlpha = 0.4 + Math.sin(gameTimeRef.current * 3) * 0.15;
                ctx.save();
                ctx.translate(monsterScreenX, monsterScreenY + animOffset);

                // 绘制外圈护盾（红色）
                const outerShield = PIXEL_ART.bossShield.shield;
                outerShield.forEach(pixel => {
                  ctx.fillStyle = pixel.color.replace('0.6', shieldAlpha.toFixed(2)).replace('52, 152, 219', '231, 76, 60');
                  ctx.fillRect(pixel.x - 2, pixel.y - 2, 4, 4); // 放大以适应更大体型
                });

                // 绘制内圈护盾（红色高亮）
                const innerShield = PIXEL_ART.bossShield.innerShield;
                innerShield.forEach(pixel => {
                  ctx.fillStyle = pixel.color.replace('0.8', (shieldAlpha + 0.2).toFixed(2)).replace('93, 173, 226', '255, 107, 107');
                  ctx.fillRect(pixel.x - 2, pixel.y - 2, 4, 4); // 放大以适应更大体型
                });

                ctx.restore();
              }
            }

            // 血条（受伤时显示）
            if (monster.hp < monster.maxHp) {
              const barWidth = monster.size * 1.5;
              const barHeight = 4;
              const barX = monsterScreenX - barWidth / 2;
              const barY = monsterScreenY - monster.size - 10;

              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(barX, barY, barWidth, barHeight);

              const hpPercent = monster.hp / monster.maxHp;
              const hpColor = hpPercent > 0.5 ? '#2ECC71' : (hpPercent > 0.25 ? '#F39C12' : '#E74C3C');
              ctx.fillStyle = hpColor;
              ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            }

            // 护盾条
            if (monster.hasShield && monster.shieldHp > 0) {
              const barWidth = monster.size * 1.5;
              const barHeight = 3;
              const barX = monsterScreenX - barWidth / 2;
              const barY = monsterScreenY - monster.size - 6;

              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(barX, barY, barWidth, barHeight);

              const shieldPercent = monster.shieldHp / monster.shieldMaxHp;
              ctx.fillStyle = '#3498DB';
              ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);
            }
          });
        }

        // 更新投射物（仅在PLAYING状态下，升级时暂停投射物）
        if (gameState === GameState.PLAYING) {
          projectilesRef.current = projectilesRef.current.filter(projectile => {
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;

          projectile.trail.push({ x: projectile.x, y: projectile.y, life: 1 });
          if (projectile.trail.length > 25) projectile.trail.shift();
          projectile.trail.forEach(t => t.life -= deltaTime * 12);

          // 边界弹射（仅玩家投射物，使用世界边界）
          if (projectile.owner === 'player') {
            if (projectile.x <= 0 || projectile.x >= WORLD_WIDTH) {
              projectile.vx *= -1;
              projectile.bounceCount--;
            }
            if (projectile.y <= 0 || projectile.y >= WORLD_HEIGHT) {
              projectile.vy *= -1;
              projectile.bounceCount--;
            }
          }

          // 绘制轨迹（使用屏幕坐标）
          const projScreenX = worldToScreenX(projectile.x);
          const projScreenY = worldToScreenY(projectile.y);

          ctx.strokeStyle = projectile.type === 'fireball' ? '#FF6B6B' :
                           (projectile.type === 'ice' ? '#85C1E9' :
                           (projectile.type === 'lightning' ? '#F1C40F' : COLORS.projectileGlow));
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          projectile.trail.forEach((t, i) => {
            if (t.life > 0) {
              const trailScreenX = worldToScreenX(t.x);
              const trailScreenY = worldToScreenY(t.y);
              ctx.globalAlpha = t.life * 0.5;
              if (i === 0) {
                ctx.moveTo(trailScreenX, trailScreenY);
              } else {
                ctx.lineTo(trailScreenX, trailScreenY);
              }
            }
          });
          ctx.stroke();
          ctx.globalAlpha = 1;

          // 绘制投射物（使用屏幕坐标）
          const glowColor = projectile.type === 'fireball' ? '#FF6B6B' :
                           (projectile.type === 'ice' ? '#85C1E9' :
                           (projectile.type === 'lightning' ? '#F1C40F' : COLORS.projectileGlow));
          const glowSize = projectile.type === 'fireball' ? 18 :
                          (projectile.type === 'ice' ? 14 :
                          (projectile.type === 'lightning' ? 16 : 12));
          const glow = ctx.createRadialGradient(projScreenX, projScreenY, 0, projScreenX, projScreenY, glowSize);
          glow.addColorStop(0, glowColor);
          glow.addColorStop(1, 'rgba(255, 165, 2, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(projScreenX, projScreenY, glowSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = projectile.type === 'fireball' ? COLORS.fireball :
                        (projectile.type === 'ice' ? '#85C1E9' :
                        (projectile.type === 'lightning' ? '#F1C40F' : COLORS.projectile));
          ctx.beginPath();
          ctx.arc(projScreenX, projScreenY, projectile.type === 'fireball' ? 7 :
                 (projectile.type === 'ice' ? 5 :
                 (projectile.type === 'lightning' ? 6 : 5)), 0, Math.PI * 2);
          ctx.fill();

          // 碰撞检测
          if (projectile.owner === 'player') {
            let hit = false;
            for (const monster of monstersRef.current) {
              const hitRadius = projectile.type === 'fireball' ? 12 :
                              (projectile.type === 'ice' ? 10 :
                              (projectile.type === 'lightning' ? 11 : 8));
              if (checkCollision(projectile.x, projectile.y, hitRadius, monster.x, monster.y, monster.size)) {
                let isCrit = Math.random() < player.critRate;
                let damage = isCrit ? projectile.damage * player.critMultiplier : projectile.damage;

                // 狂战士被动
                const hasBerserker = player.skills.some(s => s.id === 'berserker');
                if (hasBerserker && player.hp < player.maxHp * 0.5) {
                  const hpPercent = player.hp / player.maxHp;
                  damage *= 1 + (1 - hpPercent) * 1.25;
                }

                // 巨人杀手被动
                const hasGiantSlayer = player.skills.some(s => s.id === 'giant_slayer');
                if (hasGiantSlayer && (monster.type === 'boss' || monster.type === 'elite')) {
                  damage *= 1.5;
                }

                // 护盾优先吸收
                if (monster.hasShield && monster.shieldHp > 0) {
                  const absorbed = Math.min(damage, monster.shieldHp);
                  monster.shieldHp = Math.max(0, Math.floor(monster.shieldHp - absorbed));
                  damage = Math.max(0, Math.floor(damage - absorbed));
                  createParticles(monster.x, monster.y, '#3498DB', 6, 'shield');
                  playSound('shoot');
                }

                // 冰霜被动
                const hasFreeze = player.skills.some(s => s.id === 'passive_freeze');
                if (hasFreeze && Math.random() < 0.1) {
                  monster.isStunned = true;
                  monster.stunnedTime = 1000;
                  createParticles(monster.x, monster.y, '#85C1E9', 10, 'ice');
                }

                if (damage > 0) {
                  monster.hp = Math.max(0, Math.floor(monster.hp - damage));
                  createParticles(projectile.x, projectile.y, COLORS.spark, 8, 'spark');
                  createDamageNumber(monster.x, monster.y, damage, isCrit);
                  playSound(isCrit ? 'crit' : 'hit');
                  triggerScreenShake(isCrit ? 1.2 : 0.6, isCrit ? 0.04 : 0.02);
                }

                player.totalDamage += damage;

                // 荆棘护甲被动
                const hasThorns = player.skills.some(s => s.id === 'passive_thorns');
                if (hasThorns) {
                  const thornsDamage = Math.floor(monster.damage * 0.5);
                  monster.hp = Math.max(0, monster.hp - thornsDamage);
                  createParticles(monster.x, monster.y, '#FF6B6B', 5, 'spark');
                }

                // 连锁被动
                const hasChain = player.skills.some(s => s.id === 'passive_chain');
                if (hasChain && Math.random() < 0.15) {
                  for (const otherMonster of monstersRef.current) {
                    if (otherMonster.id !== monster.id && checkCollision(monster.x, monster.y, 100, otherMonster.x, otherMonster.y, otherMonster.size)) {
                      otherMonster.hp = Math.max(0, Math.floor(otherMonster.hp - damage * 0.5));
                      createParticles(otherMonster.x, otherMonster.y, '#F1C40F', 6, 'magic');
                    }
                  }
                }

                if (monster.hp < 0.1) {
                  let expGain = Math.floor(monster.exp);

                  // 快速学习被动
                  const hasFastLearning = player.skills.some(s => s.id === 'passive_exp');
                  if (hasFastLearning) {
                    expGain = Math.floor(expGain * 1.25);
                  }

                  player.exp += expGain;
                  player.totalKills++;

                  // 生命汲取被动
                  const hasLifesteal = player.skills.some(s => s.id === 'passive_lifesteal');
                  if (hasLifesteal) {
                    const healAmount = 5;
                    player.hp = Math.min(player.maxHp, Math.floor(player.hp + healAmount));
                    createDamageNumber(player.x, player.y - 20, healAmount, false, true);
                    playSound('heal');
                  }

                  createParticles(monster.x, monster.y, monster.color, 12, 'explosion');
                  triggerScreenShake(1.5, 0.05);
                  scoreRef.current += Math.floor(monster.exp);

                  // 降低分数更新频率（每0.2秒更新一次）
                  lastScoreUpdateTimeRef.current += deltaTime;
                  if (lastScoreUpdateTimeRef.current >= 0.2) {
                    lastScoreUpdateTimeRef.current = 0;
                    try {
                      setScore(scoreRef.current);
                    } catch (error) {
                      console.error('Error updating score:', error);
                    }
                  }

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
          } else {
            // 怪物投射物与玩家碰撞
            if (checkCollision(projectile.x, projectile.y, 8, player.x, player.y, PLAYER_SIZE)) {
              if (!player.invincible) {
                let damage = Math.floor(projectile.damage);

                // 坚韧被动
                const hasArmor = player.skills.some(s => s.id === 'passive_armor');
                if (hasArmor) {
                  damage = Math.floor(damage * 0.8);
                }

                player.hp = Math.max(0, Math.floor(player.hp - damage));
                player.invincible = true;
                player.invincibleTime = 500;

                createDamageNumber(player.x, player.y, damage, false);
                triggerScreenShake(2, 0.07);
                playSound('damage');
                createParticles(player.x, player.y, COLORS.player, 8, 'blood');

                if (player.hp < 0.1) {
                  gameStateRef.current = GameState.GAME_OVER;
                  return false;
                }
              }
              return false;
            }
          }

          if (projectile.x < -70 || projectile.x > WORLD_WIDTH + 70 ||
              projectile.y < -70 || projectile.y > WORLD_HEIGHT + 70 ||
              projectile.bounceCount < 0) {
            return false;
          }

          return true;
          });
        }

        // 更新刀光特效（使用屏幕坐标）
        slashEffectsRef.current = slashEffectsRef.current.filter(slash => {
          slash.life -= deltaTime / slash.maxLife;

          if (slash.life <= 0) return false;

          const alpha = slash.life;
          ctx.globalAlpha = alpha;

          const slashScreenX = worldToScreenX(slash.x);
          const slashScreenY = worldToScreenY(slash.y);

          ctx.save();
          ctx.translate(slashScreenX, slashScreenY);
          ctx.rotate(slash.angle);

          ctx.strokeStyle = COLORS.slash;
          ctx.lineWidth = 5;
          ctx.shadowColor = COLORS.slash;
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(40, -28, 80, 0);
          ctx.quadraticCurveTo(40, 10, 0, 0);
          ctx.stroke();

          ctx.restore();
          ctx.globalAlpha = 1;

          return true;
        });

        // 更新和绘制法阵特效（使用屏幕坐标）
        magicCirclesRef.current = magicCirclesRef.current.filter(circle => {
          const elapsedTime = performance.now() - circle.startTime;
          const elapsedSeconds = elapsedTime / 1000;
          const progress = elapsedSeconds / circle.duration;

          if (elapsedSeconds >= circle.duration) {
            // 法阵持续时间结束，对怪物造成伤害
            const monster = monstersRef.current.find(m => m.id === circle.monsterId);
            if (monster) {
              let isCrit = Math.random() < player.critRate;
              let damage = isCrit ? circle.damage * player.critMultiplier : circle.damage;

              // 狂战士被动
              const hasBerserker = player.skills.some(s => s.id === 'berserker');
              if (hasBerserker && player.hp < player.maxHp * 0.5) {
                const hpPercent = player.hp / player.maxHp;
                damage *= 1 + (1 - hpPercent) * 1.25;
              }

              // 巨人杀手被动
              const hasGiantSlayer = player.skills.some(s => s.id === 'giant_slayer');
              if (hasGiantSlayer && (monster.type === 'boss' || monster.type === 'elite')) {
                damage *= 1.5;
              }

              // 护盾优先吸收
              if (monster.hasShield && monster.shieldHp > 0) {
                const absorbed = Math.min(damage, monster.shieldHp);
                monster.shieldHp = Math.max(0, Math.floor(monster.shieldHp - absorbed));
                damage = Math.max(0, Math.floor(damage - absorbed));
                createParticles(monster.x, monster.y, '#3498DB', 6, 'shield');
                playSound('shoot');
              }

              if (damage > 0) {
                monster.hp = Math.max(0, Math.floor(monster.hp - damage));
                createParticles(monster.x, monster.y, '#F1C40F', 15, 'explosion');
                createParticles(monster.x, monster.y, '#9B59B6', 10, 'magic');
                createDamageNumber(monster.x, monster.y, damage, isCrit);
                triggerScreenShake(isCrit ? 2 : 1, 0.04);
                playSound(isCrit ? 'crit' : 'hit');

                player.totalDamage += damage;

                if (monster.hp < 0.1) {
                  let expGain = Math.floor(monster.exp);

                  // 快速学习被动
                  const hasFastLearning = player.skills.some(s => s.id === 'passive_exp');
                  if (hasFastLearning) {
                    expGain = Math.floor(expGain * 1.25);
                  }

                  player.exp += expGain;
                  player.totalKills++;

                  // 生命汲取被动
                  const hasLifesteal = player.skills.some(s => s.id === 'passive_lifesteal');
                  if (hasLifesteal) {
                    const healAmount = 5;
                    player.hp = Math.min(player.maxHp, Math.floor(player.hp + healAmount));
                    createDamageNumber(player.x, player.y - 20, healAmount, false, true);
                    playSound('heal');
                  }

                  createParticles(monster.x, monster.y, monster.color, 20, 'explosion');
                  triggerScreenShake(1.5, 0.05);
                  scoreRef.current += Math.floor(monster.exp);
                  playSound('kill');
                }
              }
            }
            return false;
          }

          // 更新法阵旋转
          circle.rotation += deltaTime * 2;

          // 绘制法阵（使用像素风格）
          const circleScreenX = worldToScreenX(circle.x);
          const circleScreenY = worldToScreenY(circle.y);
          const alpha = 1 - progress;

          ctx.globalAlpha = alpha;

          ctx.save();
          ctx.translate(circleScreenX, circleScreenY);

          // 外圈（金色，顺时针旋转）
          ctx.save();
          ctx.rotate(circle.rotation);
          const outerRing = PIXEL_ART.magicCircle.outerRing;
          outerRing.forEach(pixel => {
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
          });
          ctx.restore();

          // 中圈（紫色，逆时针旋转）
          ctx.save();
          ctx.rotate(-circle.rotation * 1.2);
          const middleRing = PIXEL_ART.magicCircle.middleRing;
          middleRing.forEach(pixel => {
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
          });
          ctx.restore();

          // 内圈（金色，快速旋转）
          ctx.save();
          ctx.rotate(circle.rotation * 1.5);
          const innerRing = PIXEL_ART.magicCircle.innerRing;
          innerRing.forEach(pixel => {
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
          });
          ctx.restore();

          // 装饰性三角形（随外圈旋转）
          ctx.save();
          ctx.rotate(circle.rotation * 0.5);
          const triangles = PIXEL_ART.magicCircle.triangles;
          triangles.forEach(pixel => {
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
          });
          ctx.restore();

          // 光点装饰（闪烁效果）
          const dots = PIXEL_ART.magicCircle.dots;
          const twinkle = (Math.sin(elapsedSeconds * 8) + 1) * 0.5;
          dots.forEach((pixel, index) => {
            const dotAlpha = alpha * (0.3 + twinkle * 0.7) * (0.8 + Math.sin(index + elapsedSeconds * 5) * 0.2);
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = dotAlpha;
            ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
          });

          // 中心符文（慢速脉冲）
          const pulse = 1 + Math.sin(elapsedSeconds * 6) * 0.2;
          ctx.save();
          ctx.scale(pulse, pulse);
          const centerRune = PIXEL_ART.magicCircle.centerRune;
          centerRune.forEach(pixel => {
            ctx.fillStyle = pixel.color;
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillRect(pixel.x - 1, pixel.y - 1, 3, 3);
          });
          ctx.restore();

          ctx.restore();
          ctx.globalAlpha = 1;

          return true;
        });

        // 更新粒子（使用屏幕坐标）
        particlesRef.current = particlesRef.current.filter(particle => {
          particle.life -= deltaTime;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.25;
          particle.rotation += particle.rotationSpeed;

          if (particle.life <= 0) return false;

          const alpha = particle.life / particle.maxLife;
          const particleScreenX = worldToScreenX(particle.x);
          const particleScreenY = worldToScreenY(particle.y);

          ctx.globalAlpha = alpha;

          if (particle.type === 'blood') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particleScreenX, particleScreenY, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'spark') {
            const gradient = ctx.createRadialGradient(particleScreenX, particleScreenY, 0, particleScreenX, particleScreenY, particle.size);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particleScreenX, particleScreenY, particle.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'magic' || particle.type === 'shield') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particleScreenX, particleScreenY, particle.size * alpha * 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'explosion') {
            const gradient = ctx.createRadialGradient(particleScreenX, particleScreenY, 0, particleScreenX, particleScreenY, particle.size * 2.5);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particleScreenX, particleScreenY, particle.size * alpha * 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'dust') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particleScreenX, particleScreenY, particle.size * alpha * 0.6, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'ice') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particleScreenX, particleScreenY, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = 1;
          return true;
        });

        // 更新伤害数字（使用屏幕坐标）
        damageNumbersRef.current = damageNumbersRef.current.filter(dn => {
          dn.life -= deltaTime;
          dn.y -= 3;

          if (dn.life <= 0) return false;

          const alpha = dn.life / dn.maxLife;
          const dnScreenX = worldToScreenX(dn.x);
          const dnScreenY = worldToScreenY(dn.y);

          ctx.globalAlpha = alpha;
          ctx.fillStyle = dn.color;
          ctx.font = dn.isCrit ? `bold ${36 * dn.scale}px Arial, sans-serif` : `bold ${28 * dn.scale}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = dn.color;
          ctx.shadowBlur = dn.isHeal ? 7 : 12;
          ctx.fillText(dn.damage.toString(), dnScreenX, dnScreenY);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;

          return true;
        });

        // 绘制障碍物（使用屏幕坐标）
        obstaclesRef.current.forEach(obs => {
          const obsScreenX = worldToScreenX(obs.x);
          const obsScreenY = worldToScreenY(obs.y);

          if (obs.type === 'tree') {
            // 树木特殊绘制 - 精致像素风格
            const centerX = obsScreenX + obs.width / 2;
            const centerY = obsScreenY + obs.height / 2;
            const radius = obs.width / 2;

            // 树影（更柔和的大阴影）
            const shadowGradient = ctx.createRadialGradient(
              centerX + 8, obsScreenY + obs.height + 5, 0,
              centerX + 8, obsScreenY + obs.height + 5, radius * 1.2
            );
            shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
            shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = shadowGradient;
            ctx.beginPath();
            ctx.ellipse(centerX + 8, obsScreenY + obs.height + 5, radius * 1.1, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // 树干（渐变立体感）
            const trunkGradient = ctx.createLinearGradient(centerX - 10, centerY - 15, centerX + 10, centerY + 20);
            trunkGradient.addColorStop(0, '#A0522D');
            trunkGradient.addColorStop(0.5, '#8B4513');
            trunkGradient.addColorStop(1, '#654321');
            ctx.fillStyle = trunkGradient;

            // 更精致的树干形状（底部宽，顶部窄）
            ctx.beginPath();
            ctx.moveTo(centerX - 8, centerY + 20);
            ctx.lineTo(centerX + 8, centerY + 20);
            ctx.lineTo(centerX + 5, centerY - 15);
            ctx.lineTo(centerX - 5, centerY - 15);
            ctx.closePath();
            ctx.fill();

            // 树干纹理
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(centerX - 2, centerY - 5, 4, 15);

            // 树冠（多层渐变，营造立体感）
            // 底层大叶子
            const bottomLeafGradient = ctx.createRadialGradient(
              centerX - 15, centerY - 25, 0,
              centerX - 15, centerY - 25, radius * 0.7
            );
            bottomLeafGradient.addColorStop(0, '#228B22');
            bottomLeafGradient.addColorStop(0.7, '#2E8B57');
            bottomLeafGradient.addColorStop(1, '#1B5E20');
            ctx.fillStyle = bottomLeafGradient;
            ctx.beginPath();
            ctx.ellipse(centerX - 15, centerY - 25, radius * 0.6, radius * 0.45, -0.3, 0, Math.PI * 2);
            ctx.fill();

            const bottomLeafGradient2 = ctx.createRadialGradient(
              centerX + 15, centerY - 23, 0,
              centerX + 15, centerY - 23, radius * 0.7
            );
            bottomLeafGradient2.addColorStop(0, '#228B22');
            bottomLeafGradient2.addColorStop(0.7, '#2E8B57');
            bottomLeafGradient2.addColorStop(1, '#1B5E20');
            ctx.fillStyle = bottomLeafGradient2;
            ctx.beginPath();
            ctx.ellipse(centerX + 15, centerY - 23, radius * 0.55, radius * 0.4, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // 中层叶子
            const midLeafGradient = ctx.createRadialGradient(
              centerX, centerY - 40, 0,
              centerX, centerY - 40, radius * 0.65
            );
            midLeafGradient.addColorStop(0, '#32CD32');
            midLeafGradient.addColorStop(0.7, '#228B22');
            midLeafGradient.addColorStop(1, '#1B5E20');
            ctx.fillStyle = midLeafGradient;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - 40, radius * 0.5, radius * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            // 顶层小叶子（明亮）
            const topLeafGradient = ctx.createRadialGradient(
              centerX, centerY - 55, 0,
              centerX, centerY - 55, radius * 0.5
            );
            topLeafGradient.addColorStop(0, '#90EE90');
            topLeafGradient.addColorStop(0.6, '#32CD32');
            topLeafGradient.addColorStop(1, '#228B22');
            ctx.fillStyle = topLeafGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY - 55, radius * 0.25, 0, Math.PI * 2);
            ctx.fill();

            // 树冠高光（营造光照感）
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.arc(centerX - 10, centerY - 45, radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 12, centerY - 35, radius * 0.12, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 石头和墙壁
            ctx.fillStyle = obs.type === 'rock' ? '#57606F' : '#636E72';
            ctx.fillRect(obsScreenX, obsScreenY, obs.width, obs.height);

            // 高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(obsScreenX, obsScreenY, obs.width, 4);
            ctx.fillRect(obsScreenX, obsScreenY, 4, obs.height);

            // 岩石纹理
            if (obs.type === 'rock') {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
              ctx.fillRect(obsScreenX + 10, obsScreenY + 10, obs.width - 20, 4);
              ctx.fillRect(obsScreenX + obs.width / 2 - 8, obsScreenY + obs.height / 2, 16, 4);
            }
          }
        });

        // 绘制玩家（使用屏幕坐标）
        const playerScreenX = worldToScreenX(player.x);
        const playerScreenY = worldToScreenY(player.y);

        ctx.save();
        ctx.translate(playerScreenX, playerScreenY);

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, PLAYER_SIZE * 0.35, PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 玩家光晕
        const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, PLAYER_SIZE * 2.8);
        playerGlow.addColorStop(0, COLORS.playerGlow);
        playerGlow.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = playerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // 无敌闪烁
        if (player.invincible) {
          ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.5;
        }

        // 绘制像素艺术玩家
        drawPixelArt(ctx, PIXEL_ART.player.body, -8, -8, 1);

        // 近战武器（剑）- 指向鼠标方向
        ctx.save();
        ctx.rotate(mouseRef.current.angle);
        ctx.translate(0, -8);

        const swordArt = PIXEL_ART.player.weapon.sword;
        if (swordArt) {
          drawPixelArt(ctx, swordArt, -3, -8, 0.8);
        }

        ctx.restore();

        // 远程武器（弓）- 显示在另一侧
        ctx.save();
        ctx.rotate(mouseRef.current.angle + Math.PI);
        ctx.translate(0, -8);

        const bowArt = PIXEL_ART.player.weapon.bow;
        if (bowArt) {
          drawPixelArt(ctx, bowArt, -3, -8, 0.7);
        }

        ctx.restore();
      }

      ctx.restore();

      // 强制重置Canvas上下文状态，防止shadow等效果残留导致边框问题
      resetContext(ctx);

      // 绘制升级面板（不受摄像机影响，使用Canvas坐标）
      if (gameState === GameState.LEVEL_UP) {
        console.log('[Game Loop] Drawing level up panel', {
          availableSkills: availableSkillsRef.current.length,
          skills: availableSkillsRef.current.map(s => s.name),
          playerLevel: player.level
        });

        try {
          drawLevelUpPanel(ctx, player);
        } catch (error) {
          console.error('[Game Loop] Error drawing level up panel:', error);
          // 如果绘制失败，切换回游戏状态
          gameStateRef.current = GameState.PLAYING;
        }
      } else {
        // 绘制UI（不受摄像机影响，使用Canvas坐标）
        drawUI(ctx, player);
      }

      // 绘制游戏结束屏幕（不受摄像机影响）
      if (gameState === GameState.GAME_OVER) {
        drawGameOverScreen(ctx, player);
      }

      // 统一死亡检测（确保玩家死亡后正确切换状态）
      if (gameState === GameState.PLAYING && player.hp <= 0) {
        console.log('[Game Loop] Player died, switching to GAME_OVER state', {
          playerHp: player.hp,
          gameTime: player.gameTime,
          score: scoreRef.current
        });
        gameStateRef.current = GameState.GAME_OVER;
        player.hp = 0;
        playSound('explosion');
        createParticles(player.x, player.y, COLORS.blood, 30, 'explosion');
        triggerScreenShake(5, 0.2);
      }

      // 检查升级（只在PLAYING状态下）
      if (gameState === GameState.PLAYING && player.exp >= player.expToNext) {
        console.log('[Game Loop] Level up condition met', {
          playerExp: player.exp,
          expToNext: player.expToNext,
          currentLevel: player.level,
          currentState: gameState
        });

        try {
          handleLevelUp(player);

          // 验证状态是否成功切换
          if (gameStateRef.current !== GameState.LEVEL_UP) {
            console.error('[Game Loop] Level up failed - state not changed to LEVEL_UP');
            // 如果状态切换失败，继续游戏
          } else {
            console.log('[Game Loop] Level up successful, game paused for skill selection');
            // 升级成功，本帧结束（不再继续处理）
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
          }
        } catch (error) {
          console.error('[Game Loop] Error in level up process:', error);
          // 即使升级出错，也要继续游戏循环
        }
      }

      // 继续游戏循环
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error('Game loop error:', error);
      // 防止无限错误循环，延迟重试
      setTimeout(() => {
        if (gameStateRef.current !== GameState.GAME_OVER) {
          lastTimeRef.current = performance.now();
          animationFrameRef.current = requestAnimationFrame(gameLoop);
        }
      }, 100);
    }
  }, [
    drawStartScreen,
    drawBackground,
    drawUI,
    drawLevelUpPanel,
    drawGameOverScreen,
    drawPixelArt,
    checkCollision,
    checkObstacleCollision,
    getDifficultyMultiplier,
    createParticles,
    createDamageNumber,
    createSlashEffect,
    autoMeleeAttack,
    autoRangedAttack,
    spawnMonster,
    updateBossAI,
    handleLevelUp,
    playSound,
    triggerScreenShake
  ]);

  // ==================== 游戏控制 ====================
  const initializeGame = useCallback(() => {
    console.log('Initializing game...');

    playerRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      hp: 1000,
      maxHp: 1000,
      level: 1,
      exp: 0,
      expToNext: 80,
      speed: 6,
      baseSpeed: 6,
      attackSpeed: 3,
      lastAttack: 0,
      meleeDamage: 45,
      rangedDamage: 40,
      critRate: 0.15,
      critMultiplier: 2,
      attackRange: 110,
      arrowCount: 0,
      regenRate: 1,
      skills: [],
      totalKills: 0,
      totalDamage: 0,
      gameTime: 0,
      autoLockLevel: 0,
      trackingMasteryLevel: 0,
      invincible: false,
      invincibleTime: 0
    };

    monstersRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageNumbersRef.current = [];
    slashEffectsRef.current = [];
    magicCirclesRef.current = [];
    screenShakeRef.current = { intensity: 0, duration: 0, x: 0, y: 0 };
    obstaclesRef.current = [];
    monsterIdCounterRef.current = 0;
    projectileIdCounterRef.current = 0;
    monsterSpawnTimerRef.current = 0;
    autoAttackTimerRef.current = 0;
    autoLockUltimateTimerRef.current = 0;
    meleeBossSpawnTimerRef.current = 0;
    gameTimeRef.current = 0;
    lastRegenTimeRef.current = 0;
    shieldTimerRef.current = 0;
    scoreRef.current = 0;
    difficultyRef.current = 1;
    soundCooldownsRef.current = {};  // 重置音效冷却

    spawnObstacles();
    setScore(0);
    setGameInitialized(true);

    gameStateRef.current = GameState.START;

    initAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        console.log('Canvas found, starting game loop...');
        lastTimeRef.current = performance.now();
        gameLoop();
      } else {
        console.error('Canvas not found!');
        toast.error('游戏启动失败，请重试');
      }
    }, 200);
  }, [initAudio, spawnObstacles, gameLoop]);

  // ==================== 副作用 ====================
  useEffect(() => {
    // 不在组件挂载时初始化游戏，而是在用户点击"知道了"后手动调用initializeGame
    return () => {
      // 清理动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }

      // 清理所有活动的oscillator
      activeOscillatorsRef.current.forEach(oscillator => {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch (e) {
          // 忽略已经停止的oscillator
        }
      });
      activeOscillatorsRef.current.clear();

      // 关闭AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          console.error('Error closing audio context:', e);
        }
      }

      // 清理游戏状态
      gameStateRef.current = GameState.GAME_OVER;
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // 游戏控制（仅在游戏初始化后才响应）
      if (gameInitializedRef.current) {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          if (gameStateRef.current === GameState.START) {
            gameStateRef.current = GameState.PLAYING;
            playSound('select');
          } else if (gameStateRef.current === GameState.GAME_OVER) {
            initializeGame();
            playSound('select');
          }
        }

        if (e.key.toLowerCase() === 'r') {
          if (gameStateRef.current === GameState.GAME_OVER) {
            initializeGame();
            playSound('select');
          }
        }

        if (e.key.toLowerCase() === 'q') {
          if (gameStateRef.current === GameState.GAME_OVER) {
            onCancel();
            playSound('select');
          }
        }

        // 升级面板选择
      if (gameStateRef.current === GameState.LEVEL_UP) {
        console.log('[Keyboard] Level Up input', {
          key: e.key,
          availableSkills: availableSkillsRef.current.length,
          selectedIndex: selectedSkillIndexRef.current
        });

        if (e.key === '1' || e.key === '2' || e.key === '3') {
          const index = parseInt(e.key) - 1;
          if (availableSkillsRef.current[index]) {
            console.log('[Keyboard] Selecting skill', {
              index,
              skill: availableSkillsRef.current[index]
            });

            selectedSkillIndexRef.current = index;
            playSound('select');

            setTimeout(() => {
              try {
                const skill = availableSkillsRef.current[index];
                console.log('[Keyboard] Applying skill', { skill });

                if (playerRef.current) {
                  playerRef.current = skill.apply(playerRef.current);
                  playerRef.current.skills.push(skill);

                  console.log('[Keyboard] Skill applied, resuming game', {
                    newLevel: playerRef.current.level,
                    totalSkills: playerRef.current.skills.length
                  });
                }

                gameStateRef.current = GameState.PLAYING;
                lastTimeRef.current = performance.now();
              } catch (error) {
                console.error('[Keyboard] Error applying skill:', error);
              }
            }, 200);
          }
        }

        // 鼠标选择
        if (e.key === 'Enter' || e.key === ' ') {
          const selectedSkill = availableSkillsRef.current[selectedSkillIndexRef.current];
          if (selectedSkill && playerRef.current) {
            console.log('[Keyboard] Confirming skill selection', {
              selectedSkill,
              selectedIndex: selectedSkillIndexRef.current
            });

            try {
              playerRef.current = selectedSkill.apply(playerRef.current);
              playerRef.current.skills.push(selectedSkill);

              console.log('[Keyboard] Skill applied via confirm, resuming game');

              gameStateRef.current = GameState.PLAYING;
              lastTimeRef.current = performance.now();
            } catch (error) {
              console.error('[Keyboard] Error applying skill:', error);
            }
          }
        }
        }
      }
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
  }, [initializeGame, onCancel, playSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameInitialized) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // 在升级面板中，检测鼠标悬停的技能卡片
      if (gameStateRef.current === GameState.LEVEL_UP) {
        const panelWidth = 350;
        const panelGap = 30;
        const totalWidth = panelWidth * 3 + panelGap * 2;
        const startX = (CANVAS_WIDTH - totalWidth) / 2;
        const startY = 180;

        let hoveredIndex = -1;

        availableSkillsRef.current.forEach((skill, index) => {
          const x = startX + index * (panelWidth + panelGap);
          const panelHeight = 420;

          if (mouseX >= x && mouseX <= x + panelWidth &&
              mouseY >= startY && mouseY <= startY + panelHeight) {
            hoveredIndex = index;
          }
        });

        if (hoveredIndex !== selectedSkillIndexRef.current && hoveredIndex !== -1) {
          selectedSkillIndexRef.current = hoveredIndex;
          playSound('hover');
        }
      } else {
        // 将鼠标Canvas坐标转换为世界坐标（用于计算攻击角度）
        const worldMouseX = screenToWorldX(mouseX);
        const worldMouseY = screenToWorldY(mouseY);

        // 计算鼠标角度并存储
        const dx = worldMouseX - playerRef.current!.x;
        const dy = worldMouseY - playerRef.current!.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          const angle = Math.atan2(dy, dx);
          mouseRef.current.x = worldMouseX;
          mouseRef.current.y = worldMouseY;
          mouseRef.current.angle = angle;
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (gameStateRef.current !== GameState.LEVEL_UP) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      console.log('[Mouse Click] Canvas click', {
        clickX,
        clickY,
        gameState: gameStateRef.current,
        availableSkills: availableSkillsRef.current.length
      });

      // 检查点击的是哪个技能面板
      const panelWidth = 350;
      const panelGap = 30;
      const totalWidth = panelWidth * 3 + panelGap * 2;
      const startX = (CANVAS_WIDTH - totalWidth) / 2;
      const startY = 180;

      availableSkillsRef.current.forEach((skill, index) => {
        const x = startX + index * (panelWidth + panelGap);
        const panelHeight = 420;

        if (clickX >= x && clickX <= x + panelWidth &&
            clickY >= startY && clickY <= startY + panelHeight) {
          console.log('[Mouse Click] Clicked on skill panel', {
            index,
            skill: skill.name,
            panelBounds: { x, y: startY, width: panelWidth, height: panelHeight }
          });

          selectedSkillIndexRef.current = index;
          playSound('hover');

          setTimeout(() => {
            try {
              if (playerRef.current) {
                console.log('[Mouse Click] Applying skill', { skill });

                playerRef.current = skill.apply(playerRef.current);
                playerRef.current.skills.push(skill);

                console.log('[Mouse Click] Skill applied, resuming game', {
                  newLevel: playerRef.current.level,
                  totalSkills: playerRef.current.skills.length
                });
              }

              gameStateRef.current = GameState.PLAYING;
              lastTimeRef.current = performance.now();
            } catch (error) {
              console.error('[Mouse Click] Error applying skill:', error);
            }
          }, 150);
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameInitialized, playSound]);

  // ==================== 提交结果 ====================
  const handleSubmit = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const player = playerRef.current;
      if (!player) return;

      const metadata = [scoreRef.current, player.level, player.totalKills, player.totalDamage, Math.floor(player.gameTime)];
      const gameHash = computeHash(4, scoreRef.current, timestamp, metadata);

      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          toast.error('请先连接钱包');
          return;
        }

        const result: GameResult = {
          gameType: 4,
          score: scoreRef.current,
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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

          {showTutorial && (
            <div className="bg-purple-500/10 rounded-lg p-6 backdrop-blur-sm border border-purple-500/20">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">游戏规则</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold mb-3 text-white">操作方式</p>
                  <ul className="space-y-2 text-gray-300">
                    <li>WASD / 方向键 - 移动</li>
                    <li>鼠标移动 - 瞄准</li>
                    <li>自动攻击 - 近战/远程自动切换</li>
                    <li>空格键 - 开始游戏</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-3 text-white">游戏机制</p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• 无时间限制，根据能力生存</li>
                    <li>• 非线性难度曲线</li>
                    <li>• 30+技能，包含主动/被动</li>
                    <li>• 3种武器可切换</li>
                    <li>• 地形障碍物</li>
                    <li>• Boss有特殊技能和阶段</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowTutorial(false);
                  // 点击"我知道了"后才初始化游戏
                  initializeGame();
                  playSound('select');
                }}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-600"
              >
                知道了，开始游戏
              </Button>
            </div>
          )}

          {!showTutorial && (
            <>
              <div className="flex justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-purple-500/10 border border-purple-500/20 text-white hover:bg-purple-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                  全屏
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="bg-purple-500/10 border border-purple-500/20 text-white hover:bg-purple-500/20"
                >
                  {soundEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                  {soundEnabled ? '音效: 开' : '音效: 关'}
                </Button>
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
            </>
          )}

          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full h-12 border-gray-600 hover:bg-gray-800"
          >
            返回主页
          </Button>

          {gameStateRef.current === GameState.GAME_OVER && (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  initializeGame();
                }}
                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-600"
              >
                再玩一次
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-600"
              >
                提交成绩
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
