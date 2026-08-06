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

export async function updateSection(id, payload) {
  const { data } = await apiClient.put(`/cms/landing/sections/${id}`, payload);
  return data;
}

export async function uploadLandingImage(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/cms/landing/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
