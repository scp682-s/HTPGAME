import fetch from 'node-fetch';

console.log('=== 测试拼图引擎 API ===\n');

const API_BASE = 'http://localhost:3001/api/puzzle';
const clientId = 'test-user-' + Date.now();

async function testPuzzleEngine() {
  try {
    // 测试1: 创建游戏
    console.log('1. 测试创建游戏...');
    const createResponse = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageSource: 'photo/1.png',
        gridSize: 3,
        modifiers: { rotation: false, hidden: false, trickster: false },
        clientId: clientId
      })
    });
    const createResult = await createResponse.json();

    if (!createResult.success) {
      console.log('✗ 创建游戏失败:', createResult.error);
      return;
    }

    const gameId = createResult.data.gameId;
    console.log('✓ 游戏创建成功');
    console.log(`  游戏ID: ${gameId}`);
    console.log(`  难度: ${createResult.data.gridSize}x${createResult.data.gridSize}`);
    console.log(`  托盘碎片数: ${createResult.data.tray.length}`);
    console.log(`  隐藏碎片数: ${createResult.data.hiddenCount}`);
    console.log();

    // 测试2: 获取游戏状态
    console.log('2. 测试获取游戏状态...');
    const getResponse = await fetch(`${API_BASE}/games/${gameId}`);
    const getResult = await getResponse.json();

    if (!getResult.success) {
      console.log('✗ 获取状态失败:', getResult.error);
      return;
    }

    console.log('✓ 获取状态成功');
    console.log(`  当前步数: ${getResult.data.moveCount}`);
    console.log(`  游戏状态: ${getResult.data.gameState}`);
    console.log(`  完成进度: ${getResult.data.completion.progress}%`);
    console.log();

    // 测试3: 放置碎片
    console.log('3. 测试放置碎片...');
    const firstPiece = createResult.data.tray[0].id;
    const placeResponse = await fetch(`${API_BASE}/games/${gameId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'place_from_tray',
        payload: { pieceId: firstPiece, targetIndex: 0 },
        clientId: clientId
      })
    });
    const placeResult = await placeResponse.json();

    if (!placeResult.success) {
      console.log('✗ 放置碎片失败:', placeResult.error);
      return;
    }

    console.log('✓ 放置碎片成功');
    console.log(`  消息: ${placeResult.data.message}`);
    console.log(`  当前步数: ${placeResult.data.moveCount}`);
    console.log(`  完成进度: ${placeResult.data.completion.progress}%`);
    console.log();

    // 测试4: 移动格子中的碎片
    console.log('4. 测试移动格子碎片...');
    const moveResponse = await fetch(`${API_BASE}/games/${gameId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'move_cell',
        payload: { sourceIndex: 0, targetIndex: 4 },
        clientId: clientId
      })
    });
    const moveResult = await moveResponse.json();

    if (!moveResult.success) {
      console.log('✗ 移动碎片失败:', moveResult.error);
      return;
    }

    console.log('✓ 移动碎片成功');
    console.log(`  消息: ${moveResult.data.message}`);
    console.log(`  当前步数: ${moveResult.data.moveCount}`);
    console.log();

    // 测试5: 撤销操作
    console.log('5. 测试撤销操作...');
    const undoResponse = await fetch(`${API_BASE}/games/${gameId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'undo',
        payload: {},
        clientId: clientId
      })
    });
    const undoResult = await undoResponse.json();

    if (!undoResult.success) {
      console.log('✗ 撤销失败:', undoResult.error);
      return;
    }

    console.log('✓ 撤销成功');
    console.log(`  消息: ${undoResult.data.message}`);
    console.log(`  当前步数: ${undoResult.data.moveCount}`);
    console.log();

    // 测试6: 自动完成
    console.log('6. 测试自动完成...');
    const solveResponse = await fetch(`${API_BASE}/games/${gameId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'solve',
        payload: {},
        clientId: clientId
      })
    });
    const solveResult = await solveResponse.json();

    if (!solveResult.success) {
      console.log('✗ 自动完成失败:', solveResult.error);
      return;
    }

    console.log('✓ 自动完成成功');
    console.log(`  消息: ${solveResult.data.message}`);
    console.log(`  游戏状态: ${solveResult.data.gameState}`);
    console.log(`  完成进度: ${solveResult.data.completion.progress}%`);
    console.log(`  是否完成: ${solveResult.data.completion.isCompleted}`);
    console.log();

    // 测试7: 检查数据库记录
    console.log('7. 检查数据库记录...');
    const { AnalyticsStore } = await import('./analytics_store.js');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const store = new AnalyticsStore(
      path.join(__dirname, 'data', 'behavior_analytics.db')
    );

    const sessions = store.getRecentSessions(clientId, 1, 10);
    const actions = store.getRecentActions(clientId, 1, 100);

    console.log(`✓ 数据库记录检查完成`);
    console.log(`  游戏会话数: ${sessions.length}`);
    console.log(`  动作记录数: ${actions.length}`);

    if (sessions.length > 0) {
      const session = sessions[0];
      console.log(`  最新会话状态: ${session.game_state}`);
      console.log(`  最新会话步数: ${session.move_count}`);
    }

    store.close();
    console.log();

    console.log('=== 所有测试通过！ ===');
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testPuzzleEngine();
