import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/categories"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

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

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("Category API Error:", err.response || err.message)
    return Promise.reject(err)
  }
)


// ======================
// 🟢 GET ALL
// ======================
export const getCategoriesApi = async () => {
  const res = await client.get("")
  return res.data
}


// ======================
// 🟢 CREATE
// ======================
export const createCategoryApi = async (data) => {
  const res = await client.post("", {
    name: data.name,
  })

  return res.data
}


// ======================
// 🟢 UPDATE
// ======================
export const updateCategoryApi = async (id, data) => {
  const res = await client.put(`/${id}`, {
    name: data.name,
    updatedAt: new Date(),
  })

  return res.data
}


// ======================
// 🟢 DELETE
// ======================
export const deleteCategoryApi = async (id) => {
  const res = await client.delete(`/${id}`)
  return res.data
}


// ======================
// 🟢 ADD POI TO CATEGORY
// ======================
export const addPoiToCategoryApi = async (categoryId, poiId) => {
  const res = await client.post(`/${categoryId}/pois`, poiId, {
    headers: { "Content-Type": "application/json" }
  })

  return res.data
}


// ======================
// 🟢 REMOVE POI FROM CATEGORY
// ======================
export const removePoiFromCategoryApi = async (categoryId, poiId) => {
  const res = await client.delete(`/${categoryId}/pois/${poiId}`)
  return res.data
}
