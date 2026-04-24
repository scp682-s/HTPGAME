// frontend-integration.js

// 设置 API 基础 URL
window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : '';

// 报告历史记录管理
const ReportHistory = {
  storageKey: 'psychologyReports',
  unreadKey: 'unreadReports',

  // 获取所有报告
  getAll() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  },

  // 保存报告
  save(report) {
    const reports = this.getAll();
    const newReport = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      unread: true,
      ...report
    };
    reports.unshift(newReport);
    // 最多保存20条
    if (reports.length > 20) reports.pop();
    localStorage.setItem(this.storageKey, JSON.stringify(reports));
    this.updateUnreadBadge();
  },

  // 删除报告
  delete(id) {
    const reports = this.getAll().filter(r => r.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(reports));
    this.updateUnreadBadge();
  },

  // 标记报告为已读
  markAsRead(id) {
    const reports = this.getAll();
    const report = reports.find(r => r.id === id);
    if (report) {
      report.unread = false;
      localStorage.setItem(this.storageKey, JSON.stringify(reports));
      this.updateUnreadBadge();
    }
  },

  // 标记所有报告为已读
  markAllAsRead() {
    const reports = this.getAll();
    reports.forEach(r => r.unread = false);
    localStorage.setItem(this.storageKey, JSON.stringify(reports));
    this.updateUnreadBadge();
  },

  // 获取未读数量
  getUnreadCount() {
    return this.getAll().filter(r => r.unread).length;
  },

  // 更新未读徽章
  updateUnreadBadge() {
    const btn = document.getElementById('viewReportBtn');
    if (!btn) return;

    let badge = btn.querySelector('.unread-badge');
    const unreadCount = this.getUnreadCount();

    if (unreadCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'unread-badge';
        btn.style.position = 'relative';
        btn.appendChild(badge);
      }
      badge.textContent = unreadCount;
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
};

// 显示报告历史列表
function showReportHistory() {
  const reports = ReportHistory.getAll();

  if (reports.length === 0) {
    // 没有历史记录，直接生成新报告
    generateNewReport();
    return;
  }

  // 标记所有报告为已读
  ReportHistory.markAllAsRead();

  // 创建历史列表弹窗
  const modal = document.getElementById('reportModal');
  const reportText = document.getElementById('reportText');

  let html = '<div style="max-height:400px; overflow-y:auto;">';
  html += '<h4 style="color:#667eea; margin-bottom:15px;">📋 历史报告记录</h4>';

  reports.forEach((report, index) => {
    const date = new Date(report.timestamp);
    const dateStr = `${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
    html += `
      <div style="border:1px solid #e0e0e0; border-radius:10px; padding:12px; margin-bottom:10px; cursor:pointer; transition:all 0.2s;"
           onmouseover="this.style.background='#f5f5f5'"
           onmouseout="this.style.background='white'"
           onclick="viewReport(${report.id})">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:500; color:#333;">报告 #${reports.length - index}</div>
            <div style="font-size:0.85rem; color:#666; margin-top:4px;">
              ${dateStr} | ${report.grid_size}×${report.grid_size} | ${report.moves}步
            </div>
          </div>
          <button onclick="event.stopPropagation(); deleteReport(${report.id})"
                  style="background:#ff4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">
            删除
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  html += '<button onclick="generateNewReport()" style="margin-top:15px; width:100%; padding:12px; background:#2ecc71; color:white; border:none; border-radius:10px; font-size:1rem; cursor:pointer;">➕ 生成新报告</button>';

  reportText.innerHTML = html;
  modal.style.display = 'flex';
}

// 查看历史报告
window.viewReport = function(id) {
  const reports = ReportHistory.getAll();
  const report = reports.find(r => r.id === id);
  if (!report) return;

  const reportText = document.getElementById('reportText');
  reportText.innerHTML = report.content;
};

// 删除报告
window.deleteReport = function(id) {
  if (confirm('确定要删除这条报告吗？')) {
    ReportHistory.delete(id);
    showReportHistory();
  }
};

// 获取或创建 client_id
function getOrCreateClientId() {
  const key = 'puzzle_client_id';
  let clientId = localStorage.getItem(key);
  if (!clientId) {
    clientId = 'web-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(key, clientId);
  }
  return clientId;
}

// 生成新报告
window.generateNewReport = async function() {
  const game = window.puzzleGame;
  if (!game || game.gameState !== 'completed') {
    alert('请先完成一局游戏');
    return;
  }

  const timeSeconds = Math.floor((Date.now() - game.startTime) / 1000);
  const clientId = getOrCreateClientId();

  const data = {
    client_id: clientId,
    game_id: 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    time_seconds: timeSeconds,
    moves: game.moveCount,
    grid_size: game.gridSize,
    modifiers: {
      rotation: game.modifiers.rotation || false,
      hidden: game.modifiers.hidden || false,
      trickster: game.modifiers.trickster || false
    },
    image_name: document.getElementById('previewImage')?.src.split('/').pop() || '用户图片',
    piece_order: game.pieceOrder || [],
    time_intervals: game.timeIntervals || [],
    modification_count: game.modificationCount || 0
  };

  const modal = document.getElementById('reportModal');
  const reportText = document.getElementById('reportText');
  const btn = document.getElementById('viewReportBtn');

  if (!modal || !reportText) {
    alert('报告弹窗未找到');
    return;
  }

  // 按钮显示加载状态
  const originalBtnText = btn.innerHTML;
  btn.innerHTML = '⏳ 正在生成报告...';
  btn.disabled = true;

  // 先显示弹窗和加载提示
  reportText.innerHTML = '<div style="text-align:center; padding:40px;"><div style="font-size:2rem; margin-bottom:10px;">🔄</div><div>正在生成心理分析报告...</div></div>';
  modal.style.display = 'flex';

  try {
    const response = await fetch(window.API_BASE_URL + '/api/generate_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.success) {
      // 保存到历史记录
      ReportHistory.save({
        content: result.report,
        grid_size: data.grid_size,
        moves: data.moves,
        time_seconds: data.time_seconds
      });

      // 直接显示HTML内容
      reportText.innerHTML = result.report;
    } else {
      reportText.innerHTML = '<div style="color:#e74c3c; text-align:center; padding:20px;">生成报告失败：' + result.error + '</div>';
    }
  } catch (err) {
    reportText.innerHTML = '<div style="color:#e74c3c; text-align:center; padding:20px;">网络错误：' + err.message + '</div>';
  } finally {
    // 恢复按钮状态
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
  }
};

// 主入口函数
async function generatePsychologyReport() {
  const game = window.puzzleGame;
  if (!game || game.gameState !== 'completed') {
    alert('请先完成一局游戏');
    return;
  }

  // 检查是否有历史记录
  const reports = ReportHistory.getAll();
  if (reports.length > 0) {
    // 有历史记录，显示列表
    showReportHistory();
  } else {
    // 没有历史记录，直接生成新报告
    generateNewReport();
  }
}

// 暴露给全局
window.generatePsychologyReport = generatePsychologyReport;

// 页面加载时初始化未读徽章
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    ReportHistory.updateUnreadBadge();
  }, 1000);
});

// 页面加载时更新未读徽章
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    ReportHistory.updateUnreadBadge();
  }, 1000);
});
