// src/api/apiClient.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Sending ${config.method.toUpperCase()} request to ${config.url}`, 
                config.params || config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
