import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/analytics"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

const analyticsClient = axios.create({
  baseURL: API_URL,
})

// 👉 Gắn token
analyticsClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 👉 Handle lỗi
analyticsClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("Analytics API Error:", err.response || err.message)

    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      sessionStorage.removeItem("token")
      window.location.href = "/login"
    }

    return Promise.reject(err)
  }
)

/**
 * 🔥 Top POIs
 */
export const getTopPOIs = async (top = 10) => {
  try {
    const res = await analyticsClient.get(`/top-pois?top=${top}`)
    return Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error("Error fetching top POIs:", error)
    return []
  }
}

/**
 * 🔥 Heatmap
 */
export const getHeatmap = async () => {
  try {
    const res = await analyticsClient.get(`/heatmap`)
    return res.data
  } catch (error) {
    console.error("Error fetching heatmap:", error)
    return []
  }
}

/**
 * 🔥 Heatmap theo thời gian (ngày + giờ)
 */
export const getHeatmapByTime = async (date = null, hour = null) => {
  try {
    let url = `/heatmap-by-time`
    const params = []
    
    if (date) params.push(`date=${encodeURIComponent(date)}`)
    if (hour !== null && hour >= 0 && hour < 24) params.push(`hour=${hour}`)
    
    if (params.length > 0) {
      url += `?${params.join('&')}`
    }
    
    console.log(`📡 Calling heatmap-by-time API:`, url)
    const res = await analyticsClient.get(url)
    console.log(`📦 Heatmap response status:`, res.status, `Data count:`, res.data?.length || 0)
    return res.data
  } catch (error) {
    console.error("❌ Error fetching heatmap by time:", error.response?.status, error.message)
    console.error("Response data:", error.response?.data)
    return []
  }
}

/**
 * 🔥 Listen stats
 */
export const getListenStats = async (days = null) => {
  try {
    const url = days
      ? `/listen-stats?days=${days}`
      : `/listen-stats`

    const res = await analyticsClient.get(url)

    return {
      totalListens: res.data?.totalListens || 0,
      dailyListens: res.data?.dailyListens || []
    }
  } catch (error) {
    console.error("Error fetching listen stats:", error)

    return {
      totalListens: 0,
      dailyListens: []
    }
  }
}

/**
 * 🔥 Device Activity Timeline
 * GET /api/cms/analytics/devices/{deviceId}/activity?days=7
 */
export const getDeviceActivity = async (deviceId, days = 7) => {
  try {
    const res = await analyticsClient.get(`/devices/${encodeURIComponent(deviceId)}/activity?days=${days}`)
    return res.data
  } catch (error) {
    console.error("Error fetching device activity:", error)
    return null
  }
}