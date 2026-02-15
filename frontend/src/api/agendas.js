import apiClient from './client';

export const agendaService = {
    getAll: (params) => apiClient.get('agendas/', { params }),
    getById: (id) => apiClient.get(`agendas/${id}/`),
    create: (data) => apiClient.post('agendas/', data),
    update: (id, data) => apiClient.put(`agendas/${id}/`, data),
    delete: (id) => apiClient.delete(`agendas/${id}/`),
    toggleStatus: (id) => apiClient.post(`agendas/${id}/toggle_status/`),
};
