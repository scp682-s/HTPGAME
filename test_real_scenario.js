import fetch from 'node-fetch';

console.log('=== 模拟真实用户场景测试 ===\n');

const API_URL = 'http://localhost:3000/api/generate_report';

// 模拟用户1：第一次玩游戏
async function testFirstTimeUser() {
  console.log('📝 测试场景1: 新用户第一次完成游戏\n');

  const gameData = {
    client_id: 'user-first-time-' + Date.now(),
    game_id: 'game-' + Date.now(),
    time_seconds: 180,  // 3分钟
    moves: 25,
    grid_size: 3,
    modifiers: {
      rotation: false,
      hidden: false,
      trickster: false
    },
    image_name: 'photo/1.png',
    piece_order: ['p-0-0', 'p-0-1', 'p-0-2', 'p-1-0', 'p-1-1'],
    time_intervals: [5, 3, 4, 6, 2, 8, 3, 5],
    modification_count: 3
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✓ 报告生成成功');
      console.log('报告预览（前200字）:');
      console.log(result.report.substring(0, 200) + '...\n');
      console.log('✓ 应该显示"暂无历史数据"（因为是第一次）\n');
    } else {
      console.log('✗ 报告生成失败:', result.error);
    }
  } catch (error) {
    console.log('✗ 请求失败:', error.message);
  }
}

// 模拟用户2：多次游戏后的报告
async function testReturningUser() {
  console.log('📝 测试场景2: 老用户完成第5局游戏\n');

  const clientId = 'user-returning-' + Date.now();

  // 先模拟完成4局游戏（直接插入数据库）
  console.log('正在模拟前4局游戏记录...');

  const { AnalyticsStore } = await import('./analytics_store.js');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const store = new AnalyticsStore(
    path.join(__dirname, 'data', 'behavior_analytics.db')
  );

  // 插入4局历史游戏
  for (let i = 1; i <= 4; i++) {
    store.upsertGameSession({
      gameId: `game-history-${i}-${Date.now()}`,
      clientId: clientId,
      imageSource: 'photo/1.png',
      gridSize: 3,
      modifiers: { rotation: false, hidden: false, trickster: false },
      startedAt: Date.now() / 1000 - (i * 86400) - 120,  // i天前
      endedAt: Date.now() / 1000 - (i * 86400),
      gameState: 'completed',
      moveCount: 20 + i * 2,
      progress: 100,
      completionTimeSeconds: 100 + i * 10,
      pieceOrder: ['p-0-0', 'p-0-1'],
      timeIntervals: [5, 3, 4, 6, 2],
      modificationCount: i
    });
  }

  store.close();
  console.log('✓ 已插入4局历史记录\n');

  // 现在生成第5局的报告
  const gameData = {
    client_id: clientId,
    game_id: 'game-current-' + Date.now(),
    time_seconds: 95,  // 比历史平均快
    moves: 18,  // 比历史平均少
    grid_size: 3,
    modifiers: {
      rotation: false,
      hidden: false,
      trickster: false
    },
    image_name: 'photo/1.png',
    piece_order: ['p-0-0', 'p-0-1', 'p-0-2'],
    time_intervals: [3, 2, 3, 2, 4],
    modification_count: 1
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✓ 报告生成成功');
      console.log('报告预览（前300字）:');
      console.log(result.report.substring(0, 300) + '...\n');
      console.log('✓ 应该包含近期行为数据摘要（5局游戏的统计）\n');
    } else {
      console.log('✗ 报告生成失败:', result.error);
    }
  } catch (error) {
    console.log('✗ 请求失败:', error.message);
  }
}

// 测试数据库查询
async function testDatabaseQuery() {
  console.log('📝 测试场景3: 查询数据库统计\n');

  const { AnalyticsStore } = await import('./analytics_store.js');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const store = new AnalyticsStore(
    path.join(__dirname, 'data', 'behavior_analytics.db')
  );

  // 查询总用户数
  const users = store.db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`✓ 总用户数: ${users.count}`);

  // 查询总游戏会话数
  const sessions = store.db.prepare('SELECT COUNT(*) as count FROM game_sessions').get();
  console.log(`✓ 总游戏会话数: ${sessions.count}`);

  // 查询已完成的游戏数
  const completed = store.db.prepare("SELECT COUNT(*) as count FROM game_sessions WHERE game_state = 'completed'").get();
  console.log(`✓ 已完成游戏数: ${completed.count}`);

  // 查询总报告数
  const reports = store.db.prepare('SELECT COUNT(*) as count FROM report_logs').get();
  console.log(`✓ 生成报告数: ${reports.count}`);

  // 查询平均完成时间
  const avgTime = store.db.prepare("SELECT AVG(completion_time_seconds) as avg FROM game_sessions WHERE game_state = 'completed' AND completion_time_seconds IS NOT NULL").get();
  if (avgTime.avg) {
    const minutes = Math.floor(avgTime.avg / 60);
    const seconds = Math.floor(avgTime.avg % 60);
    console.log(`✓ 平均完成时间: ${minutes}分${seconds}秒`);
  }

  store.close();
  console.log();
}

// 运行所有测试
async function runAllTests() {
  try {
    await testFirstTimeUser();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testReturningUser();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testDatabaseQuery();

    console.log('=== 所有测试完成！ ===');
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

runAllTests();
