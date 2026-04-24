// 数据库适配器 - 支持 SQLite (本地) 和 Postgres (Vercel)
import { AnalyticsStore } from './analytics_store.js';

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  // 检查是否在 Vercel 环境
  if (process.env.VERCEL) {
    // Vercel 环境 - 使用内存模式或禁用数据库
    console.log('⚠️ Running on Vercel - Database features disabled');
    return createMockDatabase();
  } else {
    // 本地环境 - 使用 SQLite
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    dbInstance = new AnalyticsStore(
      path.join(__dirname, 'data', 'behavior_analytics.db')
    );
    return dbInstance;
  }
}

// 创建模拟数据库（Vercel 环境使用）
function createMockDatabase() {
  return {
    upsertUser: () => {},
    upsertGameSession: () => {},
    logAction: () => {},
    saveReport: () => {},
    getRecentSessions: () => [],
    getRecentActions: () => [],
    buildRecentBehaviorPrompt: () => '【近期行为数据】\n暂无历史数据。',
    getReportsByClient: () => [],
    createHealingSession: () => {},
    addHealingMessage: () => {},
    getHealingMessages: () => [],
    getQuestionCount: () => 0,
    incrementQuestionCount: () => 1,
    updateHealingUserInfo: () => {},
    getAllHealingData: () => [],
    close: () => {},
    db: {
      prepare: () => ({
        get: () => null,
        all: () => [],
        run: () => {}
      })
    }
  };
}
