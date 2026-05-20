# 心宇宙重塑项目 Docker 部署方案

## 📋 项目现状分析

### 当前架构
- **前端**：纯静态 HTML/CSS/JS（无构建工具）
- **后端**：Node.js + Express（server.js）
- **数据库**：SQLite（behavior_analytics.db）
- **部署方式**：PM2 进程管理 + 直接监听 80 端口
- **服务器**：腾讯云轻量级服务器

### 存在的问题
1. ❌ PM2 停止后重启无法访问（监听地址/端口问题）
2. ❌ 每次重装系统需要重新配置环境
3. ❌ 依赖环境不一致（Node.js 版本、系统库）
4. ❌ 数据库备份恢复繁琐
5. ❌ 无法快速回滚到稳定版本

---

## 🎯 Docker 化目标

### 核心优势
✅ **环境一致性**：开发、测试、生产环境完全一致  
✅ **快速部署**：一条命令启动所有服务  
✅ **易于回滚**：出问题立即回退到上一个版本  
✅ **数据持久化**：数据库文件独立于容器  
✅ **端口管理**：容器内部端口映射，避免冲突  

---

## 🏗️ Docker 架构设计

### 方案选择：单容器 All-in-One（推荐）

**为什么选择单容器？**
- 项目规模小，前后端耦合度高
- SQLite 数据库无需独立容器
- 简化部署流程，降低维护成本
- 适合轻量级服务器资源限制

### 容器架构图

```
┌─────────────────────────────────────────┐
│  Docker Container (htpgame)             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Nginx (静态文件服务)            │   │
│  │  - index.html                    │   │
│  │  - admin-healing.html            │   │
│  │  - CSS/JS 文件                   │   │
│  └─────────────────────────────────┘   │
│              ↓ 反向代理                 │
│  ┌─────────────────────────────────┐   │
│  │  Node.js (Express API)           │   │
│  │  - server.js                     │   │
│  │  - 监听 3001 端口                │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  SQLite Database (挂载卷)        │   │
│  │  - /data/behavior_analytics.db   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↓ 端口映射 80:80
    外网访问 http://43.160.201.4
```

---

## 📦 Docker 文件结构

### 1. Dockerfile

```dockerfile
# 使用官方 Node.js 镜像
FROM node:20-alpine

# 安装 Nginx
RUN apk add --no-cache nginx

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建数据目录
RUN mkdir -p /app/data /app/logs /app/uploads

# 配置 Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 启动命令
CMD ["/docker-entrypoint.sh"]
```

### 2. docker-entrypoint.sh（启动脚本）

```bash
#!/bin/sh

# 启动 Nginx
nginx

# 启动 Node.js 应用
node server.js
```

### 3. nginx.conf（Nginx 配置）

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name _;

        # 静态文件
        location / {
            root /app;
            index index.html;
            try_files $uri $uri/ =404;
        }

        # API 代理
        location /api/ {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 上传文件
        location /uploads/ {
            alias /app/uploads/;
        }
    }
}
```

### 4. docker-compose.yml（推荐）

```yaml
version: '3.8'

services:
  htpgame:
    build: .
    container_name: htpgame
    restart: always
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DEEPSEEK_API_KEY=sk-df5d658eebef45c6a61bd1805f7a99b6
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - htpgame-network

networks:
  htpgame-network:
    driver: bridge
```

### 5. .dockerignore

```
node_modules
.git
.env
*.log
*.md
.claude
文档
test_*.js
check_*.js
create_*.js
fix_*.js
migrate_*.js
view_*.js
```

---

## 🚀 部署步骤

### 第一步：准备服务器环境

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 2. 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 3. 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. 验证安装
docker --version
docker-compose --version
```

### 第二步：准备项目文件

```bash
# 1. 克隆项目
cd /root
git clone https://github.com/scp682-s/HTPGAME.git
cd HTPGAME

# 2. 创建必要的文件
# 创建 Dockerfile、docker-entrypoint.sh、nginx.conf、docker-compose.yml
# （按照上面的内容创建）

# 3. 创建数据目录
mkdir -p data uploads logs

# 4. 如果有备份数据库，复制到 data 目录
# cp /path/to/backup/behavior_analytics.db ./data/
```

