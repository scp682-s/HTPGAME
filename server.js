import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import handler from './api_backup/generate_report.js';
import { AnalyticsStore } from './analytics_store.js';
import { PuzzleEngine, PuzzleError } from './puzzle_engine.js';
import { validateImageSource } from './image_validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// 初始化数据库
const analyticsStore = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

// 初始化拼图引擎
const puzzleEngine = new PuzzleEngine();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// ==================== 图片校验 API ====================

// 校验图片是否包含房树人三要素
app.post('/api/validate-image', async (req, res) => {
  try {
    const { imageSource } = req.body;
    const check = await validateImageSource(imageSource);
    res.json({ success: true, data: check });
  } catch (error) {
    console.error('图片校验失败:', error);
    res.status(500).json({ success: false, error: '图片校验失败: ' + error.message });
  }
});

// ==================== 拼图 API ====================

// 创建游戏
app.post('/api/puzzle/games', async (req, res) => {
  try {
    const { imageSource, gridSize, modifiers, clientId } = req.body;

    // 校验图片
    const imageCheck = await validateImageSource(imageSource);
    if (!imageCheck.valid) {
      return res.status(400).json({
        success: false,
        error: imageCheck.message,
        imageCheck: imageCheck
      });
    }

    const gameState = puzzleEngine.createGame(imageSource, gridSize, modifiers);

    // 记录到数据库
    if (clientId) {
      analyticsStore.upsertGameSession({
        gameId: gameState.gameId,
        clientId: clientId,
        imageSource: imageSource,
        gridSize: gridSize,
        modifiers: modifiers,
        startedAt: Date.now() / 1000,
        gameState: 'playing',
        moveCount: 0,
        progress: 0
      });
    }

    res.json({ success: true, data: gameState });
  } catch (error) {
    if (error instanceof PuzzleError) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      console.error('创建游戏失败:', error);
      res.status(500).json({ success: false, error: '创建游戏失败' });
    }
  }
});

// 获取游戏状态
app.get('/api/puzzle/games/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameState = puzzleEngine.getGameState(gameId);
    res.json({ success: true, data: gameState });
  } catch (error) {
    if (error instanceof PuzzleError) {
      res.status(404).json({ success: false, error: error.message });
    } else {
      console.error('获取游戏状态失败:', error);
      res.status(500).json({ success: false, error: '获取游戏状态失败' });
    }
  }
});

// 执行动作
app.post('/api/puzzle/games/:gameId/actions', (req, res) => {
  try {
    const { gameId } = req.params;
    const { action, payload, clientId } = req.body;

    const gameState = puzzleEngine.applyAction(gameId, action, payload || {});

    // 记录动作到数据库
    if (clientId) {
      analyticsStore.logAction({
        gameId: gameId,
        clientId: clientId,
        action: action,
        payload: payload,
        moveCount: gameState.moveCount,
        progress: gameState.completion.progress,
        gameState: gameState.gameState,
        elapsedSeconds: gameState.elapsedSeconds
      });

      // 更新游戏会话
      analyticsStore.upsertGameSession({
        gameId: gameId,
        clientId: clientId,
        gameState: gameState.gameState,
        moveCount: gameState.moveCount,
        progress: gameState.completion.progress,
        endedAt: gameState.gameState === 'completed' ? Date.now() / 1000 : null,
        completionTimeSeconds: gameState.gameState === 'completed' ? gameState.elapsedSeconds : null,
        pieceOrder: gameState.metrics.pieceOrder,
        timeIntervals: gameState.metrics.timeIntervals,
        modificationCount: gameState.metrics.modificationCount
      });
    }

    res.json({ success: true, data: gameState });
  } catch (error) {
    if (error instanceof PuzzleError) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      console.error('执行动作失败:', error);
      res.status(500).json({ success: false, error: '执行动作失败' });
    }
  }
});

// ==================== 报告 API ====================

