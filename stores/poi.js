import { defineStore } from 'pinia'
import { searchNearbyPOI } from '../api/map.js'

export const usePoiStore = defineStore('poi', {
    state: () => ({
        pois: [],
        selectedPoi: null,
        searchRadius: 30000,
        loading: false
    }),
    
    actions: {
        // 搜索指定位置周边POI
        async searchPois(location) {
            console.log('搜索位置周边POIs:', location)
            this.loading = true
            try {
                const results = await searchNearbyPOI(location, this.searchRadius)
                console.log('获取到POI结果:', results)
                this.pois = results
            } catch (error) {
                console.error('获取POI失败:', error)
                uni.showToast({
                    title: '获取景点信息失败',
                    icon: 'none'
                })
            } finally {
                this.loading = false
            }
        },
        
        // 搜索地图视野内的POI
        async searchPoisInRegion({ northeast, southwest }) {
            console.log('搜索区域POIs:', { northeast, southwest })
            this.loading = true
            try {
                // 计算区域中心点
                const centerLat = (northeast.latitude + southwest.latitude) / 2
                const centerLng = (northeast.longitude + southwest.longitude) / 2
                
                // 计算搜索半径（取区域对角线的一半）
                const radius = Math.ceil(
                    Math.sqrt(
                        Math.pow((northeast.latitude - southwest.latitude) * 111000, 2) +
                        Math.pow((northeast.longitude - southwest.longitude) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
                    ) / 2
                )
                
                console.log('搜索中心点:', { latitude: centerLat, longitude: centerLng }, '半径:', radius)
                
                // 搜索POI
                const results = await searchNearbyPOI({
                    latitude: centerLat,
                    longitude: centerLng
                }, radius)
                
                // 过滤出视野范围内的POI
                this.pois = results.filter(poi => 
                    poi.latitude >= southwest.latitude &&
                    poi.latitude <= northeast.latitude &&
                    poi.longitude >= southwest.longitude &&
                    poi.longitude <= northeast.longitude
                )
                
                console.log('区域内POI数量:', this.pois.length)
            } catch (error) {
                console.error('搜索区域POI失败:', error)
                uni.showToast({
                    title: '搜索景点失败',
                    icon: 'none'
                })
            } finally {
                this.loading = false
            }
        },
        
        selectPoi(poi) {
            console.log('选中POI:', poi)
            this.selectedPoi = poi
        },
        
        clearSelection() {
            this.selectedPoi = null
        },
        
        setSearchRadius(radius) {
            this.searchRadius = radius
        }
    },
    
    getters: {
        markers: (state) => {
            console.log('生成地图标记, POI数量:', state.pois.length)
            return state.pois.map((poi, index) => ({
                id: index,
                latitude: poi.latitude,
                longitude: poi.longitude,
                title: poi.title,
                iconPath: '/static/marker.png',
                width: 24,
                height: 24,
                anchor: {
                    x: 0.5,
                    y: 1
                },
                callout: {
                    content: poi.title,
                    color: '#333333',
                    fontSize: 12,
                    borderRadius: 4,
                    bgColor: '#ffffff',
                    padding: 4,
                    display: 'MOUSEOVER',
                    textAlign: 'center'
                }
            }))
        }
    }
})
