#!/bin/bash

echo "=========================================="
echo "  Blitz Arena GitHub 上传工具"
echo "  Blitz Arena GitHub Upload Tool"
echo "=========================================="
echo ""

# 检查 Git 是否已配置
if ! git remote -v | grep -q "origin"; then
    echo "❌ Git 远程仓库未配置"
    echo "❌ Git remote repository not configured"
    echo ""
    echo "请先运行: git remote add origin https://github.com/Fillped-Idealist/Blitz-Arena.git"
    exit 1
fi

echo "✅ Git 远程仓库已配置"
echo "✅ Git remote repository configured"
echo ""
echo "远程仓库地址 / Remote repository URL:"
git remote -v | grep origin | head -1
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  检测到未提交的更改"
    echo "⚠️  Uncommitted changes detected"
    echo ""
    git status --short
    echo ""
    read -p "是否先提交这些更改？(y/n) / Commit these changes first? (y/n): " commit_changes
    
    if [ "$commit_changes" = "y" ] || [ "$commit_changes" = "Y" ]; then
        git add .
        git commit -m "chore: Final updates before GitHub upload"
        echo "✅ 更改已提交 / Changes committed"
    fi
fi

echo ""
echo "=========================================="
echo "  准备推送到 GitHub"
echo "  Preparing to push to GitHub"
echo "=========================================="
echo ""

# 提示用户需要 Personal Access Token
echo "📌 需要认证 / Authentication Required"
echo ""
echo "请按照以下步骤获取 Personal Access Token："
echo "Please follow these steps to get a Personal Access Token:"
echo ""
echo "1. 访问 / Visit: https://github.com/settings/tokens"
echo "2. 点击 'Generate new token' → 'Generate new token (classic)'"
echo "3. 设置 Note: 'Blitz Arena Upload'"
echo "4. 勾选 'repo' 权限 / Check 'repo' scope"
echo "5. 点击 'Generate token'"
echo "6. ⚠️  立即复制生成的 token（只显示一次！）"
echo "   ⚠️  Copy the generated token immediately (only shown once!)"
echo ""
echo "注意 / Note:"
echo "- Token 格式类似: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "- 不要使用 GitHub 密码 / Do not use GitHub password"
echo ""

read -p "按回车键继续 / Press Enter to continue..." 

echo ""
read -p "请输入你的 GitHub Personal Access Token / Enter your GitHub Personal Access Token: " -s GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token 不能为空 / Token cannot be empty"
    exit 1
fi

echo ""
echo "=========================================="
echo "  正在推送代码到 GitHub"
echo "  Pushing code to GitHub"
echo "=========================================="
echo ""

# 设置 Git 凭证
git config credential.helper store
echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials

# 推送代码
git push -u origin main

# 清理凭证
rm -f ~/.git-credentials
git config --unset credential.helper

echo ""
echo "=========================================="
echo "  上传完成！"
echo "  Upload Complete!"
echo "=========================================="
echo ""
echo "✅ 代码已成功推送到 GitHub"
echo "✅ Code successfully pushed to GitHub"
echo ""
echo "📦 仓库地址 / Repository URL:"
echo "https://github.com/Fillped-Idealist/Blitz-Arena"
echo ""
echo "🎉 恭喜！你的项目已上传到 GitHub！"
echo "🎉 Congratulations! Your project has been uploaded to GitHub!"
echo ""
