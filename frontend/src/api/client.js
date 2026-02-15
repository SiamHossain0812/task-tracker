import axios from 'axios';

// Dynamically determine API URL based on current environment
const getBaseUrl = () => {
    // 1. Check for explicit environment variable first
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const { hostname, protocol, port } = window.location;

    // 2. Handle local development (localhost or common local IPs)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return `http://${hostname}:8000/api/v1/`;
    }

    // 3. Production/Deployment environment
    // Use the current protocol and hostname. 
    // If the frontend is on HTTPS, the API will be requested via HTTPS.
    // This assumes the production server (Nginx/etc) is configured to proxy /api/v1/ to the backend service.
    return `${protocol}//${hostname}/api/v1/`;
};

const API_BASE_URL = getBaseUrl();

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        // 'Content-Type': 'application/json', // Removed to support FormData
    },
});

// Add a request interceptor to include the JWT token in all requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token refresh logic
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for login/register requests
        if (originalRequest.url.includes('auth/login/') || originalRequest.url.includes('auth/register/')) {
            return Promise.reject(error);
        }

        // If the error is 401 and not a retry, try to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_BASE_URL}auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
