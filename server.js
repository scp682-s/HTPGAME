import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/generate_report.js';
import { AnalyticsStore } from './analytics_store.js';
import { PuzzleEngine, PuzzleError } from './puzzle_engine.js';
import { validateImageSource } from './image_validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3001;

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - POST   /api/validate-image - 校验图片三要素`);
  console.log(`  - POST   /api/puzzle/games - 创建游戏`);
  console.log(`  - GET    /api/puzzle/games/:gameId - 获取游戏状态`);
  console.log(`  - POST   /api/puzzle/games/:gameId/actions - 执行动作`);
  console.log(`  - POST   /api/generate_report - 生成心理报告`);
  console.log(`Database initialized at: ${path.join(__dirname, 'data', 'behavior_analytics.db')}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  analyticsStore.close();
  process.exit(0);
});
