# 腾讯云服务器部署快速指南

## 🚀 一键部署（推荐）

### 步骤1：上传文件到服务器

将整个项目上传到服务器，例如 `/root/htpgame`

```bash
# 使用 scp 上传（在本地执行）
scp -r ./* root@你的服务器IP:/root/htpgame

# 或使用 FTP 工具（如 FileZilla）上传
```

### 步骤2：连接服务器并执行部署脚本

```bash
# SSH 连接服务器
ssh root@你的服务器IP

# 进入项目目录
cd /root/htpgame

# 给脚本添加执行权限
chmod +x 快速部署.sh 故障排查.sh

# 执行一键部署
./快速部署.sh
```

### 步骤3：配置腾讯云防火墙

1. 登录腾讯云控制台
2. 进入 **轻量应用服务器** → 选择你的服务器
3. 点击 **防火墙** 标签
4. 添加规则：
   - 应用类型：自定义
   - 协议：TCP
   - 端口：3001
   - 策略：允许
5. 保存规则

### 步骤4：访问测试

浏览器打开：`http://你的公网IP:3001`

---

## 🔧 手动部署（详细步骤）

### 1. 修改 ecosystem.config.cjs

编辑 `ecosystem.config.cjs`，将 `cwd` 改为你的实际路径：

```javascript
cwd: '/root/htpgame',  // 改成你服务器上的实际路径
```

### 2. 安装 Node.js（如果未安装）

```bash
# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 3. 安装项目依赖

```bash
cd /root/htpgame
npm install
```

### 4. 安装 pm2

```bash
npm install -g pm2
```

### 5. 创建必要目录

```bash
mkdir -p logs data
```

### 6. 启动服务

```bash
# 使用配置文件启动
pm2 start ecosystem.config.cjs

# 或直接启动
pm2 start server.js --name http-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs http-backend
```

### 7. 配置开机自启

```bash
pm2 save
pm2 startup
# 复制输出的命令并执行
```

### 8. 配置防火墙

```bash
# 方法1：使用 firewalld（CentOS 7+）
firewall-cmd --zone=public --add-port=3001/tcp --permanent
firewall-cmd --reload

# 方法2：使用 iptables
iptables -I INPUT -p tcp --dport 3001 -j ACCEPT
service iptables save

# 方法3：使用 ufw（Ubuntu）
ufw allow 3001/tcp
ufw reload
```

---

## 🐛 故障排查

### 运行诊断脚本

```bash
./故障排查.sh
```

### 常见问题

#### 问题1：pm2 显示 "Script not found"

**原因**：路径配置错误

**解决**：
```bash
# 确认当前路径
pwd

# 修改 ecosystem.config.cjs 中的 cwd 为当前路径
# 然后重新启动
pm2 delete http-backend
pm2 start ecosystem.config.cjs
```

#### 问题2：服务启动但外网无法访问

**检查清单**：
1. ✅ pm2 状态是否为 `online`：`pm2 status`
2. ✅ 端口是否监听：`netstat -tunlp | grep 3001`
3. ✅ 本地能否访问：`curl http://localhost:3001`
4. ✅ 服务器防火墙是否开放：`firewall-cmd --list-ports`
5. ✅ **腾讯云控制台防火墙规则是否添加**（最常见问题）

#### 问题3：pm2 状态显示 "errored"

**查看错误日志**：
```bash
pm2 logs http-backend --err --lines 50
```

**常见错误**：
- `Cannot find module`：运行 `npm install`
- `Port 3001 already in use`：端口被占用，杀死进程或换端口
- `EACCES: permission denied`：权限问题，使用 `sudo` 或修改文件权限

#### 问题4：数据库错误

```bash
# 检查数据库文件
ls -la data/behavior_analytics.db

# 修复权限
chmod 755 data/
chmod 644 data/behavior_analytics.db

# 重新创建数据库
rm data/behavior_analytics.db
pm2 restart http-backend
```

---

## 📊 服务管理命令

```bash
# 查看所有进程
pm2 list

# 查看详细信息
pm2 show http-backend

# 实时日志
pm2 logs http-backend

# 只看错误日志
pm2 logs http-backend --err

# 重启服务
pm2 restart http-backend

# 停止服务
pm2 stop http-backend

# 删除进程
pm2 delete http-backend

# 监控面板
pm2 monit

# 清空日志
pm2 flush
```

---

## 🔒 安全建议

### 1. 修改默认端口（可选）

编辑 `server.js`，将 `PORT = 3001` 改为其他端口

### 2. 配置 HTTPS（推荐）

使用 Nginx 反向代理 + Let's Encrypt 证书

### 3. 限制访问来源

```bash
# 只允许特定 IP 访问
iptables -A INPUT -p tcp --dport 3001 -s 允许的IP -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP
```

### 4. 定期备份数据库

```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /root/htpgame/data/behavior_analytics.db /root/backups/db_$DATE.db
# 保留最近7天的备份
find /root/backups -name "db_*.db" -mtime +7 -delete
EOF

chmod +x /root/backup.sh

# 添加定时任务（每天凌晨2点备份）
crontab -e
# 添加：0 2 * * * /root/backup.sh
```

---

## 📝 更新部署

```bash
# 1. 备份数据库
cp data/behavior_analytics.db data/behavior_analytics.db.backup

# 2. 拉取最新代码（如果使用 git）
git pull

# 3. 安装新依赖
npm install

# 4. 重启服务
pm2 restart http-backend

# 5. 查看日志确认无误
pm2 logs http-backend --lines 50
```

---

## 📞 技术支持

如果遇到问题：

1. 运行 `./故障排查.sh` 获取诊断信息
2. 查看日志：`pm2 logs http-backend`
3. 检查腾讯云控制台防火墙设置
4. 确认 Node.js 版本 >= 14.x

---

## ✅ 部署检查清单

- [ ] 项目文件已上传到服务器
- [ ] Node.js 版本 >= 14.x
- [ ] 已运行 `npm install`
- [ ] `ecosystem.config.cjs` 中的路径已修改
- [ ] pm2 状态显示 `online`
- [ ] 本地 `curl http://localhost:3001` 可访问
- [ ] 服务器防火墙已开放 3001 端口
- [ ] **腾讯云控制台防火墙规则已添加**
- [ ] 外网可访问 `http://公网IP:3001`
- [ ] 已配置 pm2 开机自启
