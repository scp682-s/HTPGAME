# 房树人拼图游戏 - 项目总结

## 项目概述

这是一个结合心理学房树人测验（HTP）和拼图游戏的创新项目。用户通过完成房树人图像的拼图游戏，系统会基于用户的操作行为（完成时间、步数、顺序等）生成心理分析报告。

## 核心功能

### 1. 拼图游戏
- 支持2×2到6×6多种难度
- 提供4张标准房树人图像
- 支持用户上传自定义图片（仅用于游戏，不用于分析）
- 拖拽和点击两种操作方式
- 难度词条：旋转、隐藏、捣蛋鬼

### 2. 心理分析报告
- 基于AI大模型生成专业心理分析
- 只分析游戏提供的标准房树人图像
- 严格保护用户隐私，不分析用户上传的图片
- 报告包含：整体观察、细节解读、核心洞察、温馨建议

### 3. 安全限制
- **图片来源验证**：只允许分析游戏内置的4张标准图片
- **用户隐私保护**：用户上传的图片不会被发送到AI服务器
- **白名单机制**：后端严格验证图片来源
- **错误提示**：清晰告知用户哪些图片可以分析

## 技术架构

### 前端
- **技术栈**：原生HTML + CSS + JavaScript
- **特点**：
  - 响应式设计，支持手机和桌面
  - 流畅的拖拽交互
  - 音乐播放器集成
  - 新手教程系统

### 后端
- **技术栈**：Python + Flask
- **AI服务**：DeepSeek API（推荐）
- **特点**：
  - RESTful API设计
  - CORS跨域支持
  - 完善的错误处理
  - 图片来源验证

## 文件结构

```
项目根目录/
├── index.html              # 游戏主页面
├── frontend-integration.js # 前端集成代码
├── psychoanalysis.md       # 原始分析模板（已整合到后端）
├── QUICKSTART.md          # 快速开始指南
├── PROJECT_SUMMARY.md     # 项目总结（本文件）
│
├── backend/               # 后端目录
│   ├── app.py            # Flask应用主文件
│   ├── requirements.txt  # Python依赖
│   ├── .env.example      # 环境变量示例
│   ├── .env              # 环境变量（需自己创建）
│   ├── .gitignore        # Git忽略文件
│   ├── README.md         # 后端说明文档
│   ├── API_EXAMPLES.md   # 其他AI API集成示例
│   └── test_api.py       # API测试脚本
│
├── photo/                # 标准房树人图像
│   ├── 1.png
│   ├── 2.png
│   ├── 3.jpg
│   └── 4.jpg
│
└── music/                # 背景音乐
```

## 使用流程

### 开发环境

1. **安装后端依赖**
```bash
cd backend
pip install -r requirements.txt
```

2. **配置API密钥**
```bash
cp .env.example .env
# 编辑 .env 文件，填入 DEEPSEEK_API_KEY
```

3. **启动后端服务**
```bash
python app.py
```

4. **集成前端**
在 `index.html` 的 `</body>` 前添加：
```html
<script src="frontend-integration.js"></script>
```

5. **测试功能**
```bash
python backend/test_api.py
```

### 生产环境

推荐使用 Vercel 或 Railway 部署后端，详见 `QUICKSTART.md`

## API接口

### 1. 健康检查
```
GET /api/health
```

### 2. 验证图片
```
POST /api/validate-image
Body: { "imageSource": "photo/1.png" }
```

### 3. 生成报告
```
POST /api/generate-report
Body: {
  "imageSource": "photo/1.png",
  "gameData": { ... }
}
```

## 免费AI API推荐

| 服务商 | 免费额度 | 价格 | 推荐度 |
|--------|---------|------|--------|
| DeepSeek | 500万tokens | 1元/百万tokens | ⭐⭐⭐⭐⭐ |
| 智谱AI | 1000万tokens | 5元/百万tokens | ⭐⭐⭐⭐⭐ |
| 通义千问 | 100万tokens | 0.8元/千tokens | ⭐⭐⭐⭐ |
| 文心一言 | 有限 | 12元/千tokens | ⭐⭐⭐ |

**推荐使用 DeepSeek**：
- 注册简单（支持手机号）
- 免费额度充足
- 价格便宜
- 中文能力强
- API兼容OpenAI格式

## 安全特性

### 1. 图片来源验证
```python
ALLOWED_IMAGES = [
    'photo/1.png',
    'photo/2.png',
    'photo/3.jpg',
    'photo/4.jpg'
]
```

### 2. 用户上传图片检测
```python
if image_source.startswith("data:image") or image_source.startswith("blob:"):
    return jsonify({"error": "不支持分析用户上传的图片"}), 403
```

### 3. 前端提示
```javascript
if (data.imageSource.startsWith('data:image') || data.imageSource.startsWith('blob:')) {
    alert('提示：用户上传的图片不会被AI分析。\n\n为保护您的隐私...');
    return;
}
```

## 成本估算

### DeepSeek
- 免费额度：500万tokens
- 单次报告：约2000-3000 tokens
- 免费可生成：约1500-2500份报告
- 1000份报告成本：约2-3元

### 实际使用场景
- 小型项目/作业：完全免费
- 中型项目（1000用户）：约2-3元
- 大型项目（10000用户）：约20-30元

## 测试清单

运行测试脚本：
```bash
python backend/test_api.py
```

测试项目：
- [x] 后端服务健康检查
- [x] 验证允许的图片
- [x] 拒绝用户上传的图片
- [x] 生成心理分析报告
- [x] 拒绝自定义图片的分析请求

## 常见问题

### 1. 后端启动失败
- 检查Python版本（需要3.8+）
- 检查依赖是否安装完整
- 检查端口5000是否被占用

### 2. API调用失败
- 检查 `.env` 文件中的API Key
- 检查网络连接
- 检查API额度是否用完

### 3. 前端无法连接后端
- 确认后端服务已启动
- 检查 `frontend-integration.js` 中的 `API_BASE_URL`
- 检查浏览器控制台的CORS错误

### 4. 报告生成很慢
- 正常情况下需要5-15秒
- 网络延迟可能导致更慢
- 可以添加加载动画提升用户体验

## 未来改进方向

### 功能增强
- [ ] 添加用户账号系统
- [ ] 保存历史报告
- [ ] 多语言支持
- [ ] 报告导出为PDF
- [ ] 更详细的游戏数据收集

### 性能优化
- [ ] 添加请求缓存
- [ ] 实现流式响应
- [ ] 添加CDN加速
- [ ] 数据库存储报告

### 安全加固
- [ ] 添加请求频率限制
- [ ] 实现用户认证
- [ ] 添加请求签名验证
- [ ] 日志审计系统

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目文档
- 技术支持邮箱

## 致谢

- DeepSeek：提供优质的AI API服务
- Flask：简洁强大的Python Web框架
- 房树人测验：经典的心理投射测验方法

---

**最后更新**: 2026年4月14日
**版本**: v1.0
