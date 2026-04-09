import axios from "axios"

// 👉 Tạo instance riêng cho CMS API
const analyticsClient = axios.create({
  baseURL: "/api/cms/analytics",
})

// 👉 Interceptor: tự gắn token
analyticsClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") // hoặc useAuth của bạn
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 👉 Interceptor: handle lỗi chung
analyticsClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("Analytics API Error:", err.response || err.message)

    if (err.response?.status === 401) {
      // token hết hạn → logout
      localStorage.removeItem("token")
      window.location.href = "/login"
    }

    return Promise.reject(err)
  }
)

/**
 * 🔥 Lấy top POIs
 * @param {number} top
 */
export const getTopPOIs = async (top = 10) => {
  try {
    const res = await analyticsClient.get(`/top-pois?top=${top}`)
    // Ensure the response is an array
    return Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error("Error fetching top POIs:", error)
    return [] // Return an empty array on error
  }
}

/**
 * 🔥 Lấy heatmap data
 */
export const getHeatmap = async () => {
  const res = await analyticsClient.get(`/heatmap`)
  return res.data
}