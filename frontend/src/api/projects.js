import apiClient from './client';

export const projectService = {
    getAll: () => apiClient.get('projects/'),
    getById: (id) => apiClient.get(`projects/${id}/`),
    create: (data) => apiClient.post('projects/', data),
    update: (id, data) => apiClient.put(`projects/${id}/`, data),
    delete: (id) => apiClient.delete(`projects/${id}/`),
    getAnalytics: () => apiClient.get('analytics/'),
};
