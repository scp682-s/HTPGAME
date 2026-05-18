#!/bin/bash

# HTP Game 服务器部署脚本
# 使用方法: sudo bash deploy.sh

set -e

echo "========================================="
echo "HTP Game 服务器部署脚本"
echo "========================================="

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 sudo 运行此脚本"
    exit 1
fi

# 获取当前目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "📁 项目目录: $SCRIPT_DIR"

# 1. 检查 .env 文件
echo ""
echo "1️⃣ 检查环境变量文件..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "❌ 未找到 .env 文件"
    echo "📝 正在创建 .env 文件模板..."
    cat > "$SCRIPT_DIR/.env" << 'EOF'
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
EOF
    echo "⚠️  请编辑 .env 文件，填入正确的 API Key"
    echo "   nano $SCRIPT_DIR/.env"
    exit 1
else
    echo "✅ .env 文件已存在"
fi

# 2. 安装依赖
echo ""
echo "2️⃣ 安装 Node.js 依赖..."
cd "$SCRIPT_DIR"
npm install
echo "✅ 依赖安装完成"

# 3. 停止旧服务
echo ""
echo "3️⃣ 停止旧服务..."
if systemctl is-active --quiet htpgame; then
    systemctl stop htpgame
    echo "✅ 已停止旧服务"
else
    echo "ℹ️  服务未运行"
fi

# 4. 安装 systemd 服务
echo ""
echo "4️⃣ 安装 systemd 服务..."
cp "$SCRIPT_DIR/htpgame.service" /etc/systemd/system/htpgame.service
systemctl daemon-reload
echo "✅ systemd 服务已安装"

# 5. 启动服务
echo ""
echo "5️⃣ 启动服务..."
systemctl enable htpgame
systemctl start htpgame
echo "✅ 服务已启动"

# 6. 检查服务状态
echo ""
echo "6️⃣ 检查服务状态..."
sleep 2
if systemctl is-active --quiet htpgame; then
    echo "✅ 服务运行正常"
    systemctl status htpgame --no-pager -l
else
    echo "❌ 服务启动失败"
    echo "查看错误日志:"
    journalctl -u htpgame -n 50 --no-pager
    exit 1
fi

echo ""
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "常用命令:"
echo "  查看状态: sudo systemctl status htpgame"
echo "  查看日志: sudo journalctl -u htpgame -f"
echo "  重启服务: sudo systemctl restart htpgame"
echo "  停止服务: sudo systemctl stop htpgame"
echo ""
