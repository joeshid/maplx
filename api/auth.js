// 阿里云API配置
const API_KEY = 'sk-49302c14e5194e33967670b6e991ba0d'

/**
 * 获取认证头信息
 * @returns {string} 认证头
 */
export function getAuthHeader() {
    return `Bearer ${API_KEY}`
}

// 导出API Key以供其他模块使用
export const apiKey = API_KEY
