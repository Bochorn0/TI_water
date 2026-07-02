/**
 * Axios — TI Water API /tejaban module
 */
import axios from 'axios';
import { CONFIG } from '@tejaban/config-global';
import { AUTH_TOKEN_KEY } from '@tejaban/auth/auth-storage';
import { clearAuthStorage } from '@tejaban/services/auth.service';

export const tejabanAxios = axios.create({
  baseURL: CONFIG.API_TIJABAN_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(CONFIG.TIWATER_API_KEY ? { 'X-TIWater-API-Key': CONFIG.TIWATER_API_KEY } : {}),
  },
});

tejabanAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

tejabanAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !CONFIG.USE_MOCK_API) {
      clearAuthStorage();
      if (!window.location.pathname.includes('/login')) {
        window.location.assign(`${CONFIG.APP_BASE}/login`);
      }
    }
    return Promise.reject(error);
  },
);

export const authAxios = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(CONFIG.TIWATER_API_KEY ? { 'X-TIWater-API-Key': CONFIG.TIWATER_API_KEY } : {}),
  },
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
