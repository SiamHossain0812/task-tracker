import apiClient from './client';

export const collaboratorService = {
    getAll: () => apiClient.get('collaborators/'),
    getById: (id) => apiClient.get(`collaborators/${id}/`),
    create: (data) => apiClient.post('collaborators/', data),
    update: (id, data) => apiClient.put(`collaborators/${id}/`, data),
    delete: (id) => apiClient.delete(`collaborators/${id}/`),
    getPerformance: (id, start = null, end = null) => {
        let url = `collaborators/${id}/performance/`;
        if (start || end) {
            const params = new URLSearchParams();
            if (start) params.append('start_date', start);
            if (end) params.append('end_date', end);
            url += `?${params.toString()}`;
        }
        return apiClient.get(url);
    },
};
