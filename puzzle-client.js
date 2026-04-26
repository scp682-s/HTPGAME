// puzzle-client.js - 前端拼图 API 客户端

class PuzzleClient {
  constructor() {
    // 如果 API_BASE_URL 是空字符串，使用空字符串（相对路径）
    // 如果未定义，使用 localhost
    this.apiBaseUrl = (typeof window.API_BASE_URL !== 'undefined')
      ? window.API_BASE_URL
      : 'http://localhost:3001';
    this.currentGame = null;
    this.clientId = this.getOrCreateClientId();
  }

  // 获取或创建客户端ID
  getOrCreateClientId() {
    const key = 'puzzle_client_id';
    let clientId = localStorage.getItem(key);
    if (!clientId) {
      clientId = 'web-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(key, clientId);
    }
    return clientId;
  }

  // 创建游戏
  async createGame(imageSource, gridSize, modifiers) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/puzzle/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageSource,
          gridSize,
          modifiers,
          clientId: this.clientId
        })
      });

      const result = await response.json();
      if (result.success) {
        this.currentGame = result.data;
        return result.data;
      } else {
        throw new Error(result.error || '创建游戏失败');
      }
    } catch (error) {
      console.error('创建游戏失败:', error);
      throw error;
    }
  }

  // 获取游戏状态
  async getGameState(gameId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/puzzle/games/${gameId}`);
      const result = await response.json();

      if (result.success) {
        this.currentGame = result.data;
        return result.data;
      } else {
        throw new Error(result.error || '获取游戏状态失败');
      }
    } catch (error) {
      console.error('获取游戏状态失败:', error);
      throw error;
    }
  }

  // 执行动作
  async executeAction(action, payload) {
    if (!this.currentGame) {
      throw new Error('没有活动的游戏');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/puzzle/games/${this.currentGame.gameId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload,
          clientId: this.clientId
        })
      });

      const result = await response.json();
      if (result.success) {
        this.currentGame = result.data;
        return result.data;
      } else {
        throw new Error(result.error || '执行动作失败');
      }
    } catch (error) {
      console.error('执行动作失败:', error);
      throw error;
    }
  }

  // 从托盘放置碎片
  async placeFromTray(pieceId, targetIndex) {
    return this.executeAction('place_from_tray', { pieceId, targetIndex });
  }

  // 移动格子中的碎片
  async moveCell(sourceIndex, targetIndex) {
    return this.executeAction('move_cell', { sourceIndex, targetIndex });
  }

  // 旋转碎片
  async rotatePiece(pieceId) {
    return this.executeAction('rotate_piece', { pieceId });
  }

  // 重新打乱
  async shuffle() {
    return this.executeAction('shuffle', {});
  }

  // 撤销
  async undo() {
    return this.executeAction('undo', {});
  }

  // 自动完成
  async solve() {
    return this.executeAction('solve', {});
  }

  // 触发捣蛋鬼
  async triggerTrickster() {
    return this.executeAction('trigger_trickster', {});
  }
}

// 暴露到全局
window.PuzzleClient = PuzzleClient;
