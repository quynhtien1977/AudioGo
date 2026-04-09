import axios from "axios"

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

const api = axios.create({
  baseURL: "http://localhost:5086/api", // sửa lại nếu port khác
  headers: {
      Authorization: `Bearer ${getToken()}`
    } // tự động thêm token nếu đã đăng nhập
})

// =========================
// GET ALL IMAGES BY POI
// =========================
export const getGalleryByPOI = async (poiId) => {
  try {
    const res = await api.get(`/cms/pois/${poiId}/gallery`)

    return res.data.map((g) => ({
      imageId: g.imageId,
      poiId: g.poiId,
      imageUrl: g.imageUrl,
      sortOrder: g.sortOrder,
    }))
  } catch (err) {
    console.error("Error fetching gallery:", err)
    return []
  }
}

// =========================
// ADD IMAGE
// =========================
export const addGalleryImage = async (poiId, payload) => {
  try {
    const res = await api.post(`/cms/pois/${poiId}/gallery`, {
      imageUrl: payload.imageUrl,
      sortOrder: payload.sortOrder ?? 0,
    })

    return {
      imageId: res.data.imageId,
      poiId: res.data.poiId,
      imageUrl: res.data.imageUrl,
      sortOrder: res.data.sortOrder,
    }
  } catch (err) {
    console.error("Error adding gallery image:", err)
    throw err
  }
}

// =========================
// DELETE IMAGE
// =========================
export const deleteGalleryImage = async (poiId, imageId) => {
  try {
    await api.delete(`/cms/pois/${poiId}/gallery/${imageId}`)
    return true
  } catch (err) {
    console.error("Error deleting image:", err)
    return false
  }
}