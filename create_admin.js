import { AnalyticsStore } from './analytics_store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化数据库
const analyticsStore = new AnalyticsStore(
  path.join(__dirname, 'data', 'behavior_analytics.db')
);

// 创建测试管理员账号
const testAccounts = [
  { username: 'admin', password: '123456', teacherName: '管理员' },
  { username: 'teacher1', password: '123456', teacherName: '张老师' },
  { username: 'teacher2', password: '123456', teacherName: '李老师' },
  { username: 'teacher3', password: '123456', teacherName: '王老师' },
];

console.log('开始创建管理员账号...\n');

testAccounts.forEach(account => {
  try {
    analyticsStore.createAdminAccount(account.username, account.password, account.teacherName);
    console.log(`✓ 创建成功: ${account.username} (姓名: ${account.teacherName})`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log(`- 账号已存在: ${account.username}`);
    } else {
      console.error(`✗ 创建失败: ${account.username} - ${error.message}`);
    }
  }
});

console.log('\n管理员账号创建完成！');
console.log('\n可用账号:');
console.log('1. 账号: admin, 密码: 123456 (管理员)');
console.log('2. 账号: teacher1, 密码: 123456 (张老师)');
console.log('3. 账号: teacher2, 密码: 123456 (李老师)');
console.log('4. 账号: teacher3, 密码: 123456 (王老师)');

analyticsStore.close();
