/**
 * API Keys Configuration
 * 此文件包含所有API密钥配置，不要上传到GitHub
 * 
 * 引用此配置的文件：
 * - api/auth.js: 使用 ALIYUN_API_KEY 进行认证
 * - api/guide.js: 使用 ALIYUN_API_KEY 调用通义千问API
 * - api/map.js: 使用 TENCENT_MAP_KEY 调用腾讯地图服务
 */

export default {
    // 阿里云/通义千问 API Key
    // 用于：
    // 1. 语音合成 (api/auth.js)
    // 2. AI 解说词生成 (api/guide.js)
    ALIYUN_API_KEY: 'your-aliyun-api-key',

    // 腾讯地图 Key
    // 用于：
    // 1. 地图服务 (api/map.js)
    // 2. POI搜索 (api/map.js)
    // 3. 路线规划 (api/map.js)
    TENCENT_MAP_KEY: 'your-tencent-map-key'
}
