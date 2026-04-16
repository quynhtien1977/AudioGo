import apiClient from "./apiClient"

// Upload ảnh lên Azure Blob Storage
// Trả về URL thật của ảnh trên Azure
export const uploadImage = async (file) => {
  const form = new FormData()
  form.append("file", file)

  const res = await apiClient.post("/cms/upload/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  // Backend trả về: { url: "https://storage.azure.com/..." }
  return res.data.url
}

// Upload audio lên Azure Blob Storage
// Trả về URL thật của file audio trên Azure
export const uploadAudio = async (file) => {
  const form = new FormData()
  form.append("file", file)

  const res = await apiClient.post("/cms/upload/audio", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  // Backend trả về: { url: "https://storage.azure.com/..." }
  return res.data.url
}
