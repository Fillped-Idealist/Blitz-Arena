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
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PLAYER_SIZE = 20;
const MAX_MONSTERS = 100;
const MAX_PROJECTILES = 100;
const MAX_PARTICLES = 600;
const MAX_DAMAGE_NUMBERS = 80;
const MONSTER_SPAWN_MARGIN = 200;

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
  autoLockLevel: number;  // 自动锁敌技能等级（0=未解锁）
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
  type: 'slime' | 'skeleton' | 'ghost' | 'boss' | 'elite';
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
    ]
  }
};

// ==================== 技能池 ====================
const SKILL_POOL: Skill[] = [
  // 基础属性提升（主动）
  {
    id: 'melee_damage',
    name: '剑术精通',
    description: '近战伤害 +25%',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.25 }),
    rarity: 'common',
    color: COLORS.common
  },
  {
    id: 'ranged_damage',
    name: '箭术精通',
    description: '远程伤害 +25%',
    type: 'active',
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.25 }),
    rarity: 'common',
    color: COLORS.common
  },
  {
    id: 'max_hp',
    name: '钢铁之躯',
    description: '最大生命值 +50',
    type: 'active',
    apply: (p) => ({ ...p, maxHp: p.maxHp + 50, hp: p.hp + 50 }),
    rarity: 'common',
    color: COLORS.common
  },
  // 进阶属性提升（稀有）
  {
    id: 'attack_speed',
    name: '迅捷之击',
    description: '攻击速度 +25%',
    type: 'active',
    apply: (p) => ({ ...p, attackSpeed: p.attackSpeed * 1.25 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'movement_speed',
    name: '疾风步',
    description: '移动速度 +20%',
    type: 'active',
    apply: (p) => ({ ...p, baseSpeed: p.baseSpeed * 1.2, speed: p.speed * 1.2 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'attack_range',
    name: '范围扩大',
    description: '攻击范围 +30%',
    type: 'active',
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.3 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'regen_boost',
    name: '生命恢复',
    description: '每秒回复生命值 +3',
    type: 'active',
    apply: (p) => ({ ...p, regenRate: p.regenRate + 3 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  // 史诗技能
  {
    id: 'crit_rate',
    name: '致命一击',
    description: '暴击率 +20%',
    type: 'active',
    apply: (p) => ({ ...p, critRate: Math.min(p.critRate + 0.2, 1) }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'arrow_bounce',
    name: '弹射之箭',
    description: '箭矢可弹射 +4 次',
    type: 'active',
    apply: (p) => ({ ...p, arrowCount: p.arrowCount + 4 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'critical_mastery',
    name: '暴击精通',
    description: '暴击伤害 +75%',
    type: 'active',
    apply: (p) => ({ ...p, critMultiplier: p.critMultiplier * 1.75 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'blade_dance',
    name: '剑舞',
    description: '近战可同时攻击5个敌人',
    type: 'active',
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.6 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'vampirism',
    name: '吸血鬼之触',
    description: '造成伤害的15%转化为生命值',
    type: 'active',
    apply: (p) => ({ ...p, regenRate: p.regenRate + 8 }),
    rarity: 'epic',
    color: COLORS.epic
  },
  // 传说技能
  {
    id: 'fire_mastery',
    name: '火焰掌握',
    description: '远程投射物变为火球，伤害+75%',
    type: 'active',
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.75 }),
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'giant_slayer',
    name: '巨人杀手',
    description: '对Boss和精英伤害 +100%',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.5, rangedDamage: p.rangedDamage * 1.5 }),
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'berserker',
    name: '狂战士',
    description: '生命值越低，伤害越高（最高+125%）',
    type: 'active',
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.75, rangedDamage: p.rangedDamage * 1.75 }),
    rarity: 'legendary',
    color: COLORS.legendary
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
    color: COLORS.mythic
  },
  // 武器切换（主动）
  {
    id: 'change_bow',
    name: '弓箭手',
    description: '切换到弓箭，攻击范围+50%，攻击速度-15%',
    type: 'active',
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.5, attackSpeed: p.attackSpeed * 0.85 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'magic_power',
    name: '魔法强化',
    description: '远程伤害+40%，投射物速度+30%',
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
    id: 'auto_lock_lv1',
    name: '自动追踪（Lv1）',
    description: '每10秒自动发射1枚追踪导弹攻击最近的敌人（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, autoLockLevel: Math.max(p.autoLockLevel, 1) }),
    rarity: 'epic',
    color: COLORS.epic
  },
  {
    id: 'auto_lock_lv2',
    name: '自动追踪（Lv2）',
    description: '每8秒自动发射2枚追踪导弹攻击最近的2个敌人（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, autoLockLevel: Math.max(p.autoLockLevel, 2) }),
    rarity: 'legendary',
    color: COLORS.legendary
  },
  {
    id: 'auto_lock_lv3',
    name: '自动追踪（Lv3）',
    description: '每6秒自动发射3枚追踪导弹攻击最近的3个敌人，伤害x1.5（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, autoLockLevel: Math.max(p.autoLockLevel, 3) }),
    rarity: 'mythic',
    color: COLORS.mythic
  },
  {
    id: 'auto_lock_lv4',
    name: '自动追踪（Lv4）',
    description: '每5秒自动发射3枚追踪导弹攻击最近的3个敌人，伤害x2，穿透+2（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, autoLockLevel: Math.max(p.autoLockLevel, 4) }),
    rarity: 'mythic',
    color: COLORS.mythic
  },
  {
    id: 'auto_lock_lv5',
    name: '自动追踪（Lv5）',
    description: '每4秒自动发射4枚追踪导弹攻击最近的4个敌人，伤害x2.5，穿透+3（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, autoLockLevel: Math.max(p.autoLockLevel, 5) }),
    rarity: 'mythic',
    color: COLORS.mythic
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
    description: '暴击几率+10%（被动）',
    type: 'passive',
    apply: (p) => ({ ...p, critRate: p.critRate + 0.1 }),
    rarity: 'rare',
    color: COLORS.rare
  },
  {
    id: 'passive_damage',
    name: '力量',
    description: '所有伤害+15%（被动）',
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

  // 游戏核心数据引用
  const gameStateRef = useRef<GameState>(GameState.START);
  const playerRef = useRef<Player | null>(null);
  const monstersRef = useRef<Monster[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const slashEffectsRef = useRef<SlashEffect[]>([]);
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
    player.level++;
    player.exp = 0;
    player.expToNext = Math.floor(player.expToNext * 1.5);

    // 过滤掉需要前置技能的选项
    const filteredSkills = SKILL_POOL.filter(skill => {
      // 自动锁敌技能需要前置等级
      if (skill.id.startsWith('auto_lock_')) {
        const requiredLevel = parseInt(skill.id.split('_lv')[1]);
        return player.autoLockLevel >= requiredLevel - 1;
      }
      return true;
    });

    // 随机选择3个技能
    const shuffled = [...filteredSkills].sort(() => Math.random() - 0.5);
    const selectedSkills = shuffled.slice(0, 3);
    availableSkillsRef.current = selectedSkills;
    selectedSkillIndexRef.current = -1;

    gameStateRef.current = GameState.LEVEL_UP;

    createParticles(player.x, player.y, COLORS.levelUp, 40, 'magic');
    playSound('levelup');
  }, [createParticles, playSound]);

  // ==================== 生成障碍物 ====================
  const spawnObstacles = useCallback(() => {
    obstaclesRef.current = [];
    const numObstacles = 8 + Math.floor(gameTimeRef.current / 30);

    for (let i = 0; i < numObstacles; i++) {
      let x, y, width, height;
      const type = Math.random() > 0.5 ? 'rock' : 'wall';

      // 确保障碍物不在玩家初始位置附近
      do {
        x = 100 + Math.random() * (CANVAS_WIDTH - 200);
        y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      } while (Math.sqrt(Math.pow(x - CANVAS_WIDTH / 2, 2) + Math.pow(y - CANVAS_HEIGHT / 2, 2)) < 150);

      if (type === 'rock') {
        width = 40 + Math.random() * 40;
        height = 30 + Math.random() * 30;
      } else {
        width = 20 + Math.random() * 20;
        height = 80 + Math.random() * 40;
      }

      obstaclesRef.current.push({
        x, y, width, height, type, health: type === 'wall' ? 100 : 50
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
      case 0: x = Math.random() * CANVAS_WIDTH; y = -margin; break;
      case 1: x = CANVAS_WIDTH + margin; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + margin; break;
      case 3: x = -margin; y = Math.random() * CANVAS_HEIGHT; break;
      default: x = CANVAS_WIDTH / 2; y = -margin;
    }

    // 根据等级和难度调整怪物类型概率
    const typeRoll = Math.random();
    let type: Monster['type'] = 'slime';

    if (player.level >= 2 && typeRoll > 0.55 - difficulty * 0.05) type = 'skeleton';
    if (player.level >= 4 && typeRoll > 0.70 - difficulty * 0.05) type = 'ghost';
    if (player.level >= 5 && typeRoll > 0.82 - difficulty * 0.05) type = 'elite';
    if (player.level >= 7 && typeRoll > 0.93 - difficulty * 0.05) type = 'boss';

    const monsterStats = {
      slime: { baseHp: 40, baseDamage: 12, baseSpeed: 2.8, baseExp: 20, baseSize: 18, color: COLORS.slimeMonster },
      skeleton: { baseHp: 55, baseDamage: 18, baseSpeed: 3.2, baseExp: 30, baseSize: 20, color: COLORS.skeletonMonster },
      ghost: { baseHp: 45, baseDamage: 22, baseSpeed: 3.8, baseExp: 40, baseSize: 18, color: COLORS.ghostMonster },
      elite: { baseHp: 100, baseDamage: 28, baseSpeed: 3, baseExp: 80, baseSize: 24, color: COLORS.eliteMonster },
      boss: { baseHp: 500, baseDamage: 40, baseSpeed: 2.2, baseExp: 200, baseSize: 45, color: COLORS.bossMonster }
    };

    const stats = monsterStats[type];

    const monster: Monster = {
      id: monsterIdCounterRef.current++,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: Math.floor(stats.baseHp * difficulty),
      maxHp: Math.floor(stats.baseHp * difficulty),
      damage: Math.floor(stats.baseDamage * difficulty),
      speed: stats.baseSpeed * (0.95 + Math.random() * 0.1) * (1 + difficulty * 0.3),
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
      shieldHp: type === 'boss' ? 100 : 50,
      shieldMaxHp: type === 'boss' ? 100 : 50,
      currentPhase: 0,
      phaseTimer: 0,
      abilityCooldown: type === 'boss' ? 5 : 0,
      lastAbilityTime: 0
    };

    if (monstersRef.current.length < MAX_MONSTERS) {
      monstersRef.current.push(monster);
    }
  }, [getDifficultyMultiplier]);

  // ==================== Boss AI ====================
  const updateBossAI = useCallback((monster: Monster, player: Player, deltaTime: number) => {
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
            lastAbilityTime: 0
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

  // ==================== 绘制背景 ====================
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // 深空渐变背景
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    gradient.addColorStop(0, COLORS.backgroundStart);
    gradient.addColorStop(0.5, '#16213E');
    gradient.addColorStop(1, COLORS.backgroundEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 滚动网格
    const tileSize = 60;
    const gridOffset = (gameTimeRef.current * 15) % tileSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 60; i++) {
      const x = ((i * 137) % CANVAS_WIDTH);
      const y = ((i * 97) % CANVAS_HEIGHT);
      const twinkle = (Math.sin(gameTimeRef.current * 2.5 + i * 0.5) + 1) * 0.5;
      const size = (twinkle * 1.2 + 0.5);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // ==================== 绘制UI ====================
  const drawUI = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    const padding = 12;

    // 顶部信息栏背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 55);

    // 左侧：等级和血量
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv.${player.level}`, padding, 18);

    // 血量条
    const hpBarWidth = 200;
    const hpBarHeight = 14;
    const hpBarY = 32;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, hpBarY - 1, hpBarWidth + 2, hpBarHeight + 2);

    const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
    ctx.fillStyle = hpPercent > 0.3 ? '#4CAF50' : '#FF5252';
    ctx.fillRect(padding, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

    // 血量文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, padding + hpBarWidth / 2, hpBarY + hpBarHeight / 2);

    // 经验条（血量下方）
    const expBarWidth = 200;
    const expBarHeight = 6;
    const expBarY = hpBarY + hpBarHeight + 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, expBarY - 1, expBarWidth + 2, expBarHeight + 2);

    const expPercent = Math.max(0, Math.min(1, player.exp / player.expToNext));
    ctx.fillStyle = '#7ED6DF';
    ctx.fillRect(padding, expBarY, expBarWidth * expPercent, expBarHeight);

    // 经验文字
    ctx.fillStyle = '#BDC3C7';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(`${Math.floor(player.exp)}/${player.expToNext}`, padding + expBarWidth / 2, expBarY + expBarHeight / 2);

    // 右侧：分数、时间、难度
    const difficulty = getDifficultyMultiplier(player.gameTime);

    ctx.textAlign = 'right';

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_WIDTH - padding - 10, 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(`Time: ${Math.floor(player.gameTime)}s`, CANVAS_WIDTH - padding - 10, 36);

    ctx.fillStyle = '#FF6B6B';
    ctx.fillText(`Difficulty: ${difficulty.toFixed(1)}x`, CANVAS_WIDTH - padding - 10, 52);

    // 中间：击杀数和总伤害
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`Kills: ${player.totalKills}`, CANVAS_WIDTH / 2, 18);

    ctx.fillStyle = '#F39C12';
    ctx.fillText(`Damage: ${Math.floor(player.totalDamage)}`, CANVAS_WIDTH / 2, 36);
  }, [getDifficultyMultiplier]);

  // ==================== 绘制升级面板 ====================
  const drawLevelUpPanel = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('升级了！选择一个技能', CANVAS_WIDTH / 2, 120);

    const skills = availableSkillsRef.current;
    const panelWidth = 350;
    const panelHeight = 420;
    const panelGap = 30;
    const totalWidth = panelWidth * 3 + panelGap * 2;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = 180;

    skills.forEach((skill, index) => {
      const x = startX + index * (panelWidth + panelGap);
      const isSelected = selectedSkillIndexRef.current === index;

      // 背景面板
      ctx.fillStyle = isSelected ? 'rgba(155, 89, 182, 0.4)' : 'rgba(30, 30, 50, 0.95)';
      ctx.strokeStyle = isSelected ? '#9B59B6' : 'rgba(155, 89, 182, 0.5)';
      ctx.lineWidth = isSelected ? 4 : 2;

      // 绘制圆角矩形
      const radius = 10;
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

      // 稀有度标签
      ctx.fillStyle = skill.color;
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(skill.rarity.toUpperCase(), x + panelWidth / 2, startY + 30);

      // 技能名称
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(skill.name, x + panelWidth / 2, startY + 70);

      // 技能描述
      ctx.fillStyle = '#BDC3C7';
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // 文字换行处理
      const maxWidth = panelWidth - 30;
      const words = skill.description.split('');
      let line = '';
      let lineY = startY + 110;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, x + 15, lineY);
          line = words[i];
          lineY += 20;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x + 15, lineY);

      // 技能类型
      ctx.fillStyle = skill.type === 'passive' ? '#2ECC71' : '#3498DB';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(skill.type === 'passive' ? '被动' : '主动', x + panelWidth / 2, startY + panelHeight - 50);

      // 键盘快捷键提示
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(`按 ${index + 1} 选择`, x + panelWidth / 2, startY + panelHeight - 25);
    });
  }, []);

  // ==================== 绘制开始屏幕 ====================
  const drawStartScreen = useCallback((ctx: CanvasRenderingContext2D) => {
    drawBackground(ctx);

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

      // 屏幕震动
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

      if (gameState === GameState.PLAYING || gameState === GameState.LEVEL_UP) {
        // 更新游戏时间
        if (gameState === GameState.PLAYING) {
          player.gameTime += deltaTime;
          gameTimeRef.current = player.gameTime;
        }

        // 更新难度
        difficultyRef.current = getDifficultyMultiplier(player.gameTime);

        // 玩家移动（带惯性）
        let dx = 0, dy = 0;
        if (keysRef.current['w'] || keysRef.current['arrowup']) dy -= 1;
        if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
        if (keysRef.current['a'] || keysRef.current['arrowleft']) dx -= 1;
        if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;

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

          // 边界和障碍物碰撞检测
          if (!checkObstacleCollision(newX, player.y, PLAYER_SIZE) &&
              newX > PLAYER_SIZE + 10 && newX < CANVAS_WIDTH - PLAYER_SIZE - 10) {
            player.x = newX;
          }
          if (!checkObstacleCollision(player.x, newY, PLAYER_SIZE) &&
              newY > PLAYER_SIZE + 10 && newY < CANVAS_HEIGHT - PLAYER_SIZE - 10) {
            player.y = newY;
          }

          if (Math.random() < 0.3) {
            createParticles(player.x, player.y + PLAYER_SIZE, '#555', 1, 'dust');
          }
        } else {
          player.vx *= 0.9;
          player.vy *= 0.9;
        }

        // 生命恢复
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
          const spawnInterval = Math.max(0.2, 1.2 - Math.pow(difficultyRef.current, 0.5) * 0.3);

          if (monsterSpawnTimerRef.current >= spawnInterval) {
            spawnMonster(player);
            monsterSpawnTimerRef.current = 0;
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

            // 远程攻击（一直向鼠标方向射击，降低攻击频率）
            if (Math.random() < 0.4) {
              autoRangedAttack(player);
            }
          }

          // 自动锁敌被动技能（根据等级触发）
          if (player.autoLockLevel > 0 && monstersRef.current.length > 0) {
            autoLockUltimateTimerRef.current += deltaTime;

            const autoLockConfig = {
              1: { interval: 10, count: 1, damageMult: 1, pierce: 0 },
              2: { interval: 8, count: 2, damageMult: 1, pierce: 0 },
              3: { interval: 6, count: 3, damageMult: 1.5, pierce: 1 },
              4: { interval: 5, count: 3, damageMult: 2, pierce: 2 },
              5: { interval: 4, count: 4, damageMult: 2.5, pierce: 3 }
            };

            const config = autoLockConfig[player.autoLockLevel as keyof typeof autoLockConfig];

            if (autoLockUltimateTimerRef.current >= config.interval) {
              autoLockUltimateTimerRef.current = 0;

              // 找到最近的N个怪物
              const sortedMonsters = monstersRef.current
                .map(m => ({
                  monster: m,
                  distance: Math.sqrt(Math.pow(m.x - player.x, 2) + Math.pow(m.y - player.y, 2))
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, config.count);

              sortedMonsters.forEach(({ monster }) => {
                const angle = Math.atan2(monster.y - player.y, monster.x - player.x);

                projectilesRef.current.push({
                  id: projectileIdCounterRef.current++,
                  x: player.x,
                  y: player.y,
                  vx: Math.cos(angle) * 12,
                  vy: Math.sin(angle) * 12,
                  damage: Math.floor(player.rangedDamage * config.damageMult),
                  speed: 12,
                  bounceCount: 0,
                  angle,
                  trail: [],
                  type: 'lightning',
                  pierceCount: config.pierce,
                  owner: 'player'
                });
              });

              createParticles(player.x, player.y, '#F1C40F', 20, 'magic');
              triggerScreenShake(2 * player.autoLockLevel / 5, 0.06);
              playSound('levelup');
            }
          }
        }

        // 更新怪物
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

          // 玩家与怪物碰撞
          if (gameState === GameState.PLAYING && checkCollision(player.x, player.y, PLAYER_SIZE, monster.x, monster.y, monster.size)) {
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

          // 绘制怪物
          ctx.save();
          ctx.translate(monster.x, monster.y);

          // 阴影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, monster.size * 0.4, monster.size * 0.7, monster.size * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();

          // 动画偏移
          const bounce = Math.sin(gameTimeRef.current * 7 + monster.animationOffset) * 2;
          const scale = monster.type === 'boss' ? 1.6 : (monster.type === 'elite' ? 1.3 : 1);
          ctx.translate(0, bounce);
          ctx.scale(scale, scale);

          // 绘制像素艺术怪物
          const monsterArt = PIXEL_ART.monsters[monster.type];
          if (monsterArt) {
            drawPixelArt(ctx, monsterArt, -8, -8, 1);
          } else {
            ctx.fillStyle = monster.color;
            ctx.beginPath();
            ctx.arc(0, 0, monster.size, 0, Math.PI * 2);
            ctx.fill();
          }

          // 护盾效果
          if (monster.hasShield && monster.shieldHp > 0) {
            ctx.strokeStyle = '#3498DB';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8 + Math.sin(gameTimeRef.current * 5) * 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, monster.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          ctx.restore();

          // 怪物血条
          const hpPercent = monster.hp / monster.maxHp;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(monster.x - monster.size - 2, monster.y - monster.size - 14, monster.size * 2 + 4, 6);
          ctx.fillStyle = hpPercent > 0.3 ? '#4CAF50' : '#FF5252';
          ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 12, monster.size * 2 * hpPercent, 4);

          // 护盾条
          if (monster.hasShield && monster.shieldHp > 0) {
            const shieldPercent = monster.shieldHp / monster.shieldMaxHp;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(monster.x - monster.size - 2, monster.y - monster.size - 20, monster.size * 2 + 4, 4);
            ctx.fillStyle = '#3498DB';
            ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 18, monster.size * 2 * shieldPercent, 2);
          }

          return monster.hp > 0;
        });

        // 更新投射物
        projectilesRef.current = projectilesRef.current.filter(projectile => {
          projectile.x += projectile.vx;
          projectile.y += projectile.vy;

          projectile.trail.push({ x: projectile.x, y: projectile.y, life: 1 });
          if (projectile.trail.length > 25) projectile.trail.shift();
          projectile.trail.forEach(t => t.life -= deltaTime * 12);

          // 边界弹射（仅玩家投射物）
          if (projectile.owner === 'player') {
            if (projectile.x <= 0 || projectile.x >= CANVAS_WIDTH) {
              projectile.vx *= -1;
              projectile.bounceCount--;
            }
            if (projectile.y <= 0 || projectile.y >= CANVAS_HEIGHT) {
              projectile.vy *= -1;
              projectile.bounceCount--;
            }
          }

          // 绘制轨迹
          ctx.strokeStyle = projectile.type === 'fireball' ? '#FF6B6B' :
                           (projectile.type === 'ice' ? '#85C1E9' :
                           (projectile.type === 'lightning' ? '#F1C40F' : COLORS.projectileGlow));
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
          const glowColor = projectile.type === 'fireball' ? '#FF6B6B' :
                           (projectile.type === 'ice' ? '#85C1E9' :
                           (projectile.type === 'lightning' ? '#F1C40F' : COLORS.projectileGlow));
          const glowSize = projectile.type === 'fireball' ? 18 :
                          (projectile.type === 'ice' ? 14 :
                          (projectile.type === 'lightning' ? 16 : 12));
          const glow = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, glowSize);
          glow.addColorStop(0, glowColor);
          glow.addColorStop(1, 'rgba(255, 165, 2, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, glowSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = projectile.type === 'fireball' ? COLORS.fireball :
                        (projectile.type === 'ice' ? '#85C1E9' :
                        (projectile.type === 'lightning' ? '#F1C40F' : COLORS.projectile));
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, projectile.type === 'fireball' ? 7 :
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

          if (projectile.x < -70 || projectile.x > CANVAS_WIDTH + 70 ||
              projectile.y < -70 || projectile.y > CANVAS_HEIGHT + 70 ||
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

        // 更新粒子
        particlesRef.current = particlesRef.current.filter(particle => {
          particle.life -= deltaTime;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.25;
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
          } else if (particle.type === 'magic' || particle.type === 'shield') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha * 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'explosion') {
            const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2.5);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha * 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'dust') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha * 0.6, 0, Math.PI * 2);
            ctx.fill();
          } else if (particle.type === 'ice') {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = 1;
          return true;
        });

        // 更新伤害数字
        damageNumbersRef.current = damageNumbersRef.current.filter(dn => {
          dn.life -= deltaTime;
          dn.y -= 3;

          if (dn.life <= 0) return false;

          const alpha = dn.life / dn.maxLife;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = dn.color;
          ctx.font = dn.isCrit ? `bold ${36 * dn.scale}px Arial, sans-serif` : `bold ${28 * dn.scale}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = dn.color;
          ctx.shadowBlur = dn.isHeal ? 7 : 12;
          ctx.fillText(dn.damage.toString(), dn.x, dn.y);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;

          return true;
        });

        // 绘制障碍物
        obstaclesRef.current.forEach(obs => {
          ctx.fillStyle = obs.type === 'rock' ? '#57606F' : '#636E72';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

          // 高光
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(obs.x, obs.y, obs.width, 4);
          ctx.fillRect(obs.x, obs.y, 4, obs.height);
        });

        // 绘制玩家
        ctx.save();
        ctx.translate(player.x, player.y);

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
      ctx.globalAlpha = 1;

      // 绘制升级面板
      if (gameState === GameState.LEVEL_UP) {
        drawLevelUpPanel(ctx, player);
      } else {
        // 绘制UI
        drawUI(ctx, player);
      }

      // 绘制游戏结束屏幕
      if (gameState === GameState.GAME_OVER) {
        drawGameOverScreen(ctx, player);
      }

      ctx.restore();

      // 检查升级
      if (gameState === GameState.PLAYING && player.exp >= player.expToNext) {
        try {
          handleLevelUp(player);
        } catch (error) {
          console.error('Error handling level up:', error);
          // 即使升级出错，也要继续游戏循环
        }
        return;
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
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      level: 1,
      exp: 0,
      expToNext: 100,
      speed: 6,
      baseSpeed: 6,
      attackSpeed: 2,
      lastAttack: 0,
      meleeDamage: 30,
      rangedDamage: 25,
      critRate: 0.15,
      critMultiplier: 2,
      attackRange: 110,
      arrowCount: 0,
      regenRate: 2,
      skills: [],
      totalKills: 0,
      totalDamage: 0,
      gameTime: 0,
      autoLockLevel: 0,
      invincible: false,
      invincibleTime: 0
    };

    monstersRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageNumbersRef.current = [];
    slashEffectsRef.current = [];
    screenShakeRef.current = { intensity: 0, duration: 0, x: 0, y: 0 };
    obstaclesRef.current = [];
    monsterIdCounterRef.current = 0;
    projectileIdCounterRef.current = 0;
    monsterSpawnTimerRef.current = 0;
    autoAttackTimerRef.current = 0;
    autoLockUltimateTimerRef.current = 0;
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

      // 游戏控制
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
        if (e.key === '1' || e.key === '2' || e.key === '3') {
          const index = parseInt(e.key) - 1;
          if (availableSkillsRef.current[index]) {
            selectedSkillIndexRef.current = index;
            playSound('select');

            setTimeout(() => {
              const skill = availableSkillsRef.current[index];
              if (playerRef.current) {
                playerRef.current = skill.apply(playerRef.current);
                playerRef.current.skills.push(skill);
              }
              gameStateRef.current = GameState.PLAYING;
              lastTimeRef.current = performance.now();
            }, 200);
          }
        }

        // 鼠标选择
        if (e.key === 'Enter' || e.key === ' ') {
          const selectedSkill = availableSkillsRef.current[selectedSkillIndexRef.current];
          if (selectedSkill && playerRef.current) {
            playerRef.current = selectedSkill.apply(playerRef.current);
            playerRef.current.skills.push(selectedSkill);
            gameStateRef.current = GameState.PLAYING;
            lastTimeRef.current = performance.now();
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

      // 计算鼠标角度并存储
      const dx = mouseX - playerRef.current!.x;
      const dy = mouseY - playerRef.current!.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        const angle = Math.atan2(dy, dx);
        mouseRef.current.x = mouseX;
        mouseRef.current.y = mouseY;
        mouseRef.current.angle = angle;
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (gameStateRef.current !== GameState.LEVEL_UP) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

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
          selectedSkillIndexRef.current = index;
          playSound('hover');

          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current = skill.apply(playerRef.current);
              playerRef.current.skills.push(skill);
            }
            gameStateRef.current = GameState.PLAYING;
            lastTimeRef.current = performance.now();
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
