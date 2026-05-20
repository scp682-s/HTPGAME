# 使用 Node.js 20 LTS 版本
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
RUN mkdir -p /app/data /app/uploads /app/logs

# 配置 Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 启动命令
CMD ["/docker-entrypoint.sh"]
