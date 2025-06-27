// 主应用类
class FeishuDocumentViewer {
    constructor() {
        this.currentDocument = null;
        this.documents = [];
        this.init();
    }

    // 初始化应用
    async init() {
        this.setupEventListeners();
        await this.loadDocumentList();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => {
            this.loadDocumentList();
        });

        // Tab切换
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.loadDocumentList();
            }
        });
    }

    // 加载文档列表
    async loadDocumentList() {
        this.showLoading(true);

        try {
            const documentListElement = document.getElementById('documentList');
            documentListElement.innerHTML = '<div style="padding: 1rem; color: #666;">正在加载文档列表...</div>';

            const data = await feishuAPI.getDocumentList();
            this.documents = data.items || [];

            this.renderDocumentList();
        } catch (error) {
            console.error('加载文档列表失败:', error);
            this.showError('加载文档列表失败: ' + error.message);

            const documentListElement = document.getElementById('documentList');
            documentListElement.innerHTML = `
                <div style="padding: 1rem; color: #f56565;">
                    <p>❌ 加载失败</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                        ${error.message}
                    </p>
                    <button onclick="app.loadDocumentList()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        重试
                    </button>
                </div>
            `;
        } finally {
            this.showLoading(false);
        }
    }

    // 渲染文档列表
    renderDocumentList() {
        const documentListElement = document.getElementById('documentList');

        if (this.documents.length === 0) {
            documentListElement.innerHTML = '<div style="padding: 1rem; color: #666;">暂无文档</div>';
            return;
        }

        documentListElement.innerHTML = '';

        this.documents.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'document-item';
            docElement.setAttribute('data-obj-token', doc.obj_token);

            const titleElement = document.createElement('div');
            titleElement.className = 'document-title';
            titleElement.textContent = doc.title || '无标题';

            const metaElement = document.createElement('div');
            metaElement.className = 'document-meta';

            const createTime = new Date(parseInt(doc.obj_create_time) * 1000).toLocaleDateString();
            const editTime = new Date(parseInt(doc.obj_edit_time) * 1000).toLocaleDateString();

            metaElement.innerHTML = `
                <span>创建: ${createTime}</span>
                <span>修改: ${editTime}</span>
            `;

            docElement.appendChild(titleElement);
            docElement.appendChild(metaElement);

            // 添加点击事件
            docElement.addEventListener('click', () => {
                this.selectDocument(doc);
            });

            documentListElement.appendChild(docElement);
        });
    }

    // 选择文档
    async selectDocument(doc) {
        // 更新文档列表中的选中状态
        document.querySelectorAll('.document-item').forEach(item => {
            item.classList.remove('active');
        });

        const selectedElement = document.querySelector(`[data-obj-token="${doc.obj_token}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }

        // 更新文档标题
        const documentTitleElement = document.getElementById('documentTitle');
        documentTitleElement.textContent = doc.title || '无标题';

        // 加载文档内容
        await this.loadDocumentContent(doc.obj_token);
    }

    // 加载文档内容
    async loadDocumentContent(documentId) {
        this.showLoading(true);

        try {
            const contentElement = document.getElementById('documentContent');
            contentElement.innerHTML = '<div style="padding: 2rem; color: #666; text-align: center;">正在加载文档内容...</div>';

            // 获取文档块
            const blocksData = await feishuAPI.getDocumentBlocksRecursive(documentId);

            if (blocksData.length === 0) {
                contentElement.innerHTML = '<div style="padding: 2rem; color: #666; text-align: center;">文档内容为空</div>';
                return;
            }

            // 渲染文档
            const documentContainer = await documentRenderer.renderDocument(blocksData, documentId);

            contentElement.innerHTML = '';
            contentElement.appendChild(documentContainer);

            this.currentDocument = { id: documentId, blocks: blocksData };

        } catch (error) {
            console.error('加载文档内容失败:', error);
            this.showError('加载文档内容失败: ' + error.message);

            const contentElement = document.getElementById('documentContent');
            contentElement.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <div style="color: #f56565; margin-bottom: 1rem;">
                        <h3>❌ 加载失败</h3>
                        <p>${error.message}</p>
                    </div>
                    <button onclick="app.loadDocumentContent('${documentId}')" style="padding: 0.5rem 1rem; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        重试
                    </button>
                </div>
            `;
        } finally {
            this.showLoading(false);
        }
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    // 显示错误信息
    showError(message) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');

        errorMessage.textContent = message;
        errorModal.style.display = 'flex';

        // 5秒后自动关闭
        setTimeout(() => {
            this.closeErrorModal();
        }, 5000);
    }

    // 关闭错误模态框
    closeErrorModal() {
        const errorModal = document.getElementById('errorModal');
        errorModal.style.display = 'none';
    }

    // 处理窗口大小变化
    handleResize() {
        // 响应式处理逻辑
        const sidebar = document.querySelector('.sidebar');
        const contentArea = document.querySelector('.content-area');

        if (window.innerWidth <= 768) {
            // 移动端布局
            sidebar.style.position = 'fixed';
            sidebar.style.top = '80px';
            sidebar.style.left = '0';
            sidebar.style.zIndex = '100';
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.transition = 'transform 0.3s ease';
        } else {
            // 桌面端布局
            sidebar.style.position = 'relative';
            sidebar.style.transform = 'translateX(0)';
        }
    }
}

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
    if (window.app) {
        app.showError('发生了未知错误，请刷新页面重试');
    }
});

// 网络错误处理
window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
    if (window.app) {
        app.showError('网络请求失败，请检查网络连接');
    }
});

// 关闭错误模态框的全局函数
function closeErrorModal() {
    if (window.app) {
        app.closeErrorModal();
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FeishuDocumentViewer();

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        app.handleResize();
    });

    // 初始化时处理一次窗口大小
    app.handleResize();

    console.log('飞书文档浏览器初始化完成');
});

// 导出到全局作用域（调试用）
window.FeishuDocumentViewer = FeishuDocumentViewer;
window.feishuAPI = feishuAPI;
window.documentRenderer = documentRenderer; 