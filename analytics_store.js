import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * 归一化 client_id，确保可用于统计分组
 */
function normalizeClientId(rawClientId) {
  if (typeof rawClientId !== 'string') return 'anonymous';
  let cleaned = rawClientId.trim();
  if (!cleaned) return 'anonymous';
  cleaned = cleaned.replace(/[^a-zA-Z0-9._:-]/g, '_');
  if (cleaned.length > 128) cleaned = cleaned.substring(0, 128);
  return cleaned || 'anonymous';
}

/**
 * 解析完成时间为秒数
 */
function parseCompletionTimeToSeconds(value) {
  if (typeof value === 'number') return Math.max(0, Math.floor(value));
  if (typeof value !== 'string') return null;

  const txt = value.trim();
  if (!txt) return null;

  // 支持 mm:ss 或 hh:mm:ss
  const parts = txt.split(':');
  if (!parts.every(p => /^\d+$/.test(p))) return null;

  if (parts.length === 2) {
    const [mm, ss] = parts.map(Number);
    return Math.max(0, mm * 60 + ss);
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts.map(Number);
    return Math.max(0, hh * 3600 + mm * 60 + ss);
  }
  return null;
}

/**
 * SQLite 行为分析存储
 */
class AnalyticsStore {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this._ensureParentDir();
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this._initDb();
  }

  _ensureParentDir() {
    const parentDir = path.dirname(this.dbPath);
    if (parentDir && !fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  _initDb() {
    // 创建 users 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        client_id TEXT PRIMARY KEY,
        first_seen REAL NOT NULL,
        last_seen REAL NOT NULL
      )
    `);

    // 创建 game_sessions 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        image_source TEXT,
        grid_size INTEGER,
        modifiers_json TEXT,
        started_at REAL,
        ended_at REAL,
        game_state TEXT,
        move_count INTEGER DEFAULT 0,
        progress REAL DEFAULT 0,
        completion_time_seconds INTEGER,
        piece_order_json TEXT,
        time_intervals_json TEXT,
        modification_count INTEGER DEFAULT 0,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_game_sessions_client_updated
      ON game_sessions(client_id, updated_at DESC)
    `);

    // 创建 action_logs 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload_json TEXT,
        move_count INTEGER,
        progress REAL,
        game_state TEXT,
        elapsed_seconds INTEGER,
        created_at REAL NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_action_logs_client_time
      ON action_logs(client_id, created_at DESC)
    `);

    // 创建 report_logs 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS report_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        game_id TEXT,
        image_source TEXT,
        prompt_text TEXT,
        report_text TEXT,
        is_deleted INTEGER DEFAULT 0,
        created_at REAL NOT NULL
      )
    `);

    // 为已存在的表添加 is_deleted 字段（如果不存在）
    try {
      this.db.exec(`ALTER TABLE report_logs ADD COLUMN is_deleted INTEGER DEFAULT 0`);
    } catch (e) {
      // 字段已存在，忽略错误
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_report_logs_client_time
      ON report_logs(client_id, created_at DESC)
    `);

    // 创建 healing_sessions 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS healing_sessions (
        session_id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        report_id INTEGER,
        report_content TEXT,
        question_count INTEGER DEFAULT 0,
        user_name TEXT,
        user_student_id TEXT,
        is_anonymous INTEGER DEFAULT 1,
        is_deleted INTEGER DEFAULT 0,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_healing_sessions_client
      ON healing_sessions(client_id, created_at DESC)
    `);

    // 创建 healing_messages 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS healing_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at REAL NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_healing_messages_session
      ON healing_messages(session_id, created_at ASC)
    `);
  }

  /**
   * 更新或插入用户记录
   */
  upsertUser(clientId) {
    const normalized = normalizeClientId(clientId);
    const now = Date.now() / 1000;

    const existing = this.db.prepare('SELECT * FROM users WHERE client_id = ?').get(normalized);

    if (existing) {
      this.db.prepare('UPDATE users SET last_seen = ? WHERE client_id = ?').run(now, normalized);
    } else {
      this.db.prepare('INSERT INTO users (client_id, first_seen, last_seen) VALUES (?, ?, ?)').run(normalized, now, now);
    }
  }

  /**
   * 更新或插入游戏会话
   */
  upsertGameSession(data) {
    const normalized = normalizeClientId(data.clientId);
    const now = Date.now() / 1000;

    const existing = this.db.prepare('SELECT * FROM game_sessions WHERE game_id = ?').get(data.gameId);

    const sessionData = {
      game_id: data.gameId,
      client_id: normalized,
      image_source: data.imageSource || null,
      grid_size: data.gridSize || null,
      modifiers_json: data.modifiers ? JSON.stringify(data.modifiers) : null,
      started_at: data.startedAt || null,
      ended_at: data.endedAt || null,
      game_state: data.gameState || 'playing',
      move_count: data.moveCount || 0,
      progress: data.progress || 0,
      completion_time_seconds: data.completionTimeSeconds || null,
      piece_order_json: data.pieceOrder ? JSON.stringify(data.pieceOrder) : null,
      time_intervals_json: data.timeIntervals ? JSON.stringify(data.timeIntervals) : null,
      modification_count: data.modificationCount || 0,
      updated_at: now
    };

    if (existing) {
      const updateStmt = this.db.prepare(`
        UPDATE game_sessions SET
          client_id = ?,
          image_source = ?,
          grid_size = ?,
          modifiers_json = ?,
          started_at = ?,
          ended_at = ?,
          game_state = ?,
          move_count = ?,
          progress = ?,
          completion_time_seconds = ?,
          piece_order_json = ?,
          time_intervals_json = ?,
          modification_count = ?,
          updated_at = ?
        WHERE game_id = ?
      `);
      updateStmt.run(
        sessionData.client_id,
        sessionData.image_source,
        sessionData.grid_size,
        sessionData.modifiers_json,
        sessionData.started_at,
        sessionData.ended_at,
        sessionData.game_state,
        sessionData.move_count,
        sessionData.progress,
        sessionData.completion_time_seconds,
        sessionData.piece_order_json,
        sessionData.time_intervals_json,
        sessionData.modification_count,
        sessionData.updated_at,
        data.gameId
      );
    } else {
      const insertStmt = this.db.prepare(`
        INSERT INTO game_sessions (
          game_id, client_id, image_source, grid_size, modifiers_json,
          started_at, ended_at, game_state, move_count, progress,
          completion_time_seconds, piece_order_json, time_intervals_json,
          modification_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(
        sessionData.game_id,
        sessionData.client_id,
        sessionData.image_source,
        sessionData.grid_size,
        sessionData.modifiers_json,
        sessionData.started_at,
        sessionData.ended_at,
        sessionData.game_state,
        sessionData.move_count,
        sessionData.progress,
        sessionData.completion_time_seconds,
        sessionData.piece_order_json,
        sessionData.time_intervals_json,
        sessionData.modification_count,
        now,
        sessionData.updated_at
      );
    }

    this.upsertUser(normalized);
  }

  /**
   * 记录动作日志
   */
  logAction(data) {
    const normalized = normalizeClientId(data.clientId);
    const now = Date.now() / 1000;

    const insertStmt = this.db.prepare(`
      INSERT INTO action_logs (
        game_id, client_id, action, payload_json, move_count,
        progress, game_state, elapsed_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      data.gameId,
      normalized,
      data.action,
      data.payload ? JSON.stringify(data.payload) : null,
      data.moveCount || null,
      data.progress || null,
      data.gameState || null,
      data.elapsedSeconds || null,
      now
    );

    this.upsertUser(normalized);
  }

  /**
   * 保存报告日志
   */
  saveReport(data) {
    const normalized = normalizeClientId(data.clientId);
    const now = Date.now() / 1000;

    const insertStmt = this.db.prepare(`
      INSERT INTO report_logs (
        client_id, game_id, image_source, prompt_text, report_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      normalized,
      data.gameId || null,
      data.imageSource || null,
      data.promptText || null,
      data.reportText || null,
      now
    );

    this.upsertUser(normalized);
  }

  /**
   * 获取用户近期游戏会话（用于生成行为摘要）
   */
  getRecentSessions(clientId, days = 14, limit = 12) {
    const normalized = normalizeClientId(clientId);
    const cutoffTime = Date.now() / 1000 - (days * 24 * 3600);

    const stmt = this.db.prepare(`
      SELECT * FROM game_sessions
      WHERE client_id = ? AND updated_at >= ?
      ORDER BY updated_at DESC
      LIMIT ?
    `);

    return stmt.all(normalized, cutoffTime, limit);
  }

  /**
   * 获取用户近期动作日志
   */
  getRecentActions(clientId, days = 14, limit = 500) {
    const normalized = normalizeClientId(clientId);
    const cutoffTime = Date.now() / 1000 - (days * 24 * 3600);

    const stmt = this.db.prepare(`
      SELECT * FROM action_logs
      WHERE client_id = ? AND created_at >= ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(normalized, cutoffTime, limit);
  }

  /**
   * 构建近期行为摘要（用于增强 AI 提示词）
   */
  buildRecentBehaviorPrompt(clientId, days = 14, maxSessions = 12) {
    const sessions = this.getRecentSessions(clientId, days, maxSessions);

    if (sessions.length === 0) {
      return '【近期行为数据】\n暂无历史数据。';
    }

    const completedSessions = sessions.filter(s => s.game_state === 'completed');
    const totalSessions = sessions.length;
    const completedCount = completedSessions.length;

    if (completedCount === 0) {
      return `【近期行为数据】\n近 ${days} 天内共 ${totalSessions} 局游戏，但尚未完成任何一局。`;
    }

    // 统计数据
    const times = completedSessions.map(s => s.completion_time_seconds).filter(t => t != null);
    const moves = completedSessions.map(s => s.move_count).filter(m => m != null);
    const modifications = completedSessions.map(s => s.modification_count).filter(m => m != null);

    const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    const avgMoves = moves.length > 0 ? Math.round(moves.reduce((a, b) => a + b, 0) / moves.length) : null;
    const avgMods = modifications.length > 0 ? Math.round(modifications.reduce((a, b) => a + b, 0) / modifications.length) : null;

    // 计算中位数
    const median = (arr) => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };

    const medianTime = median(times);

    // 时间间隔分析
    let hesitationRate = null;
    const allIntervals = [];
    completedSessions.forEach(s => {
      if (s.time_intervals_json) {
        try {
          const intervals = JSON.parse(s.time_intervals_json);
          allIntervals.push(...intervals);
        } catch (e) {}
      }
    });

    if (allIntervals.length > 0) {
      const hesitationCount = allIntervals.filter(i => i >= 4).length;
      hesitationRate = Math.round((hesitationCount / allIntervals.length) * 100);
    }

    // 构建摘要文本
    let summary = `【近期行为数据摘要】\n`;
    summary += `统计窗口：近 ${days} 天，共 ${totalSessions} 局游戏，完成 ${completedCount} 局\n\n`;

    if (avgTime) summary += `平均用时：${Math.floor(avgTime / 60)}分${avgTime % 60}秒\n`;
    if (medianTime) summary += `中位用时：${Math.floor(medianTime / 60)}分${Math.round(medianTime % 60)}秒\n`;
    if (avgMoves) summary += `平均步数：${avgMoves} 步\n`;
    if (avgMods) summary += `平均修改次数：${avgMods} 次\n`;
    if (hesitationRate !== null) summary += `高犹豫动作占比：${hesitationRate}%（间隔≥4秒）\n`;

    // 难度分布
    const difficulties = completedSessions.map(s => s.grid_size).filter(g => g != null);
    if (difficulties.length > 0) {
      const diffCount = {};
      difficulties.forEach(d => diffCount[d] = (diffCount[d] || 0) + 1);
      const mostCommon = Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0];
      summary += `常用难度：${mostCommon[0]}x${mostCommon[0]}（${mostCommon[1]}次）\n`;
    }

    return summary;
  }

  /**
   * 获取用户的报告列表（只返回未删除的）
   */
  getReportsByClient(clientId, limit = 50) {
    const normalized = normalizeClientId(clientId);
    const stmt = this.db.prepare(`
      SELECT
        id,
        game_id,
        image_source,
        report_text,
        created_at
      FROM report_logs
      WHERE client_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const reports = stmt.all(normalized, limit);
    return reports.map(r => ({
      id: r.id,
      game_id: r.game_id,
      image_source: r.image_source,
      reportText: r.report_text,
      created_at: r.created_at,
      createdAtFormatted: new Date(r.created_at * 1000).toLocaleString('zh-CN')
    }));
  }

  /**
   * 创建心理疗愈会话
   */
  createHealingSession(sessionId, clientId, reportId, reportContent) {
    const normalized = normalizeClientId(clientId);
    const now = Date.now() / 1000;

    const stmt = this.db.prepare(`
      INSERT INTO healing_sessions (
        session_id, client_id, report_id, report_content,
        question_count, is_anonymous, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 0, 1, ?, ?)
    `);

    stmt.run(sessionId, normalized, reportId, reportContent, now, now);
    this.upsertUser(normalized);
  }

  /**
   * 添加疗愈消息
   */
  addHealingMessage(sessionId, role, content) {
    const now = Date.now() / 1000;

    const stmt = this.db.prepare(`
      INSERT INTO healing_messages (session_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(sessionId, role, content, now);

    // 更新会话的 updated_at
    this.db.prepare('UPDATE healing_sessions SET updated_at = ? WHERE session_id = ?')
      .run(now, sessionId);
  }

  /**
   * 获取疗愈消息历史
   */
  getHealingMessages(sessionId) {
    const stmt = this.db.prepare(`
      SELECT role, content, created_at
      FROM healing_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `);

    return stmt.all(sessionId);
  }

  /**
   * 获取问题计数
   */
  getQuestionCount(sessionId) {
    const stmt = this.db.prepare('SELECT question_count FROM healing_sessions WHERE session_id = ?');
    const result = stmt.get(sessionId);
    return result ? result.question_count : 0;
  }

  /**
   * 增加问题计数
   */
  incrementQuestionCount(sessionId) {
    const now = Date.now() / 1000;
    const stmt = this.db.prepare(`
      UPDATE healing_sessions
      SET question_count = question_count + 1, updated_at = ?
      WHERE session_id = ?
    `);
    stmt.run(now, sessionId);

    return this.getQuestionCount(sessionId);
  }

  /**
   * 更新用户信息
   */
  updateHealingUserInfo(sessionId, userName, userStudentId, isAnonymous) {
    const now = Date.now() / 1000;
    const stmt = this.db.prepare(`
      UPDATE healing_sessions
      SET user_name = ?, user_student_id = ?, is_anonymous = ?, updated_at = ?
      WHERE session_id = ?
    `);

    stmt.run(userName, userStudentId, isAnonymous ? 1 : 0, now, sessionId);
  }

  /**
   * 获取所有疗愈数据（用于管理员导出）
   */
  getAllHealingData() {
    const stmt = this.db.prepare(`
      SELECT
        hs.session_id,
        hs.client_id,
        hs.report_id,
        hs.report_content,
        hs.question_count,
        hs.user_name,
        hs.user_student_id,
        hs.is_anonymous,
        hs.created_at,
        hs.updated_at
      FROM healing_sessions hs
      WHERE hs.is_deleted = 0
      ORDER BY hs.created_at DESC
    `);

    const sessions = stmt.all();

    // 获取每个会话的用户问题
    return sessions.map(session => {
      const messagesStmt = this.db.prepare(`
        SELECT content FROM healing_messages
        WHERE session_id = ? AND role = 'user'
        ORDER BY created_at ASC
      `);
      const messages = messagesStmt.all(session.session_id);

      return {
        ...session,
        questions: messages.map(m => m.content)
      };
    });
  }

  /**
   * 软删除报告（标记为已删除，但保留数据供管理员导出）
   */
  softDeleteReport(reportId) {
    const stmt = this.db.prepare(`
      UPDATE report_logs
      SET is_deleted = 1
      WHERE id = ?
    `);
    stmt.run(reportId);
  }

  /**
   * 关闭数据库连接
   */
  close() {
    this.db.close();
  }
}

export { AnalyticsStore, normalizeClientId, parseCompletionTimeToSeconds };
