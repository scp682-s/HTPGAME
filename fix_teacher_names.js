import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyticsStore = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

console.log('开始修复数据...\n');

// 更新已存在账号的 teacher_name
const updates = [
  { username: 'admin', teacherName: '管理员' },
  { username: 'teacher1', teacherName: '张老师' },
  { username: 'teacher2', teacherName: '李老师' },
];

updates.forEach(({ username, teacherName }) => {
  try {
    analyticsStore.db.prepare(`
      UPDATE admin_accounts
      SET teacher_name = ?
      WHERE username = ?
    `).run(teacherName, username);
    console.log(`✓ 更新成功: ${username} -> ${teacherName}`);
  } catch (error) {
    console.error(`✗ 更新失败: ${username} - ${error.message}`);
  }
});

console.log('\n数据修复完成！');

analyticsStore.close();
