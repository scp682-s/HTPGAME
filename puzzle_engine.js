import crypto from 'crypto';

/**
 * 业务校验异常
 */
class PuzzleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PuzzleError';
  }
}

/**
 * 拼图碎片
 */
class Piece {
  constructor(pieceId, originalRow, originalCol) {
    this.pieceId = pieceId;
    this.originalRow = originalRow;
    this.originalCol = originalCol;
  }
}

/**
 * 拼图指标（用于心理分析）
 */
class PuzzleMetrics {
  constructor() {
    this.pieceOrder = [];
    this.placedOnce = new Set();
    this.actionTimestamps = [];
    this.timeIntervals = [];
    this.modificationCount = 0;
  }
}

/**
 * 拼图游戏状态
 */
class PuzzleGameState {
  constructor(data) {
    this.gameId = data.gameId;
    this.imageSource = data.imageSource;
    this.gridSize = data.gridSize;
    this.modifiers = data.modifiers;
    this.pieces = data.pieces;
    this.board = data.board;
    this.tray = data.tray;
    this.hiddenPool = data.hiddenPool;
    this.rotations = data.rotations;
    this.startedAt = data.startedAt;
    this.gameState = data.gameState || 'playing';
    this.moveCount = data.moveCount || 0;
    this.tricksterTriggered = data.tricksterTriggered || false;
    this.history = data.history || [];
    this.metrics = data.metrics || new PuzzleMetrics();
    this.lastMessage = data.lastMessage || '点按碎片，再点按格子放置';
    this.lastActiveAt = data.lastActiveAt || Date.now();
  }
}

/**
 * 服务端拼图引擎：前端只渲染，状态与规则统一在后端维护
 */
class PuzzleEngine {
  constructor(maxGames = 200, ttlSeconds = 7200, maxUndo = 300) {
    this.maxGames = maxGames;
    this.ttlSeconds = ttlSeconds;
    this.maxUndo = maxUndo;
    this.games = new Map();
  }

  // -------------------- 对外方法 --------------------

  createGame(imageSource, gridSize, modifiers) {
    this._cleanupExpiredGames();
    if (this.games.size >= this.maxGames) {
      this._evictOldestGame();
    }

    const size = this._validateGridSize(gridSize);
    const normalizedModifiers = this._normalizeModifiers(modifiers);

    const pieces = this._buildPieces(size);
    const pieceIds = Object.keys(pieces);
    const shuffled = [...pieceIds];
    this._shuffle(shuffled);

    const rotationCount = size >= 6 ? 3 : 1;
    let hiddenCount = 1;
    if (size === 4) hiddenCount = 1;
    else if (size === 5) hiddenCount = 3;
    else if (size >= 6) hiddenCount = 4;

    const rotations = new Set();
    const hiddenPool = new Set();

    if (normalizedModifiers.rotation) {
      const selected = this._sample(shuffled, Math.min(rotationCount, shuffled.length));
      selected.forEach(id => rotations.add(id));
    }

    if (normalizedModifiers.hidden) {
      const candidates = shuffled.filter(id => !rotations.has(id));
      const maxHidden = Math.max(0, candidates.length - 1);
      const selected = this._sample(candidates, Math.min(hiddenCount, maxHidden));
      selected.forEach(id => hiddenPool.add(id));
    }

    const tray = shuffled.filter(id => !hiddenPool.has(id));
    const board = new Array(size * size).fill(null);

    const gameId = crypto.randomUUID();
    const state = new PuzzleGameState({
      gameId,
      imageSource: imageSource || '',
      gridSize: size,
      modifiers: normalizedModifiers,
      pieces,
      board,
      tray,
      hiddenPool,
      rotations,
      startedAt: Date.now()
    });

    this._validateState(state);
    this.games.set(gameId, state);
    return this._serializeState(state, '拼图已生成，开始挑战吧');
  }

  getGameState(gameId) {
    const state = this._getGame(gameId);
    this._touch(state);
    this._validateState(state);
    return this._serializeState(state);
  }

  applyAction(gameId, action, payload) {
    const state = this._getGame(gameId);
    this._touch(state);

    const dispatch = {
      place_from_tray: this._actionPlaceFromTray.bind(this),
      move_cell: this._actionMoveCell.bind(this),
      rotate_piece: this._actionRotatePiece.bind(this),
      shuffle: this._actionShuffle.bind(this),
      undo: this._actionUndo.bind(this),
      solve: this._actionSolve.bind(this),
      trigger_trickster: this._actionTriggerTrickster.bind(this)
    };

    if (!dispatch[action]) {
      throw new PuzzleError(`不支持的动作: ${action}`);
    }

    const resultMessage = dispatch[action](state, payload);
    this._validateState(state);
    return this._serializeState(state, resultMessage);
  }