### 第三步：构建并启动容器

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动容器
docker-compose up -d

# 3. 查看容器状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

### 第四步：验证部署

```bash
# 1. 检查容器是否运行
docker ps

# 2. 测试本地访问
curl -I http://localhost

# 3. 浏览器访问
# http://43.160.201.4
```

---

## 🔧 常用管理命令

### 容器管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 查看日志
docker-compose logs -f

# 进入容器
docker exec -it htpgame sh
```

### 数据备份

```bash
# 备份数据库
docker exec htpgame tar -czf /tmp/backup.tar.gz /app/data /app/uploads
docker cp htpgame:/tmp/backup.tar.gz ./backup_$(date +%Y%m%d).tar.gz

# 恢复数据库
docker cp ./backup.tar.gz htpgame:/tmp/
docker exec htpgame tar -xzf /tmp/backup.tar.gz -C /
docker-compose restart
```

### 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose build

# 3. 重启容器
docker-compose up -d

# 4. 清理旧镜像
docker image prune -f
```

---

## 📊 资源占用预估

### 容器资源
- **内存**：约 150-200MB
- **磁盘**：约 300MB（镜像 + 数据）
- **CPU**：低负载（< 5%）

### 轻量级服务器要求
- **最低配置**：1核 1GB 内存
- **推荐配置**：1核 2GB 内存
- **磁盘空间**：至少 5GB 可用

---

## 🛡️ 安全建议

### 1. 环境变量管理

```bash
# 不要在 docker-compose.yml 中硬编码 API Key
# 使用 .env 文件

# 创建 .env 文件
cat > .env <<EOF
DEEPSEEK_API_KEY=sk-df5d658eebef45c6a61bd1805f7a99b6
NODE_ENV=production
PORT=3001
EOF

# 修改 docker-compose.yml
environment:
  - NODE_ENV=${NODE_ENV}
  - PORT=${PORT}
  - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
```

### 2. 数据持久化

```yaml
# 确保数据目录挂载到宿主机
volumes:
  - ./data:/app/data          # 数据库
  - ./uploads:/app/uploads    # 上传文件
  - ./logs:/app/logs          # 日志文件
```

### 3. 定期备份

```bash
# 添加到 crontab
0 2 * * * cd /root/HTPGAME && docker exec htpgame tar -czf /tmp/backup.tar.gz /app/data /app/uploads && docker cp htpgame:/tmp/backup.tar.gz ./backups/backup_$(date +\%Y\%m\%d).tar.gz
```

---

## 🔄 回滚方案

### 快速回滚

```bash
# 1. 停止当前容器
docker-compose down

# 2. 切换到上一个稳定版本
git checkout <上一个稳定的commit>

# 3. 重新构建并启动
docker-compose build
docker-compose up -d
```

### 使用镜像标签

```bash
# 构建时打标签
docker build -t htpgame:v1.0 .
docker build -t htpgame:v1.1 .

# 回滚到指定版本
docker-compose down
docker tag htpgame:v1.0 htpgame:latest
docker-compose up -d
```

---

## 📝 迁移检查清单

### 迁移前
- [ ] 备份当前数据库文件
- [ ] 备份上传的图片文件
- [ ] 记录当前环境变量配置
- [ ] 测试 Docker 环境是否正常

### 迁移中
- [ ] 创建所有必要的 Docker 配置文件
- [ ] 构建镜像成功
- [ ] 容器启动成功
- [ ] 数据卷挂载正确

### 迁移后
- [ ] 网站可以正常访问
- [ ] API 接口正常工作
- [ ] 数据库数据完整
- [ ] 上传功能正常
- [ ] 管理员功能正常
- [ ] 设置开机自启动

---

## 💡 下一步优化方向

1. **监控告警**：集成 Prometheus + Grafana
2. **日志管理**：使用 ELK 或 Loki
3. **自动化部署**：GitHub Actions CI/CD
4. **负载均衡**：多容器实例 + Nginx 负载均衡
5. **HTTPS 支持**：Let's Encrypt 自动证书

---

**创建时间**：2026-05-20  
**适用版本**：v2.0.0  
**维护者**：项目团队
