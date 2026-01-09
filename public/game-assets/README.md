# 游戏资产使用指南

本文档说明了如何使用项目中的游戏资产和PixiJS渲染引擎。

## 📁 资产结构

```
public/game-assets/
├── sprites/              # 精灵图（角色、怪物）
│   ├── player/
│   │   ├── player_spritesheet.svg
│   │   └── player_animations.json
│   └── monsters/
│       ├── slime/
│       ├── skeleton/
│       ├── ghost/
│       └── boss/
├── particles/            # 粒子特效
│   ├── blood_particle.svg
│   ├── spark_particle.svg
│   ├── magic_particle.svg
│   ├── explosion_particle.svg
│   └── dust_particle.svg
├── backgrounds/          # 背景和环境
│   ├── grid_background.svg
│   ├── floor_tile.svg
│   └── arena_background.svg
├── effects/              # 视觉特效
│   ├── glow_effect.svg
│   ├── shadow_effect.svg
│   └── projectile_trail.svg
└── ui/                   # UI图标
    └── icons/
        ├── health_icon.svg
        ├── exp_icon.svg
        ├── skill_icon.svg
        └── level_up_icon.svg
```

## 🎮 精灵图使用

### 1. 玩家精灵 (Player Sprites)

**文件**: `sprites/player/player_spritesheet.svg`

包含4帧动画：
- `idle_0`, `idle_1`: 待机动画
- `run_0`, `run_1`: 跑步动画

**使用方法** (PixiJS):
```typescript
import * as PIXI from 'pixi.js';

// 加载精灵图
const texture = await PIXI.Assets.load('/game-assets/sprites/player/player_spritesheet.svg');

// 创建精灵
const playerSprite = new PIXI.Sprite(texture);
playerSprite.anchor.set(0.5);
playerSprite.x = canvasWidth / 2;
playerSprite.y = canvasHeight / 2;

// 添加到舞台
app.stage.addChild(playerSprite);
```

**使用方法** (Canvas):
```typescript
// 创建Image对象
const playerImage = new Image();
playerImage.src = '/game-assets/sprites/player/player_spritesheet.svg';

playerImage.onload = () => {
  ctx.drawImage(playerImage, 0, 0, 32, 32, x, y, 32, 32);
};
```

### 2. 怪物精灵 (Monster Sprites)

**史莱姆** (Slime) - `monsters/slime/slime_spritesheet.svg`
- 绿色半透明，会弹跳移动
- 4帧动画：idle × 2, move × 2

**骷髅** (Skeleton) - `monsters/skeleton/skeleton_spritesheet.svg`
- 白色骨架，会举剑攻击
- 4帧动画：idle × 2, attack × 2

**幽灵** (Ghost) - `monsters/ghost/ghost_spritesheet.svg`
- 蓝色半透明，会漂浮移动
- 4帧动画：idle × 2, move × 2

**Boss** - `monsters/boss/boss_spritesheet.svg`
- 大型紫色怪物，强攻击力
- 4帧动画：idle × 2, attack × 2

**使用示例**:
```typescript
const monsterSprites = {
  slime: await PIXI.Assets.load('/game-assets/sprites/monsters/slime/slime_spritesheet.svg'),
  skeleton: await PIXI.Assets.load('/game-assets/sprites/monsters/skeleton/skeleton_spritesheet.svg'),
  ghost: await PIXI.Assets.load('/game-assets/sprites/monsters/ghost/ghost_spritesheet.svg'),
  boss: await PIXI.Assets.load('/game-assets/sprites/monsters/boss/boss_spritesheet.svg')
};

const monsterSprite = new PIXI.Sprite(monsterSprites.slime);
app.stage.addChild(monsterSprite);
```

## ✨ 粒子系统使用

### 粒子类型

1. **血液粒子** (blood_particle.svg)
   - 颜色：深红色渐变
   - 用途：怪物受伤、死亡特效
   - 物理：轻微向上抛物线

2. **火花粒子** (spark_particle.svg)
   - 颜色：金色到橙色渐变
   - 用途：武器碰撞、暴击特效
   - 特效：光晕和十字闪光

3. **魔法粒子** (magic_particle.svg)
   - 颜色：紫色
   - 用途：技能释放、升级特效
   - 形状：星形

4. **爆炸粒子** (explosion_particle.svg)
   - 颜色：红到橙到白渐变
   - 用途：大招、怪物死亡
   - 形状：大尺寸爆炸

5. **尘埃粒子** (dust_particle.svg)
   - 颜色：灰色
   - 用途：移动拖尾、环境效果

**PixiJS 粒子系统示例**:
```typescript
import { Emitter } from '@pixi/particle-emitter';

// 创建粒子发射器
const emitter = new Emitter(particleContainer, {
  lifetime: { min: 0.5, max: 1 },
  frequency: 0.01,
  spawnChance: 1,
  particlesPerWave: 1,
  emitterLifetime: 0.5,
  pos: { x: x, y: y },
  behaviors: [
    { type: 'alpha', params: { alpha: 1, time: 0, value: 1 } },
    { type: 'alpha', params: { alpha: 1, time: 1, value: 0 } },
    { type: 'scaleStatic', params: { min: 0.5, max: 1 } },
    { type: 'moveSpeed', params: { speed: { min: 50, max: 100 } } }
  ]
});

emitter.play();
```

**Canvas 粒子系统示例**:
```typescript
function createParticles(x, y, color, count, type) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.4,
      color,
      type
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // 重力
    p.life -= 0.02;

    if (p.life <= 0) return false;

    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    return true;
  });
}
```

