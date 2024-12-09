<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePoiStore } from '@/stores/poi.js'
import GuideExplanation from '@/components/GuideExplanation.vue'

const poiStore = usePoiStore()
const mapRef = ref(null)
const latitude = ref(31.38475)
const longitude = ref(120.98181)
const scale = ref(14)
const guideVisible = ref(false)
const selectedPOI = ref(null)

// 监听POI选择变化
watch(() => poiStore.selectedPoi, (newPoi) => {
    console.log('选中的POI变化:', newPoi)
    selectedPOI.value = newPoi
})

// 初始化地图
const initMap = async () => {
    console.log('开始初始化地图')
    try {
        // 先获取位置权限
        const settingRes = await uni.getSetting()
        if (!settingRes.authSetting['scope.userLocation']) {
            const authRes = await uni.authorize({
                scope: 'scope.userLocation'
            })
            console.log('位置权限授权结果:', authRes)
        }

        // 获取位置
        const locationRes = await uni.getLocation({
            type: 'gcj02',
            isHighAccuracy: true,
            highAccuracyExpireTime: 3000
        })
        
        console.log('获取位置成功:', locationRes)
        latitude.value = locationRes.latitude
        longitude.value = locationRes.longitude
        
        // 获取地图上下文
        mapRef.value = uni.createMapContext('map')
    } catch (error) {
        console.error('初始化地图失败:', error)
        uni.showToast({
            title: '获取位置失败，请检查位置权限',
            icon: 'none'
        })
    }
}

// 移动到当前位置
const moveToLocation = async () => {
    try {
        // 检查权限
        const settingRes = await uni.getSetting()
        if (!settingRes.authSetting['scope.userLocation']) {
            await uni.authorize({
                scope: 'scope.userLocation'
            })
        }
        
        // 获取位置
        uni.showLoading({
            title: '定位中...'
        })
        
        const res = await uni.getLocation({
            type: 'gcj02',
            isHighAccuracy: true
        })
        
        console.log('获取位置成功:', res)
        
        // 更新地图中心点并移动
        if (mapRef.value) {
            mapRef.value.moveToLocation({
                latitude: res.latitude,
                longitude: res.longitude,
                success: () => {
                    latitude.value = res.latitude
                    longitude.value = res.longitude
                }
            })
        }
        
        uni.hideLoading()
        
        // 显示成功提示
        uni.showToast({
            title: '定位成功',
            icon: 'success'
        })
    } catch (error) {
        console.error('定位失败:', error)
        uni.hideLoading()
        uni.showModal({
            title: '定位失败',
            content: '请检查是否授予了位置权限',
            showCancel: false
        })
    }
}

// 获取当前地图视野内的POI
const searchInViewPOIs = async () => {
    if (!mapRef.value) return
    
    try {
        uni.showLoading({
            title: '搜索中...'
        })
        
        // 获取当前地图视野范围
        const { northeast, southwest } = await new Promise((resolve, reject) => {
            mapRef.value.getRegion({
                success: (res) => resolve(res),
                fail: (err) => reject(err)
            })
        })
        
        // 搜索视野内的POI
        await poiStore.searchPoisInRegion({
            northeast,
            southwest
        })
        
        uni.hideLoading()
    } catch (error) {
        console.error('搜索POI失败:', error)
        uni.hideLoading()
        uni.showToast({
            title: '搜索失败，请重试',
            icon: 'none'
        })
    }
}

// 监听地图区域变化
const onRegionChange = (e) => {
    console.log('地图区域变化:', e)
}

// 顶部搜索栏点击
const onSearchTap = () => {
    searchInViewPOIs()
}

// 放大地图
const zoomIn = () => {
    if (scale.value < 20) {
        scale.value++
    }
}

// 缩小地图
const zoomOut = () => {
    if (scale.value > 3) {
        scale.value--
    }
}

// 标记点击事件
function onMarkerTap(e) {
    console.log('点击标记:', e.detail.markerId)
    const poi = poiStore.pois[e.detail.markerId]
    if (poi) {
        console.log('选中POI:', poi)
        poiStore.selectPoi(poi)
        selectedPOI.value = poi
    }
}

// 标记被选中
function onMarkerSelected(e) {
    console.log('选中标记:', e.detail.markerId)
    const poi = poiStore.pois[e.detail.markerId]
    if (poi) {
        console.log('选中POI:', poi)
        poiStore.selectPoi(poi)
        selectedPOI.value = poi
    }
}

// 气泡点击事件
const onCalloutTap = (e) => {
    console.log('点击气泡:', e.detail)
    const poi = poiStore.pois[e.detail.markerId]
    if (poi) {
        poiStore.selectPoi(poi)
        selectedPOI.value = poi
    }
}

// 显示路线
const showRoute = () => {
    if (poiStore.selectedPoi) {
        uni.openLocation({
            latitude: poiStore.selectedPoi.latitude,
            longitude: poiStore.selectedPoi.longitude,
            name: poiStore.selectedPoi.title,
            address: poiStore.selectedPoi.address,
            success: () => {
                console.log('打开导航成功')
            },
            fail: (error) => {
                console.error('打开导航失败:', error)
                uni.showToast({
                    title: '打开导航失败',
                    icon: 'none'
                })
            }
        })
    }
}

