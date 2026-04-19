import api from "./apiClient";

export const accessCodeApi = {
    getAccessCodes: (page = 1, pageSize = 50) => 
        api.get('/cms/accesscodes', { params: { page, pageSize } }),
        
    createCodes: (count) => 
        api.post('/cms/accesscodes', { count }),
        
    deleteCode: (id) => 
        api.delete(`/cms/accesscodes/${id}`),

    getQrImageUrl: (code) => {
        // Since we have an endpoint that returns a data_url, we can fetch it, 
        // or we just return the full URL of the GET request if it returns an image directly.
        // But our endpoint returns JSON { Code, DataUri }. So we need to fetch it to get DataUri.
        return api.get('/cms/qr/generate', { params: { code } });
    }
};
