// ==================== 管理员功能 ====================
class AdminManager {
    constructor() {
        this.adminLoginModal = document.getElementById('adminLoginModal');
        this.adminPanelModal = document.getElementById('adminPanelModal');
        this.classDataModal = document.getElementById('classDataModal');
        this.currentAdmin = null;
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

        // 关闭班级数据模态框
        document.getElementById('closeClassData').addEventListener('click', () => {
            this.classDataModal.classList.remove('active');
        });

        // 查看班级数据按钮
        document.getElementById('viewClassDataBtn').addEventListener('click', () => {
            this.viewClassData();
        });

        // 新建班级按钮
        document.getElementById('createClassBtn').addEventListener('click', () => {
            this.createClass();
        });

        // 删除班级按钮
        document.getElementById('deleteClassBtn').addEventListener('click', () => {
            this.deleteClass();
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

        this.classDataModal.addEventListener('click', (e) => {
            if (e.target === this.classDataModal) {
                this.classDataModal.classList.remove('active');
            }
        });
    }

    showLoginModal() {
        this.adminLoginModal.classList.add('active');
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
    }

    async login() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (!username || !password) {
            alert('请输入账号和密码');
            return;
        }

        try {
            const response = await fetch(window.API_BASE_URL + '/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.currentAdmin = {
                    username: result.username,
                    teacherId: result.teacherId,
                    teacherName: result.teacherName
                };
                this.adminLoginModal.classList.remove('active');
                this.showAdminPanel();
            } else {
                alert(result.message || '账号或密码错误');
            }
        } catch (error) {
            alert('登录失败: ' + error.message);
        }
    }

    async showAdminPanel() {
        this.adminPanelModal.classList.add('active');
        document.getElementById('adminWelcome').textContent = this.currentAdmin.teacherName || this.currentAdmin.username;

        // 加载该老师的班级列表
        await this.loadTeacherClasses();
    }

