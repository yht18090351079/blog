exports.handler = async (event, context) => {
    const { httpMethod, path, headers, body } = event;

    // 从路径中提取API endpoint
    const apiPath = path.replace('/.netlify/functions/proxy', '');
    const apiUrl = `https://open.feishu.cn${apiPath}`;

    console.log('Proxying request to:', apiUrl);

    try {
        // 构造请求选项
        const requestOptions = {
            method: httpMethod,
            headers: {
                'Authorization': headers.authorization || headers.Authorization,
                'Content-Type': headers['content-type'] || 'application/json',
            }
        };

        // 如果是POST/PUT请求，添加body
        if (httpMethod === 'POST' || httpMethod === 'PUT') {
            requestOptions.body = body;
        }

        // 发送请求到飞书API
        const response = await fetch(apiUrl, requestOptions);
        const data = await response.text();

        // 处理图片等二进制数据
        const contentType = response.headers.get('content-type');
        let responseBody = data;

        if (contentType && contentType.startsWith('image/')) {
            // 对于图片，返回base64编码
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            responseBody = `data:${contentType};base64,${base64}`;
        } else {
            try {
                // 尝试解析为JSON
                JSON.parse(data);
                responseBody = data;
            } catch (e) {
                // 如果不是JSON，直接返回原始数据
                responseBody = data;
            }
        }

        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Content-Type': contentType || 'application/json'
            },
            body: responseBody
        };

    } catch (error) {
        console.error('Proxy error:', error);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Proxy error',
                message: error.message
            })
        };
    }
}; 