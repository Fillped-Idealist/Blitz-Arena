# GitHub 上传指南 / GitHub Upload Guide

---

## 📦 准备工作 / Preparation

### 1. 创建 GitHub 仓库 / Create GitHub Repository

1. 访问 GitHub 并登录 / Visit [GitHub](https://github.com) and sign in
2. 点击右上角 "+" → "New repository" / Click "+" in top-right corner → "New repository"
3. 填写仓库信息 / Fill in repository information:

```
Repository name: Blitz-Arena
Description: A production-grade blockchain gaming tournament platform
Visibility: Public (或 Private / or Private)
```

4. 勾选以下选项（如果需要）/ Check these options (if needed):
   - ✅ Add a README file（我们会替换它 / We'll replace it）
   - ✅ Choose a license（推荐 MIT License / Recommend MIT License）

5. 点击 "Create repository" / Click "Create repository"

---

## 🚀 上传步骤 / Upload Steps

### 第一步：初始化 Git 仓库 / Step 1: Initialize Git Repository

```bash
# 确认当前在项目目录 / Ensure you're in the project directory
cd /workspace/projects/

# 初始化 Git 仓库 / Initialize Git repository
git init

# 设置主分支为 main / Set main branch
git branch -M main
```

### 第二步：添加远程仓库 / Step 2: Add Remote Repository

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Blitz-Arena.git
```

**示例 / Example:**
```bash
git remote add origin https://github.com/johndoe/Blitz-Arena.git
```

### 第三步：暂存所有文件 / Step 3: Stage All Files

```bash
# 添加所有文件到暂存区 / Add all files to staging area
git add .
```

### 第四步：创建第一次提交 / Step 4: Create First Commit

```bash
# 创建提交 / Create commit
git commit -m "feat: Initial commit - Blitz Arena blockchain gaming platform

- Add smart contracts (GameFactory, GameInstance, GameRegistry, UserLevelManager)
- Add frontend application (Next.js 16, TypeScript, Tailwind CSS)
- Add deployment scripts for Mantle Sepolia and Hardhat local network
- Add bilingual documentation (English and Chinese)
- Implement 5 integrated games (Number Guess, Rock Paper Scissors, Quick Click, Cycle Rift, Infinite Match)
- Implement social features (friends, chat, achievements, level system)
- Implement BLZ token economy and prize distribution system"
```

### 第五步：推送到 GitHub / Step 5: Push to GitHub

```bash
# 推送到远程仓库的 main 分支 / Push to main branch of remote repository
git push -u origin main
```

**如果遇到认证错误 / If you encounter authentication errors:**

选项 1：使用 Personal Access Token / Option 1: Use Personal Access Token
```bash
# 推送时会提示输入用户名和密码（密码使用 Personal Access Token）
# You'll be prompted for username and password (use Personal Access Token for password)
git push -u origin main
```

选项 2：配置 Git 认证 / Option 2: Configure Git authentication
```bash
# 配置 Git 使用 credential helper / Configure Git to use credential helper
git config --global credential.helper store
```

获取 Personal Access Token 步骤 / Steps to get Personal Access Token:
1. 访问 / Visit: https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 选择权限 / Select permissions: `repo` (full control of private repositories)
4. 点击 "Generate token"
5. 复制生成的 token（只显示一次）/ Copy the generated token (only shown once)
6. 在推送时使用此 token 作为密码 / Use this token as password when pushing

---

## 📋 仓库信息 / Repository Information

### 基本信息 / Basic Information

```
项目名称 / Project Name: Blitz-Arena
描述 / Description: A production-grade blockchain gaming tournament platform
技术栈 / Tech Stack: Next.js 16, TypeScript, Solidity, Hardhat, Tailwind CSS
网络 / Networks: Mantle Sepolia Testnet, Hardhat Local Network
```

### 已部署合约地址 / Deployed Contract Addresses

Mantle Sepolia Testnet (Chain ID: 5003):

```
GameFactory: 0x99E43c03AB9c8DC0d03c9EF3fbcDd92c13Da34BA
GameRegistry: 0xDEd2563C3111a654603A2427Db18452C85b31C2B
UserLevelManager: 0x8feFB3C18f48f148BCe092b9bE82915D581bA1Ba
BLZ Token: 0x5ae1364fE3FF7F78a0DD7e995F72C4Dd8184190A
Prize Token: 0xFa5ba717eA6fbDeBa21D1eb440A713BC80413b5A
```

### 在线演示 / Live Demo

```
URL: https://5c5f236a-6d0b-4eed-82db-6a193669bde6.dev.coze.site/test
```

---

## 🏷️ 仓库设置（可选）/ Repository Settings (Optional)

### 添加 Topics / Add Topics

访问仓库 Settings → Topics，添加以下标签：
Visit repository Settings → Topics, add these tags:

```
blockchain, gaming, web3, solidity, nextjs, mantle, nft, defi, tournament, smart-contracts
```

### 启用 GitHub Actions / Enable GitHub Actions

如果需要 CI/CD，可以创建 `.github/workflows/ci.yml`：
If you need CI/CD, create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Compile contracts
      run: pnpm run compile
    
    - name: Build frontend
      run: pnpm run build
```

### 启用 GitHub Pages / Enable GitHub Pages

如果需要部署文档：
If you need to deploy documentation:

1. 访问仓库 Settings → Pages / Visit repository Settings → Pages
2. Source: 选择 "Deploy from a branch" / Select "Deploy from a branch"
3. Branch: 选择 `gh-pages` 分支 / Select `gh-pages` branch
4. 点击 Save / Click Save

---

## 🔐 安全建议 / Security Recommendations

### 1. 敏感信息 / Sensitive Information

✅ 已删除 / Already Removed:
- `.env` 文件（包含私钥和 API 密钥）/ `.env` file (contains private keys and API secrets)
- 所有测试文件和临时文件 / All test files and temporary files
- 日志文件 / Log files

✅ 保留 / Kept:
- `.env.example`（环境变量示例）/ `.env.example` (environment variable template)

⚠️ 注意 / Warning:
- 不要在代码中硬编码私钥 / Never hardcode private keys in code
- 不要提交包含敏感信息的文件 / Never commit files with sensitive information
- 使用环境变量管理密钥 / Use environment variables to manage secrets

### 2. 合约安全 / Contract Security

建议进行以下审计：
Recommend these audits:

- 智能合约代码审计 / Smart contract code audit
- 前端安全审计 / Frontend security audit
- 集成测试 / Integration testing

### 3. 许可证 / License

项目使用 MIT License，允许商业使用：
Project uses MIT License, allowing commercial use:

```text
MIT License

Copyright (c) 2026 Blitz Arena Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📊 项目统计 / Project Statistics

### 文件统计 / File Statistics

```
智能合约 / Smart Contracts: 6 files
前端页面 / Frontend Pages: 8+ pages
React 组件 / React Components: 20+ components
自定义 Hooks / Custom Hooks: 5+ hooks
部署脚本 / Deployment Scripts: 4 scripts
```

### 代码行数（估算）/ Lines of Code (Estimated)

```
Solidity 代码: ~2000 lines
TypeScript 代码: ~15000 lines
配置文件: ~500 lines
文档: ~2000 lines
```

---

## 🎯 后续步骤 / Next Steps

### 1. 创建 LICENSE 文件 / Create LICENSE File

```bash
# 创建 MIT License 文件
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Blitz Arena Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

### 2. 创建 CONTRIBUTING.md / Create CONTRIBUTING.md

```bash
# 创建贡献指南
cat > CONTRIBUTING.md << 'EOF'
# Contributing to Blitz Arena

Thank you for your interest in contributing to Blitz Arena!

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass

## Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, network, etc.)

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.
EOF
```

### 3. 创建 SECURITY.md / Create SECURITY.md

```bash
# 创建安全策略
cat > SECURITY.md << 'EOF'
# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. Do not create public issues for security vulnerabilities
2. Email us at: security@example.com
3. Include a detailed description of the vulnerability
4. We will respond within 48 hours
5. We will work with you to fix the issue

## Security Best Practices

- Never share private keys or seed phrases
- Always verify contract addresses before interacting
- Use hardware wallets for significant transactions
- Keep your software updated
- Be cautious of phishing attempts

## Known Security Considerations

- Smart contracts are experimental and carry risks
- Testnet deployments are for testing only
- Always audit contracts before mainnet deployment
EOF
```

### 4. 创建 ISSUE_TEMPLATE / Create ISSUE_TEMPLATE

创建 `.github/ISSUE_TEMPLATE/bug_report.md`:
Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS]
 - Browser: [e.g. Chrome, Firefox]
 - Network: [e.g. Mantle Sepolia, Hardhat Local]

