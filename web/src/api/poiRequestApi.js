// import axios from "axios"

// const API_URL = "http://localhost:5086/api"

// const getToken = () =>
//   localStorage.getItem("token") || sessionStorage.getItem("token")

// // GET POI REQUESTS FOR CURRENT OWNER
// export const getMyPoiRequests = async (status = null) => {
//   const params = new URLSearchParams()
//   if (status) {
//     params.append("status", status)
//   }

//   const res = await axios.get(
//     `${API_URL}/cms/pois/requests/my-requests${params.toString() ? "?" + params.toString() : ""}`,
//     {
//       headers: {
//         Authorization: `Bearer ${getToken()}`
//       }
//     }
//   )
//   return res.data
// }

// // GET POI REQUEST DETAIL BY REQUEST ID
// export const getPoiRequestDetail = async (requestId) => {
//   const res = await axios.get(
//     `${API_URL}/cms/pois/requests/${requestId}`,
//     {
//       headers: {
//         Authorization: `Bearer ${getToken()}`
//       }
//     }
//   )
//   return res.data
// }

// export const createPoiRequest = async (data) => {
//   const res = await axios.post(
//     `${API_URL}/cms/pois/requests`,
//     data,
//     {
//       headers: {
//         Authorization: `Bearer ${getToken()}`
//       }
//     }
//   )
//   return res.data
// }
import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/pois"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

// ======================
// 🔧 AXIOS INSTANCE
// ======================
const client = axios.create({
  baseURL: API_URL,
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("POI REQUEST API ERROR:", err.response || err.message)
    return Promise.reject(err)
  }
)

// ======================
// 🟢 OWNER APIs
// ======================

// GET MY REQUESTS
export const getMyPoiRequests = async (status = null) => {
  const params = new URLSearchParams()
  if (status) params.append("status", status)

  const res = await client.get(
    `/requests/my-requests${params.toString() ? "?" + params.toString() : ""}`
  )
  return res.data
}

// GET REQUEST DETAIL
export const getPoiRequestDetail = async (requestId) => {
  const res = await client.get(`/requests/${requestId}`)
  return res.data
}

// CREATE REQUEST (CREATE / UPDATE / DELETE)
export const createPoiRequest = async (data) => {
  const res = await client.post(`/requests`, data)
  return res.data
}

// ======================
// 🔴 ADMIN APIs
// ======================

// GET ALL REQUESTS (default: PENDING)
export const getAllPoiRequests = async (status = "PENDING") => {
  const res = await client.get(`/requests`, {
    params: { status }
  })
  return res.data
}

// REVIEW REQUEST (APPROVE / REJECT)
export const reviewPoiRequest = async (requestId, data) => {
  // data = { approved: true/false, rejectReason: "" }
  const res = await client.put(
    `/requests/${requestId}/review`,
    data
  )
  return res.data
}

// ======================
// 📊 STATS API (ADMIN DASHBOARD)
// ======================
export const getPoiRequestStats = async () => {
  const res = await client.get(`/requests/stats`)
  return res.data
}