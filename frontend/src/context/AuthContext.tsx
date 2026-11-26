import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';
import type { AuthResponse, UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  verifying: boolean;
  loginSuccess: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [verifying, setVerifying] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const verifySession = async () => {
      const storedToken = localStorage.getItem('sr_token');
      if (!storedToken) {
        if (active) setVerifying(false);
        return;
      }

      try {
        const verifiedUser = await authApi.me();
        if (active) {
          setToken(storedToken);
          setUser(verifiedUser);
          localStorage.setItem('sr_user', JSON.stringify(verifiedUser));
        }
      } catch {
        try {
          const refreshed = await authApi.refresh();
          if (active) {
            localStorage.setItem('sr_token', refreshed.token);
            localStorage.setItem('sr_user', JSON.stringify(refreshed.user));
            setToken(refreshed.token);
            setUser(refreshed.user);
          }
        } catch {
          localStorage.removeItem('sr_token');
          localStorage.removeItem('sr_user');
          if (active) {
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (active) setVerifying(false);
      }
    };

    verifySession();
    return () => {
      active = false;
    };
  }, []);

  const loginSuccess = useCallback((data: AuthResponse) => {
    localStorage.setItem('sr_token', data.token);
    localStorage.setItem('sr_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        verifying,
        loginSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
