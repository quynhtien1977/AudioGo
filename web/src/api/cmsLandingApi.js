/**
 * CMS Landing API — yêu cầu JWT Admin.
 * Dùng apiClient (baseURL đã = VITE_API_URL = ".../api")
 * nên path chỉ cần từ /cms/... trở đi.
 */
import apiClient from "./apiClient";

// ── Sections ──────────────────────────────────────────────────────────────
export async function getCmsSections() {
  const { data } = await apiClient.get("/cms/landing/sections");
  return data;
}

export async function getCmsSection(id) {
  const { data } = await apiClient.get(`/cms/landing/sections/${id}`);
  return data;
}

/**
 * Cập nhật bản dịch của 1 ngôn ngữ cho section — dùng JSON_MODIFY atomic ở SQL Server.
 * @param {string} id - SectionId
 * @param {string} langCode - "vi" | "en" | "es" | "fr" | "ko" | "ja"
 * @param {object} content - object chứa các text field đã dịch
 */
export async function updateTranslation(id, langCode, content) {
  await apiClient.put(`/cms/landing/sections/${id}/translation/${langCode}`, {
    content: JSON.stringify(content),
  });
}

/**
 * Cập nhật shared fields (ảnh, link, icon...) cho section — dùng JSON_MODIFY atomic.
 * @param {string} id - SectionId
 * @param {object} content - object shared fields
 */
export async function updateShared(id, content) {
  await apiClient.put(`/cms/landing/sections/${id}/shared`, {
    content: JSON.stringify(content),
  });
}

/**
 * Cập nhật meta (isActive, sortOrder) — KHÔNG chạm ContentJson.
 */
export async function updateSectionMeta(id, { isActive, sortOrder }) {
  await apiClient.patch(`/cms/landing/sections/${id}/meta`, { isActive, sortOrder });
}

export async function uploadLandingImage(file, sectionKey = "general") {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post(
    `/cms/landing/upload-image?section=${encodeURIComponent(sectionKey)}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.url;
}

// ── App Releases ──────────────────────────────────────────────────────────
export async function getAppReleases() {
  const { data } = await apiClient.get("/cms/app-releases");
  return data;
}

export async function uploadApk({ file, version, releaseNotes, minAndroidVersion }) {
  const form = new FormData();
  form.append("file", file);
  form.append("version", version);
  if (releaseNotes) form.append("releaseNotes", releaseNotes);
  if (minAndroidVersion) form.append("minAndroidVersion", minAndroidVersion);

  const { data } = await apiClient.post("/cms/app-releases", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteRelease(id) {
  await apiClient.delete(`/cms/app-releases/${id}`);
}

// ── Consultations ─────────────────────────────────────────────────────────
export async function getConsultations(status) {
  const params = status ? { status } : {};
  const { data } = await apiClient.get("/cms/consultations", { params });
  return data;
}

export async function updateConsultStatus(id, status) {
  await apiClient.patch(`/cms/consultations/${id}/status`, { status });
}

export async function deleteConsultation(id) {
  await apiClient.delete(`/cms/consultations/${id}`);
}
