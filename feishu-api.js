// 飞书API接口封装
class FeishuAPI {
    constructor() {
        // 如果有认证管理器，优先使用；否则回退到配置中的token
        this.authManager = window.authManager || null;
        this.fallbackToken = CONFIG.USER_ACCESS_TOKEN;
    }

    // 获取请求头
    async getHeaders() {
        let token = this.fallbackToken;

        // 优先尝试从认证管理器获取有效token
        if (this.authManager) {
            try {
                token = await this.authManager.getValidUserAccessToken();
            } catch (error) {
                console.warn('无法从认证管理器获取token，使用配置中的fallback token:', error);
                // 如果获取失败且没有fallback token，抛出错误
                if (!this.fallbackToken) {
                    throw new Error('需要认证：请登录后重试');
                }
            }
        }

        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = getApiUrl(endpoint);
        const headers = await this.getHeaders();
        const defaultOptions = {
            method: 'GET',
            headers: headers,
            ...options
        };

        try {
            console.log('Request URL:', url);
            console.log('Request Options:', defaultOptions);

            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            console.log('Response:', data);

            if (data.code !== 0) {
                // 如果是认证相关错误，清除token
                if (data.code === 99991663 || data.code === 99991664 || data.code === 99991665) {
                    console.warn('认证token无效，清除缓存的token');
                    if (this.authManager) {
                        this.authManager.clearTokenData();
                    }
                }
                throw new Error(data.msg || 'API请求失败');
            }

            return data.data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 获取知识空间文档列表
    async getDocumentList() {
        const endpoint = `/wiki/v2/spaces/${CONFIG.SPACE_ID}/nodes`;
        const params = new URLSearchParams({
            page_size: '50'
        });

        return await this.request(`${endpoint}?${params}`);
    }

    // 获取文档块列表
    async getDocumentBlocks(documentId) {
        const endpoint = `/docx/v1/documents/${documentId}/blocks`;
        const params = new URLSearchParams({
            page_size: '500',
            document_revision_id: '-1'
        });

        return await this.request(`${endpoint}?${params}`);
    }

    // 获取单个文档块详情
    async getDocumentBlock(documentId, blockId) {
        const endpoint = `/docx/v1/documents/${documentId}/blocks/${blockId}`;
        const params = new URLSearchParams({
            document_revision_id: '-1'
        });

        return await this.request(`${endpoint}?${params}`);
    }

    // 获取文档基本信息
    async getDocumentInfo(documentId) {
        const endpoint = `/docx/v1/documents/${documentId}`;
        return await this.request(endpoint);
    }

    // 获取图片下载链接
    async getImageUrl(imageToken) {
        try {
            const endpoint = `/drive/v1/medias/${imageToken}/download`;
            const response = await fetch(getApiUrl(endpoint), {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (response.ok) {
                // 返回图片的blob URL
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } else {
                console.warn('获取图片失败:', imageToken);
                return null;
            }
        } catch (error) {
            console.error('获取图片错误:', error);
            return null;
        }
    }

    // 批量获取文档块内容（包含子块）
    async getDocumentBlocksRecursive(documentId, blockIds = []) {
        try {
            const blocksData = await this.getDocumentBlocks(documentId);
            const blocks = blocksData.items || [];

            // 创建块的映射表
            const blockMap = {};
            blocks.forEach(block => {
                blockMap[block.block_id] = block;
            });

            // 如果指定了特定的blockIds，只返回这些块
            if (blockIds.length > 0) {
                return blockIds.map(id => blockMap[id]).filter(Boolean);
            }

            return blocks;
        } catch (error) {
            console.error('获取文档块错误:', error);
            throw error;
        }
    }

    // 解析多维表格token
    parseBitableToken(token) {
        // token格式: BitableToken_TableID
        const parts = token.split('_');
        if (parts.length >= 2) {
            return {
                app_token: parts[0],
                table_id: parts[1]
            };
        }
        return {
            app_token: token,
            table_id: null
        };
    }

    // 获取多维表格基本信息
    async getBitableInfo(appToken) {
        const endpoint = `/bitable/v1/apps/${appToken}`;
        return await this.request(endpoint);
    }

    // 获取多维表格数据表列表
    async getBitableTables(appToken) {
        const endpoint = `/bitable/v1/apps/${appToken}/tables`;
        const params = new URLSearchParams({
            page_size: '100'
        });
        return await this.request(`${endpoint}?${params}`);
    }

    // 获取数据表字段列表
    async getBitableFields(appToken, tableId) {
        const endpoint = `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`;
        const params = new URLSearchParams({
            page_size: '100'
        });
        return await this.request(`${endpoint}?${params}`);
    }

    // 获取数据表记录
    async getBitableRecords(appToken, tableId, viewId = null) {
        const endpoint = `/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
        const params = new URLSearchParams({
            page_size: '50'
        });
        if (viewId) {
            params.append('view_id', viewId);
        }
        return await this.request(`${endpoint}?${params}`);
    }

    // 获取数据表视图列表
    async getBitableViews(appToken, tableId) {
        const endpoint = `/bitable/v1/apps/${appToken}/tables/${tableId}/views`;
        const params = new URLSearchParams({
            page_size: '100'
        });
        return await this.request(`${endpoint}?${params}`);
    }

    // 获取电子表格基础信息
    async getSpreadsheetInfo(spreadsheetToken, userIdType = 'open_id') {
        const endpoint = `/sheets/v3/spreadsheets/${spreadsheetToken}`;
        const params = new URLSearchParams({
            user_id_type: userIdType
        });
        return await this.request(`${endpoint}?${params}`);
    }

    // 获取电子表格工作表列表
    async getSpreadsheetSheets(spreadsheetToken) {
        const endpoint = `/sheets/v3/spreadsheets/${spreadsheetToken}/sheets`;
        return await this.request(endpoint);
    }

    // 获取电子表格单元格数据
    async getSpreadsheetCells(spreadsheetToken, sheetId, range = '') {
        const endpoint = `/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/${sheetId}/values`;
        if (range) {
            const params = new URLSearchParams({
                range: range
            });
            return await this.request(`${endpoint}?${params}`);
        }
        return await this.request(endpoint);
    }
}

// 创建API实例
const feishuAPI = new FeishuAPI(); 