  // -------------------- 动作实现 --------------------

  _actionPlaceFromTray(state, payload) {
    this._ensurePlaying(state);
    const pieceId = this._requirePieceId(state, payload.pieceId);
    const targetIndex = this._validateCellIndex(state, payload.targetIndex);

    const [location] = this._locatePiece(state, pieceId);
    if (location !== 'tray') {
      throw new PuzzleError('只能放置托盘中的碎片');
    }

    this._pushHistory(state);
    const targetPiece = state.board[targetIndex];

    const trayIndex = state.tray.indexOf(pieceId);
    state.tray.splice(trayIndex, 1);

    if (targetPiece) {
      state.tray.unshift(targetPiece);
      state.metrics.modificationCount++;
    }

    state.board[targetIndex] = pieceId;
    this._recordPieceOrder(state, pieceId);
    this._recordMove(state);

    let message = '碎片已放置';
    message = this._postActionUpdate(state, message);
    return message;
  }

  _actionMoveCell(state, payload) {
    this._ensurePlaying(state);
    const sourceIndex = this._validateCellIndex(state, payload.sourceIndex);
    const targetIndex = this._validateCellIndex(state, payload.targetIndex);

    if (sourceIndex === targetIndex) {
      throw new PuzzleError('源格子与目标格子不能相同');
    }

    const sourcePiece = state.board[sourceIndex];
    if (!sourcePiece) {
      throw new PuzzleError('源格子没有可移动碎片');
    }

    this._pushHistory(state);
    const targetPiece = state.board[targetIndex];

    let message;
    if (targetPiece) {
      [state.board[sourceIndex], state.board[targetIndex]] = [targetPiece, sourcePiece];
      message = '格子碎片已交换';
    } else {
      state.board[targetIndex] = sourcePiece;
      state.board[sourceIndex] = null;
      message = '碎片已移动到目标格子';
    }

    state.metrics.modificationCount++;
    this._recordMove(state);
    message = this._postActionUpdate(state, message);
    return message;
  }

  _actionRotatePiece(state, payload) {
    this._ensurePlaying(state);
    if (!state.modifiers.rotation) {
      throw new PuzzleError('当前难度未启用翻转');
    }

    const pieceId = this._requirePieceId(state, payload.pieceId);
    const [location] = this._locatePiece(state, pieceId);
    if (location !== 'tray' && location !== 'board') {
      throw new PuzzleError('隐藏碎片不能翻转');
    }

    this._pushHistory(state);
    let message;
    if (state.rotations.has(pieceId)) {
      state.rotations.delete(pieceId);
      message = '碎片已恢复正向';
    } else {
      state.rotations.add(pieceId);
      message = '碎片已翻转 180°';
    }

    state.metrics.modificationCount++;
    this._recordMove(state);
    message = this._postActionUpdate(state, message);
    return message;
  }

  _actionShuffle(state) {
    this._ensurePlayingOrCompleted(state);
    this._pushHistory(state);

    const visibleIds = Object.keys(state.pieces).filter(id => !state.hiddenPool.has(id));
    this._shuffle(visibleIds);
    state.board = new Array(state.board.length).fill(null);
    state.tray = visibleIds;

    state.rotations.clear();
    if (state.modifiers.rotation) {
      const rotationCount = state.gridSize >= 6 ? 3 : 1;
      const selected = this._sample(state.tray, Math.min(rotationCount, state.tray.length));
      selected.forEach(id => state.rotations.add(id));
    }

    state.moveCount = 0;
    state.startedAt = Date.now();
    state.gameState = 'playing';
    state.tricksterTriggered = false;
    state.metrics = new PuzzleMetrics();
    state.lastMessage = '碎片已打乱，重新开始吧';
    return state.lastMessage;
  }

  _actionUndo(state) {
    if (state.history.length === 0) {
      throw new PuzzleError('当前没有可回退的操作');
    }

    const snapshot = state.history.pop();
    state.board = snapshot.board;
    state.tray = snapshot.tray;
    state.hiddenPool = snapshot.hiddenPool;
    state.rotations = snapshot.rotations;
    state.startedAt = snapshot.startedAt;
    state.gameState = snapshot.gameState;
    state.moveCount = snapshot.moveCount;
    state.tricksterTriggered = snapshot.tricksterTriggered;
    state.metrics = snapshot.metrics;
    state.lastMessage = '已回退一步';
    return state.lastMessage;
  }

