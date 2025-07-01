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
    // Enhanced error logging
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error(`Response error (${error.response.status}):`, 
        error.response?.data?.message || error.message);
      
      if (error.response.status === 403) {
        console.error('Permission error details:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Error in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Restore token from localStorage if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Functions to set/clear token
export const setToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const clearToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export default api;
