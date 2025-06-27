// 飞书API配置
const CONFIG = {
    // 飞书应用信息
    APP_ID: 'cli_a8d4ae3326b8100b',
    APP_SECRET: 'Lc3U2cR6tQ3g5LFWQCWARcrlfiAbIbpL',

    // 用户访问令牌 - 注意：在实际生产环境中，这应该通过OAuth流程获取
    USER_ACCESS_TOKEN: 'u-fIxh3wCld5FG0aQgpTOcJH4gnrUNl4EroG20ghg020HT',

    // 知识空间ID
    SPACE_ID: '7520465195491311619',

    // 飞书API基础URL
    API_BASE_URL: 'https://open.feishu.cn/open-apis',

    // 因为浏览器的CORS限制，需要使用代理服务器
    // 在Netlify部署时使用Netlify Functions
    USE_PROXY: true,
    PROXY_URL: '/api',

    // Emoji映射表（部分常用的）
    EMOJI_MAP: {
        'gift': '🎁',
        'round_pushpin': '📍',
        'warning': '⚠️',
        'information_source': 'ℹ️',
        'bulb': '💡',
        'bookmark': '🔖',
        'point_right': '👉',
        'star': '⭐',
        'fire': '🔥',
        'heart': '❤️',
        'thumbsup': '👍',
        'eyes': '👀',
        'thinking_face': '🤔',
        'rocket': '🚀',
        'chart_with_upwards_trend': '📈'
    }
};

// 获取Emoji字符
function getEmoji(emojiId) {
    return CONFIG.EMOJI_MAP[emojiId] || '📌';
}

// 获取API URL
function getApiUrl(endpoint) {
    if (CONFIG.USE_PROXY && CONFIG.PROXY_URL) {
        // 当使用代理时，只需要传递 endpoint，代理服务器会处理完整URL
        return `${CONFIG.PROXY_URL}/open-apis${endpoint}`;
    }
    return `${CONFIG.API_BASE_URL}${endpoint}`;
} 