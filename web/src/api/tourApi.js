import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/tours"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

// 🔧 AXIOS INSTANCE
const client = axios.create({
  baseURL: API_URL,
})

// 🔐 attach token
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ❗ handle errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("Tour API Error:", err.response || err.message)
    return Promise.reject(err)
  }
)

// ======================
// 🟢 GET ALL TOURS
// ======================
export const getAllToursApi = async () => {
  const res = await client.get("")
  return res.data
}

// ======================
// 🟢 GET TOUR BY ID
// ======================
export const getTourByIdApi = async (id) => {
  const res = await client.get(`/${id}`)
  return res.data
}

// ======================
// 🟢 CREATE TOUR
// ======================
export const createTourApi = async (data) => {
  const res = await client.post("", data)
  return res.data
}

// ======================
// 🟢 UPDATE TOUR
// ======================
export const updateTourApi = async (id, data) => {
  const res = await client.put(`/${id}`, data)
  return res.data
}

// ======================
// 🟢 DELETE TOUR
// ======================
export const deleteTourApi = async (id) => {
  await client.delete(`/${id}`)
}

// ======================
// 🟢 ADD POI TO TOUR
// ======================
export const addPoiToTourApi = async (tourId, data) => {
  await client.post(`/${tourId}/pois`, data)
}

// ======================
// 🟢 REMOVE POI FROM TOUR
// ======================
export const removePoiFromTourApi = async (tourId, poiId) => {
  await client.delete(`/${tourId}/pois/${poiId}`)
}