// API route - 传递 analyticsStore 给 handler
app.all('/api/generate_report', (req, res) => {
  handler(req, res, analyticsStore);
});

// 获取报告列表
app.post('/api/reports/list', async (req, res) => {
  try {
    const { clientId } = req.body;
    const reports = await analyticsStore.getReportsByClient(clientId, 50);
    res.json({ success: true, reports });
  } catch (error) {
    console.error('获取报告列表失败:', error);
    res.status(500).json({ success: false, error: '获取报告列表失败' });
  }
});

// 软删除报告（联动删除疗愈会话）
app.post('/api/reports/delete', async (req, res) => {
  try {
    const { reportId } = req.body;
    await analyticsStore.softDeleteReport(reportId);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除报告失败:', error);
    res.status(500).json({ success: false, error: '删除报告失败' });
  }
});

// 软删除疗愈会话（联动删除报告）
app.post('/api/healing/delete', async (req, res) => {
  try {
    const { reportId } = req.body;
    await analyticsStore.softDeleteHealingSession(reportId);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除疗愈会话失败:', error);
    res.status(500).json({ success: false, error: '删除疗愈会话失败' });
  }
});

// ==================== 管理员 API ====================

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证管理员账号
    const admin = analyticsStore.verifyAdminAccount(username, password);

    if (admin) {
      res.json({
        success: true,
        message: '登录成功',
        teacherId: admin.id,
        teacherName: admin.teacher_name,
        username: admin.username
      });
    } else {
      res.status(401).json({ success: false, message: '账号或密码错误' });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

// 创建管理员账号
app.post('/api/admin/create-account', (req, res) => {
  try {
    const { username, password, teacherName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    analyticsStore.createAdminAccount(username, password, teacherName);
    res.json({ success: true, message: '账号创建成功' });
  } catch (error) {
    console.error('创建账号失败:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '账号已存在' });
    } else {
      res.status(500).json({ success: false, error: '创建账号失败' });
    }
  }
});

// 获取所有老师列表
app.get('/api/teachers', (req, res) => {
  try {
    const teachers = analyticsStore.getAllTeachers();
    res.json({ success: true, teachers });
  } catch (error) {
    console.error('获取老师列表失败:', error);
    res.status(500).json({ success: false, error: '获取老师列表失败' });
  }
});

// 获取指定老师的班级列表
app.get('/api/teachers/:teacherId/classes', (req, res) => {
  try {
    const { teacherId } = req.params;
    const classes = analyticsStore.getClassesByTeacher(teacherId);
    res.json({ success: true, classes });
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({ success: false, error: '获取班级列表失败' });
  }
});

// 创建班级
app.post('/api/admin/classes', (req, res) => {
  try {
    const { teacherId, classNumber } = req.body;

    if (!teacherId || !classNumber) {
      return res.status(400).json({ success: false, message: '老师ID和班级号不能为空' });
    }

    analyticsStore.createClass(teacherId, classNumber);
    res.json({ success: true, message: '班级创建成功' });
  } catch (error) {
    console.error('创建班级失败:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '该班级已存在' });
    } else {
      res.status(500).json({ success: false, error: '创建班级失败' });
    }
  }
});

// 删除班级
app.delete('/api/admin/classes/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    analyticsStore.deleteClass(classId);
    res.json({ success: true, message: '班级删除成功' });
  } catch (error) {
    console.error('删除班级失败:', error);
    res.status(500).json({ success: false, error: '删除班级失败' });
  }
});

// 获取所有班级列表
app.get('/api/admin/all-classes', (req, res) => {
  try {
    const classes = analyticsStore.getAllClasses();
    res.json({ success: true, classes });
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({ success: false, error: '获取班级列表失败' });
  }
});

