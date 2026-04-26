// ==================== 管理员功能 ====================
class AdminManager {
    constructor() {
        this.adminLoginModal = document.getElementById('adminLoginModal');
        this.adminPanelModal = document.getElementById('adminPanelModal');
        this.initEvents();
    }

    initEvents() {
        // 管理员按钮点击
        document.getElementById('adminBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // 关闭登录模态框
        document.getElementById('closeAdminLogin').addEventListener('click', () => {
            this.adminLoginModal.classList.remove('active');
        });

        // 登录按钮
        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            this.login();
        });

        // 关闭管理员面板
        document.getElementById('closeAdminPanel').addEventListener('click', () => {
            this.adminPanelModal.classList.remove('active');
        });

        // 导出数据按钮
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // 点击模态框外部关闭
        this.adminLoginModal.addEventListener('click', (e) => {
            if (e.target === this.adminLoginModal) {
                this.adminLoginModal.classList.remove('active');
            }
        });

        this.adminPanelModal.addEventListener('click', (e) => {
            if (e.target === this.adminPanelModal) {
                this.adminPanelModal.classList.remove('active');
            }
        });
    }

    showLoginModal() {
        this.adminLoginModal.classList.add('active');
        document.getElementById('adminPassword').value = '';
    }

    async login() {
        const password = document.getElementById('adminPassword').value;

        if (!password) {
            alert('请输入密码');
            return;
        }

        try {
            const response = await fetch(window.API_BASE_URL + '/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.adminLoginModal.classList.remove('active');
                this.adminPanelModal.classList.add('active');
            } else {
                alert(result.message || '密码错误');
            }
        } catch (error) {
            alert('登录失败: ' + error.message);
        }
    }

    async exportData() {
        try {
            const response = await fetch(window.API_BASE_URL + '/api/admin/export-data');

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `心理测试数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                alert('数据导出成功！');
            } else {
                const result = await response.json();
                alert('导出失败: ' + (result.error || result.message));
            }
        } catch (error) {
            alert('导出失败: ' + error.message);
        }
    }
}

// ==================== 心理疗愈功能 ====================
class HealingManager {
    constructor() {
        this.healingListModal = document.getElementById('healingListModal');
        this.healingChatModal = document.getElementById('healingChatModal');
        this.userInfoModal = document.getElementById('userInfoModal');
        this.currentSessionId = null;
        this.currentReportId = null;
        this.currentReportContent = null;
        this.initEvents();
    }

    initEvents() {
        // 心理疗愈按钮（完成页面）
        document.getElementById('healingBtn').addEventListener('click', () => {
            this.showHealingList();
        });

        // 关闭疗愈列表
        document.getElementById('closeHealingList').addEventListener('click', () => {
            this.healingListModal.classList.remove('active');
        });

        // 关闭疗愈对话
        document.getElementById('closeHealingChat').addEventListener('click', () => {
            this.healingChatModal.classList.remove('active');
        });

        // 关闭用户信息
        document.getElementById('closeUserInfo').addEventListener('click', () => {
            this.userInfoModal.classList.remove('active');
        });

        // 发送消息按钮
        document.getElementById('chatSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车发送
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 提交用户信息
        document.getElementById('submitUserInfoBtn').addEventListener('click', () => {
            this.submitUserInfo();
        });

        // 点击模态框外部关闭
        this.healingListModal.addEventListener('click', (e) => {
            if (e.target === this.healingListModal) {
                this.healingListModal.classList.remove('active');
            }
        });

        this.healingChatModal.addEventListener('click', (e) => {
            if (e.target === this.healingChatModal) {
                this.healingChatModal.classList.remove('active');
            }
        });

        this.userInfoModal.addEventListener('click', (e) => {
            if (e.target === this.userInfoModal) {
                this.userInfoModal.classList.remove('active');
            }
        });
    }

    async showHealingList() {
        this.healingListModal.classList.add('active');
        const content = document.getElementById('healingListContent');
        content.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载中...</p></div>';

        try {
            const clientId = this.getClientId();
            const response = await fetch(window.API_BASE_URL + '/api/reports/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.renderReportList(result.reports);
            } else {
                content.innerHTML = '<p style="text-align: center; color: #999;">加载失败</p>';
            }
        } catch (error) {
            content.innerHTML = '<p style="text-align: center; color: #999;">加载失败: ' + error.message + '</p>';
        }
    }

    renderReportList(reports) {
        const content = document.getElementById('healingListContent');

        if (reports.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #999;">暂无报告</p>';
            return;
        }

        const list = document.createElement('ul');
        list.className = 'report-list';

        reports.forEach(report => {
            const item = document.createElement('li');
            item.className = 'report-item';

            // 获取会话状态
            const sessionStatus = this.getSessionStatus(report.id);
            let buttonHtml = '';
            let buttonStyle = '';

            if (sessionStatus === 'not_started') {
                buttonStyle = 'background: #2ecc71; color: white;';
                buttonHtml = '💚 开始疗愈';
            } else if (sessionStatus === 'in_progress') {
                buttonStyle = 'background: #f39c12; color: white;';
                buttonHtml = '💛 继续对话';
            } else {
                buttonStyle = 'background: #ecf0f1; color: #7f8c8d;';
                buttonHtml = '🤍 查看记录';
            }

            item.innerHTML = `
                <div class="report-item-header">
                    <span style="font-weight: 500;">报告 #${report.id}</span>
                    <span class="report-item-time">${report.createdAtFormatted}</span>
                </div>
                <div class="report-item-preview">${report.reportText.substring(0, 50)}...</div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="healing-action-btn" style="${buttonStyle} flex: 1; padding: 8px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                        ${buttonHtml}
                    </button>
                    <button class="delete-session-btn" style="background: #e74c3c; color: white; padding: 8px 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                        🗑️ 删除
                    </button>
                </div>
            `;

            // 绑定开始/继续/查看按钮
            const actionBtn = item.querySelector('.healing-action-btn');
            actionBtn.addEventListener('click', () => {
                this.startHealing(report.id, report.reportText);
            });

            // 绑定删除按钮
            const deleteBtn = item.querySelector('.delete-session-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(report.id);
            });

            list.appendChild(item);
        });

        content.innerHTML = '';
        content.appendChild(list);
    }

    // 获取会话状态
    getSessionStatus(reportId) {
        const sessionKey = `healing_session_${reportId}`;
        const sessionData = localStorage.getItem(sessionKey);

        if (!sessionData) {
            return 'not_started';
        }

        const session = JSON.parse(sessionData);
        if (session.questionCount >= 3) {
            return 'completed';
        } else if (session.questionCount > 0) {
            return 'in_progress';
        } else {
            return 'not_started';
        }
    }

    // 删除会话
    async deleteSession(reportId) {
        if (!confirm('确定要删除这个报告吗？删除后将无法恢复。')) {
            return;
        }

        try {
            // 调用后端 API 软删除报告
            const response = await fetch(window.API_BASE_URL + '/api/reports/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // 删除本地会话数据
                const sessionKey = `healing_session_${reportId}`;
                localStorage.removeItem(sessionKey);

                // 重新加载列表
                this.showHealingList();
                alert('删除成功');
            } else {
                alert('删除失败: ' + (result.error || '未知错误'));
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }

    async startHealing(reportId, reportContent) {
        this.currentReportId = reportId;
        this.currentReportContent = reportContent;
        this.healingListModal.classList.remove('active');

        const sessionKey = `healing_session_${reportId}`;
        const existingSession = localStorage.getItem(sessionKey);

        if (existingSession) {
            // 恢复已有会话
            const session = JSON.parse(existingSession);
            this.currentSessionId = session.sessionId;
            this.showChatModal(session.questionCount);

            // 恢复消息历史
            if (session.messages) {
                const messagesContainer = document.getElementById('chatMessages');
                messagesContainer.innerHTML = `
                    <div class="chat-message system">
                        欢迎来到心理疗愈对话。我会基于您的心理报告，与您进行3轮对话，帮助您更好地了解自己。
                    </div>
                `;
                session.messages.forEach(msg => {
                    this.addMessageToChat(msg.role, msg.content);
                });
            }
        } else {
            // 创建新会话
            try {
                const clientId = this.getClientId();
                const response = await fetch(window.API_BASE_URL + '/api/healing/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, reportId, reportContent })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    this.currentSessionId = result.sessionId;

                    // 保存会话到本地
                    localStorage.setItem(sessionKey, JSON.stringify({
                        sessionId: result.sessionId,
                        reportId: reportId,
                        questionCount: 0,
                        messages: []
                    }));

                    this.showChatModal(0);
                } else {
                    alert('创建疗愈会话失败');
                }
            } catch (error) {
                alert('创建疗愈会话失败: ' + error.message);
            }
        }
    }

    showChatModal(questionCount = 0) {
        this.healingChatModal.classList.add('active');
        const messagesContainer = document.getElementById('chatMessages');

        if (questionCount === 0) {
            // 显示报告内容摘要
            const reportPreview = this.currentReportContent.substring(0, 200);
            messagesContainer.innerHTML = `
                <div class="chat-message system">
                    <strong>📋 正在阅读您的心理报告...</strong><br><br>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 0.9rem; color: #666;">
                        ${reportPreview}...
                    </div>
                    <br>
                    <strong>✅ 报告阅读完成！</strong><br><br>
                    我已经仔细阅读了您的心理报告。基于报告内容，我会与您进行3轮对话，帮助您更好地了解自己的心理状态。<br><br>
                    您可以向我提出任何关于报告的疑问，或者分享您的感受。我会根据报告内容为您提供支持和建议。
                </div>
            `;
        }

        document.getElementById('chatInput').value = '';
        document.getElementById('questionCounter').textContent = `剩余提问次数: ${3 - questionCount}`;

        // 如果已完成3次对话，禁用输入
        if (questionCount >= 3) {
            document.getElementById('chatInput').disabled = true;
            document.getElementById('chatSendBtn').disabled = true;
        } else {
            document.getElementById('chatInput').disabled = false;
            document.getElementById('chatSendBtn').disabled = false;
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) {
            return;
        }

        // 添加用户消息到界面
        this.addMessageToChat('user', message);
        input.value = '';

        // 保存用户消息到本地
        const sessionKey = `healing_session_${this.currentReportId}`;
        const sessionData = JSON.parse(localStorage.getItem(sessionKey));
        if (!sessionData.messages) sessionData.messages = [];
        sessionData.messages.push({ role: 'user', content: message });
        localStorage.setItem(sessionKey, JSON.stringify(sessionData));

        try {
            const response = await fetch(window.API_BASE_URL + '/api/healing/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.currentSessionId, message })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.addMessageToChat('assistant', result.message);
                document.getElementById('questionCounter').textContent = `剩余提问次数: ${result.remainingQuestions}`;

                // 保存AI回复到本地
                sessionData.messages.push({ role: 'assistant', content: result.message });
                sessionData.questionCount = result.questionCount;
                localStorage.setItem(sessionKey, JSON.stringify(sessionData));

                if (result.remainingQuestions === 0) {
                    // 对话结束，禁用输入
                    document.getElementById('chatInput').disabled = true;
                    document.getElementById('chatSendBtn').disabled = true;

                    // 显示用户信息提交表单
                    setTimeout(() => {
                        this.healingChatModal.classList.remove('active');
                        this.userInfoModal.classList.add('active');
                    }, 1000);
                }
            } else {
                alert(result.error || '发送失败');
            }
        } catch (error) {
            alert('发送失败: ' + error.message);
        }
    }

    addMessageToChat(role, content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async submitUserInfo() {
        const userName = document.getElementById('userName').value.trim();
        const userStudentId = document.getElementById('userStudentId').value.trim();
        const isAnonymous = document.getElementById('isAnonymous').checked;

        try {
            const response = await fetch(window.API_BASE_URL + '/api/healing/submit-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    userName,
                    userStudentId,
                    isAnonymous
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.userInfoModal.classList.remove('active');
                alert('感谢您的参与！');
            } else {
                alert('提交失败');
            }
        } catch (error) {
            alert('提交失败: ' + error.message);
        }
    }

    getClientId() {
        const key = 'puzzle_client_id';
        let clientId = localStorage.getItem(key);
        if (!clientId) {
            clientId = 'web-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem(key, clientId);
        }
        return clientId;
    }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
    window.healingManager = new HealingManager();
});
