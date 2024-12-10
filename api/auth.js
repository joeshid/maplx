// 阿里云API配置
import config from '../config.js'
const API_KEY = config.ALIYUN_API_KEY

/**
 * 获取认证头信息
 * @returns {string} 认证头
 */
export function getAuthHeader() {
    return `Bearer ${API_KEY}`
}

// 导出API Key以供其他模块使用
export const apiKey = API_KEY
