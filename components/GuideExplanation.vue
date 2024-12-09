<template>
    <view v-if="props.visible" class="guide-explanation">
        <!-- 标题栏 -->
        <view class="header">
            <view class="controls">
                <button class="voice-btn male" 
                        @click="playVoice('male')"
                        :disabled="isPlaying">
                    <text class="iconfont" :class="{'icon-loading': isPlaying && currentVoice === 'male'}">
                        {{ isPlaying && currentVoice === 'male' ? '🔄' : '👨' }}
                    </text>
                </button>
                <button class="voice-btn female" 
                        @click="playVoice('female')"
                        :disabled="isPlaying">
                    <text class="iconfont" :class="{'icon-loading': isPlaying && currentVoice === 'female'}">
                        {{ isPlaying && currentVoice === 'female' ? '🔄' : '👩' }}
                    </text>
                </button>
                <button class="voice-btn copy" 
                        @click="copyExplanation" 
                        :disabled="!explanation">
                    <text class="iconfont icon-copy">📋</text>
                </button>
                <button class="voice-btn regenerate" 
                        @click="regenerateExplanation" 
                        :disabled="isGenerating">
                    <text class="iconfont">🔄</text>
                </button>
            </view>
            <view class="language-selector">
                <picker class="language-picker" 
                        :value="languages.indexOf(currentLanguage)" 
                        :range="languages" 
                        @change="onLanguageChange">
                    <view class="picker-text">
                        {{ currentLanguage }}
                    </view>
                </picker>
            </view>
            <text class="close" @click="closePopup">×</text>
        </view>
        
        <!-- 加载状态 -->
        <view v-if="isGenerating" class="loading">
            <text class="loading-text">{{ loadingTips }}</text>
        </view>
        
        <!-- 错误提示 -->
        <view v-else-if="error" class="error">
            {{ error }}
        </view>
        
        <!-- 内容区域 -->
        <view v-else-if="explanation" class="content">
            <!-- 解说词 -->
            <scroll-view class="explanation-text" scroll-y>
                <text user-select class="explanation-content">{{ explanation }}</text>
            </scroll-view>
        </view>
    </view>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { generateGuideExplanation } from '../api/guide.js'
import { synthesizeVoice } from '../api/voice.js'

