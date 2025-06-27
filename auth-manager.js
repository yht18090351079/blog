// 飞书认证管理器
class AuthManager {
    constructor() {
        this.userAccessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
        this.isAuthenticating = false;

        // 从localStorage恢复token
        this.loadTokenFromStorage();
    }

    // 从localStorage加载已保存的token
    loadTokenFromStorage() {
        try {
            const tokenData = localStorage.getItem('feishu_token_data');
            if (tokenData) {
                const parsed = JSON.parse(tokenData);
                this.userAccessToken = parsed.userAccessToken;
                this.refreshToken = parsed.refreshToken;
                this.expiresAt = parsed.expiresAt;

                console.log('从本地存储加载Token:', {
                    hasToken: !!this.userAccessToken,
                    expiresAt: this.expiresAt ? new Date(this.expiresAt).toLocaleString() : null,
                    isExpired: this.isTokenExpired()
                });
            }
        } catch (error) {
            console.error('加载本地Token失败:', error);
            this.clearTokenData();
        }
    }

    // 保存token到localStorage
    saveTokenToStorage() {
        try {
            const tokenData = {
                userAccessToken: this.userAccessToken,
                refreshToken: this.refreshToken,
                expiresAt: this.expiresAt
            };
            localStorage.setItem('feishu_token_data', JSON.stringify(tokenData));
            console.log('Token已保存到本地存储');
        } catch (error) {
            console.error('保存Token到本地存储失败:', error);
        }
    }

    // 清除token数据
    clearTokenData() {
        this.userAccessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
        localStorage.removeItem('feishu_token_data');
        console.log('已清除Token数据');
    }

    // 检查token是否过期
    isTokenExpired() {
        if (!this.expiresAt) return true;
        // 提前5分钟认为token过期，避免临界情况
        return Date.now() >= (this.expiresAt - 5 * 60 * 1000);
    }

    // 获取有效的user_access_token
    async getValidUserAccessToken() {
        // 如果没有token或token过期，尝试刷新
        if (!this.userAccessToken || this.isTokenExpired()) {
            if (this.refreshToken) {
                console.log('Token过期，尝试刷新...');
                await this.refreshUserAccessToken();
            } else {
                console.log('没有refresh_token，需要重新认证');
                throw new Error('需要重新认证');
            }
        }

        return this.userAccessToken;
    }

    // 开始OAuth认证流程
    async startOAuthFlow() {
        const authUrl = this.buildAuthUrl();
        console.log('启动OAuth认证流程:', authUrl);

        // 在新窗口中打开认证页面
        const authWindow = window.open(authUrl, 'feishu_auth', 'width=600,height=700');

        return new Promise((resolve, reject) => {
            // 监听认证窗口的消息
            const messageHandler = (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'FEISHU_AUTH_SUCCESS') {
                    window.removeEventListener('message', messageHandler);
                    authWindow.close();
                    this.handleAuthCallback(event.data.code)
                        .then(resolve)
                        .catch(reject);
                } else if (event.data.type === 'FEISHU_AUTH_ERROR') {
                    window.removeEventListener('message', messageHandler);
                    authWindow.close();
                    reject(new Error(event.data.error || '认证失败'));
                }
            };

            window.addEventListener('message', messageHandler);

            // 检查窗口是否被关闭
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('用户取消了认证'));
                }
            }, 1000);
        });
    }

    // 构建认证URL
    buildAuthUrl() {
        const redirectUri = `${window.location.origin}/auth-callback.html`;
        const state = this.generateState();

        const params = new URLSearchParams({
            app_id: CONFIG.APP_ID,
            redirect_uri: redirectUri,
            scope: 'drive:drive sheets:spreadsheet',
            state: state
        });

        const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?${params}`;

        console.log('构建认证URL:', {
            app_id: CONFIG.APP_ID,
            redirect_uri: redirectUri,
            state: state,
            full_url: authUrl
        });

        return authUrl;
    }

    // 生成state参数
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // 处理认证回调
    async handleAuthCallback(code) {
        if (this.isAuthenticating) {
            throw new Error('认证正在进行中');
        }

        this.isAuthenticating = true;

        try {
            const tokenData = await this.exchangeCodeForToken(code);

            this.userAccessToken = tokenData.access_token;
            this.refreshToken = tokenData.refresh_token;
            this.expiresAt = Date.now() + (tokenData.expires_in * 1000);

            this.saveTokenToStorage();

            console.log('认证成功:', {
                hasToken: !!this.userAccessToken,
                expiresAt: new Date(this.expiresAt).toLocaleString()
            });

            return this.userAccessToken;
        } finally {
            this.isAuthenticating = false;
        }
    }

    // 用code换取token
    async exchangeCodeForToken(code) {
        const response = await fetch(getApiUrl('/authen/v1/oidc/access_token'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.APP_SECRET}`
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code
            })
        });

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(data.msg || '获取token失败');
        }

        return data.data;
    }

    // 刷新user_access_token
    async refreshUserAccessToken() {
        if (!this.refreshToken) {
            throw new Error('没有refresh_token，无法刷新');
        }

        try {
            const response = await fetch(getApiUrl('/authen/v1/oidc/refresh_access_token'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.APP_SECRET}`
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken
                })
            });

            const data = await response.json();

            if (data.code !== 0) {
                // 刷新失败，清除token数据
                this.clearTokenData();
                throw new Error(data.msg || '刷新token失败');
            }

            this.userAccessToken = data.data.access_token;
            this.refreshToken = data.data.refresh_token;
            this.expiresAt = Date.now() + (data.data.expires_in * 1000);

            this.saveTokenToStorage();

            console.log('Token刷新成功');
            return this.userAccessToken;

        } catch (error) {
            console.error('刷新token失败:', error);
            this.clearTokenData();
            throw error;
        }
    }

    // 检查认证状态
    getAuthStatus() {
        return {
            isAuthenticated: !!this.userAccessToken && !this.isTokenExpired(),
            hasToken: !!this.userAccessToken,
            isExpired: this.isTokenExpired(),
            expiresAt: this.expiresAt ? new Date(this.expiresAt).toLocaleString() : null
        };
    }

    // 注销
    logout() {
        this.clearTokenData();
        console.log('用户已注销');
    }
}

// 创建全局认证管理器实例
const authManager = new AuthManager(); 