# Vercel 部署指南

## 部署步骤

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

在项目根目录执行：

```bash
vercel
```

### 4. 配置环境变量

在 Vercel 控制台中：

1. 进入项目设置
2. 找到 "Environment Variables"
3. 添加：
   - Name: `DEEPSEEK_API_KEY`
   - Value: `sk-9ab4e3c8af6241e5917f87d2c1ce651f`
   - Environment: Production, Preview, Development

### 5. 重新部署

```bash
vercel --prod
```

## 自动连接后端

部署完成后，Vercel 会给你一个 URL，例如：
```
https://your-project.vercel.app
```

修改 `frontend-integration.js` 中的 API 地址：

```javascript
const API_BASE_URL = 'https://your-project.vercel.app';
```

## 注意事项

1. Vercel 免费版有限制：
   - 每月 100GB 带宽
   - 每次请求最多 10 秒执行时间
   - 适合小型项目

2. 如果超出限制，考虑：
   - Railway (https://railway.app/)
   - Render (https://render.com/)
   - Fly.io (https://fly.io/)
