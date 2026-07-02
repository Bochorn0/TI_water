import axios from 'axios';
import { CONFIG } from 'src/config-global';
import type { LoginResponse } from 'src/auth/auth-types';

const client = axios.create({
  baseURL: CONFIG.API_V1_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/auth/login', { email, password });
  return data;
}