// 收藏POI
const collectPoi = () => {
    uni.showToast({
        title: '收藏成功',
        icon: 'success'
    })
}

// 显示导游解说信息
const showGuideInfo = () => {
    if (!poiStore.selectedPoi) {
        console.log('No POI selected')
        return
    }
    console.log('Showing guide info for POI:', poiStore.selectedPoi)
    guideVisible.value = true
}

onMounted(() => {
    console.log('组件挂载完成')
    initMap()
})
</script>

<template>
    <view class="container">
        <!-- 顶部搜索栏 -->
        <view class="search-bar">
            <view class="search-item" @tap="onSearchTap">当前区域景点</view>
            <view class="search-item">{{ poiStore.searchRadius / 1000 }}km</view>
            <view class="search-item">更多筛选</view>
        </view>

        <map
            id="map"
            ref="mapRef"
            class="map"
            :latitude="latitude"
            :longitude="longitude"
            :markers="poiStore.markers"
            :scale="scale"
            show-location
            @markertap="onMarkerTap"
            @callouttap="onCalloutTap"
            @regionchange="onRegionChange"
            @markerselected="onMarkerSelected"
        >
            <!-- 地图控件 -->
            <cover-view class="map-controls">
                <cover-view class="control-btn" @tap="moveToLocation">
                    <cover-image src="/static/location.png" class="control-icon" />
                </cover-view>
                <cover-view class="control-btn" @tap="zoomIn">
                    <cover-view class="zoom-text">+</cover-view>
                </cover-view>
                <cover-view class="control-btn" @tap="zoomOut">
                    <cover-view class="zoom-text">-</cover-view>
                </cover-view>
            </cover-view>
        </map>
        
        <!-- POI详情卡片 -->
        <view class="poi-detail" v-if="poiStore.selectedPoi">
            <view class="poi-card">
                <view class="poi-header">
                    <view class="title-container">
                        <text class="poi-title">{{ poiStore.selectedPoi.title }}</text>
                        <text class="poi-distance">{{ (poiStore.selectedPoi.distance / 1000).toFixed(1) }}km</text>
                    </view>
                    <view class="action-icons">
                        <button class="icon-btn" @tap="showRoute" show-tooltip hover-class="icon-hover">
                            <image src="/static/route.png" mode="aspectFit" class="action-icon"/>
                            <text class="icon-tooltip">路线</text>
                        </button>
                        <button class="icon-btn" @tap="collectPoi" show-tooltip hover-class="icon-hover">
                            <image src="/static/collect.png" mode="aspectFit" class="action-icon"/>
                            <text class="icon-tooltip">收藏</text>
                        </button>
                        <button class="icon-btn" @tap="showGuideInfo" show-tooltip hover-class="icon-hover">
                            <image src="/static/guide.png" mode="aspectFit" class="action-icon"/>
                            <text class="icon-tooltip">解说</text>
                        </button>
                    </view>
                </view>
                <view class="poi-info">
                    <view class="info-row">
                        <image src="/static/location-pin.png" mode="aspectFit" class="info-icon"/>
                        <text class="poi-address">{{ poiStore.selectedPoi.address }}</text>
                    </view>
                    <view class="info-row" v-if="poiStore.selectedPoi.rating">
                        <image src="/static/star.png" mode="aspectFit" class="info-icon"/>
                        <text class="rating-text">{{ poiStore.selectedPoi.rating }}分</text>
                    </view>
                </view>
            </view>
        </view>
        
        <!-- 导游解说面板 -->
        <GuideExplanation 
            :visible="guideVisible" 
            :poi="poiStore.selectedPoi || null"
            @update:visible="guideVisible = $event" 
        />
    </view>
</template>

<style>
.container {
    width: 100%;
    height: 100vh;
    position: relative;
}

.map {
    width: 100%;
    height: 100%;
}

.search-bar {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    background: #fff;
    border-radius: 8px;
    padding: 8px;
    display: flex;
    justify-content: space-around;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-item {
    font-size: 14px;
    color: #333;
    padding: 4px 12px;
}

.map-controls {
    position: fixed;
    right: 20px;
    bottom: 200px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.control-btn {
    width: 40px;
    height: 40px;
    background: #fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.control-icon {
    width: 24px;
    height: 24px;
}

.zoom-text {
    font-size: 20px;
    color: #333;
    font-weight: bold;
}

.poi-detail {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 1000;
}

.poi-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.poi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.title-container {
    flex: 1;
    margin-right: 12px;
}

.poi-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
}

.poi-distance {
    font-size: 12px;
    color: #666;
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 12px;
}

.action-icons {
    display: flex;
    gap: 12px;
}

.icon-btn {
    position: relative;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
}

.icon-btn::after {
    border: none;
}

.icon-hover {
    background: #e0e0e0;
}

.action-icon {
    width: 20px;
    height: 20px;
}

.icon-tooltip {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
}

.icon-hover .icon-tooltip {
    opacity: 1;
}

.icon-tooltip::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid rgba(0,0,0,0.7);
}

.poi-info {
    margin-top: 12px;
}

.info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.info-icon {
    width: 16px;
    height: 16px;
    opacity: 0.7;
}

.poi-address {
    font-size: 14px;
    color: #666;
    flex: 1;
}

.rating-text {
    font-size: 14px;
    color: #ff9800;
    font-weight: bold;
}
</style>
