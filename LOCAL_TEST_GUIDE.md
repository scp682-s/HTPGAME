# 本地测试指南

## 快速开始

### 1. 启动后端服务器

打开命令行，进入项目目录：

```bash
cd "c:\Users\redking\Desktop\大创项目\心宇宙重塑：房树人图像趣测"
npm run dev
```

你应该看到：
```
Server running at http://localhost:3001
API endpoints:
  - POST   /api/puzzle/games - 创建游戏
  - GET    /api/puzzle/games/:gameId - 获取游戏状态
  - POST   /api/puzzle/games/:gameId/actions - 执行动作
  - POST   /api/generate_report - 生成心理报告
Database initialized at: ...
```

### 2. 打开游戏页面

**方法1：直接打开HTML文件**
- 双击 `index.html` 文件
- 浏览器会自动打开

**方法2：使用本地服务器（推荐）**
- 打开新的命令行窗口
- 运行：`python -m http.server 8000`（如果有Python）
- 访问：http://localhost:8000

### 3. 测试游戏功能

#### 测试步骤：
1. 点击"开始游戏"
2. 选择一张图片（photo/1.png 等）
3. 选择难度（建议先选3x3）
4. 点击"生成拼图"
5. 完成拼图
6. 点击"查看心理分析报告"
7. 等待报告生成（5-15秒）

---

## 测试后端API

### 使用测试脚本

```bash
# 测试数据库功能
node test_database.js

# 测试拼图引擎
node test_puzzle_engine.js

# 测试真实场景
node test_real_scenario.js

# 查看最新报告
node view_report.js
```

---

## 测试完整流程

1. **启动服务器** - `npm run dev`
2. **打开浏览器** - 访问 http://localhost:8000
3. **完成一局游戏** - 选择图片、难度、完成拼图
4. **生成报告** - 点击"查看心理分析报告"
5. **检查数据库** - `node view_report.js`
6. **再玩几局** - 重复3-5次
7. **查看近期行为摘要** - 报告中会显示统计数据

---

## 常见问题

### 1. 端口被占用
```bash
taskkill /F /IM node.exe
```

### 2. 报告生成失败
检查 `.env` 文件是否包含：
```
OPENAI_API_KEY=sk-你的密钥
```

### 3. 前端无法连接后端
确保端口正确（3001），编辑 `frontend-integration.js`

---

## 项目文件

### 核心文件
- `server.js` - 后端服务器
- `puzzle_engine.js` - 拼图引擎
- `analytics_store.js` - 数据库
- `index.html` - 游戏页面

### 测试文件
- `test_database.js`
- `test_puzzle_engine.js`
- `test_real_scenario.js`
- `view_report.js`

### 数据
- `data/behavior_analytics.db` - 数据库
- `.env` - API密钥
