import axios from "axios"

const API_URL = "http://localhost:5086/api/cms/accounts"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

// ======================
// 🔧 AXIOS INSTANCE
// ======================
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

// ❗ handle lỗi chung
client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("Account API Error:", err.response || err.message)

    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }

    return Promise.reject(err)
  }
)


// ======================
// 🟢 GET ALL
// ======================
export const getUsersApi = async () => {
  const res = await client.get("")
  return res.data
}


// ======================
// 🟢 GET BY ID
// ======================
export const getUserByIdApi = async (id) => {
  const res = await client.get(`/${id}`)
  return res.data
}


// ======================
// 🟢 CREATE (FULL FIELD)
// ======================
export const createUserApi = async (data) => {
  const res = await client.post("", {
    username: data.username,
    password: data.password,
    role: data.role,

    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.phoneNumber,
  })

  return res.data
}


// ======================
// 🟢 UPDATE (SAFE UPDATE)
// ======================
export const updateUserApi = async (id, data) => {
  const payload = {}

  // chỉ gửi field có giá trị (tránh ghi đè null)
  if (data.username !== undefined) payload.username = data.username
  if (data.password !== undefined) payload.password = data.password
  if (data.role !== undefined) payload.role = data.role

  if (data.fullName !== undefined) payload.fullName = data.fullName
  if (data.email !== undefined) payload.email = data.email
  if (data.phoneNumber !== undefined) payload.phoneNumber = data.phoneNumber
  if (data.isLocked !== undefined) payload.isLocked = data.isLocked

  const res = await client.put(`/${id}`, payload)
  return res.data
}


// ======================
// 🟢 DELETE
// ======================
export const deleteUserApi = async (id) => {
  const res = await client.delete(`/${id}`)
  return res.data
}