const props = defineProps({
    poi: {
        type: Object,
        required: true,
        default: () => ({})
    },
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:visible'])

// 状态变量
const isGenerating = ref(false)
const isPlaying = ref(false)
const currentVoice = ref('')
const audioPlayer = ref(null)
const explanation = ref('')
const error = ref('')
const loadingTips = ref('正在生成解说词...')
const currentLanguage = ref('中文')
const languages = ['中文', 'English']

// 缓存key
const getCacheKey = (poi) => {
    return `guide_explanation_${poi.id}_${currentLanguage.value}`
}

// 从缓存获取解说词
const getExplanationFromCache = () => {
    const key = getCacheKey(props.poi)
    return uni.getStorageSync(key)
}

// 保存解说词到缓存
const saveExplanationToCache = (text) => {
    const key = getCacheKey(props.poi)
    uni.setStorageSync(key, text)
}

// 监听POI变化
watch(
    () => props.poi,
    async (newPoi) => {
        console.log('POI changed:', newPoi)
        if (!newPoi || Object.keys(newPoi).length === 0) {
            explanation.value = ''
            return
        }
        
        if (props.visible) {
            await generateNewExplanation()
        }
    },
    { deep: true }
)

// 监听可见性变化
watch(
    () => props.visible,
    async (newVisible) => {
        console.log('Visibility changed:', newVisible, 'POI:', props.poi)
        if (newVisible && props.poi && Object.keys(props.poi).length > 0) {
            await initExplanation()
        }
    }
)

// 初始化解说词
const initExplanation = async () => {
    // 先尝试从缓存获取
    const cachedExplanation = getExplanationFromCache()
    if (cachedExplanation) {
        explanation.value = cachedExplanation
    } else {
        // 如果缓存中没有，则生成新的
        await generateNewExplanation()
    }
}

// 生成新的解说词
async function generateNewExplanation() {
    if (!props.poi || Object.keys(props.poi).length === 0) {
        console.log('No POI available')
        return
    }
    
    isGenerating.value = true
    error.value = ''
    
    try {
        console.log('Generating explanation for:', props.poi)
        const result = await generateGuideExplanation(props.poi, currentLanguage.value === '中文' ? 'zh' : 'en')
        explanation.value = result?.text || ''
        // 保存到缓存
        saveExplanationToCache(result?.text || '')
    } catch (err) {
        console.error('Failed to generate explanation:', err)
        error.value = '生成解说失败，请稍后重试'
        explanation.value = ''
    } finally {
        isGenerating.value = false
    }
}

// 重新生成解说词
const regenerateExplanation = () => {
    generateNewExplanation()
}

// 语言切换
function onLanguageChange(e) {
    if (!e.detail || typeof e.detail.value !== 'number') return
    currentLanguage.value = languages[e.detail.value]
    if (props.poi && Object.keys(props.poi).length > 0) {
        generateNewExplanation()
    }
}

// 复制解说词
async function copyExplanation() {
    if (!explanation.value) return
    
    try {
        await uni.setClipboardData({
            data: explanation.value,
            success: () => {
                uni.showToast({
                    title: '复制成功',
                    icon: 'success',
                    duration: 2000
                })
            }
        })
    } catch (err) {
        console.error('Failed to copy:', err)
        uni.showToast({
            title: '复制失败',
            icon: 'none'
        })
    }
}

// 播放语音
async function playVoice(gender) {
    if (!explanation.value || isPlaying.value) return
    
    try {
        isPlaying.value = true
        currentVoice.value = gender
        loadingTips.value = '正在生成语音...'
        
        // 停止当前正在播放的音频
        if (audioPlayer.value) {
            audioPlayer.value.pause()
            audioPlayer.value = null
        }
        
        // 生成语音
        const audioBlob = await synthesizeVoice(explanation.value, gender)
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // 创建新的音频播放器
        audioPlayer.value = new Audio(audioUrl)
        
        // 监听播放结束事件
        audioPlayer.value.onended = () => {
            isPlaying.value = false
            currentVoice.value = ''
            URL.revokeObjectURL(audioUrl)
        }
        
        // 开始播放
        await audioPlayer.value.play()
        
        uni.showToast({
            title: '开始播放',
            icon: 'success'
        })
    } catch (err) {
        console.error('播放语音失败:', err)
        isPlaying.value = false
        currentVoice.value = ''
        
        uni.showToast({
            title: '播放失败',
            icon: 'none'
        })
    }
}

function closePopup() {
    emit('update:visible', false)
}
</script>

<style>
.guide-explanation {
    position: fixed;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    width: 90%;
    max-width: 600px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    padding: 15px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    position: relative;
    padding-right: 30px; /* 为关闭按钮留出空间 */
}

.controls {
    display: flex;
    gap: 8px;
}

.language-selector {
    flex-shrink: 0;
    margin-left: auto;
    margin-right: 10px;
}

.language-picker {
    font-size: 14px;
    padding: 4px 8px;
    background: #f5f5f5;
    border-radius: 4px;
    max-width: 80px; /* 限制选择器宽度 */
}

.picker-text {
    font-size: 14px;
    color: #666;
}

.close {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    font-size: 20px;
    color: #999;
    cursor: pointer;
    z-index: 1;
}

.close:hover {
    color: #666;
}

.voice-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #f5f5f5;
    padding: 0;
}

.voice-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.voice-btn:not(:disabled):hover {
    background: #e8e8e8;
}

.icon-loading {
    display: inline-block;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.loading {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
}

.loading-text {
    color: #666;
    font-size: 13px;
}

.error {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ff4d4f;
    text-align: center;
    padding: 15px;
    font-size: 13px;
    min-height: 100px;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 100px;
    -webkit-overflow-scrolling: touch;
}

.content::-webkit-scrollbar {
    display: none; /* 隐藏滚动条 */
}

.explanation-text {
    flex: 1;
    padding: 10px 5px;
    padding-right: 15px; /* 增加右侧内边距 */
}

.explanation-content {
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
    text-align: justify;
    color: #333;
    font-size: 13px;
    line-height: 1.6;
    padding-right: 10px; /* 确保文字不会被遮挡 */
}
</style>
