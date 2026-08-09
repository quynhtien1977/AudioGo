import apiClient from "./apiClient";

/**
 * Public API — không cần auth.
 * apiClient.baseURL = VITE_API_URL = "http://localhost:5086/api"
 * Nên chỉ cần dùng path tương đối từ /api trở đi.
 */

export const SUPPORTED_LANGS = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English",    flag: "🇺🇸" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
];

export async function getLandingSections(lang = "vi") {
  const { data } = await apiClient.get("/landing/sections", { params: { lang } });
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
