import apiClient from "./apiClient"

// Generate audio cho 1 POI (tất cả ngôn ngữ đang có content)
export const generatePipelineForPoi = async (poiId) => {
  const res = await apiClient.post(`/cms/pipeline/generate/${poiId}`)
  return res.data
}

// Batch: Generate audio cho tất cả POI thiếu AudioUrl (IsActive)
export const generateAllAudio = async () => {
  const res = await apiClient.post("/cms/pipeline/generate-all")
  return res.data
}

// Full Pipeline: Dịch + TTS cho 7 ngôn ngữ (tất cả POI IsActive)
export const generateAllLanguages = async () => {
  const res = await apiClient.post("/cms/pipeline/generate-all-languages")
  return res.data
}
