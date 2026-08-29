import api from "./apiClient";

// ── Banner CMS API ─────────────────────────────────────────────────────────

export const bannerApi = {
  getAll: (params = {}) =>
    api.get("/cms/banners", { params }),

  getById: (id) =>
    api.get(`/cms/banners/${id}`),

  create: (data) =>
    api.post("/cms/banners", data),

  update: (id, data) =>
    api.put(`/cms/banners/${id}`, data),

  toggle: (id) =>
    api.patch(`/cms/banners/${id}/toggle`),

  delete: (id) =>
    api.delete(`/cms/banners/${id}`),

  uploadImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/cms/banners/upload-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── AppSetting CMS API ─────────────────────────────────────────────────────

export const appSettingApi = {
  getAll: () =>
    api.get("/cms/settings"),

  update: (key, value) =>
    api.put(`/cms/settings/${encodeURIComponent(key)}`, { value }),
};

// ── Public Banner API (Mobile & Landing) ───────────────────────────────────

export const getPublicBanners = (target = "Landing") =>
  api.get("/mobile/banners", { params: { target } });

