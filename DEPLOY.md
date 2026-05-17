# 服务器部署指南

## 环境要求
- Node.js >= 14.x
- npm

## 部署步骤

### 1. 克隆项目
```bash
git clone https://github.com/scp682-s/HTPGAME.git
cd HTPGAME
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
创建 `.env` 文件：
```
OPENAI_API_KEY=你的API密钥
```

### 4. 启动服务
```bash
# 开发模式
node server.js

# 生产模式（使用 pm2）
npm install -g pm2
pm2 start server.js --name htpgame
pm2 save
pm2 startup
```

### 5. 配置防火墙
开放端口 80（或你配置的端口）

### 6. 访问
浏览器访问：`http://你的服务器IP`

## 常用命令
```bash
# 查看日志
pm2 logs htpgame

# 重启服务
pm2 restart htpgame

# 停止服务
pm2 stop htpgame
```