    async loadTeacherClasses() {
        try {
            const response = await fetch(window.API_BASE_URL + `/api/teachers/${this.currentAdmin.teacherId}/classes`);
            const result = await response.json();

            if (response.ok && result.success) {
                const selector = document.getElementById('classSelector');
                selector.innerHTML = '<option value="">请选择班级</option>';

                result.classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.class_number;
                    option.dataset.classId = cls.id;
                    option.textContent = cls.class_number;
                    selector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('加载班级列表失败:', error);
        }
    }

    async createClass() {
        const classNumber = prompt('请输入班级号（例如：1、2、3）：');

        if (!classNumber || !classNumber.trim()) {
            return;
        }

        try {
            const response = await fetch(window.API_BASE_URL + '/api/admin/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: this.currentAdmin.teacherId,
                    classNumber: classNumber.trim()
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('班级创建成功！');
                await this.loadTeacherClasses();
            } else {
                alert(result.message || '创建失败');
            }
        } catch (error) {
            alert('创建失败: ' + error.message);
        }
    }

    async deleteClass() {
        const selector = document.getElementById('classSelector');
        const selectedOption = selector.options[selector.selectedIndex];

        if (!selectedOption || !selectedOption.dataset.classId) {
            alert('请先选择要删除的班级');
            return;
        }

        if (!confirm(`确定要删除班级 ${selectedOption.value} 吗？`)) {
            return;
        }

        try {
            const response = await fetch(window.API_BASE_URL + `/api/admin/classes/${selectedOption.dataset.classId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('班级删除成功！');
                await this.loadTeacherClasses();
            } else {
                alert(result.message || '删除失败');
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }

    async viewClassData() {
        const className = document.getElementById('classSelector').value;

        if (!className) {
            alert('请选择班级');
            return;
        }

        this.classDataModal.classList.add('active');
        const content = document.getElementById('classDataContent');
        content.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载中...</p></div>';

        try {
            const response = await fetch(window.API_BASE_URL + '/api/admin/class-healing-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ className })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.renderClassData(result.data, className);
            } else {
                content.innerHTML = '<p style="text-align: center; color: #999;">加载失败</p>';
            }
        } catch (error) {
            content.innerHTML = '<p style="text-align: center; color: #999;">加载失败: ' + error.message + '</p>';
        }
    }

    renderClassData(data, className) {
        const content = document.getElementById('classDataContent');

        if (data.length === 0) {
            content.innerHTML = `<p style="text-align: center; color: #999;">${className} 暂无学生疗愈数据</p>`;
            return;
        }

        const list = document.createElement('ul');
        list.className = 'report-list';

        data.forEach((session, index) => {
            const item = document.createElement('li');
            item.className = 'report-item';

            const date = new Date(session.created_at * 1000);
            const dateStr = `${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;

            const displayName = session.is_anonymous ? '匿名' : (session.user_name || '未填写');
            const displayStudentId = session.is_anonymous ? '匿名' : (session.user_student_id || '未填写');

            item.innerHTML = `
                <div class="report-item-header">
                    <span style="font-weight: 500;">${displayName} (${displayStudentId})</span>
                    <span class="report-item-time">${dateStr}</span>
                </div>
                <div style="font-size:0.85rem; color:#666; margin-top:4px;">
                    提问次数: ${session.question_count}
                </div>
                <button class="view-detail-btn" style="margin-top: 10px; width: 100%; padding: 8px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    查看详情
                </button>
                <div class="session-detail" style="display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin-bottom: 8px;">用户提问:</h4>
                    ${session.questions.map((q, i) => `<p style="margin: 5px 0; font-size: 0.85rem;"><strong>问题${i+1}:</strong> ${q}</p>`).join('')}
                </div>
            `;

            const viewBtn = item.querySelector('.view-detail-btn');
            const detailDiv = item.querySelector('.session-detail');
            viewBtn.addEventListener('click', () => {
                if (detailDiv.style.display === 'none') {
                    detailDiv.style.display = 'block';
                    viewBtn.textContent = '收起详情';
                } else {
                    detailDiv.style.display = 'none';
                    viewBtn.textContent = '查看详情';
                }
            });

            list.appendChild(item);
        });

        content.innerHTML = `<h4 style="margin-bottom: 15px;">${className} - 共 ${data.length} 条记录</h4>`;
        content.appendChild(list);
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

        // 匿名复选框变化事件
        document.getElementById('isAnonymous').addEventListener('change', (e) => {
            const userInfoFields = document.getElementById('userInfoFields');
            if (e.target.checked) {
                userInfoFields.style.display = 'none';
            } else {
                userInfoFields.style.display = 'block';
            }
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

        reports.forEach((report, index) => {
            const item = document.createElement('li');
            item.className = 'report-item';

            // 格式化日期时间
            const date = new Date(report.created_at * 1000);
            const dateStr = `${date.getMonth()+1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;

            // 只显示有效的数据
            const gridSize = report.grid_size || 0;
            const moves = report.moves || 0;
            const detailStr = (gridSize > 0 && moves >= 0) ? `${gridSize}×${gridSize} | ${moves}步` : '';

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
                    <span class="report-item-time">${dateStr}</span>
                </div>
                <div style="font-size:0.85rem; color:#666; margin-top:4px;">
                    ${detailStr || ''}
                </div>
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

    // 删除会话（联动删除报告和疗愈会话）
    async deleteSession(reportId) {
        if (!confirm('确定要删除这个报告吗？删除后将无法恢复，关联的心理疗愈记录也会一并删除。')) {
            return;
        }

        try {
            // 调用后端 API 软删除报告（会联动删除疗愈会话）
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

        // 每次都创建新会话，不恢复旧会话
        const sessionKey = `healing_session_${reportId}`;

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
                        this.showUserInfoModal();
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

    async showUserInfoModal() {
        this.userInfoModal.classList.add('active');

        // 加载老师列表
        try {
            const response = await fetch(window.API_BASE_URL + '/api/teachers');
            const result = await response.json();

            if (response.ok && result.success) {
                const teacherSelector = document.getElementById('teacherSelector');
                teacherSelector.innerHTML = '<option value="">请选择老师</option>';

                result.teachers.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.id;
                    option.textContent = teacher.teacher_name || teacher.username;
                    teacherSelector.appendChild(option);
                });

                // 监听老师选择变化
                teacherSelector.addEventListener('change', async (e) => {
                    await this.loadTeacherClassesForStudent(e.target.value);
                });
            }
        } catch (error) {
            console.error('加载老师列表失败:', error);
        }
    }

    async loadTeacherClassesForStudent(teacherId) {
        const classSelector = document.getElementById('userClassSelector');

        if (!teacherId) {
            classSelector.innerHTML = '<option value="">请先选择老师</option>';
            return;
        }

        try {
            const response = await fetch(window.API_BASE_URL + `/api/teachers/${teacherId}/classes`);
            const result = await response.json();

            if (response.ok && result.success) {
                classSelector.innerHTML = '<option value="">请选择班级</option>';

                result.classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.class_number;
                    option.textContent = cls.class_number;
                    classSelector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('加载班级列表失败:', error);
            classSelector.innerHTML = '<option value="">加载失败</option>';
        }
    }

    async submitUserInfo() {
        const userName = document.getElementById('userName').value.trim();
        const userStudentId = document.getElementById('userStudentId').value.trim();
        const userClass = document.getElementById('userClassSelector').value;
        const isAnonymous = document.getElementById('isAnonymous').checked;

        try {
            const response = await fetch(window.API_BASE_URL + '/api/healing/submit-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    userName: isAnonymous ? '' : userName,
                    userStudentId: isAnonymous ? '' : userStudentId,
                    userClass: isAnonymous ? '' : userClass,
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
