#!/bin/bash
# 部署脚本：将修改的文件上传到云服务器

SERVER="root@43.160.201.4"
REMOTE_DIR="/root/心宇宙重塑：房树人图像趣测"

echo "正在上传修改的文件到云服务器..."

# 上传 puzzle_engine.js
scp puzzle_engine.js $SERVER:$REMOTE_DIR/

# 上传 index.html
scp index.html $SERVER:$REMOTE_DIR/

echo "文件上传完成！"
echo "正在重启服务..."

# SSH 登录并重启服务
ssh $SERVER << 'ENDSSH'
cd /root/心宇宙重塑：房树人图像趣测
pm2 restart all
echo "服务重启完成！"
ENDSSH

echo "部署完成！"
