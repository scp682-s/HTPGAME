import OpenAI from 'openai';

export default async function handler(req, res, analyticsStore) {
  // 初始化 DeepSeek 客户端
  const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,  // 从环境变量读取
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
      client_id = 'anonymous',
      game_id = null,
      time_seconds = 0,
      moves = 0,
      grid_size = 3,
      modifiers = {},
      image_name = '未知图片',
      piece_order = [],
      time_intervals = [],
      modification_count = 0,
      // 新增：行为统计数据
      behavior_log = [],
      used_auto_solve = false,
      undo_count = 0,
      shuffle_count = 0,
      rotate_count = 0
    } = gameData;

    // 如果有数据库，记录游戏会话和报告请求
    if (analyticsStore && game_id) {
      try {
        // 更新游戏会话为已完成
        analyticsStore.upsertGameSession({
          gameId: game_id,
          clientId: client_id,
          imageSource: image_name,
          gridSize: grid_size,
          modifiers: modifiers,
          startedAt: Date.now() / 1000 - time_seconds,
          endedAt: Date.now() / 1000,
          gameState: 'completed',
          moveCount: moves,
          progress: 100,
          completionTimeSeconds: time_seconds,
          pieceOrder: piece_order,
          timeIntervals: time_intervals,
          modificationCount: modification_count
        });
      } catch (dbError) {
        console.error('数据库记录失败:', dbError);
        // 不影响报告生成，继续执行
      }
    }

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

    // 获取近期行为摘要（如果有数据库）
    let recentBehaviorSummary = '';
    if (analyticsStore && client_id) {
      try {
        recentBehaviorSummary = analyticsStore.buildRecentBehaviorPrompt(client_id, 14, 12);
      } catch (dbError) {
        console.error('获取近期行为摘要失败:', dbError);
        recentBehaviorSummary = '【近期行为数据】\n暂无历史数据。';
      }
    } else {
      recentBehaviorSummary = '【近期行为数据】\n暂无历史数据。';
    }

    // 构建提示词（使用新模板）
    const prompt = `
你是高校心理健康教育场景中的心理学科普助手，服务对象是大学生。
你的工作是基于房树人主题拼图行为数据，给出温和、可执行、非诊断的心理观察与自我觉察建议。

【本次拼图行为数据】
- 图片主题：${image_name}
- 拼图难度：${grid_size} x ${grid_size}
- 完成用时：${minutes}分${seconds}秒
- 总步数：${moves}
- 修改次数：${modification_count}
- 特殊模组开启情况：${modifiersText(modifiers)}
- 行为特征：${behaviorTraits(moves, time_seconds, grid_size)}

【行为统计】
- 是否使用自动完成：${used_auto_solve ? '是（在' + moves + '步后使用）' : '否'}
- 撤销次数：${undo_count}次
- 重新打乱次数：${shuffle_count}次
- 旋转次数：${rotate_count}次

${recentBehaviorSummary}

【分析要求】
1. 以"本次拼图行为数据"为主证据，"近期行为数据摘要"为辅证据
2. 当本次数据与近期趋势冲突时，优先解释本次数据，并把历史信息写成"可能的背景趋势"
3. 当近期样本偏少时，明确提示"样本有限"，禁止下绝对结论
4. 每条判断都要映射到行为证据（用时、步数、间隔、修改次数等）
5. **重点关注行为统计数据**：
   - 使用自动完成可能反映：遇到困难时的应对方式、对完美的追求程度、时间压力感知
   - 撤销次数反映：决策谨慎度、容错心态、完美主义倾向
   - 重新打乱次数反映：面对挫折的态度、重新开始的勇气、策略调整能力
   - 旋转次数反映：空间思维能力、耐心程度、细节关注度
6. 禁止医学诊断、病理标签或治疗结论
7. 禁止"你有问题""你患有"等负向定性表达
8. 只能做心理科普和自我觉察引导，不替代专业诊疗
9. 禁止使用表情符号，中文表达要清晰整洁

【输出格式要求】
1. 首先输出一个表格，包含游戏数据（使用HTML表格格式）
2. 然后输出分析内容，包含以下结构：
   - <h3>游戏表现概述</h3>
   - <h3>心理特质分析</h3>
   - <h3>成长建议</h3>
3. 在分析中使用<span style="color:#e74c3c">红色</span>、<span style="color:#3498db">蓝色</span>、<span style="color:#2ecc71">绿色</span>等颜色标注重要特质词汇
4. 整体字数控制在500字以内
5. 语气温暖、鼓励，避免生硬说教

【示例格式】
<table style="width:100%; border-collapse:collapse; margin:20px 0;">
<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">难度</td><td style="padding:8px; border:1px solid #ddd;">${grid_size}×${grid_size}</td></tr>
<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">用时</td><td style="padding:8px; border:1px solid #ddd;">${minutes}分${seconds}秒</td></tr>
<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">步数</td><td style="padding:8px; border:1px solid #ddd;">${moves}步</td></tr>
<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">修改次数</td><td style="padding:8px; border:1px solid #ddd;">${modification_count}次</td></tr>
${used_auto_solve ? '<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">自动完成</td><td style="padding:8px; border:1px solid #ddd;">是</td></tr>' : ''}
${undo_count > 0 ? '<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">撤销次数</td><td style="padding:8px; border:1px solid #ddd;">' + undo_count + '次</td></tr>' : ''}
${shuffle_count > 0 ? '<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">重新打乱</td><td style="padding:8px; border:1px solid #ddd;">' + shuffle_count + '次</td></tr>' : ''}
${rotate_count > 0 ? '<tr><td style="padding:8px; border:1px solid #ddd; background:#f5f5f5;">旋转次数</td><td style="padding:8px; border:1px solid #ddd;">' + rotate_count + '次</td></tr>' : ''}
</table>

<h3>游戏表现概述</h3>
<p>您在${grid_size}×${grid_size}难度下...</p>

<h3>心理特质分析</h3>
<p>从您的拼图过程中，我们观察到您展现出<span style="color:#e74c3c">高效决策</span>的特质...</p>

<h3>成长建议</h3>
<p>建议您...</p>
`;

    // 调用 AI
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一位温暖、专业的心理分析师，专注于大学生心理健康教育。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const report = completion.choices[0].message.content;

    // 保存报告到数据库
    console.log('准备保存报告, analyticsStore:', !!analyticsStore, 'client_id:', client_id);
    if (analyticsStore && client_id) {
      try {
        analyticsStore.saveReport({
          clientId: client_id,
          gameId: game_id,
          imageSource: image_name,
          promptText: prompt,
          reportText: report
        });
        console.log('报告保存成功, client_id:', client_id);
      } catch (dbError) {
        console.error('保存报告失败:', dbError);
        // 不影响返回结果
      }
    } else {
      console.log('跳过保存报告: analyticsStore=', !!analyticsStore, 'client_id=', client_id);
    }

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