// 获取指定班级的学生疗愈数据
app.post('/api/admin/class-healing-data', (req, res) => {
  try {
    const { className } = req.body;
    const data = analyticsStore.getHealingDataByClass(className);
    res.json({ success: true, data });
  } catch (error) {
    console.error('获取班级数据失败:', error);
    res.status(500).json({ success: false, error: '获取班级数据失败' });
  }
});

// 导出数据为Excel
app.get('/api/admin/export-data', async (req, res) => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    const worksheet = workbook.addWorksheet('心理测试数据');

    // 设置表头
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: '测试时间', key: 'testTime', width: 20 },
      { header: '姓名', key: 'userName', width: 15 },
      { header: '学号', key: 'userStudentId', width: 15 },
      { header: '问题1', key: 'q1', width: 30 },
      { header: '问题2', key: 'q2', width: 30 },
      { header: '问题3', key: 'q3', width: 30 },
      { header: '心理报告结论', key: 'level', width: 15 },
      { header: '备注', key: 'reason', width: 40 }
    ];

    // 获取所有疗愈数据
    const healingData = await analyticsStore.getAllHealingData();

    // 按日期分组
    const dateGroups = {};
    healingData.forEach(session => {
      const date = new Date(session.created_at * 1000);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '/');
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = [];
      }
      dateGroups[dateStr].push(session);
    });

    // 填充数据
    Object.keys(dateGroups).sort().forEach(dateStr => {
      const sessions = dateGroups[dateStr].sort((a, b) => a.created_at - b.created_at);
      sessions.forEach((session, idx) => {
        const sessionId = `${dateStr}_${String(idx + 1).padStart(2, '0')}`;
        const testTime = new Date(session.created_at * 1000).toLocaleString('zh-CN');
        const userName = session.is_anonymous ? '匿名' : (session.user_name || '');
        const userStudentId = session.is_anonymous ? '匿名' : (session.user_student_id || '');

        const questions = session.questions || [];
        const q1 = questions[0] || '';
        const q2 = questions[1] || '';
        const q3 = questions[2] || '';

        const { level, reason } = evaluateReportLevel(session.report_content, questions);

        const row = worksheet.addRow({
          id: sessionId,
          testTime,
          userName,
          userStudentId,
          q1,
          q2,
          q3,
          level,
          reason
        });

        // 标红有问题的行
        if (level === '有问题' || level === '有大问题') {
          row.getCell('level').font = { color: { argb: 'FFFF0000' }, bold: true };
        }
      });
    });

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCE5FF' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // 生成文件
    const filename = `心理测试数据_${new Date().toISOString().split('T')[0]}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('导出数据失败:', error);
    res.status(500).json({ success: false, error: '导出数据失败: ' + error.message });
  }
});

// 评估报告等级的辅助函数
function evaluateReportLevel(reportText, userQuestions = []) {
  const text = (reportText || '').toLowerCase();
  const questionsText = userQuestions.join(' ').toLowerCase();
  const fullText = text + ' ' + questionsText;

  const severeKeywords = ['严重', '极度', '强烈焦虑', '抑郁倾向', '自我否定', '孤立', '逃避', '困扰明显',
                          '想死', '自杀', '轻生', '活着没意思', '绝望', '崩溃', '无法承受'];
  const problemKeywords = ['压力较大', '焦虑', '紧张', '不安', '疲惫', '困惑', '犹豫', '负担',
                          '痛苦', '难受', '失眠', '烦躁', '迷茫', '无助', '孤独'];
  const goodKeywords = ['稳定', '良好', '积极', '平衡', '适应', '健康', '正常'];
  const excellentKeywords = ['优秀', '出色', '自信', '乐观', '充满活力', '目标明确'];

  const severeCount = severeKeywords.filter(kw => fullText.includes(kw)).length;
  const problemCount = problemKeywords.filter(kw => fullText.includes(kw)).length;
  const goodCount = goodKeywords.filter(kw => fullText.includes(kw)).length;
  const excellentCount = excellentKeywords.filter(kw => fullText.includes(kw)).length;

  if (severeCount >= 1) {
    const matched = severeKeywords.filter(kw => fullText.includes(kw)).slice(0, 3);
    if (severeCount >= 2) {
      return { level: '有大问题', reason: `检测到严重负面情绪或风险信号：${matched.join(', ')}` };
    } else {
      return { level: '有问题', reason: `检测到负面心理指标：${matched.join(', ')}` };
    }
  } else if (problemCount >= 2) {
    const matched = problemKeywords.filter(kw => fullText.includes(kw)).slice(0, 3);
    return { level: '有问题', reason: `检测到负面心理指标：${matched.join(', ')}` };
  } else if (problemCount >= 1) {
    return { level: '一般', reason: '检测到轻微负面情绪' };
  } else if (excellentCount >= 2 && goodCount >= 2) {
    return { level: '优秀', reason: '无' };
  } else if (goodCount >= 2) {
    return { level: '良好', reason: '无' };
  } else {
    return { level: '一般', reason: '无' };
  }
}

// ==================== 心理疗愈 API ====================

// 创建疗愈会话
app.post('/api/healing/create-session', async (req, res) => {
  try {
    const { clientId, reportId, reportContent } = req.body;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await analyticsStore.createHealingSession(sessionId, clientId, reportId, reportContent);

    // 添加系统初始消息
    await analyticsStore.addHealingMessage(sessionId, 'system',
      `已上传心理报告，报告内容：\n${reportContent.substring(0, 500)}...`);

    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('创建疗愈会话失败:', error);
    res.status(500).json({ success: false, error: '创建疗愈会话失败' });
  }
});

// 心理疗愈对话
app.post('/api/healing/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: '消息不能为空' });
    }

    // 检查问题数量限制
    const questionCount = await analyticsStore.getQuestionCount(sessionId);
    if (questionCount >= 3) {
      return res.status(403).json({ success: false, error: '已达到提问次数上限（3次）' });
    }

    // 保存用户消息
    await analyticsStore.addHealingMessage(sessionId, 'user', message);

    // 增加问题计数
    const newCount = await analyticsStore.incrementQuestionCount(sessionId);

    // 获取对话历史和报告内容
    const messages = await analyticsStore.getHealingMessages(sessionId);

    // 获取会话的报告内容
    const sessionInfo = analyticsStore.db.prepare('SELECT report_content FROM healing_sessions WHERE session_id = ?').get(sessionId);
    const reportContent = sessionInfo ? sessionInfo.report_content : '';

    // 调用AI生成回复（传入报告内容）
    const assistantMessage = await generateHealingResponse(messages, reportContent, newCount);

    // 保存AI回复
    await analyticsStore.addHealingMessage(sessionId, 'assistant', assistantMessage);

    res.json({
      success: true,
      message: assistantMessage,
      questionCount: newCount,
      remainingQuestions: 3 - newCount
    });
  } catch (error) {
    console.error('对话失败:', error);
    res.status(500).json({ success: false, error: '对话失败' });
  }
});

// 提交用户信息
app.post('/api/healing/submit-info', async (req, res) => {
  try {
    const { sessionId, userName, userStudentId, userClass, isAnonymous } = req.body;
    await analyticsStore.updateHealingUserInfo(sessionId, userName, userStudentId, userClass, isAnonymous);
    res.json({ success: true });
  } catch (error) {
    console.error('提交信息失败:', error);
    res.status(500).json({ success: false, error: '提交信息失败' });
  }
});

// 生成疗愈回复的辅助函数
async function generateHealingResponse(messages, reportContent, questionNum) {
  try {
    // 构建系统提示词
    const systemPrompt = `你是一位温暖、专业的心理咨询师，正在与一位刚完成房树人心理测试的来访者进行对话。

