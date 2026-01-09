'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Swords, Zap, Heart, Shield, TrendingUp, Target, Play, X } from 'lucide-react';

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

// 游戏常量
const GAME_DURATION = 600; // 10分钟
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 24;
const MONSTER_BASE_HP = 30;
const MONSTER_BASE_DAMAGE = 5;
const MONSTER_BASE_SPEED = 2;
const MAX_MONSTERS = 100; // 最大怪物数量限制
const MAX_PROJECTILES = 50; // 最大投射物数量限制
const MAX_PARTICLES = 200; // 最大粒子数量限制

// 游戏状态接口
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
}

interface DamageNumber {
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  life: number;
  maxLife: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  apply: (player: Player) => Player;
}

// 技能列表
const SKILL_POOL: Skill[] = [
  {
    id: 'melee_damage',
    name: '剑术精通',
    description: '近战伤害 +20%',
    icon: <Swords className="w-6 h-6" />,
    apply: (p) => ({ ...p, meleeDamage: p.meleeDamage * 1.2 })
  },
  {
    id: 'ranged_damage',
    name: '箭术精通',
    description: '远程伤害 +20%',
    icon: <Target className="w-6 h-6" />,
    apply: (p) => ({ ...p, rangedDamage: p.rangedDamage * 1.2 })
  },
  {
    id: 'attack_speed',
    name: '迅捷之击',
    description: '攻击速度 +15%',
    icon: <Zap className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackSpeed: p.attackSpeed * 1.15 })
  },
  {
    id: 'movement_speed',
    name: '疾风步',
    description: '移动速度 +10%',
    icon: <TrendingUp className="w-6 h-6" />,
    apply: (p) => ({ ...p, speed: p.speed * 1.1 })
  },
  {
    id: 'max_hp',
    name: '钢铁之躯',
    description: '最大生命值 +30',
    icon: <Heart className="w-6 h-6" />,
    apply: (p) => ({ ...p, maxHp: p.maxHp + 30, hp: p.hp + 30 })
  },
  {
    id: 'crit_rate',
    name: '致命一击',
    description: '暴击率 +10%',
    icon: <Target className="w-6 h-6" />,
    apply: (p) => ({ ...p, critRate: Math.min(p.critRate + 0.1, 1) })
  },
  {
    id: 'attack_range',
    name: '范围扩大',
    description: '攻击范围 +15%',
    icon: <Shield className="w-6 h-6" />,
    apply: (p) => ({ ...p, attackRange: p.attackRange * 1.15 })
  },
  {
    id: 'arrow_bounce',
    name: '弹射之箭',
    description: '箭矢可弹射 +1 次',
    icon: <Target className="w-6 h-6" />,
    apply: (p) => ({ ...p, arrowCount: p.arrowCount + 1 })
  }
];

