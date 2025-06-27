const http = require('http');
const https = require('https');
const url = require('url');

// CORS代理服务器
class CORSProxy {
    constructor(port = 3000) {
        this.port = port;
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            // 设置CORS头
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Max-Age', '86400');

            // 处理预检请求
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 CORS代理服务器启动成功！`);
            console.log(`📡 监听端口: ${this.port}`);
            console.log(`🌐 访问地址: http://localhost:${this.port}`);
            console.log(`📋 用法: 在前端请求时将飞书API的基础URL替换为 http://localhost:${this.port}`);
            console.log(`⚠️  注意: 这只是开发环境的临时解决方案，生产环境请使用其他方式处理CORS`);
        });
    }

    handleRequest(req, res) {
        try {
            // 解析请求URL
            const reqUrl = url.parse(req.url, true);

            // 提取目标URL (去掉代理路径前缀)
            let targetPath = reqUrl.pathname;
            if (targetPath.startsWith('/')) {
                targetPath = targetPath.substring(1);
            }

            // 重构飞书API的完整URL
            const targetUrl = `https://open.feishu.cn/${targetPath}${reqUrl.search || ''}`;

            console.log(`🔄 代理请求: ${req.method} ${targetUrl}`);

            // 准备请求选项
            const options = {
                method: req.method,
                headers: {
                    ...req.headers,
                    'host': 'open.feishu.cn',
                    'origin': undefined,
                    'referer': undefined
                }
            };

            // 删除可能导致问题的头部
            delete options.headers.host;
            delete options.headers.origin;
            delete options.headers.referer;

            // 创建请求
            const proxyReq = https.request(targetUrl, options, (proxyRes) => {
                // 复制响应头
                Object.keys(proxyRes.headers).forEach(key => {
                    res.setHeader(key, proxyRes.headers[key]);
                });

                // 设置响应状态码
                res.writeHead(proxyRes.statusCode);

                // 管道响应数据
                proxyRes.pipe(res);

                console.log(`✅ 响应状态: ${proxyRes.statusCode}`);
            });

            // 错误处理
            proxyReq.on('error', (error) => {
                console.error(`❌ 代理请求错误:`, error);
                res.writeHead(500);
                res.end(JSON.stringify({
                    error: '代理请求失败',
                    message: error.message
                }));
            });

            // 如果是POST/PUT请求，转发请求体
            if (req.method === 'POST' || req.method === 'PUT') {
                req.pipe(proxyReq);
            } else {
                proxyReq.end();
            }

        } catch (error) {
            console.error(`❌ 处理请求时发生错误:`, error);
            res.writeHead(500);
            res.end(JSON.stringify({
                error: '服务器内部错误',
                message: error.message
            }));
        }
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🛑 CORS代理服务器已停止');
            });
        }
    }
}

// 启动服务器
const proxy = new CORSProxy(3000);
proxy.start();

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n📤 正在关闭CORS代理服务器...');
    proxy.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n📤 正在关闭CORS代理服务器...');
    proxy.stop();
    process.exit(0);
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    proxy.stop();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
});

module.exports = CORSProxy; 