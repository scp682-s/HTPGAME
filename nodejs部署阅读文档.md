明白了，Flask 在 Vercel 上部署确实比较麻烦（需要配置 `vercel.json` 的 `builds` 和 `routes`，且冷启动慢）。换成 **Node.js + Vercel Serverless Functions** 会简单很多，因为 Vercel 原生支持 JavaScript/TypeScript。

下面给你完整的 **Node.js 后端实现方案**，部署到 Vercel 零配置（只需把文件放在 `api/` 目录下）。

---

## 一、项目结构（在现有前端项目基础上添加）

```
你的项目根目录/
├── index.html                （你现有的前端）
├── frontend-integration.js   （你现有的）
├── api/
│   └── generate_report.js    （新增：心理报告 API）
├── vercel.json               （可选，一般不需要额外配置）
└── package.json              （可选，如果需要安装依赖）
```

---

## 二、安装依赖（本地测试用，部署时 Vercel 自动安装）

在项目根目录创建 `package.json`：

```json
{
  "name": "house-tree-person-puzzle",
  "version": "1.0.0",
  "dependencies": {
    "openai": "^4.20.0"
  }
}
```

然后运行 `npm install`（本地测试时）。

---

## 三、编写 API 函数

创建 `api/generate_report.js`：

```javascript
import OpenAI from 'openai';

// 初始化 OpenAI 客户端（支持国内模型如 DeepSeek，只需改 baseURL）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // 从环境变量读取
  // 如果使用 DeepSeek，取消下面注释：
  // baseURL: "https://api.deepseek.com/v1"
});

export default async function handler(req, res) {
  // 设置 CORS 头（允许前端调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameData = req.body;
    
    // 提取数据
    const {
      time_seconds = 0,
      moves = 0,
      grid_size = 3,
      modifiers = {},
      image_name = '未知图片'
    } = gameData;

    const minutes = Math.floor(time_seconds / 60);
    const seconds = Math.floor(time_seconds % 60);
    
    // 行为特征推断
    const efficiency = moves < grid_size * grid_size * 2 ? '高效' : '谨慎';
    const patience = time_seconds > 120 ? '耐心' : '果断';

    // 构建提示词
    const prompt = `
你是一位资深房树人心理投射分析专家。用户完成了一款“房树人拼图游戏”，以下是他的游戏数据：

- 选用图片：${image_name}
- 难度：${grid_size}x${grid_size}
- 完成用时：${minutes}分${seconds}秒
- 总步数：${moves}
- 开启的特殊模组：${JSON.stringify(modifiers)}
- 行为特征：${efficiency}、${patience}

请根据房树人心理分析理论（房子代表家庭安全感、树代表成长与生命力、人代表自我认知），结合用户的表现（例如步数多可能犹豫不决，用时短可能追求效率），写一段不超过300字的个性化心理分析报告。语气温暖、鼓励，并提供1-2条成长建议。
`;

    // 调用 AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // 或 'deepseek-chat', 'glm-4' 等
      messages: [
        { role: 'system', content: '你是一位温暖、专业的心理分析师。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const report = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      report: report
    });
  } catch (error) {
    console.error('AI 调用失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '生成报告失败，请稍后重试'
    });
  }
}
```

---

## 四、修改前端 `frontend-integration.js`

你的 `frontend-integration.js` 需要发送正确的游戏数据。示例内容如下（如果你已有类似代码，请对照调整）：

```javascript
// frontend-integration.js
async function generatePsychologyReport() {
  const game = window.puzzleGame;
  if (!game || game.gameState !== 'completed') {
    alert('请先完成一局游戏');
    return;
  }

  const timeSeconds = Math.floor((Date.now() - game.startTime) / 1000);
  const data = {
    time_seconds: timeSeconds,
    moves: game.moveCount,
    grid_size: game.gridSize,
    modifiers: {
      rotation: game.modifiers.rotation || false,
      hidden: game.modifiers.hidden || false,
      trickster: game.modifiers.trickster || false
    },
    image_name: document.getElementById('previewImage')?.src.split('/').pop() || '用户图片'
  };

  try {
    const response = await fetch(window.API_BASE_URL + '/api/generate_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      // 弹出报告或显示在页面上
      alert('📊 心理分析报告：\n\n' + result.report);
      // 你也可以创建一个模态框来显示，这里简单 alert
    } else {
      alert('生成报告失败：' + result.error);
    }
  } catch (err) {
    alert('网络错误：' + err.message);
  }
}

// 暴露给全局（因为你的 HTML 中调用了这个函数）
window.generatePsychologyReport = generatePsychologyReport;
```

