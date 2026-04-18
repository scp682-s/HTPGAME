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
    const behaviorTraits = (moves, time, size) => {
      if (moves < size * size * 1.5) return '高效、果断';
      if (moves > size * size * 3) return '谨慎、周密思考';
      return '稳健、有条理';
    };

    // 特殊模组文本
    const modifiersText = (mod) => {
      const active = [];
      if (mod.rotation) active.push('旋转拼图');
      if (mod.hidden) active.push('隐藏碎片');
      if (mod.trickster) active.push('捣蛋鬼干扰');
      return active.length ? active.join('、') : '无特殊模组';
    };

    // 构建提示词（使用新模板）
    const prompt = `
你是一位资深房树人心理投射分析专家，用户刚刚完成了一款"房树人拼图游戏"。请根据以下游戏数据，写一段不超过300字的个性化心理分析报告。

【游戏数据】
- 图片主题：${image_name}
- 拼图难度：${grid_size} x ${grid_size}
- 完成用时：${minutes}分${seconds}秒
- 总步数：${moves}
- 特殊模组开启情况：${modifiersText(modifiers)}
- 行为特征：${behaviorTraits(moves, time_seconds, grid_size)}

【房树人心理分析理论要点】
- 房子：代表家庭安全感、对家庭的态度。拼图中房子部分放置准确、步数少 → 家庭安全感强；反复调整 → 可能对家庭角色有思考或不确定。
- 树：代表生命力、成长经历、自我发展。树干稳固、树冠茂盛 → 生命力旺盛；若拼图时树的部分犹豫 → 可能在成长中经历过挑战。
- 人：代表自我认知、人际关系。人物拼图果断 → 自我接纳度高；反复修正 → 可能对自我形象有较高要求或正在探索。

【分析要求】
1. 语气温暖、鼓励，避免生硬说教。
2. 结合用户的具体数据（例如用时短/步数少 → 高效、果断；用时长/步数多 → 细致、周密）。
3. 给出1-2条贴合用户表现的成长建议（与房树人意象相关）。
4. 整体字数控制在300字以内。

【输出格式】
直接输出分析正文，不要加额外说明或标题。
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
