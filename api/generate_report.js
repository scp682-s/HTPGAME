import OpenAI from 'openai';

export default async function handler(req, res) {
  // 初始化 OpenAI 客户端（使用 DeepSeek API）
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // 从环境变量读取
    baseURL: "https://api.deepseek.com/v1"
  });
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
你是一位资深房树人心理投射分析专家。用户完成了一款"房树人拼图游戏"，以下是他的游戏数据：

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
      model: 'deepseek-chat',
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
