# Netlify 部署指南

## 📋 部署前准备

本应用已经配置好了Netlify部署所需的所有文件：

- `netlify.toml` - Netlify配置文件
- `netlify/functions/proxy.js` - Netlify Functions代理服务
- `package.json` - 项目依赖和脚本
- `.gitignore` - Git忽略文件

## 🚀 部署步骤

### 方式一：通过Git仓库部署（推荐）

1. **将代码推送到Git仓库**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **登录Netlify并连接仓库**
   - 访问 [Netlify](https://netlify.com)
   - 点击 "New site from Git"
   - 连接您的Git仓库（GitHub、GitLab或Bitbucket）
   - 选择此项目的仓库

3. **配置构建设置**
   - Build command: `npm run build`（可选，因为是静态文件）
   - Publish directory: `.`（根目录）
   - Functions directory: `netlify/functions`（自动检测）

4. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

### 方式二：直接拖拽部署

1. **准备文件**
   - 确保所有文件都在项目根目录
   - 不需要 `node_modules` 文件夹

2. **拖拽部署**
   - 访问 [Netlify](https://netlify.com)
   - 将整个项目文件夹拖拽到部署区域
   - 等待上传和部署完成

## ⚙️ 环境变量配置（可选）

如果您想要将敏感信息（如API密钥）放在环境变量中：

1. 在Netlify控制台中，进入 Site settings > Environment variables
2. 添加以下环境变量：
   - `FEISHU_APP_ID`: 您的飞书App ID
   - `FEISHU_APP_SECRET`: 您的飞书App Secret
   - `FEISHU_USER_TOKEN`: 您的用户访问令牌

然后修改 `config.js` 使用环境变量：
```javascript
APP_ID: process.env.FEISHU_APP_ID || 'cli_a8d4ae3326b8100b',
APP_SECRET: process.env.FEISHU_APP_SECRET || 'Lc3U2cR6tQ3g5LFWQCWARcrlfiAbIbpL',
```

## 🔍 本地测试

在部署前，您可以在本地测试Netlify Functions：

1. **安装Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **本地开发**
   ```bash
   netlify dev
   ```

3. **访问应用**
   - 打开浏览器访问显示的本地地址（通常是 `http://localhost:8888`）

## 🌟 部署后配置

1. **自定义域名**（可选）
   - 在Netlify控制台中设置自定义域名
   - 配置DNS记录

2. **HTTPS**
   - Netlify自动提供免费的SSL证书
   - 强制HTTPS重定向

3. **性能优化**
   - 启用资源压缩
   - 配置缓存策略

## 🔧 故障排除

### 常见问题

1. **Functions部署失败**
   - 检查 `netlify/functions/proxy.js` 文件语法
   - 确保Node.js版本兼容（>=18.0.0）

2. **API调用失败**
   - 检查网络连接
   - 验证飞书API凭据
   - 查看Netlify Functions日志

3. **CORS错误**
   - 确保使用了代理路径 `/api/*`
   - 检查 `config.js` 中的 `PROXY_URL` 设置

### 查看日志

在Netlify控制台中：
- Functions > [function-name] > 查看调用日志
- Site overview > Production deploys > 查看构建日志

## 📝 注意事项

1. **API限制**
   - 飞书API有调用频率限制
   - 用户访问令牌有有效期限制

2. **安全性**
   - 生产环境中应使用OAuth流程获取令牌
   - 不要在前端代码中硬编码敏感信息

3. **性能**
   - 图片会通过代理加载，可能影响加载速度
   - 考虑实现缓存机制

## 🎉 部署完成

部署成功后，您将获得：
- 一个自动生成的Netlify域名（如 `amazing-app-123456.netlify.app`）
- 自动HTTPS
- 全球CDN加速
- 自动部署（当推送到Git仓库时）

访问您的应用并测试所有功能是否正常工作！ 