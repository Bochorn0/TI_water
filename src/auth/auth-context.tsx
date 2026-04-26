import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { v1Client } from 'src/api/v1-client';
import { loginRequest } from 'src/api/auth-api';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './auth-storage';
import type { AuthUser } from './auth-types';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Replace stored user (e.g. after PATCH /auth/me) */
  setUser: (user: AuthUser) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null,
  );
  const [user, setUser] = useState<AuthUser | null>(() =>
    typeof localStorage !== 'undefined' ? readStoredUser() : null,
  );

  // Refresh user from API so role/permissions match DB (e.g. after migrations), not old localStorage.
  useEffect(() => {
    if (!token) return;
    v1Client
      .get<{ user: AuthUser }>('/auth/me')
      .then((r) => {
        const u = r.data.user;
        setUser(u);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        // keep cached user; token may be invalid — login flow will clear
      });
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const { token: t, user: u } = await loginRequest(email.trim(), password);
    localStorage.setItem(AUTH_TOKEN_KEY, t);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u as AuthUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const setUserPersist = useCallback((next: AuthUser) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      setUser: setUserPersist,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, login, logout, setUserPersist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
