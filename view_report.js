import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

console.log('=== 查看最新生成的报告 ===\n');

// 获取最新的报告
const latestReport = store.db.prepare(`
  SELECT * FROM report_logs
  ORDER BY created_at DESC
  LIMIT 1
`).get();

if (latestReport) {
  console.log('客户端ID:', latestReport.client_id);
  console.log('游戏ID:', latestReport.game_id);
  console.log('图片来源:', latestReport.image_source);
  console.log('生成时间:', new Date(latestReport.created_at * 1000).toLocaleString('zh-CN'));
  console.log('\n--- AI 提示词（包含近期行为摘要）---');
  console.log(latestReport.prompt_text);
  console.log('\n--- AI 生成的报告 ---');
  console.log(latestReport.report_text);
} else {
  console.log('没有找到报告记录');
}

store.close();
