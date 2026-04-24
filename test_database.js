import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 测试数据库功能 ===\n');

const store = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

// 测试1: 创建用户
console.log('1. 测试用户创建...');
store.upsertUser('test-user-123');
console.log('✓ 用户创建成功\n');

// 测试2: 创建游戏会话
console.log('2. 测试游戏会话创建...');
const gameId = 'game-test-' + Date.now();
store.upsertGameSession({
  gameId: gameId,
  clientId: 'test-user-123',
  imageSource: 'photo/1.png',
  gridSize: 3,
  modifiers: { rotation: false, hidden: false, trickster: false },
  startedAt: Date.now() / 1000,
  gameState: 'playing',
  moveCount: 0,
  progress: 0
});
console.log('✓ 游戏会话创建成功\n');

// 测试3: 记录动作
console.log('3. 测试动作记录...');
store.logAction({
  gameId: gameId,
  clientId: 'test-user-123',
  action: 'place_piece',
  payload: { pieceId: 'p-0-0', position: 0 },
  moveCount: 1,
  progress: 11.11,
  gameState: 'playing',
  elapsedSeconds: 5
});
console.log('✓ 动作记录成功\n');

// 测试4: 完成游戏
console.log('4. 测试游戏完成...');
store.upsertGameSession({
  gameId: gameId,
  clientId: 'test-user-123',
  imageSource: 'photo/1.png',
  gridSize: 3,
  modifiers: { rotation: false, hidden: false, trickster: false },
  startedAt: Date.now() / 1000 - 120,
  endedAt: Date.now() / 1000,
  gameState: 'completed',
  moveCount: 15,
  progress: 100,
  completionTimeSeconds: 120,
  pieceOrder: ['p-0-0', 'p-0-1', 'p-0-2'],
  timeIntervals: [5, 3, 4, 6, 2],
  modificationCount: 2
});
console.log('✓ 游戏完成记录成功\n');

// 测试5: 保存报告
console.log('5. 测试报告保存...');
store.saveReport({
  clientId: 'test-user-123',
  gameId: gameId,
  imageSource: 'photo/1.png',
  promptText: '测试提示词',
  reportText: '测试报告内容'
});
console.log('✓ 报告保存成功\n');

// 测试6: 查询近期会话
console.log('6. 测试查询近期会话...');
const sessions = store.getRecentSessions('test-user-123', 14, 12);
console.log(`✓ 查询到 ${sessions.length} 个会话\n`);

// 测试7: 生成行为摘要
console.log('7. 测试生成行为摘要...');
const summary = store.buildRecentBehaviorPrompt('test-user-123', 14, 12);
console.log('✓ 行为摘要生成成功:');
console.log(summary);
console.log();

// 关闭数据库
store.close();

console.log('=== 所有测试通过！ ===');