**Additional context**
Add any other context about the problem here.
```

---

## 📝 常见问题 / FAQ

### Q1: 推送失败怎么办？/ What if push fails?

A: 检查以下几点 / Check the following:
1. 确认远程仓库地址正确 / Verify remote repository URL is correct
2. 确认有推送权限 / Verify you have push permission
3. 如果使用 2FA，需要使用 Personal Access Token / If using 2FA, use Personal Access Token

### Q2: 如何更新 README？/ How to update README?

A: 直接编辑 README.md，然后提交推送：
Edit README.md directly, then commit and push:

```bash
git add README.md
git commit -m "docs: Update README"
git push
```

### Q3: 如何撤销提交？/ How to undo a commit?

A: 如果还未推送 / If not yet pushed:
```bash
git reset --soft HEAD~1  # 保留修改 / Keep changes
git reset --hard HEAD~1  # 丢弃修改 / Discard changes
```

如果已推送 / If already pushed:
```bash
git revert HEAD  # 创建新提交撤销 / Create new commit to revert
git push
```

### Q4: 如何处理大文件？/ How to handle large files?

A: Git 有 100MB 文件大小限制。对于大文件，建议：
Git has a 100MB file size limit. For large files, consider:

1. 使用 Git LFS / Use Git LFS
2. 将大文件放在外部存储 / Store large files externally
3. 在 .gitignore 中排除 / Exclude in .gitignore

### Q5: 如何创建发布版本？/ How to create a release?

A: 在 GitHub 网页上操作：
On GitHub website:

1. 访问仓库 / Visit repository
2. 点击 "Releases" → "Create a new release"
3. 填写版本号和说明 / Fill in version number and description
4. 点击 "Publish release"

---

## 🎉 完成！/ Done!

你的项目已成功上传到 GitHub！

Your project has been successfully uploaded to GitHub!

**仓库链接 / Repository URL:**
```
https://github.com/YOUR_USERNAME/Blitz-Arena
```

**下一步建议 / Next Steps:**
- 分享给社区 / Share with community
- 添加更多功能 / Add more features
- 接受贡献 / Accept contributions
- 监控问题 / Monitor issues

---

## 📞 获取帮助 / Get Help

如果遇到问题，可以通过以下方式获取帮助：
If you encounter issues, get help through:

- [GitHub Issues](https://github.com/YOUR_USERNAME/Blitz-Arena/issues)
- [GitHub Discussions](https://github.com/YOUR_USERNAME/Blitz-Arena/discussions)
- Email: support@example.com

---

**祝你使用愉快！/ Enjoy!** 🚀
