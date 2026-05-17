import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化数据库
const analyticsStore = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

console.log('开始数据库迁移...\n');

try {
  // 添加 user_class 列到 healing_sessions 表
  analyticsStore.db.exec(`ALTER TABLE healing_sessions ADD COLUMN user_class TEXT`);
  console.log('✓ 成功添加 user_class 列到 healing_sessions 表');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('- user_class 列已存在，跳过');
  } else {
    console.error('✗ 添加 user_class 列失败:', error.message);
  }
}

console.log('\n数据库迁移完成！');

analyticsStore.close();
