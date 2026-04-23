import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/location-logs"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

const client = axios.create({
  baseURL: API_URL,
})

// 🔐 REQUEST INTERCEPTOR
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 🔥 RESPONSE INTERCEPTOR
client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("LOCATION LOG API ERROR:", err.response || err.message)
    return Promise.reject(err)
  }
)

// ======================
// 📍 GET PAGED LOGS
// ======================
export const getLocationLogs = async (page = 1, pageSize = 10) => {
  try {
    const res = await client.get("", {
      params: { page, pageSize }
    })
    return res.data
  } catch (err) {
    console.error("GET LOCATION LOGS ERROR:", err)
    throw err
  }
}

// ======================
// 📊 GET STATS
// ======================
export const getLocationStats = async () => {
  try {
    const res = await client.get("/stats")
    return res.data
  } catch (err) {
    console.error("GET LOCATION STATS ERROR:", err)
    throw err
  }
}