【来访者的心理报告】
${reportContent}

【你的任务】
- 你已仔细阅读了来访者的心理报告
- 这是第 ${questionNum}/3 次对话
- 根据报告内容和来访者的提问，提供个性化的心理支持
- 用温暖、共情的语气回应，让来访者感到被理解和支持
- 避免说教，多倾听和理解
- 回复控制在150-200字

【对话策略】
第1次对话：倾听和共情，回应来访者的感受，基于报告内容给予理解
第2次对话：继续支持，可以提供一些具体的建议或应对方法
第3次对话：总结对话，给出2-3条简洁的建议，鼓励来访者

【重要边界】
- 必须基于报告内容进行个性化回复，不要泛泛而谈
- 如果报告中提到具体问题（如焦虑、压力、人际关系等），要针对性回应
- 语言要自然、温暖，像朋友般交流，不要过于正式
- 你是心理学科普助手，服务对象是大学生，提供的是心理观察与自我觉察建议
- 不做临床诊断，不开处方，不替代专业心理咨询

【安全与责任】
- 禁止诊断：不使用"抑郁症""焦虑症"等临床术语，改用"情绪低落""紧张感"等描述性词汇
- 禁止治疗：不提供药物建议、治疗方案，仅限于心理观察和自我觉察引导
- 危机识别：如发现严重心理困扰迹象，温和建议寻求学校心理咨询中心或专业机构帮助
- 隐私保护：不询问敏感个人信息，不记录可识别身份的内容
- 分为导向：遇到超出能力范围的问题，明确告知"这个问题需要专业心理咨询师的帮助"并引导转介`;

    // 构建对话历史
    const conversationMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加用户的历史消息
    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        conversationMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    // 调用 DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversationMessages,
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API 调用失败: ${response.status}`, errorText);
      throw new Error(`DeepSeek API 调用失败: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content.trim();

    // 确保回复不超过200字
    if (aiResponse.length > 200) {
      aiResponse = aiResponse.substring(0, 197) + '...';
    }

    console.log(`AI 回复生成成功 (第${questionNum}次对话):`, aiResponse.substring(0, 50) + '...');
    return aiResponse;

  } catch (error) {
    console.error('AI 回复生成失败，使用降级方案:', error.message);

    // 降级方案：返回简单的回复
    if (questionNum === 1) {
      return '我理解你的感受。从报告来看，你正在经历一些情绪波动，这是很正常的。请记住，每个人都有自己的节奏，不要给自己太大压力。你愿意和我分享更多吗？';
    } else if (questionNum === 2) {
      return '谢谢你愿意和我分享。你已经在努力面对自己的感受了，这本身就很了不起。记住，你不是一个人在面对这些。每个人都有困难时刻，重要的是学会接纳自己。';
    } else {
      return '通过我们的对话，我看到你正在积极面对自己的情绪。建议：1. 保持自我觉察 2. 向信任的人倾诉 3. 保持规律作息。如果压力持续，建议寻求专业帮助。记住，寻求帮助是勇敢的表现。祝你一切顺利！';
    }
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - POST   /api/validate-image - 校验图片三要素`);
  console.log(`  - POST   /api/puzzle/games - 创建游戏`);
  console.log(`  - GET    /api/puzzle/games/:gameId - 获取游戏状态`);
  console.log(`  - POST   /api/puzzle/games/:gameId/actions - 执行动作`);
  console.log(`  - POST   /api/generate_report - 生成心理报告`);
  console.log(`  - POST   /api/reports/list - 获取报告列表`);
  console.log(`  - POST   /api/admin/login - 管理员登录`);
  console.log(`  - GET    /api/admin/export-data - 导出数据`);
  console.log(`  - POST   /api/healing/create-session - 创建疗愈会话`);
  console.log(`  - POST   /api/healing/chat - 心理疗愈对话`);
  console.log(`  - POST   /api/healing/submit-info - 提交用户信息`);
  console.log(`Database initialized at: ${path.join(__dirname, 'data', 'behavior_analytics.db')}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  analyticsStore.close();
  process.exit(0);
});
