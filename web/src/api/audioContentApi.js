import apiClient from "./apiClient";

export const audioContentApi = {
    getAllTranslations: (page = 1, limit = 50) => {
        return apiClient.get(`/cms/content/all-translations`, {
            params: { page, limit }
        });
    }
};
