import { getAuthHeader, apiKey } from './auth.js'

// 阿里云语音合成配置
const VOICE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/text2speech/tts'

const VOICE_CONFIGS = {
  male: {
    model: 'sambert-v1',
    format: 'wav',
    sample_rate: 24000,
    volume: 50,
    rate: 1,
    pitch: 1,
    voice_name: 'zhida'  // 男声
  },
  female: {
    model: 'sambert-v1',
    format: 'wav',
    sample_rate: 24000,
    volume: 50,
    rate: 1,
    pitch: 1,
    voice_name: 'zhiyan'  // 女声
  }
}

/**
 * 生成语音合成音频
 * @param {string} text 要合成的文本
 * @param {string} gender 性别 'male' | 'female'
 * @returns {Promise<Blob>} 音频数据
 */
export async function synthesizeVoice(text, gender = 'male') {
  try {
    const voiceConfig = VOICE_CONFIGS[gender]
    
    console.log('开始语音合成请求:', {
      url: VOICE_API_URL,
      text,
      config: voiceConfig
    })
    
    const response = await uni.request({
      url: VOICE_API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      data: {
        model: voiceConfig.model,
        input: {
          text
        },
        parameters: {
          ...voiceConfig,
          voice_name: voiceConfig.voice_name
        }
      }
    })

    console.log('语音合成响应:', response)
    
    if (response.statusCode !== 200) {
      console.log('语音合成错误响应:', response.data)
      throw new Error('语音合成失败: ' + (response.data.message || '未知错误'))
    }

    // 处理音频数据
    const audioData = response.data.output.audio
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '')
    const binaryData = uni.base64ToArrayBuffer(base64Data)
    
    console.log('语音合成成功')
    return new Blob([binaryData], { type: 'audio/wav' })
  } catch (error) {
    console.error('语音合成错误:', error)
    throw error
  }
}
