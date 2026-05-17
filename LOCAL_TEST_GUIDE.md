# 本地测试说明

## 新增功能

### 1. 管理员账号系统
- 管理员现在使用账号+密码登录（不再是单一密码）
- 每个管理员可以绑定一个班级
- 数据库新增 `admin_accounts` 表存储管理员信息

### 2. 班级管理功能
- 管理员登录后可以选择班级查看学生的心理疗愈数据
- 以列表形式展示学生姓名、学号和疗愈内容
- 支持查看学生的提问详情

### 3. 匿名提交优化
- 用户信息提交页面调整为：先勾选"匿名提交"，勾选后隐藏姓名/学号/班级输入框
- 不勾选匿名时，需要填写姓名、学号和班级
- 数据库 `healing_sessions` 表新增 `user_class` 字段

## 本地测试步骤

### 1. 创建管理员账号

运行以下命令创建测试管理员账号：

```bash
node create_admin.js
```

这将创建以下测试账号：
- 账号: `admin`, 密码: `123456` (超级管理员，可查看所有班级)
- 账号: `teacher1`, 密码: `123456` (计算机1班)
- 账号: `teacher2`, 密码: `123456` (计算机2班)

### 2. 启动服务器

```bash
node server.js
```

### 3. 测试流程

#### 测试管理员功能：
1. 打开浏览器访问 `http://localhost:3001`
2. 点击"管理员"按钮
3. 使用上述账号登录（例如：admin/123456）
4. 登录后可以：
   - 选择班级查看学生疗愈数据
   - 导出所有数据为Excel

#### 测试学生提交功能：
1. 完成拼图游戏并生成心理报告
2. 进行心理疗愈对话（3轮提问）
3. 对话结束后，在信息提交页面：
   - **不勾选匿名**：需要填写姓名、学号、班级
   - **勾选匿名**：姓名、学号、班级输入框隐藏，提交为匿名

#### 测试班级数据查看：
1. 使用管理员账号登录
2. 选择班级（例如：计算机1班）
3. 点击"查看班级数据"
4. 查看该班级学生的疗愈记录列表
5. 点击"查看详情"展开学生的提问内容

## 数据库变更

### 新增表：`admin_accounts`
```sql
CREATE TABLE admin_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  class_name TEXT,
  created_at REAL NOT NULL
)
```

### 修改表：`healing_sessions`
新增字段：`user_class TEXT`

## API 变更

### 新增接口：
- `POST /api/admin/create-account` - 创建管理员账号
- `GET /api/admin/classes` - 获取所有班级列表
- `POST /api/admin/class-healing-data` - 获取指定班级的学生疗愈数据

### 修改接口：
- `POST /api/admin/login` - 现在需要 `username` 和 `password`
- `POST /api/healing/submit-info` - 新增 `userClass` 参数

## 注意事项

1. 这些功能仅用于本地测试
2. 密码未加密存储，生产环境需要使用加密
3. 管理员账号创建脚本可以重复运行，已存在的账号会跳过
4. 匿名提交时，姓名、学号、班级字段会存储为空字符串