---

## 五、设置环境变量（Vercel 上配置）

1. 进入 Vercel 项目 Dashboard → **Settings** → **Environment Variables**。
2. 添加变量：
   - `Name`: `OPENAI_API_KEY`
   - `Value`: 你的 API Key（例如 `sk-xxx`）
3. 点击 **Save**，然后重新部署项目（Vercel 会自动重新部署）。

如果你用的是国内大模型（如 DeepSeek），还需要添加 `OPENAI_BASE_URL` 变量，并在代码中读取它。

---

## 六、可选：修改 `vercel.json`（如果需要重写路由）

一般情况下 Vercel 会自动识别 `api/` 目录下的文件，无需额外配置。如果你需要自定义，可以创建 `vercel.json`：

```json
{
  "functions": {
    "api/generate_report.js": {
      "maxDuration": 10
    }
  }
}
```

---

## 七、本地测试（可选）

1. 在项目根目录运行：
   ```bash
   npm install
   ```
2. 安装 Vercel CLI：`npm i -g vercel`
3. 运行 `vercel dev` 启动本地开发服务器，Vercel 会自动模拟云端环境。
4. 访问 `http://localhost:3000/api/generate_report` 测试。

---

## 八、部署到 Vercel

1. 将代码推送到 GitHub 仓库。
2. 在 Vercel 上导入该仓库。
3. 设置环境变量（上面已说明）。
4. 点击 **Deploy**。

部署完成后，你的前端（`index.html` 中 `window.API_BASE_URL` 会自动指向当前域名），因此调用 `/api/generate_report` 就是正确的。

---

## 九、常见问题与解决

**1. 返回 404 错误**  
- 确保文件路径正确：`api/generate_report.js`（必须是 `api` 目录，文件名为 `generate_report.js`，导出 `default` 函数）。  
- 检查 Vercel 部署日志，看函数是否被正确识别。

**2. 返回 500 错误，提示 OpenAI 未配置**  
- 确认环境变量 `OPENAI_API_KEY` 已添加，并且重新部署了。  
- 在代码中打印 `process.env.OPENAI_API_KEY` 看看是否为空（通过 Vercel 日志）。

**3. 想用免费的 DeepSeek 模型**  
- 注册 DeepSeek，获取 API Key。  
- 环境变量名可以仍用 `OPENAI_API_KEY`，但需要修改代码中的 `baseURL` 和 `model`：
  ```javascript
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.deepseek.com/v1"
  });
  // 然后调用时 model 改为 'deepseek-chat'
  ```

**4. 前端调用跨域问题**  
- 我们的 API 函数中已经设置了 `Access-Control-Allow-Origin: *`，不会出现跨域。

**5. 冷启动慢**  
- Vercel 免费版有冷启动，第一次调用可能需 1-2 秒，这是正常的。可以加一个“加载中”提示。

---

## 十、完整示例：显示报告的弹窗（美化版）

如果你不想用 `alert`，可以创建一个浮动模态框。在 `index.html` 中添加：

```html
<div id="reportModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:20000; justify-content:center; align-items:center;">
  <div style="background:white; border-radius:20px; max-width:90%; max-height:80%; overflow:auto; padding:20px;">
    <h3>📊 心理分析报告</h3>
    <p id="reportText"></p>
    <button onclick="document.getElementById('reportModal').style.display='none'">关闭</button>
  </div>
</div>
```

然后在 `generatePsychologyReport` 中动态显示：

```javascript
const modal = document.getElementById('reportModal');
const reportText = document.getElementById('reportText');
reportText.innerText = result.report;
modal.style.display = 'flex';
```

---

现在你只需要按照以上步骤，把 Node.js 函数部署到 Vercel，前端无需改动（只要 `API_BASE_URL` 正确），心理报告功能就能正常工作了。如果还有问题，请提供具体的部署错误日志，我可以帮你排查。