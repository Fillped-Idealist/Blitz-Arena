# Vercel 部署指南

## 部署状态评估

✅ **当前GitHub仓库可以直接部署到Vercel**

### 检查结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| package.json scripts | ✅ 通过 | 包含dev、build、start脚本 |
| 依赖管理 | ✅ 通过 | 使用pnpm，Vercel原生支持 |
| 环境变量 | ✅ 通过 | 合约地址已硬编码，无需额外配置 |
| Next.js版本 | ✅ 通过 | Next.js 16，Vercel原生支持 |
| 敏感信息 | ✅ 通过 | 无敏感信息泄露风险 |
| .gitignore | ✅ 通过 | .env文件已排除 |

---

## 部署步骤

### 方法1：通过Vercel网页界面部署（推荐）

#### 1. 登录Vercel
- 访问：https://vercel.com
- 使用GitHub账号登录

#### 2. 导入项目
- 点击 "Add New" → "Project"
- 在Import Git Repository中选择：`Fillped-Idealist/Blitz-Arena`
- 点击 "Import"

#### 3. 配置项目
- **Project Name**: `blitz-arena`（或自定义）
- **Framework Preset**: `Next.js`（自动检测）
- **Root Directory**: `./`（保持默认）
- **Build Command**: `pnpm build`（已自动配置）
- **Output Directory**: `.next`（自动）
- **Install Command**: `pnpm install`（已自动配置）

#### 4. 配置环境变量
此项目**不需要**配置环境变量，因为：
- 合约地址已硬编码在 `src/lib/chainConfig.ts`
- 无需API密钥或数据库配置

#### 5. 部署设置
- **Region**: 选择 `Hong Kong` (hkg1) 以优化亚洲地区访问速度
- **Node.js Version**: 保持默认（建议18.x或更高）
- **Enable CI/CD**: ✅ 保持开启

#### 6. 开始部署
点击 "Deploy" 按钮，等待部署完成（通常2-3分钟）

---

### 方法2：通过Vercel CLI部署

#### 1. 安装Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录
```bash
vercel login
```

#### 3. 部署
```bash
cd /workspace/projects
vercel
```

按照提示完成配置，选择：
- Link to existing project? `No`
- Scope: 你的GitHub账号
- Project name: `blitz-arena`
- Framework: `Next.js`
- Deploy to: `Production`

---

## 部署后配置

### 1. 添加自定义域名（可选）
- 在Vercel项目设置中点击 "Domains"
- 添加自定义域名，如 `blitz-arena.com`
- 按照提示配置DNS记录

### 2. 配置环境变量（如有需要）
如果后续需要添加环境变量：
- 访问项目设置 → Environment Variables
- 添加变量名和值
- 重新部署项目

### 3. 设置分支保护（推荐）
在GitHub仓库设置中：
- Settings → Branches
- 启用 "Branch protection rule" for main
- 要求 "Require status checks to pass before merging"

---

## 验证部署

### 检查清单
- [ ] 网站可以正常访问
- [ ] 钱包连接功能正常
- [ ] 可以连接到Mantle Sepolia测试网
- [ ] 智能合约交互正常
- [ ] 所有页面加载正常
- [ ] 移动端响应式布局正常

### 常见问题排查

#### 问题1：部署失败 - Build Error
**解决方案**：
```bash
# 本地测试构建
pnpm build

# 检查TypeScript错误
npx tsc --noEmit
```

#### 问题2：智能合约连接失败
**解决方案**：
- 检查浏览器控制台网络请求
- 确认Mantle Sepolia测试网RPC正常
- 验证合约地址是否正确

#### 问题3：样式加载异常
**解决方案**：
- 清除Vercel缓存：项目设置 → Git → Clear Cache
- 重新部署项目

---

## 持续集成/持续部署 (CI/CD)

Vercel已自动配置CI/CD：
- **触发条件**：推送到main分支
- **自动构建**：每次推送都会自动构建
- **自动部署**：构建成功后自动部署
- **预览环境**：每个PR都会生成预览链接

### 工作流程
```mermaid
graph LR
    A[推送代码到GitHub] --> B[Vercel触发构建]
    B --> C[运行pnpm build]
    C --> D{构建成功?}
    D -->|是| E[部署到生产环境]
    D -->|否| F[发送错误通知]
```

---

## 性能优化建议

### 1. 启用ISR（增量静态再生）
在需要动态数据的页面中使用：
```typescript
export const revalidate = 3600; // 1小时
```

### 2. 启用图片优化
使用Next.js Image组件：
```typescript
import Image from 'next/image';
```

### 3. 配置CDN
Vercel已自动配置全球CDN，无需额外设置。

---

## 成本分析

### Vercel免费计划
- ✅ 无限次部署
- ✅ 100GB带宽/月
- ✅ 6,000分钟构建时间/月
- ✅ 自定义域名支持
- ✅ 自动HTTPS

### 适用场景
Blitz Arena项目完全符合Vercel免费计划要求，无需额外付费。

---

## 安全建议

### 1. 定期更新依赖
```bash
pnpm update
```

### 2. 启用安全头部
在 `next.config.ts` 中添加：
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};
```

### 3. 监控日志
在Vercel仪表板中查看：
- 函数日志
- 构建日志
- 错误追踪

---

## 监控和分析

### Vercel Analytics
- 在项目设置中启用 "Web Analytics"
- 查看访问量、页面性能等指标

### 错误追踪
推荐集成Sentry（可选）：
```bash
pnpm add @sentry/nextjs
```

---

## 回滚方案

如果新版本出现问题：
1. 访问Vercel项目 → Deployments
2. 找到之前的稳定版本
3. 点击 "..." → "Promote to Production"

---

## 相关链接

- Vercel文档：https://vercel.com/docs
- Next.js部署指南：https://nextjs.org/docs/deployment
- Mantle Sepolia测试网：https://sepolia.mantle.xyz/

---

## 技术支持

如遇到部署问题：
1. 检查Vercel构建日志
2. 查看GitHub Actions（如有）
3. 访问Vercel社区论坛

---

**部署完成后，你将获得一个类似这样的URL：**
```
https://blitz-arena.vercel.app
```

或自定义域名：
```
https://blitz-arena.com
```
