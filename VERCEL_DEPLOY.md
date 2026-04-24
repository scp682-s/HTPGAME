# Vercel 部署指南

## 部署步骤

### 1. 准备工作

确保你的项目已经推送到 Git 仓库（GitHub、GitLab 或 Bitbucket）。

### 2. 在 Vercel 上导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入你的 Git 仓库
4. 选择项目根目录

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
OPENAI_API_KEY=你的DeepSeek API密钥
ADMIN_PASSWORD=管理员密码（默认123456）
```

**重要：** 必须配置 `OPENAI_API_KEY`，否则报告生成功能无法使用。

获取 DeepSeek API 密钥：
1. 访问 [https://platform.deepseek.com](https://platform.deepseek.com)
2. 注册并登录
3. 在 API Keys 页面创建新密钥

### 4. 部署

点击 "Deploy" 按钮，Vercel 会自动构建和部署你的项目。

### 5. 访问你的应用

部署完成后，Vercel 会提供一个 URL（如 `https://your-project.vercel.app`）。

## 功能限制说明

由于 Vercel 是无服务器环境，以下功能在 Vercel 部署中**不可用**：

- ❌ 数据库持久化（游戏历史、疗愈记录）
- ❌ 管理员数据导出功能
- ❌ 心理疗愈功能（需要数据库支持）

以下功能**正常可用**：

- ✅ 拼图游戏
- ✅ 图片校验
- ✅ 心理报告生成
- ✅ 报告历史（存储在浏览器 localStorage）

## 启用完整功能

如果需要完整功能（包括数据库），有两个选择：

### 选项 1：使用 Vercel Postgres（推荐）

1. 在 Vercel 项目中添加 Postgres 数据库
2. 修改代码以使用 Postgres 替代 SQLite
3. 需要重写 `analytics_store.js` 以支持 Postgres

### 选项 2：使用传统服务器部署

在有持久化文件系统的服务器上部署（如阿里云、腾讯云），运行：

```bash
npm install
node server.js
```

## 常见问题

### Q: 为什么创建游戏失败？

A: 检查以下几点：
1. 确保 `OPENAI_API_KEY` 环境变量已正确配置
2. 检查 DeepSeek API 余额是否充足
3. 查看 Vercel 部署日志中的错误信息

### Q: 手机无法访问？

A: 确保：
1. 使用 HTTPS 协议访问（Vercel 自动提供）
2. 图片资源路径正确（使用相对路径）
3. 检查浏览器控制台是否有 CORS 错误

### Q: 如何查看部署日志？

A: 在 Vercel 项目页面，点击 "Deployments" → 选择最新部署 → 点击 "View Function Logs"

## 本地开发

本地开发时使用完整功能（包括数据库）：

```bash
npm install
node server.js
```

访问 `http://localhost:3001`

## 技术支持

如有问题，请检查：
1. Vercel 部署日志
2. 浏览器控制台错误
3. 网络请求是否成功（F12 → Network）