  _actionSolve(state) {
    this._ensurePlayingOrCompleted(state);
    this._pushHistory(state);

    const solvedBoard = [];
    for (let row = 0; row < state.gridSize; row++) {
      for (let col = 0; col < state.gridSize; col++) {
        solvedBoard.push(`p-${row}-${col}`);
      }
    }

    state.board = solvedBoard;
    state.tray = [];
    state.hiddenPool.clear();
    state.rotations.clear();
    state.gameState = 'completed';
    state.lastMessage = '已自动完成拼图';
    return state.lastMessage;
  }

  _actionTriggerTrickster(state) {
    this._ensurePlaying(state);
    if (!state.modifiers.trickster) {
      throw new PuzzleError('当前难度未启用捣蛋鬼');
    }
    if (state.tricksterTriggered) {
      return '捣蛋鬼已触发过，本局不会再次触发';
    }

    this._pushHistory(state);
    const movedCount = this._triggerTrickster(state);
    if (movedCount === 0) {
      return '捣蛋鬼没找到可捣乱的目标';
    }

    state.metrics.modificationCount += movedCount;
    state.lastMessage = `😈 捣蛋鬼移动了 ${movedCount} 个碎片`;
    return state.lastMessage;
  }

  // -------------------- 核心规则 --------------------

  _postActionUpdate(state, message) {
    const revealMessage = this._revealHiddenPiecesIfNeeded(state);
    const tricksterMessage = this._maybeTriggerTrickster(state);

    const [correctCount, totalCells] = this._countCorrectCells(state);
    if (correctCount === totalCells && state.tray.length === 0 && state.hiddenPool.size === 0) {
      state.gameState = 'completed';
      return '拼图完成，恭喜通关';
    }

    const piecesInBoard = state.board.filter(pid => pid !== null).length;
    let baseMessage = piecesInBoard === 0 && state.tray.length > 0 ? '请先放置一个碎片' : message;

    if (revealMessage) baseMessage = `${baseMessage}，${revealMessage}`;
    if (tricksterMessage) baseMessage = `${baseMessage}，${tricksterMessage}`;

    state.lastMessage = baseMessage;
    return baseMessage;
  }

  _maybeTriggerTrickster(state) {
    if (!state.modifiers.trickster) return '';
    if (state.tricksterTriggered) return '';
    if (state.moveCount < 5) return '';

    const placedIndices = state.board.map((pid, idx) => pid !== null ? idx : -1).filter(idx => idx !== -1);
    if (placedIndices.length < 2) return '';

    const triggerProbability = 0.15;
    if (Math.random() > triggerProbability) return '';

    const movedCount = this._triggerTrickster(state);
    if (movedCount <= 0) return '';

    state.metrics.modificationCount += movedCount;
    return `😈 捣蛋鬼出手，随机移动了 ${movedCount} 个碎片`;
  }

  _triggerTrickster(state) {
    const placedIndices = state.board.map((pid, idx) => pid !== null ? idx : -1).filter(idx => idx !== -1);
    if (placedIndices.length < 2) return 0;

    let moveCount = state.gridSize >= 6 ? 5 : Math.floor(Math.random() * 3) + 1;
    moveCount = Math.min(moveCount, placedIndices.length);
    const selectedIndices = this._sample(placedIndices, moveCount);

    let moved = 0;
    for (const sourceIdx of selectedIndices) {
      const targetCandidates = placedIndices.filter(idx => idx !== sourceIdx);
      if (targetCandidates.length === 0) continue;
      const targetIdx = targetCandidates[Math.floor(Math.random() * targetCandidates.length)];
      [state.board[sourceIdx], state.board[targetIdx]] = [state.board[targetIdx], state.board[sourceIdx]];
      moved++;
    }

    if (moved > 0) {
      state.tricksterTriggered = true;
    }
    return moved;
  }

  _revealHiddenPiecesIfNeeded(state) {
    if (!state.modifiers.hidden) return '';
    if (state.hiddenPool.size === 0) return '';

    const totalCells = state.gridSize * state.gridSize;
    const visibleCells = totalCells - state.hiddenPool.size;
    const [correctCount] = this._countCorrectCells(state);
    const threshold = Math.max(1, visibleCells - 1);

    if (correctCount < threshold) return '';

    const revealed = Array.from(state.hiddenPool);
    this._shuffle(revealed);
    state.tray.push(...revealed);
    state.hiddenPool.clear();
    return '';
  }

