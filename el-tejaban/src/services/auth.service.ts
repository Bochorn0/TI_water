import { CONFIG } from '@tejaban/config-global';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@tejaban/auth/auth-storage';
import type { AuthResponse, LoginPayload, TiWaterAuthUser } from '@tejaban/types/auth.types';
import { authAxios } from '@tejaban/api/axiosInstance';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): TiWaterAuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TiWaterAuthUser;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function persistAuth(response: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, response.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
}

export const authService = {
  /** Uses TI Water POST /api/v1.0/auth/login — same users as tiwater.mx */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (!payload.email || !payload.password) throw new Error('Credenciales requeridas');

    if (CONFIG.USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 300));
      const isAdmin = payload.email.toLowerCase().includes('admin');
      const response: AuthResponse = {
        token: 'mock-jwt',
        user: {
          id: 1,
          email: payload.email,
          nombre: isAdmin ? 'Carlos Admin' : 'María García',
          role: {
            _id: 1,
            name: isAdmin ? 'admin' : 'mesero',
            permissions: isAdmin ? ['/el-tejaban', '/el-tejaban-admin'] : ['/el-tejaban'],
          },
        },
      };
      persistAuth(response);
      return response;
    }

    const { data } = await authAxios.post<AuthResponse>('/auth/login', payload);
    persistAuth(data);
    return data;
  },

  async logout(): Promise<void> {
    clearAuthStorage();
  },

  async me(): Promise<TiWaterAuthUser> {
    if (CONFIG.USE_MOCK_API) {
      const user = getStoredUser();
      if (!user) throw new Error('No autenticado');
      return user;
    }
    const { data } = await authAxios.get<{ user: TiWaterAuthUser }>('/auth/me');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return data.user;
  },
};
