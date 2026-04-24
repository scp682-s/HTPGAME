# 数据库功能说明

## 概述

已成功将 Python 版本的 SQLite 数据库功能移植到 Node.js 项目中。数据库用于记录用户拼图行为，并生成近期行为摘要以增强 AI 心理分析报告的质量。

## 数据库位置

```
data/behavior_analytics.db
```

## 数据库表结构

### 1. users（用户表）
- `client_id` - 用户唯一标识
- `first_seen` - 首次访问时间
- `last_seen` - 最近活跃时间

### 2. game_sessions（游戏会话表）
- `game_id` - 游戏唯一标识
- `client_id` - 用户标识
- `image_source` - 图片来源
- `grid_size` - 拼图难度
- `modifiers_json` - 游戏修饰符（旋转、隐藏等）
- `started_at` - 开始时间
- `ended_at` - 结束时间
- `game_state` - 游戏状态（playing/completed）
- `move_count` - 移动次数
- `progress` - 完成进度
- `completion_time_seconds` - 完成用时（秒）
- `piece_order_json` - 碎片放置顺序
- `time_intervals_json` - 操作时间间隔
- `modification_count` - 修改次数

### 3. action_logs（动作日志表）
- `game_id` - 游戏标识
- `client_id` - 用户标识
- `action` - 动作类型
- `payload_json` - 动作参数
- `move_count` - 当前步数
- `progress` - 当前进度
- `game_state` - 游戏状态
- `elapsed_seconds` - 已用时间

### 4. report_logs（报告日志表）
- `client_id` - 用户标识
- `game_id` - 游戏标识
- `image_source` - 图片来源
- `prompt_text` - AI 提示词
- `report_text` - AI 生成的报告
- `created_at` - 创建时间

## 核心功能

### 1. 用户行为记录
- 自动记录每个用户的游戏会话
- 记录每次操作的详细日志
- 追踪用户的活跃时间

### 2. 近期行为摘要
系统会自动统计用户近 14 天内最多 12 局游戏的数据，生成行为摘要：
- 平均用时和中位用时
- 平均步数
- 平均修改次数
- 高犹豫动作占比（间隔≥4秒）
- 常用难度

### 3. AI 报告增强
生成心理分析报告时，会将"本次拼图数据"和"近期行为摘要"一起发送给 AI，使报告更加：
- 个性化
- 连贯一致
- 有历史对比

## 使用方法

### 启动服务器
```bash
npm run dev
```

服务器启动时会自动：
1. 创建 `data` 目录
2. 初始化数据库文件
3. 创建所有必要的表

### 测试数据库
```bash
node test_database.js
```

## 前端集成

前端会自动：
1. 生成并保存 `client_id` 到 localStorage
2. 在生成报告时发送完整的游戏数据
3. 包含：用户ID、游戏ID、用时、步数、修改次数等

## 数据流程

```
用户完成拼图
    ↓
前端收集游戏数据（用时、步数、修改次数等）
    ↓
发送到后端 /api/generate_report
    ↓
后端记录到数据库（game_sessions, report_logs）
    ↓
查询用户近期行为数据
    ↓
生成行为摘要
    ↓
拼接到 AI 提示词
    ↓
调用 DeepSeek API
    ↓
返回增强的心理分析报告
```

## 隐私说明

- `client_id` 是浏览器本地生成的匿名标识
- 不收集任何个人身份信息
- 数据仅用于改善心理分析报告质量
- 数据库文件存储在本地服务器

## 维护建议

### 定期备份
```bash
# 备份数据库
cp data/behavior_analytics.db data/backup_$(date +%Y%m%d).db
```

### 清理旧数据
目前系统会保留所有历史数据。如需清理，可以手动删除：
```sql
-- 删除 30 天前的动作日志
DELETE FROM action_logs WHERE created_at < (unixepoch() - 30*24*3600);

-- 删除 30 天前的报告日志
DELETE FROM report_logs WHERE created_at < (unixepoch() - 30*24*3600);
```

## 文件说明

- `analytics_store.js` - 数据库操作模块
- `server.js` - 服务器入口，初始化数据库
- `api/generate_report.js` - 报告生成 API，集成数据库
- `frontend-integration.js` - 前端集成，发送 client_id
- `test_database.js` - 数据库功能测试脚本

## 下一步计划

阶段1（数据库层）已完成 ✓

接下来可以进行：
- 阶段2：拼图引擎（服务端状态管理）
- 阶段3：前端改进（拖拽、撤销等交互）
- 阶段4：图片三要素校验（可选）
