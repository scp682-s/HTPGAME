#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  房树人项目故障排查工具${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. 检查项目文件
echo -e "\n${YELLOW}[检查1] 项目文件完整性${NC}"
if [ -f "server.js" ]; then
    echo -e "${GREEN}✓ server.js 存在${NC}"
else
    echo -e "${RED}✗ server.js 不存在${NC}"
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json 存在${NC}"
    if grep -q '"type": "module"' package.json; then
        echo -e "${GREEN}✓ ES6 模块配置正确${NC}"
    else
        echo -e "${RED}✗ package.json 缺少 \"type\": \"module\"${NC}"
    fi
else
    echo -e "${RED}✗ package.json 不存在${NC}"
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules 存在${NC}"
else
    echo -e "${RED}✗ node_modules 不存在，需要运行 npm install${NC}"
fi

# 2. 检查 Node.js 环境
echo -e "\n${YELLOW}[检查2] Node.js 环境${NC}"
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ $MAJOR_VERSION -ge 14 ]; then
        echo -e "${GREEN}✓ Node.js 版本满足要求 (>= 14.x)${NC}"
    else
        echo -e "${RED}✗ Node.js 版本过低，需要 >= 14.x${NC}"
    fi
else
    echo -e "${RED}✗ 未安装 Node.js${NC}"
fi

NPM_VERSION=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ npm 版本: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm 未安装${NC}"
fi

# 3. 检查 pm2 状态
echo -e "\n${YELLOW}[检查3] pm2 进程状态${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✓ pm2 已安装${NC}"
    pm2 list | grep -E "http-backend|online|errored|stopped"

    if pm2 list | grep -q "http-backend"; then
        STATUS=$(pm2 jlist | grep -A 10 "http-backend" | grep "status" | cut -d'"' -f4)
        if [ "$STATUS" == "online" ]; then
            echo -e "${GREEN}✓ 服务运行中${NC}"
        else
            echo -e "${RED}✗ 服务状态异常: $STATUS${NC}"
        fi
    else
        echo -e "${YELLOW}! 未找到 http-backend 进程${NC}"
    fi
else
    echo -e "${RED}✗ pm2 未安装${NC}"
fi

# 4. 检查端口占用
echo -e "\n${YELLOW}[检查4] 端口 3001 状态${NC}"
if netstat -tunlp 2>/dev/null | grep -q ":3001"; then
    echo -e "${GREEN}✓ 端口 3001 正在监听${NC}"
    netstat -tunlp | grep ":3001"
else
    echo -e "${RED}✗ 端口 3001 未被监听${NC}"
fi

# 5. 检查防火墙
echo -e "\n${YELLOW}[检查5] 防火墙配置${NC}"
if command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --list-ports 2>/dev/null | grep -q "3001"; then
        echo -e "${GREEN}✓ firewalld 已开放 3001 端口${NC}"
    else
        echo -e "${RED}✗ firewalld 未开放 3001 端口${NC}"
        echo -e "${YELLOW}  运行: firewall-cmd --zone=public --add-port=3001/tcp --permanent && firewall-cmd --reload${NC}"
    fi
elif command -v iptables &> /dev/null; then
    if iptables -L -n | grep -q "3001"; then
        echo -e "${GREEN}✓ iptables 已配置 3001 端口${NC}"
    else
        echo -e "${YELLOW}! 未在 iptables 中找到 3001 规则${NC}"
    fi
else
    echo -e "${YELLOW}! 未检测到防火墙服务${NC}"
fi

# 6. 测试本地连接
echo -e "\n${YELLOW}[检查6] 本地连接测试${NC}"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 --connect-timeout 5)
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
        echo -e "${GREEN}✓ 本地可以访问服务 (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}✗ 本地无法访问服务 (HTTP $HTTP_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}! curl 未安装，跳过连接测试${NC}"
fi

# 7. 检查日志文件
echo -e "\n${YELLOW}[检查7] 日志文件${NC}"
if [ -d "logs" ]; then
    echo -e "${GREEN}✓ logs 目录存在${NC}"
    if [ -f "logs/err.log" ]; then
        ERR_SIZE=$(wc -l < logs/err.log)
        if [ $ERR_SIZE -gt 0 ]; then
            echo -e "${RED}✗ 发现 $ERR_SIZE 行错误日志${NC}"
            echo -e "${YELLOW}  最近的错误:${NC}"
            tail -n 5 logs/err.log
        else
            echo -e "${GREEN}✓ 无错误日志${NC}"
        fi
    fi
else
    echo -e "${YELLOW}! logs 目录不存在${NC}"
fi

# 8. 检查数据库
echo -e "\n${YELLOW}[检查8] 数据库文件${NC}"
if [ -f "data/behavior_analytics.db" ]; then
    echo -e "${GREEN}✓ 数据库文件存在${NC}"
    DB_SIZE=$(du -h data/behavior_analytics.db | cut -f1)
    echo -e "  数据库大小: $DB_SIZE"
else
    echo -e "${YELLOW}! 数据库文件不存在，首次运行时会自动创建${NC}"
fi

# 9. 获取公网 IP
echo -e "\n${YELLOW}[检查9] 网络信息${NC}"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
if [ -n "$PUBLIC_IP" ]; then
    echo -e "${GREEN}✓ 公网 IP: $PUBLIC_IP${NC}"
    echo -e "${BLUE}  访问地址: http://$PUBLIC_IP:3001${NC}"
else
    echo -e "${YELLOW}! 无法获取公网 IP${NC}"
fi

PRIVATE_IP=$(hostname -I | awk '{print $1}')
if [ -n "$PRIVATE_IP" ]; then
    echo -e "  内网 IP: $PRIVATE_IP"
fi

# 总结
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  排查完成${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}常用命令:${NC}"
echo -e "  查看实时日志: ${GREEN}pm2 logs http-backend${NC}"
echo -e "  重启服务: ${GREEN}pm2 restart http-backend${NC}"
echo -e "  查看详细状态: ${GREEN}pm2 show http-backend${NC}"
echo -e "  手动启动: ${GREEN}node server.js${NC}"
echo -e "  测试连接: ${GREEN}curl http://localhost:3001${NC}"
