import apiClient from "./apiClient";

/**
 * Public API — không cần auth.
 * apiClient.baseURL = VITE_API_URL = "http://localhost:5086/api"
 * Nên chỉ cần dùng path tương đối từ /api trở đi.
 */

export async function getLandingSections() {
  const { data } = await apiClient.get("/landing");
  return data;
}

export async function getLatestRelease() {
  try {
    const { data } = await apiClient.get("/app/latest");
    return data;
  } catch {
    return null;
  }
}

export async function submitConsultation(payload) {
  const { data } = await apiClient.post("/landing/consult", payload);
  return data;
}