## 🎨 背景和环境

### 1. 网格背景 (grid_background.svg)

- 深色渐变背景 + 网格线
- 适用：科技风、现代游戏
- 使用方法：
```typescript
const bgTexture = await PIXI.Assets.load('/game-assets/backgrounds/grid_background.svg');
const bgSprite = new PIXI.TilingSprite(bgTexture, width, height);
app.stage.addChild(bgSprite);
```

### 2. 地板瓦片 (floor_tile.svg)

- 砖石纹理
- 适用：复古游戏
- 使用方法：循环平铺

### 3. 竞技场背景 (arena_background.svg)

- 带装饰圆环的竞技场
- 适用：Boss战、竞技模式
- 特点：中心对称设计

## 🌟 视觉特效

### 1. 光晕效果 (glow_effect.svg)

- 金色光晕
- 用途：玩家光环、技能激活、物品高亮

### 2. 阴影效果 (shadow_effect.svg)

- 半透明椭圆阴影
- 用途：角色和怪物下方的投影

### 3. 投射物拖尾 (projectile_trail.svg)

- 金色渐变拖尾
- 用途：箭矢、魔法弹的轨迹

**使用示例**:
```typescript
// 创建阴影
const shadowTexture = await PIXI.Assets.load('/game-assets/effects/shadow_effect.svg');
const shadow = new PIXI.Sprite(shadowTexture);
shadow.anchor.set(0.5);
shadow.y = 10; // 偏移到下方

// 添加到角色
character.addChild(shadow);
```

## 🔧 UI 图标

所有图标都是SVG格式，支持无限缩放。

- **health_icon.svg**: 生命值心形图标
- **exp_icon.svg**: 经验值加号图标
- **skill_icon.svg**: 技能星形图标
- **level_up_icon.svg**: 升级箭头图标

**使用方法**:
```typescript
import healthIcon from '/game-assets/ui/icons/health_icon.svg';

// React组件
<Image src={healthIcon} alt="Health" width={32} height={32} />

// PixiJS
const iconTexture = await PIXI.Assets.load('/game-assets/ui/icons/health_icon.svg');
const iconSprite = new PIXI.Sprite(iconTexture);
```

## 🚀 PixiJS 渲染引擎

### 基础设置

```typescript
import * as PIXI from 'pixi.js';

// 创建应用
const app = new PIXI.Application({
  view: canvas,
  width: 1280,
  height: 720,
  background: 0x1A1A2E,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true
});

// 添加容器（用于层级管理）
const worldContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();

app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);
```

### 性能优化

1. **使用Sprite Sheets**
   - 减少draw call
   - 提高渲染效率

2. **纹理池**
   ```typescript
   const texturePool = new Map<string, PIXI.Texture>();

   function getTexture(url: string) {
     if (!texturePool.has(url)) {
       texturePool.set(url, PIXI.Texture.from(url));
     }
     return texturePool.get(url);
   }
   ```

3. **对象池**
   ```typescript
   const spritePool: PIXI.Sprite[] = [];

   function getSprite(texture: PIXI.Texture): PIXI.Sprite {
     return spritePool.pop() || new PIXI.Sprite(texture);
   }

   function releaseSprite(sprite: PIXI.Sprite) {
     sprite.visible = false;
     spritePool.push(sprite);
   }
   ```

### 屏幕震动

```typescript
let shakeIntensity = 0;
let shakeDuration = 0;

function triggerShake(intensity: number, duration: number) {
  shakeIntensity = intensity;
  shakeDuration = duration;
}

function updateShake(deltaTime: number) {
  if (shakeDuration > 0) {
    shakeDuration -= deltaTime;
    const amount = (shakeDuration / 0.15) * shakeIntensity;
    container.x = (Math.random() - 0.5) * amount * 2;
    container.y = (Math.random() - 0.5) * amount * 2;
  } else {
    container.x = 0;
    container.y = 0;
  }
}
```

## 📝 最佳实践

1. **资源预加载**
   ```typescript
   async function preloadAssets() {
     await PIXI.Assets.load([
       '/game-assets/sprites/player/player_spritesheet.svg',
       '/game-assets/particles/blood_particle.svg',
       // ... 更多资源
     ]);
   }
   ```

2. **响应式设计**
   ```typescript
   function resize() {
     const scaleX = window.innerWidth / CANVAS_WIDTH;
     const scaleY = window.innerHeight / CANVAS_HEIGHT;
     const scale = Math.min(scaleX, scaleY);
     app.stage.scale.set(scale);
   }

   window.addEventListener('resize', resize);
   ```

3. **错误处理**
   ```typescript
   try {
     const texture = await PIXI.Assets.load('/path/to/asset.svg');
   } catch (error) {
     console.error('Failed to load asset:', error);
     // 使用备用资源
   }
   ```

## 🔗 相关链接

- [PixiJS官方文档](https://pixijs.io/)
- [PixiJS粒子发射器](https://pixijs.io/pixi-particles/)
- [SVG优化指南](https://svgwg.org/specs/svg/)
- [Web游戏性能优化](https://web.dev/performance/)

## 💡 提示

1. 所有SVG资产都经过优化，确保文件大小适中
2. 建议使用WebP或PNG格式的备选资源以提高兼容性
3. 粒子系统可以自定义配置以获得不同的视觉效果
4. 背景资源支持平铺和缩放
5. UI图标可以在任何分辨率下保持清晰

---

**版本**: 1.0.0
**更新日期**: 2025-01-14
**作者**: Vibe Coding
