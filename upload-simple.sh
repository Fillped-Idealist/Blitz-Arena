#!/bin/bash

# GitHub 上传脚本 - 需要用户提供 Personal Access Token
# GitHub Upload Script - User needs to provide Personal Access Token

echo "=========================================="
echo "  Blitz Arena GitHub 上传"
echo "  Blitz Arena GitHub Upload"
echo "=========================================="
echo ""

# 检查远程仓库
echo "检查远程仓库配置 / Checking remote repository configuration..."
git remote -v

echo ""
echo "准备推送 / Preparing to push..."
echo ""

# 提示用户需要 token
echo "⚠️  需要提供 GitHub Personal Access Token"
echo "⚠️  GitHub Personal Access Token is required"
echo ""
echo "获取步骤 / Steps to get token:"
echo "1. 访问 / Visit: https://github.com/settings/tokens"
echo "2. Generate new token (classic)"
echo "3. 勾选 repo 权限 / Check repo scope"
echo "4. 复制生成的 token / Copy the generated token"
echo ""

# 使用环境变量或提示输入
if [ -z "$GITHUB_TOKEN" ]; then
    echo "请输入 GitHub Token / Please enter GitHub Token:"
    read -s GITHUB_TOKEN
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token 为空 / Token is empty"
    exit 1
fi

echo ""
echo "正在推送 / Pushing..."
echo ""

# 使用 token 推送
git push https://${GITHUB_TOKEN}@github.com/Fillped-Idealist/Blitz-Arena.git main

echo ""
echo "✅ 完成 / Done"
