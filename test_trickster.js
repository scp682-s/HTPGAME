import { PuzzleEngine } from './puzzle_engine.js';

console.log('=== 测试捣蛋鬼触发 ===\n');

const engine = new PuzzleEngine();

const gameState = engine.createGame('photo/1.png', 3, {
  rotation: false,
  hidden: false,
  trickster: true
});

console.log('游戏创建成功');
console.log('捣蛋鬼已启用:', gameState.modifiers.trickster);

console.log('\n开始放置碎片...');
for (let i = 0; i < 3; i++) {
  const piece = gameState.tray[i];
  const result = engine.applyAction(gameState.gameId, 'place_from_tray', {
    pieceId: piece.id,
    targetIndex: i
  });
  console.log(`第${i+1}步: ${result.message}`);
}

console.log('\n继续移动，测试捣蛋鬼触发...');
let triggered = false;
for (let i = 0; i < 30; i++) {
  const result = engine.applyAction(gameState.gameId, 'move_cell', {
    sourceIndex: 0,
    targetIndex: 1
  });

  console.log(`第${i+4}步: ${result.message}`);

  if (result.message.includes('捣蛋鬼')) {
    console.log('\n✅ 捣蛋鬼触发成功！');
    triggered = true;
    break;
  }
}

if (!triggered) {
  console.log('\n❌ 30次操作后捣蛋鬼未触发');
}

console.log('\n=== 测试完成 ===');
