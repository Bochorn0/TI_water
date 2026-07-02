// Axios client for /api/v1.0 routes outside /tiwater (users, roles, auth/me)

import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { AUTH_TOKEN_KEY } from 'src/auth/auth-storage';

export const v1Client = axios.create({
  baseURL: CONFIG.API_V1_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-TIWater-API-Key': CONFIG.TIWATER_API_KEY,
  },
});

v1Client.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
