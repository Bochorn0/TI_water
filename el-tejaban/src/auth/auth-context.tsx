import { CONFIG } from '@tejaban/config-global';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { canAccessElTejaban, canAccessRoute, hasPermission } from '@tejaban/auth/permissions';
import type { PermissionPath, TiWaterAuthUser } from '@tejaban/types/auth.types';
import {
  authService,
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
} from '@tejaban/services/auth.service';

type AuthContextValue = {
  user: TiWaterAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (path: PermissionPath) => boolean;
  canAccessRoute: (pathname: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TiWaterAuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(() => {
    const token = getStoredToken();
    if (!token) return false;
    // Stale mock session after switching to real API — force re-login
    if (token === 'mock-jwt' && !CONFIG.USE_MOCK_API) return true;
    if (token === 'mock-jwt' && CONFIG.USE_MOCK_API && getStoredUser()) return false;
    return true;
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    if (token === 'mock-jwt') {
      if (!CONFIG.USE_MOCK_API) {
        clearAuthStorage();
        setUser(null);
        setIsBootstrapping(false);
        return;
      }
      const stored = getStoredUser();
      if (!stored || !canAccessElTejaban(stored)) {
        clearAuthStorage();
        setUser(null);
      } else {
        setUser(stored);
      }
      setIsBootstrapping(false);
      return;
    }

    authService
      .me()
      .then((freshUser) => {
        if (!canAccessElTejaban(freshUser)) {
          clearAuthStorage();
          setUser(null);
          return;
        }
        setUser(freshUser);
      })
      .catch(() => {
        clearAuthStorage();
        setUser(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const checkPermission = useCallback(
    (path: PermissionPath) => hasPermission(user, path),
    [user],
  );

  const checkRoute = useCallback(
    (pathname: string) => canAccessRoute(user, pathname),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(getStoredToken() && user && canAccessElTejaban(user)),
      isLoading,
      isBootstrapping,
      login,
      logout,
      hasPermission: checkPermission,
      canAccessRoute: checkRoute,
    }),
    [user, isLoading, isBootstrapping, login, logout, checkPermission, checkRoute],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
