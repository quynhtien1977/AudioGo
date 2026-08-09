import apiClient from "./apiClient";

/**
 * Public API — không cần auth.
 * apiClient.baseURL = VITE_API_URL = "http://localhost:5086/api"
 * Nên chỉ cần dùng path tương đối từ /api trở đi.
 */

export const SUPPORTED_LANGS = [
  { code: "vi", label: "Tiếng Việt", flag: "https://flagcdn.com/w40/vn.png" },
  { code: "en", label: "English",    flag: "https://flagcdn.com/w40/us.png" },
  { code: "es", label: "Español",    flag: "https://flagcdn.com/w40/es.png" },
  { code: "fr", label: "Français",   flag: "https://flagcdn.com/w40/fr.png" },
  { code: "ko", label: "한국어",      flag: "https://flagcdn.com/w40/kr.png" },
  { code: "ja", label: "日本語",      flag: "https://flagcdn.com/w40/jp.png" },
];

export const LANG_META = [
  { code: "vi", label: "VI", flagUrl: "https://flagcdn.com/w40/vn.png", full: "Tiếng Việt", isMaster: true },
  { code: "en", label: "EN", flagUrl: "https://flagcdn.com/w40/us.png", full: "English" },
  { code: "es", label: "ES", flagUrl: "https://flagcdn.com/w40/es.png", full: "Español" },
  { code: "fr", label: "FR", flagUrl: "https://flagcdn.com/w40/fr.png", full: "Français" },
  { code: "ko", label: "KO", flagUrl: "https://flagcdn.com/w40/kr.png", full: "한국어" },
  { code: "ja", label: "JA", flagUrl: "https://flagcdn.com/w40/jp.png", full: "日本語" },
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
