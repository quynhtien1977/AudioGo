import axios from "axios"
import { getPoiDetail } from "./poiApi"

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

// GET ALL REQUESTS (default: PENDING, pass null to get all)
export const getAllPoiRequests = async (status = "PENDING") => {
  const params = {}
  if (status) {
    params.status = status
  }
  
  const res = await client.get(`/requests`, { params })
  return res.data
}

// GET ALL POI REQUESTS (tất cả statuses)
export const getAllPoiRequestsAll = async () => {
  try {
    const statuses = ["PENDING", "APPROVED", "REJECTED"]
    const results = await Promise.all(
      statuses.map(status => getAllPoiRequests(status))
    )
    // Merge and remove duplicates
    const allRequests = results.flat()
    const uniqueMap = new Map()
    allRequests.forEach(req => {
      uniqueMap.set(req.requestId, req)
    })
    return Array.from(uniqueMap.values())
  } catch (err) {
    console.error("getAllPoiRequestsAll error:", err)
    return []
  }
}

// REVIEW REQUEST (APPROVE / REJECT)
export const reviewPoiRequest = async (requestId, data) => {
  const res = await client.put(
    `/requests/${requestId}/review`,
    {
      Approved: data.approved,
      RejectReason: data.rejectReason || ""
    }
  )
  return res.data
}

// ======================
// 📊 STATS API
// ======================
export const getPoiRequestStats = async () => {
  const res = await client.get(`/requests/stats`)
  return res.data
}

// ======================
// 🔥 NEW: COMBINE API (QUAN TRỌNG)
// ======================
export const getPoiUpdateDetailApi = async (requestId) => {
  try {
    // 1. Lấy request
    const request = await getPoiRequestDetail(requestId)

    if (!request) throw new Error("Request not found")

    // 2. Parse proposedData
    let proposed = request.proposedData

    if (!proposed) proposed = {}

    if (typeof proposed === "string") {
      try {
        proposed = JSON.parse(proposed)
      } catch (err) {
        console.warn("Parse proposedData failed:", err)
        proposed = {}
      }
    }

    // 3. Lấy POI hiện tại
    const current = await getPoiDetail(request.poiId)

    // 4. Merge fallback (tránh thiếu field)
    const mergedProposed = {
      ...current,
      ...proposed
    }

    // 5. Return cho UI
    return {
      current,
      proposed: mergedProposed,
      requestId: request.id
    }

  } catch (err) {
    console.error("getPoiUpdateDetailApi error:", err)
    throw err
  }
}