export default function RoguelikeSurvivalGame({ onComplete, onCancel }: RoguelikeSurvivalGameProps) {
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);

  // 游戏数据
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
    meleeDamage: 15,
    rangedDamage: 10,
    critRate: 0.1,
    critMultiplier: 2,
    attackRange: 60,
    arrowCount: 0,
    skills: []
  });

  const monstersRef = useRef<Monster[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const monsterIdCounterRef = useRef(0);
  const projectileIdCounterRef = useRef(0);

  // 输入状态
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  // Canvas 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const monsterSpawnTimerRef = useRef<number>(0);
  const gameTimerRef = useRef<number>(0);

  // 计算游戏难度系数（时间越久，怪物越强）
  const getDifficultyMultiplier = useCallback((): number => {
    const elapsed = GAME_DURATION - timeLeft;
    return 1 + (elapsed / 60) * 0.2; // 每分钟增加20%
  }, [timeLeft]);

  // 初始化玩家
  const initPlayer = useCallback(() => {
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
      meleeDamage: 15,
      rangedDamage: 10,
      critRate: 0.1,
      critMultiplier: 2,
      attackRange: 60,
      arrowCount: 0,
      skills: []
    };
  }, []);

  // 生成怪物
  const spawnMonster = useCallback(() => {
    const difficulty = getDifficultyMultiplier();
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    // 从屏幕边缘生成
    switch (side) {
      case 0: // 上
        x = Math.random() * CANVAS_WIDTH;
        y = -30;
        break;
      case 1: // 右
        x = CANVAS_WIDTH + 30;
        y = Math.random() * CANVAS_HEIGHT;
        break;
      case 2: // 下
        x = Math.random() * CANVAS_WIDTH;
        y = CANVAS_HEIGHT + 30;
        break;
      case 3: // 左
        x = -30;
        y = Math.random() * CANVAS_HEIGHT;
        break;
      default:
        x = CANVAS_WIDTH / 2;
        y = -30;
    }

    const monster: Monster = {
      id: monsterIdCounterRef.current++,
      x,
      y,
      hp: MONSTER_BASE_HP * difficulty,
      maxHp: MONSTER_BASE_HP * difficulty,
      damage: MONSTER_BASE_DAMAGE * difficulty,
      speed: MONSTER_BASE_SPEED * (0.8 + Math.random() * 0.4),
      exp: Math.floor(10 * difficulty),
      lastAttack: 0,
      size: 20 + Math.random() * 10,
      color: ['#e74c3c', '#e67e22', '#f39c12'][Math.floor(Math.random() * 3)]
    };

    // 限制最大怪物数量
    if (monstersRef.current.length < MAX_MONSTERS) {
      monstersRef.current.push(monster);
    }
  }, [getDifficultyMultiplier]);

  // 创建粒子
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }, []);

  // 创建伤害数字
  const createDamageNumber = useCallback((x: number, y: number, damage: number, isCrit: boolean) => {
    damageNumbersRef.current.push({
      x,
      y,
      damage,
      isCrit,
      life: 1,
      maxLife: 1
    });
  }, []);

  // 检测碰撞
  const checkCollision = useCallback((x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
  }, []);

  // 近战攻击
  const meleeAttack = useCallback((mouseX: number, mouseY: number) => {
    const player = playerRef.current;
    const now = Date.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;
    player.lastAttack = now;

    // 计算攻击方向
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > player.attackRange) return;

    const angle = Math.atan2(dy, dx);

    // 检查扇形范围内的敌人
    monstersRef.current.forEach(monster => {
      const mdx = monster.x - player.x;
      const mdy = monster.y - player.y;
      const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
      const mAngle = Math.atan2(mdy, mdx);
      const angleDiff = Math.abs(mAngle - angle);

      // 90度扇形范围
      if (mDistance < player.attackRange && angleDiff < Math.PI / 4) {
        // 计算伤害
        const isCrit = Math.random() < player.critRate;
        const damage = isCrit ? player.meleeDamage * player.critMultiplier : player.meleeDamage;

        monster.hp -= damage;
        createParticles(monster.x, monster.y, '#ffeb3b', 8);
        createDamageNumber(monster.x, monster.y, Math.floor(damage), isCrit);

        if (monster.hp <= 0) {
          player.exp += monster.exp;
          createParticles(monster.x, monster.y, monster.color, 12);
          setScore(prev => prev + Math.floor(monster.exp));
        }
      }
    });

    // 创建攻击特效
    const attackX = player.x + Math.cos(angle) * player.attackRange / 2;
    const attackY = player.y + Math.sin(angle) * player.attackRange / 2;
    createParticles(attackX, attackY, '#ffffff', 6);
  }, [createParticles, createDamageNumber]);

  // 远程攻击
  const rangedAttack = useCallback((mouseX: number, mouseY: number) => {
    const player = playerRef.current;
    const now = Date.now();
    const attackCooldown = 1000 / player.attackSpeed;

    if (now - player.lastAttack < attackCooldown) return;
    player.lastAttack = now;

    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) return;

    const angle = Math.atan2(dy, dx);

    // 限制最大投射物数量
    if (projectilesRef.current.length < MAX_PROJECTILES) {
      projectilesRef.current.push({
        id: projectileIdCounterRef.current++,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        damage: player.rangedDamage,
        speed: 10,
        bounceCount: player.arrowCount
      });
    }
  }, []);

  // 升级处理
  const handleLevelUp = useCallback(() => {
    const player = playerRef.current;
    player.level++;
    player.exp = 0;
    player.expToNext = Math.floor(player.expToNext * 1.5);

    // 随机选择3个技能
    const shuffled = [...SKILL_POOL].sort(() => Math.random() - 0.5);
    setAvailableSkills(shuffled.slice(0, 3));
    setShowLevelUp(true);

    // 暂停游戏
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // 选择技能
  const selectSkill = useCallback((skill: Skill) => {
    playerRef.current = skill.apply(playerRef.current);
    playerRef.current.skills.push(skill);
    setShowLevelUp(false);

    // 恢复游戏
    lastTimeRef.current = performance.now();
    gameLoop();
  }, []);

  // 游戏循环
  const gameLoop = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = performance.now();
      const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1); // 限制最大delta防止跳帧
      lastTimeRef.current = now;

    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
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

      // 边界检测
      player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, player.x));
      player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, player.y));
    }

    // 生成怪物（难度越高，生成越快）
    const difficulty = getDifficultyMultiplier();
    monsterSpawnTimerRef.current += deltaTime;
    const spawnInterval = Math.max(0.5, 2 - difficulty * 0.5);

    if (monsterSpawnTimerRef.current >= spawnInterval) {
      spawnMonster();
      monsterSpawnTimerRef.current = 0;
    }

    // 更新怪物
    monstersRef.current = monstersRef.current.filter(monster => {
      // 向玩家移动
      const mdx = player.x - monster.x;
      const mdy = player.y - monster.y;
      const mDistance = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mDistance > 0) {
        monster.x += (mdx / mDistance) * monster.speed;
        monster.y += (mdy / mDistance) * monster.speed;
      }

      // 碰撞检测 - 攻击玩家
      const now = Date.now();
      if (checkCollision(player.x, player.y, PLAYER_SIZE, monster.x, monster.y, monster.size)) {
        if (now - monster.lastAttack > 1000) {
          player.hp -= monster.damage;
          monster.lastAttack = now;
          createDamageNumber(player.x, player.y, monster.damage, false);

          if (player.hp <= 0) {
            endGame();
            return false;
          }
        }
      }

      // 绘制怪物
      ctx.fillStyle = monster.color;
      ctx.beginPath();
      ctx.arc(monster.x, monster.y, monster.size, 0, Math.PI * 2);
      ctx.fill();

      // 怪物血条
      const hpPercent = monster.hp / monster.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 8, monster.size * 2, 4);
      ctx.fillStyle = hpPercent > 0.3 ? '#4caf50' : '#f44336';
      ctx.fillRect(monster.x - monster.size, monster.y - monster.size - 8, monster.size * 2 * hpPercent, 4);

      return monster.hp > 0;
    });

    // 更新投射物
    projectilesRef.current = projectilesRef.current.filter(projectile => {
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;

      // 边界反弹
      if (projectile.x <= 0 || projectile.x >= CANVAS_WIDTH) {
        projectile.vx *= -1;
        projectile.bounceCount--;
      }
      if (projectile.y <= 0 || projectile.y >= CANVAS_HEIGHT) {
        projectile.vy *= -1;
        projectile.bounceCount--;
      }

      // 绘制投射物
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // 绘制拖尾
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(projectile.x, projectile.y);
      ctx.lineTo(projectile.x - projectile.vx * 0.5, projectile.y - projectile.vy * 0.5);
      ctx.stroke();

      // 碰撞检测
      for (const monster of monstersRef.current) {
        if (checkCollision(projectile.x, projectile.y, 6, monster.x, monster.y, monster.size)) {
          const isCrit = Math.random() < player.critRate;
          const damage = isCrit ? projectile.damage * player.critMultiplier : projectile.damage;

          monster.hp -= damage;
          createParticles(projectile.x, projectile.y, '#87ceeb', 5);
          createDamageNumber(monster.x, monster.y, Math.floor(damage), isCrit);

          if (projectile.bounceCount <= 0) {
            return false;
          }

          if (monster.hp <= 0) {
            player.exp += monster.exp;
            createParticles(monster.x, monster.y, monster.color, 12);
            setScore(prev => prev + Math.floor(monster.exp));
          }
          break;
        }
      }

      // 超出边界或没有反弹次数
      if (projectile.x < -50 || projectile.x > CANVAS_WIDTH + 50 ||
          projectile.y < -50 || projectile.y > CANVAS_HEIGHT + 50 ||
          projectile.bounceCount < 0) {
        return false;
      }

      return true;
    });

    // 更新粒子
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life -= deltaTime;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // 重力

      if (particle.life <= 0) return false;

      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      return true;
    });

    // 更新伤害数字
    damageNumbersRef.current = damageNumbersRef.current.filter(dn => {
      dn.life -= deltaTime;
      dn.y -= 1;

      if (dn.life <= 0) return false;

      const alpha = dn.life / dn.maxLife;
      ctx.fillStyle = dn.isCrit ? '#ff9800' : '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.font = dn.isCrit ? 'bold 24px monospace' : '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dn.damage.toString(), dn.x, dn.y);
      ctx.globalAlpha = 1;

      return true;
    });

    // 绘制玩家
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // 玩家方向指示器
    const angle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + Math.cos(angle) * 30,
      player.y + Math.sin(angle) * 30
    );
    ctx.stroke();

    // 玩家血条
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 12, 60, 6);
    ctx.fillStyle = hpPercent > 0.3 ? '#4caf50' : '#f44336';
    ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 12, 60 * hpPercent, 6);

    // 经验条
    const expPercent = player.exp / player.expToNext;
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 20, 60, 4);
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(player.x - 30, player.y - PLAYER_SIZE - 20, 60 * expPercent, 4);

    // 检查升级
    if (player.exp >= player.expToNext) {
      handleLevelUp();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error('Game loop error:', error);
    // 出错时尝试继续游戏循环
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }
  }, [checkCollision, createDamageNumber, createParticles, getDifficultyMultiplier, handleLevelUp, meleeAttack, rangedAttack, spawnMonster]);

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setShowTutorial(false);
    setShowLevelUp(false);

    // 初始化游戏状态
    initPlayer();
    monstersRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageNumbersRef.current = [];
    monsterIdCounterRef.current = 0;
    projectileIdCounterRef.current = 0;
    monsterSpawnTimerRef.current = 0;

    // 启动游戏循环
    lastTimeRef.current = performance.now();
    gameLoop();

    // 启动倒计时
    gameTimerRef.current = window.setInterval(() => {
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

  // 清理
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 键盘事件
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

  // 鼠标事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      mouseRef.current.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!gameStarted || showLevelUp) return;

      if (e.button === 0) {
        // 左键 - 近战攻击
        meleeAttack(mouseRef.current.x, mouseRef.current.y);
      } else if (e.button === 2) {
        // 右键 - 远程攻击
        rangedAttack(mouseRef.current.x, mouseRef.current.y);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameStarted, showLevelUp, meleeAttack, rangedAttack]);

  // 提交结果
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
          gameType: 4, // Roguelike Survival
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

  // 计算哈希
  const computeHash = (gameType: number, score: number, timestamp: number, metadata: number[]): string => {
    const data = `${gameType}-${score}-${timestamp}-${metadata.join(',')}`;
    return '0x' + Array.from(new TextEncoder().encode(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // 格式化时间
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
      className="w-full max-w-5xl mx-auto"
    >
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="space-y-6">
          {/* 游戏标题 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              肉鸽割草
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              无限挑战，生存下去，击败无尽怪物
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
                  <div className="bg-purple-500/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4">游戏规则</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <div>
                        <p className="font-semibold mb-2">操作方式</p>
                        <ul className="space-y-1 text-gray-400">
                          <li>• WASD 或 方向键：移动</li>
                          <li>• 鼠标左键：近战攻击（剑）</li>
                          <li>• 鼠标右键：远程攻击（弓箭）</li>
                          <li>• 鼠标：控制攻击方向</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">游戏机制</p>
                        <ul className="space-y-1 text-gray-400">
                          <li>• 游戏时间：10分钟</li>
                          <li>• 击杀怪物获得经验升级</li>
                          <li>• 升级可选择强化技能</li>
                          <li>• 难度随时间逐渐增加</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
                      <p className="text-sm text-purple-300">💡 提示：合理搭配近战和远程攻击，优先升级伤害和攻击速度</p>
                    </div>
                  </div>
                ) : null}
                <Button
                  onClick={startGame}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Play className="w-5 h-5 mr-2" />
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{formatTime(timeLeft)}</div>
                    <div className="text-xs text-gray-400 mt-1">剩余时间</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{score}</div>
                    <div className="text-xs text-gray-400 mt-1">得分</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{player.level}</div>
                    <div className="text-xs text-gray-400 mt-1">等级</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-400">{Math.floor(player.hp)}/{player.maxHp}</div>
                    <div className="text-xs text-gray-400 mt-1">生命值</div>
                  </div>
                </div>

                {/* 游戏画布 */}
                <div className="relative rounded-xl overflow-hidden border border-purple-500/20">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* 经验显示 */}
                <div className="bg-purple-500/10 rounded-lg p-3">
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>经验值</span>
                    <span>{player.exp} / {player.expToNext}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(player.exp / player.expToNext) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 取消按钮 */}
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
              // 游戏结束
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-8 text-center">
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
                    <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
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
                    className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
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

          {/* 升级选择界面 */}
          <AnimatePresence>
            {showLevelUp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full"
                >
                  <h3 className="text-2xl font-bold text-center text-yellow-400 mb-6">
                    🎉 升级了！选择一个技能
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {availableSkills.map((skill, index) => (
                      <Button
                        key={skill.id}
                        onClick={() => selectSkill(skill)}
                        className="h-auto p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          {skill.icon}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-white">{skill.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
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
