import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyticsStore = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

// 查看所有报告
const allReports = analyticsStore.db.prepare(`
  SELECT client_id, id, substr(report_text, 1, 50) as preview,
         datetime(created_at, 'unixepoch', 'localtime') as time
  FROM report_logs
  ORDER BY created_at DESC
  LIMIT 10
`).all();

console.log('数据库中的报告记录：');
console.log(allReports);

// 查看所有不同的 client_id
const clientIds = analyticsStore.db.prepare(`
  SELECT DISTINCT client_id FROM report_logs
`).all();

console.log('\n所有 client_id：');
console.log(clientIds);

analyticsStore.close();
