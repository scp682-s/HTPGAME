import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyticsStore = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

console.log('=== 检查数据库数据 ===\n');

// 查看 healing_sessions 表的数据
const sessions = analyticsStore.db.prepare(`
  SELECT session_id, user_name, user_student_id, user_class, is_anonymous, created_at
  FROM healing_sessions
  WHERE is_deleted = 0
  ORDER BY created_at DESC
  LIMIT 10
`).all();

console.log('healing_sessions 表数据:');
console.table(sessions);

// 查看 classes 表的数据
const classes = analyticsStore.db.prepare(`
  SELECT * FROM classes
  ORDER BY created_at DESC
`).all();

console.log('\nclasses 表数据:');
console.table(classes);

// 查看 admin_accounts 表的数据
const admins = analyticsStore.db.prepare(`
  SELECT id, username, teacher_name FROM admin_accounts
`).all();

console.log('\nadmin_accounts 表数据:');
console.table(admins);

analyticsStore.close();