  // -------------------- 状态校验 --------------------

  _validateState(state) {
    const totalCells = state.gridSize * state.gridSize;
    if (state.board.length !== totalCells) {
      throw new PuzzleError('棋盘尺寸异常');
    }

    const allPieceIds = new Set(Object.keys(state.pieces));
    const boardIds = state.board.filter(pid => pid !== null);
    const trayIds = state.tray;
    const hiddenIds = Array.from(state.hiddenPool);

    const seen = [...boardIds, ...trayIds, ...hiddenIds];
    const seenSet = new Set(seen);
    if (seen.length !== seenSet.size) {
      throw new PuzzleError('状态异常：碎片重复出现');
    }

    if (seenSet.size !== allPieceIds.size || ![...seenSet].every(id => allPieceIds.has(id))) {
      throw new PuzzleError('状态异常：碎片集合不一致');
    }

    for (const rotId of state.rotations) {
      if (!allPieceIds.has(rotId)) {
        throw new PuzzleError('状态异常：翻转集合含非法碎片');
      }
    }

    if (state.history.length > this.maxUndo) {
      throw new PuzzleError('状态异常：回退历史超过限制');
    }
  }

  // -------------------- 序列化 --------------------

  _serializeState(state, message = null) {
    if (message) {
      state.lastMessage = message;
    }

    const [correctCount, totalCells] = this._countCorrectCells(state);
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    const completionTime = this._formatElapsed(elapsedSeconds);

    return {
      gameId: state.gameId,
      imageSource: state.imageSource,
      gridSize: state.gridSize,
      modifiers: state.modifiers,
      gameState: state.gameState,
      moveCount: state.moveCount,
      elapsedSeconds,
      elapsedFormatted: completionTime,
      canUndo: state.history.length > 0,
      hiddenCount: state.hiddenPool.size,
      message: state.lastMessage,
      completion: {
        correctCount,
        total: totalCells,
        isCompleted: state.gameState === 'completed' && correctCount === totalCells && state.tray.length === 0 && state.hiddenPool.size === 0,
        progress: totalCells > 0 ? Math.round((correctCount / totalCells) * 100 * 100) / 100 : 0
      },
      board: state.board.map(pieceId => pieceId ? this._serializePiece(state, pieceId) : null),
      tray: state.tray.map(pieceId => this._serializePiece(state, pieceId)),
      metrics: {
        pieceOrder: state.metrics.pieceOrder,
        timeIntervals: state.metrics.timeIntervals,
        modificationCount: state.metrics.modificationCount,
        completionTime: state.gameState === 'completed' ? completionTime : null
      }
    };
  }

  _serializePiece(state, pieceId) {
    const piece = state.pieces[pieceId];
    return {
      id: piece.pieceId,
      originalRow: piece.originalRow,
      originalCol: piece.originalCol,
      rotated: state.rotations.has(pieceId)
    };
  }

  // -------------------- 工具方法 --------------------

  _recordPieceOrder(state, pieceId) {
    if (!state.metrics.placedOnce.has(pieceId)) {
      state.metrics.placedOnce.add(pieceId);
      state.metrics.pieceOrder.push(pieceId);
    }
  }

  _recordMove(state) {
    const now = Date.now();
    if (state.metrics.actionTimestamps.length > 0) {
      const interval = Math.round((now - state.metrics.actionTimestamps[state.metrics.actionTimestamps.length - 1]) / 10) / 100;
      state.metrics.timeIntervals.push(interval);
    }
    state.metrics.actionTimestamps.push(now);
    state.moveCount++;
  }

  _countCorrectCells(state) {
    const totalCells = state.gridSize * state.gridSize;
    let correct = 0;
    for (let idx = 0; idx < state.board.length; idx++) {
      const pieceId = state.board[idx];
      if (!pieceId) continue;
      const row = Math.floor(idx / state.gridSize);
      const col = idx % state.gridSize;
      const piece = state.pieces[pieceId];
      if (piece.originalRow === row && piece.originalCol === col && !state.rotations.has(pieceId)) {
        correct++;
      }
    }
    return [correct, totalCells];
  }

