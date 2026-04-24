import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/services/api/client';
import { getCurrentUser } from '../utils/decode-token';
import {
  clearStoredRefreshToken,
  clearStoredToken,
  getStoredRefreshToken,
  storeRefreshToken,
  storeToken,
} from '../utils/token-storage';
import type { AuthUser } from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const decoded = getCurrentUser();
    if (!decoded) return null;
    return { id: decoded.sub, email: decoded.email, username: decoded.username };
  });

  const logoutRef = useRef<() => void>(() => {});

  function setUser(newUser: AuthUser, accessToken: string, refreshToken: string) {
    storeToken(accessToken);
    storeRefreshToken(refreshToken);
    setUserState(newUser);
  }

  function logout() {
    const refreshToken = getStoredRefreshToken();
    clearStoredToken();
    clearStoredRefreshToken();
    setUserState(null);

    if (refreshToken) {
      void fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }

    if (!window.location.pathname.startsWith('/login')) {
      window.location.replace('/login');
    }
  }

  logoutRef.current = logout;

  useEffect(() => {
    setUnauthorizedHandler(() => logoutRef.current());
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
