// src/api/axiosInstance.ts
// Axios instance configured for TI Water API with API Key authentication

import axios from 'axios';
import { CONFIG } from '../config-global';
import { AUTH_TOKEN_KEY } from '../auth/auth-storage';

const axiosInstance = axios.create({
  baseURL: CONFIG.API_BASE_URL_TIWATER,
  headers: {
    'Content-Type': 'application/json',
    'X-TIWater-API-Key': CONFIG.TIWATER_API_KEY,
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle API errors
      const errorMessage = error.response.data?.message || error.message;
      console.error('API Error:', errorMessage);
      
      // Handle specific error cases
      if (error.response.status === 401) {
        console.error('API Key is invalid or missing');
      } else if (error.response.status === 500) {
        console.error('Server error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
