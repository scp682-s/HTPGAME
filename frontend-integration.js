// frontend-integration.js

// 逐字显示函数
function typewriterEffect(element, text, speed = 50) {
  element.textContent = '';
  let index = 0;

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

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

  const modal = document.getElementById('reportModal');
  const reportText = document.getElementById('reportText');

  if (!modal || !reportText) {
    alert('报告弹窗未找到');
    return;
  }

  // 先显示弹窗和加载提示
  reportText.textContent = '正在生成心理分析报告...';
  modal.style.display = 'flex';

  try {
    const response = await fetch(window.API_BASE_URL + '/api/generate_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.success) {
      // 逐字显示报告
      await typewriterEffect(reportText, result.report, 50);
    } else {
      reportText.textContent = '生成报告失败：' + result.error;
    }
  } catch (err) {
    reportText.textContent = '网络错误：' + err.message;
  }
}

// 暴露给全局
window.generatePsychologyReport = generatePsychologyReport;
