#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  房树人项目服务器部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 1. 检查 Node.js 版本
echo -e "\n${YELLOW}[1/8] 检查 Node.js 版本...${NC}"
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ 未安装 Node.js，请先安装${NC}"
    exit 1
fi

# 2. 检查当前目录
echo -e "\n${YELLOW}[2/8] 检查项目文件...${NC}"
if [ ! -f "server.js" ]; then
    echo -e "${RED}✗ 未找到 server.js，请确认在项目根目录执行此脚本${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 找到 server.js${NC}"

# 3. 创建必要的目录
echo -e "\n${YELLOW}[3/8] 创建日志目录...${NC}"
mkdir -p logs
mkdir -p data
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 4. 安装依赖
echo -e "\n${YELLOW}[4/8] 安装 npm 依赖...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 依赖安装成功${NC}"
else
    echo -e "${RED}✗ 依赖安装失败${NC}"
    exit 1
fi

# 5. 检查 pm2
echo -e "\n${YELLOW}[5/8] 检查 pm2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}未安装 pm2，正在安装...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ pm2 已就绪${NC}"

# 6. 停止旧进程
echo -e "\n${YELLOW}[6/8] 停止旧进程...${NC}"
pm2 delete http-backend 2>/dev/null
echo -e "${GREEN}✓ 旧进程已清理${NC}"

# 7. 启动服务
echo -e "\n${YELLOW}[7/8] 启动服务...${NC}"
pm2 start ecosystem.config.cjs
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务启动成功${NC}"
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    exit 1
fi

# 8. 保存 pm2 配置
echo -e "\n${YELLOW}[8/8] 配置开机自启...${NC}"
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null
echo -e "${GREEN}✓ 开机自启配置完成${NC}"

# 显示状态
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
pm2 status

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "\n${GREEN}访问地址: http://${SERVER_IP}:3001${NC}"
echo -e "${YELLOW}查看日志: pm2 logs http-backend${NC}"
echo -e "${YELLOW}重启服务: pm2 restart http-backend${NC}"
