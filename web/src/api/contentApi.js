import axios from "axios"

// ================= BASE API =================
const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token")

const api = axios.create({
  baseURL: "http://localhost:5086/api", // sửa lại nếu port khác
  headers: {
      Authorization: `Bearer ${getToken()}`
    } // tự động thêm token nếu đã đăng nhập
})

// ================= GET =================
export const getContentsByPOI = async (poiId) => {
  try {
    const res = await api.get(`/cms/pois/${poiId}/content`)

    return res.data.map((c) => ({
      id: c.contentId,
      poiId: c.poiId,
      languageCode: c.languageCode,
      title: c.title || "Unknown",
      description: c.description || "",
      audioUrl: c.audioUrl || "",
      isMaster: c.isMaster ?? false,
    }))
  } catch (err) {
    console.error("Error fetching contents:", err)
    return []
  }
}

// ================= CREATE =================
export const createContent = async (poiId, data) => {
  try {
    const res = await api.post(`/cms/pois/${poiId}/content`, {
      languageCode: data.languageCode,
      title: data.title,
      description: data.description,
      audioUrl: data.audioUrl,
      isMaster: data.isMaster,
    })

    return {
      id: res.data.contentId,
      poiId: res.data.poiId,
      languageCode: res.data.languageCode,
      title: res.data.title,
      description: res.data.description,
      audioUrl: res.data.audioUrl,
      isMaster: res.data.isMaster,
    }
  } catch (err) {
    console.error("Error creating content:", err)
    throw err
  }
}

// ================= UPDATE =================
export const updateContent = async (poiId, contentId, data) => {
  try {
    const res = await api.put(
      `/cms/pois/${poiId}/content/${contentId}`,
      {
        title: data.title,
        description: data.description,
        audioUrl: data.audioUrl,
        isMaster: data.isMaster,
      }
    )

    return {
      id: res.data.contentId,
      poiId: res.data.poiId,
      languageCode: res.data.languageCode,
      title: res.data.title,
      description: res.data.description,
      audioUrl: res.data.audioUrl,
      isMaster: res.data.isMaster,
    }
  } catch (err) {
    console.error("Error updating content:", err)
    throw err
  }
}

// ================= DELETE =================
export const deleteContent = async (poiId, contentId) => {
  try {
    await api.delete(`/cms/pois/${poiId}/content/${contentId}`)
    return true
  } catch (err) {
    console.error("Error deleting content:", err)
    return false
  }
}