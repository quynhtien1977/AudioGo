import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/tours"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

// 🔧 AXIOS INSTANCE
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
export const getAllToursApi = async (includeInactive = true) => {
  const res = await client.get("", {
    params: { includeInactive }
  })
  return res.data
}

// ======================
// 🟢 GET TOUR BY ID
// ======================
export const getTourByIdApi = async (id) => {
  console.log("🔍 Fetching tour with ID:", id)
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
// 🟢 RESTORE TOUR
// ======================
export const restoreTourApi = async (id) => {
  await client.patch(`/${id}/restore`)
}

// ======================
// 🟢 ADD POI TO TOUR
// ======================
export const addPoiToTourApi = async (tourId, data) => {
  const res = await client.post(`/${tourId}/pois`, data)
  return res.data
}

// ======================
// 🟢 REMOVE POI FROM TOUR
// ======================
export const removePoiFromTourApi = async (tourId, poiId) => {
  await client.delete(`/${tourId}/pois/${poiId}`)
}

// ======================
// 🟢 REORDER POI IN TOUR
// ======================
export const reorderPoiInTourApi = async (tourId, pois) => {
  // Gọi API reorder cho mỗi POI với stepOrder mới
  for (const poi of pois) {
    await client.put(
      `/${tourId}/pois/${poi.poiId}/order`,
      poi.stepOrder
    )
  }
}
