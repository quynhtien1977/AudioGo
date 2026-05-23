import apiClient from "./apiClient"

// Lấy danh sách bài viết (type: "tip" | "news" hoặc rỗng để lấy cả hai)
export const getAllArticles = async (type = "") => {
  const url = type ? `/cms/articles?type=${type}` : "/cms/articles"
  const res = await apiClient.get(url)
  return res.data
}

// Lấy chi tiết bài viết
export const getArticleById = async (id) => {
  const res = await apiClient.get(`/cms/articles/${id}`)
  return res.data
}

// Tạo bài viết mới
export const createArticle = async (data) => {
  const res = await apiClient.post("/cms/articles", data)
  return res.data
}

// Cập nhật bài viết
export const updateArticle = async (id, data) => {
  const res = await apiClient.put(`/cms/articles/${id}`, data)
  return res.data
}

// Xóa bài viết
export const deleteArticle = async (id) => {
  const res = await apiClient.delete(`/cms/articles/${id}`)
  return res.data
}
