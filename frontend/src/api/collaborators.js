import apiClient from './client';

export const collaboratorService = {
    getAll: () => apiClient.get('collaborators/'),
    getById: (id) => apiClient.get(`collaborators/${id}/`),
    create: (data) => apiClient.post('collaborators/', data),
    update: (id, data) => apiClient.put(`collaborators/${id}/`, data),
    delete: (id) => apiClient.delete(`collaborators/${id}/`),
};
