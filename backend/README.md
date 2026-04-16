# 房树人拼图游戏 - 后端服务

## 功能说明

这是房树人拼图游戏的后端服务，用于调用AI API生成心理分析报告。

### 重要安全限制

1. **只分析游戏提供的图片**：系统只能分析游戏内置的四张标准房树人图像（photo/1.png, photo/2.png, photo/3.jpg, photo/4.jpg）
2. **禁止分析用户上传图片**：用户上传的自定义图片不会被发送到AI进行分析，确保用户隐私安全
3. **只分析操作行为**：AI只能基于用户的拼图操作行为（完成时间、步数、顺序等）进行分析

## 免费AI API推荐

### 1. DeepSeek (推荐) ⭐
- **官网**: https://platform.deepseek.com/
- **优势**: 
  - 新用户赠送500万tokens免费额度
  - API兼容OpenAI格式，易于集成
  - 中文理解能力强
  - 价格便宜（1元/百万tokens）
- **注册**: 支持手机号注册
- **获取API Key**: 注册后在控制台创建API密钥

### 2. 阿里云通义千问
- **官网**: https://dashscope.aliyun.com/
- **优势**: 
  - 新用户赠送100万tokens
  - 阿里云背书，稳定可靠
  - 中文能力优秀
- **注册**: 需要阿里云账号

### 3. 智谱AI (ChatGLM)
- **官网**: https://open.bigmodel.cn/
- **优势**: 
  - 新用户赠送1000万tokens
  - 清华大学技术支持
  - 免费额度较多
- **注册**: 支持手机号注册

### 4. 百度文心一言
- **官网**: https://cloud.baidu.com/product/wenxinworkshop
- **优势**: 
  - 百度出品，中文能力强
  - 有免费试用额度
- **注册**: 需要百度云账号

## 安装步骤

### 1. 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置API密钥

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的API密钥：

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 3. 启动后端服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

## API接口说明

### 1. 健康检查
```
GET /api/health
```

### 2. 生成分析报告
```
POST /api/generate-report
Content-Type: application/json

{
  "imageSource": "photo/1.png",
  "gameData": {
    "completionTime": "02:30",
    "moveCount": 45,
    "difficulty": "3x3",
    "pieceOrder": [...],
    "timeIntervals": [...],
    "modificationCount": 5
  }
}
```

**响应**:
```json
{
  "success": true,
  "report": "# 心理分析报告\n\n...",
  "imageSource": "photo/1.png",
  "timestamp": 1234567890
}
```

**错误响应（用户上传图片）**:
```json
{
  "error": "不支持分析用户上传的图片",
  "message": "为保护隐私和确保分析准确性，本系统仅支持分析游戏提供的标准房树人图像。"
}
```

### 3. 验证图片
```
POST /api/validate-image
Content-Type: application/json

{
  "imageSource": "photo/1.png"
}
```

## 切换到其他AI API

### 使用通义千问

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("QWEN_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)
```

### 使用智谱AI

```python
from zhipuai import ZhipuAI

client = ZhipuAI(api_key=os.environ.get("ZHIPU_API_KEY"))
response = client.chat.completions.create(
    model="glm-4",
    messages=[...]
)
```

### 使用百度文心一言

```python
import qianfan

chat_comp = qianfan.ChatCompletion()
resp = chat_comp.do(
    model="ERNIE-Bot-4",
    messages=[...]
)
```

## 安全特性

1. **图片来源验证**: 每次请求都会验证图片来源，拒绝分析用户上传的图片
2. **白名单机制**: 只有在 `ALLOWED_IMAGES` 列表中的图片才能被分析
3. **CORS保护**: 配置了跨域资源共享，只允许特定来源访问
4. **错误处理**: 完善的错误处理机制，避免敏感信息泄露

## 注意事项

1. 不要将 `.env` 文件提交到版本控制系统
2. 定期检查API使用量，避免超出免费额度
3. 生产环境建议使用 gunicorn 或 uwsgi 部署
4. 建议配置 nginx 反向代理和 HTTPS

## 生产部署

使用 gunicorn 部署：

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 许可证

MIT License
