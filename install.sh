#!/bin/bash

echo "========================================"
echo "房树人拼图游戏 - 后端安装脚本"
echo "========================================"
echo ""

echo "[1/4] 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未检测到Python3，请先安装Python 3.8+"
    exit 1
fi
python3 --version
echo "✅ Python环境正常"
echo ""

echo "[2/4] 安装依赖包..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装完成"
echo ""

echo "[3/4] 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  请编辑 backend/.env 文件，填入你的 DEEPSEEK_API_KEY"
    echo ""
    echo "获取API Key步骤："
    echo "1. 访问 https://platform.deepseek.com/"
    echo "2. 注册并登录"
    echo "3. 进入'API Keys'页面"
    echo "4. 创建新的API Key"
    echo "5. 复制API Key到 .env 文件中"
    echo ""
    read -p "按回车键继续..."
else
    echo "✅ .env 文件已存在"
fi
echo ""

echo "[4/4] 测试后端服务..."
echo "正在启动后端服务（按 Ctrl+C 可停止）..."
echo ""
python3 app.py
