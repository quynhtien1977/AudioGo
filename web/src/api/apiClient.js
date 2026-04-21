import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5086/api"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

const apiClient = axios.create({
  baseURL: API_URL,
})

// Tự động gắn JWT token vào mọi request
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Xử lý lỗi toàn cục
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API ERROR:", err.response?.status, err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default apiClient
