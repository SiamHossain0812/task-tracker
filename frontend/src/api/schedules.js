import apiClient from './client';

const scheduleApi = {
    list: (params) => apiClient.get('schedules/', { params }),
    get: (id) => apiClient.get(`schedules/${id}/`),
    create: (data) => apiClient.post('schedules/', data),
    update: (id, data) => apiClient.patch(`schedules/${id}/`, data),
    delete: (id) => apiClient.delete(`schedules/${id}/`),
    toggleStatus: (id) => apiClient.post(`schedules/${id}/toggle_status/`),
    reschedule: (id, data) => apiClient.post(`schedules/${id}/reschedule/`, data),
};

export default scheduleApi;
