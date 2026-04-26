// Vercel Serverless Function - 拼图游戏 API
import { PuzzleEngine, PuzzleError } from '../puzzle_engine.js';
import { validateImageSource } from '../image_validator.js';

// 使用内存存储游戏状态（Vercel 环境）
const puzzleEngine = new PuzzleEngine();

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, gameId } = req.query;

    if (req.method === 'POST' && !action) {
      // POST /api/puzzle/games - 创建游戏
      const { imageSource, gridSize, modifiers } = req.body;

      const imageCheck = await validateImageSource(imageSource);
      if (!imageCheck.valid) {
        return res.status(400).json({
          success: false,
          error: imageCheck.message,
          imageCheck: imageCheck
        });
      }

      const gameState = puzzleEngine.createGame(imageSource, gridSize, modifiers);
      return res.json({ success: true, data: gameState });

    } else if (req.method === 'GET' && gameId) {
      // GET /api/puzzle/games/:gameId - 获取游戏状态
      const gameState = puzzleEngine.getGameState(gameId);
      return res.json({ success: true, data: gameState });

    } else if (req.method === 'POST' && gameId) {
      // POST /api/puzzle/games/:gameId/actions - 执行动作
      const { action: moveAction, payload } = req.body;
      const gameState = puzzleEngine.applyAction(gameId, moveAction, payload || {});
      return res.json({ success: true, data: gameState });

    } else {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
  } catch (error) {
    if (error instanceof PuzzleError) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      console.error('拼图 API 错误:', error);
      res.status(500).json({ success: false, error: '服务器错误: ' + error.message });
    }
  }
}
