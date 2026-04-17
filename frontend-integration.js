// frontend-integration.js
async function generatePsychologyReport() {
  const game = window.puzzleGame;
  if (!game || game.gameState !== 'completed') {
    alert('请先完成一局游戏');
    return;
  }

  const timeSeconds = Math.floor((Date.now() - game.startTime) / 1000);
  const data = {
    time_seconds: timeSeconds,
    moves: game.moveCount,
    grid_size: game.gridSize,
    modifiers: {
      rotation: game.modifiers.rotation || false,
      hidden: game.modifiers.hidden || false,
      trickster: game.modifiers.trickster || false
    },
    image_name: document.getElementById('previewImage')?.src.split('/').pop() || '用户图片'
  };

  try {
    const response = await fetch(window.API_BASE_URL + '/api/generate_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      // 显示报告
      const modal = document.getElementById('reportModal');
      const reportText = document.getElementById('reportText');
      if (modal && reportText) {
        reportText.innerText = result.report;
        modal.style.display = 'flex';
      } else {
        alert('📊 心理分析报告：\n\n' + result.report);
      }
    } else {
      alert('生成报告失败：' + result.error);
    }
  } catch (err) {
    alert('网络错误：' + err.message);
  }
}

// 暴露给全局
window.generatePsychologyReport = generatePsychologyReport;
