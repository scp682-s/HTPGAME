import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'behavior_analytics.db');
const db = new Database(dbPath);

console.log('开始清理管理员数据...');

// 1. 先删除所有班级数据（因为有外键约束）
db.prepare('DELETE FROM classes').run();
console.log('✓ 已删除所有班级数据');

// 2. 删除所有管理员账号
db.prepare('DELETE FROM admin_accounts').run();
console.log('✓ 已删除所有管理员账号');

// 3. 创建唯一的 admin 账号
const now = Date.now() / 1000;
db.prepare(`
  INSERT INTO admin_accounts (username, password, teacher_name, created_at)
  VALUES (?, ?, ?, ?)
`).run('admin', '123456', '管理员', now);
console.log('✓ 已创建 admin 账号 (用户名: admin, 密码: 123456, 老师名: 管理员)');

// 4. 为 admin 创建一个默认班级
const adminId = db.prepare('SELECT id FROM admin_accounts WHERE username = ?').get('admin').id;
db.prepare(`
  INSERT INTO classes (teacher_id, class_number, created_at)
  VALUES (?, ?, ?)
`).run(adminId, '1班', now);
console.log('✓ 已为 admin 创建默认班级: 1班');

// 5. 验证结果
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_accounts').get().count;
const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
const teachers = db.prepare('SELECT id, username, teacher_name FROM admin_accounts').all();

console.log('\n=== 清理完成 ===');
console.log(`管理员账号数量: ${adminCount}`);
console.log(`班级数量: ${classCount}`);
console.log('\n管理员列表:');
teachers.forEach(t => {
  console.log(`  ID: ${t.id}, 用户名: ${t.username}, 老师名: ${t.teacher_name}`);
});

db.close();
console.log('\n数据库已关闭');
