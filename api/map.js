// 腾讯地图WebService API
const KEY = 'V23BZ-6OH6V-U7UPT-57F57-UGU2Q-V7BYW' // 替换为你的腾讯地图Key
const BASE_URL = 'https://apis.map.qq.com/ws'

// 坐标转换（GCJ02 to BD09）
const convertCoord = (latitude, longitude) => {
    return {
        latitude,
        longitude
    }
}

// 搜索POI
export const searchPOI = (keyword, location, radius = 30000) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${BASE_URL}/place/v1/search`,
            method: 'GET',
            data: {
                key: KEY,
                keyword: keyword,
                boundary: `nearby(${location.latitude},${location.longitude},${radius})`,
                page_size: 20,
                page_index: 1,
                orderby: '_distance'
            },
            success: (res) => {
                if (res.data.status === 0) {
                    const pois = res.data.data.map(item => ({
                        id: item.id,
                        title: item.title,
                        latitude: item.location.lat,
                        longitude: item.location.lng,
                        address: item.address,
                        distance: (item._distance / 1000).toFixed(1)
                    }))
                    resolve(pois)
                } else {
                    reject(new Error(res.data.message))
                }
            },
            fail: reject
        })
    })
}

// 搜索周边POI
export const searchNearbyPOI = async (location, radius = 30000) => {
    try {
        const { latitude, longitude } = location
        console.log('开始搜索POI, 位置:', latitude, longitude, '半径:', radius)
        
        // 构建请求URL，使用更简单的参数
        const url = `https://apis.map.qq.com/ws/place/v1/search?boundary=nearby(${latitude},${longitude},${radius})&keyword=景点&page_size=20&key=${KEY}`
        
        console.log('请求URL:', url)
        
        // 发起请求
        const response = await new Promise((resolve, reject) => {
            uni.request({
                url,
                method: 'GET',
                success: (res) => {
                    console.log('搜索POI原始响应:', res)
                    resolve(res)
                },
                fail: (err) => {
                    console.error('搜索POI请求失败:', err)
                    reject(err)
                }
            })
        })
        
        // 检查响应状态
        if (response.statusCode === 200) {
            console.log('搜索POI响应数据:', response.data)
            
            if (response.data && response.data.status === 0) {
                const pois = response.data.data.map(item => ({
                    id: item.id || String(Math.random()),
                    title: item.title,
                    latitude: item.location.lat,
                    longitude: item.location.lng,
                    address: item.address || '',
                    distance: item._distance || 0,
                    rating: item.rating || 0
                }))
                
                console.log('解析到的POI列表:', pois)
                return pois
            } else {
                console.error('搜索POI业务错误:', response.data)
                uni.showToast({
                    title: '搜索景点失败：' + (response.data.message || '未知错误'),
                    icon: 'none'
                })
            }
        } else {
            console.error('搜索POI HTTP错误:', response.statusCode)
            uni.showToast({
                title: '搜索景点失败，请检查网络',
                icon: 'none'
            })
        }
        
        return []
    } catch (error) {
        console.error('搜索POI异常:', error)
        uni.showToast({
            title: '搜索景点时发生错误',
            icon: 'none'
        })
        return []
    }
}

// 获取路线规划
export const getRoute = (from, to) => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `https://apis.map.qq.com/ws/direction/v1/walking/?from=${from.latitude},${from.longitude}&to=${to.latitude},${to.longitude}&key=${KEY}`,
            success: (res) => {
                if (res.data.status === 0) {
                    resolve(res.data.result)
                } else {
                    reject(new Error(res.data.message))
                }
            },
            fail: reject
        })
    })
}