  _validateGridSize(gridSize) {
    const size = parseInt(gridSize);
    if (isNaN(size)) {
      throw new PuzzleError('难度必须是数字');
    }
    if (size < 2 || size > 6) {
      throw new PuzzleError('难度只支持 2 到 6');
    }
    return size;
  }

  _buildPieces(gridSize) {
    const pieces = {};
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pieceId = `p-${row}-${col}`;
        pieces[pieceId] = new Piece(pieceId, row, col);
      }
    }
    return pieces;
  }

  _normalizeModifiers(modifiers) {
    const raw = modifiers && typeof modifiers === 'object' ? modifiers : {};
    return {
      rotation: Boolean(raw.rotation),
      hidden: Boolean(raw.hidden),
      trickster: Boolean(raw.trickster)
    };
  }

  _validateCellIndex(state, cellIndex) {
    const idx = parseInt(cellIndex);
    if (isNaN(idx)) {
      throw new PuzzleError('格子索引必须是数字');
    }
    if (idx < 0 || idx >= state.board.length) {
      throw new PuzzleError('格子索引越界');
    }
    return idx;
  }

  _requirePieceId(state, pieceId) {
    if (typeof pieceId !== 'string' || !pieceId) {
      throw new PuzzleError('pieceId 不能为空');
    }
    if (!state.pieces[pieceId]) {
      throw new PuzzleError('pieceId 不存在');
    }
    return pieceId;
  }

  _locatePiece(state, pieceId) {
    if (state.hiddenPool.has(pieceId)) {
      return ['hidden', null];
    }
    const trayIndex = state.tray.indexOf(pieceId);
    if (trayIndex !== -1) {
      return ['tray', trayIndex];
    }
    const boardIndex = state.board.indexOf(pieceId);
    if (boardIndex !== -1) {
      return ['board', boardIndex];
    }
    throw new PuzzleError('碎片位置异常，未找到 pieceId');
  }

  _pushHistory(state) {
    const snapshot = {
      board: [...state.board],
      tray: [...state.tray],
      hiddenPool: new Set(state.hiddenPool),
      rotations: new Set(state.rotations),
      startedAt: state.startedAt,
      gameState: state.gameState,
      moveCount: state.moveCount,
      tricksterTriggered: state.tricksterTriggered,
      metrics: JSON.parse(JSON.stringify({
        pieceOrder: state.metrics.pieceOrder,
        placedOnce: Array.from(state.metrics.placedOnce),
        actionTimestamps: state.metrics.actionTimestamps,
        timeIntervals: state.metrics.timeIntervals,
        modificationCount: state.metrics.modificationCount
      }))
    };
    // 恢复 Set
    snapshot.metrics.placedOnce = new Set(snapshot.metrics.placedOnce);

    state.history.push(snapshot);
    if (state.history.length > this.maxUndo) {
      state.history.shift();
    }
  }

  _sample(data, count) {
    if (count <= 0 || data.length === 0) return [];
    if (count >= data.length) return [...data];
    const result = [];
    const copy = [...data];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  _ensurePlaying(state) {
    if (state.gameState !== 'playing') {
      throw new PuzzleError('当前局面不可操作，请重新开始或回退');
    }
  }

  _ensurePlayingOrCompleted(state) {
    if (state.gameState !== 'playing' && state.gameState !== 'completed') {
      throw new PuzzleError('当前局面不可操作');
    }
  }

  _formatElapsed(elapsedSeconds) {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  _touch(state) {
    state.lastActiveAt = Date.now();
  }

  _cleanupExpiredGames() {
    const now = Date.now();
    const expired = [];
    for (const [gameId, state] of this.games.entries()) {
      if (now - state.lastActiveAt > this.ttlSeconds * 1000) {
        expired.push(gameId);
      }
    }
    expired.forEach(gameId => this.games.delete(gameId));
  }

  _evictOldestGame() {
    if (this.games.size === 0) return;
    let oldestGameId = null;
    let oldestTime = Infinity;
    for (const [gameId, state] of this.games.entries()) {
      if (state.lastActiveAt < oldestTime) {
        oldestTime = state.lastActiveAt;
        oldestGameId = gameId;
      }
    }
    if (oldestGameId) {
      this.games.delete(oldestGameId);
    }
  }

  _getGame(gameId) {
    this._cleanupExpiredGames();
    const state = this.games.get(gameId);
    if (!state) {
      throw new PuzzleError('游戏不存在或已过期，请重新生成拼图');
    }
    return state;
  }
}

export { PuzzleEngine, PuzzleError };
