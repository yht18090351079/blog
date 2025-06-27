# 飞书文档浏览器

一个基于HTML、CSS、JavaScript的飞书文档浏览器，可以从飞书知识库获取并展示文档内容。

## 功能特性

- 📋 获取飞书知识空间的文档列表
- 📄 展示完整的文档内容，包括：
  - 文本内容（支持各种格式）
  - 标题（1-9级标题）
  - 引用块
  - 高亮块（Callout）
  - 表格
  - 图片
  - 内嵌内容（iframe）
  - 分栏布局
  - 等等...
- 🎨 现代化的UI设计
- 📱 响应式布局，支持移动端
- ⚡ 异步加载，提升用户体验

## 文件结构

```
├── index.html          # 主HTML页面
├── styles.css          # 样式文件
├── config.js           # 配置文件
├── feishu-api.js       # 飞书API接口封装
├── document-renderer.js # 文档渲染器
├── app.js              # 主应用逻辑
├── cors-proxy.js       # CORS代理服务器（可选）
└── README.md           # 说明文档
```

## 快速开始

### 1. 配置API信息

编辑 `config.js` 文件，填入你的飞书应用信息：

```javascript
const CONFIG = {
    APP_ID: 'your_app_id',
    APP_SECRET: 'your_app_secret', 
    USER_ACCESS_TOKEN: 'your_user_access_token',
    SPACE_ID: 'your_space_id'
};
```

### 2. 解决CORS问题

由于浏览器的同源策略，直接访问飞书API会遇到CORS问题。有以下几种解决方案：

#### 方案1: 使用CORS代理服务器（推荐）

1. 安装Node.js
2. 运行代理服务器：
   ```bash
   node cors-proxy.js
   ```
3. 在 `config.js` 中启用代理：
   ```javascript
   USE_PROXY: true,
   PROXY_URL: 'http://localhost:3000'
   ```

#### 方案2: 使用浏览器插件

安装CORS插件（如"CORS Unblock"）并启用。

#### 方案3: 使用Chrome启动参数

使用以下参数启动Chrome：
```bash
chrome --disable-web-security --user-data-dir="[临时目录路径]"
```

### 3. 运行应用

1. 将所有文件放在同一目录下
2. 启动一个本地HTTP服务器：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (需要安装http-server)
   npx http-server
   ```
3. 在浏览器中访问 `http://localhost:8000`

## 支持的文档块类型

- ✅ 文本块（Text）
- ✅ 标题块（Heading 1-9）
- ✅ 引用块（Quote）
- ✅ 高亮块（Callout）
- ✅ 表格（Table）
- ✅ 图片（Image）
- ✅ 内嵌内容（Iframe）
- ✅ 分栏布局（Grid）
- ✅ 分割线（Divider）
- ⚠️ 多维表格（Bitable）- 基本支持
- ⚠️ 电子表格（Sheet）- 基本支持
- ❌ 其他高级块类型 - 待支持

## 文本样式支持

- ✅ 粗体、斜体、下划线、删除线
- ✅ 内联代码
- ✅ 字体颜色
- ✅ 超链接
- ✅ @用户提及
- ✅ @文档提及
- ✅ 对齐方式

## 注意事项

1. **用户访问令牌**: 当前使用硬编码的用户访问令牌，在生产环境中应该使用OAuth流程获取。

2. **权限控制**: 确保使用的用户访问令牌有权限访问指定的知识空间。

3. **CORS限制**: 浏览器的CORS限制是主要的技术挑战，建议使用代理服务器解决。

4. **图片访问**: 飞书图片需要通过API获取，可能加载较慢。

5. **API限制**: 飞书API有调用频率限制，请避免频繁请求。

## 故障排除

### 无法加载文档列表

1. 检查网络连接
2. 确认API配置信息正确
3. 检查用户访问令牌是否有效
4. 确认CORS问题已解决

### 文档内容显示异常

1. 查看浏览器控制台的错误信息
2. 确认文档块数据结构
3. 检查渲染器是否支持该块类型

### 图片无法显示

1. 确认图片token有效
2. 检查用户访问令牌权限
3. 查看网络请求是否成功

## 开发说明

### 扩展新的块类型

在 `document-renderer.js` 中添加新的渲染方法：

```javascript
// 在renderBlock方法的switch语句中添加新case
case 'new_block_type':
    await this.renderNewBlockType(block, element);
    break;

// 实现具体的渲染方法
async renderNewBlockType(block, element) {
    // 渲染逻辑
}
```

### 添加新的样式

在 `styles.css` 中添加对应的CSS样式：

```css
.block-new-type {
    /* 样式定义 */
}
```

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License 