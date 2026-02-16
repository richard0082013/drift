import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  storeSession,
  clearSession,
  hasSession,
  getUser,
  type StoredUser,
} from "./session";
import { api } from "../api";
import type { ApiLoginRequest, ApiLoginResponse } from "../../types/api";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: StoredUser | null;
  login: (req: ApiLoginRequest) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const hasToken = await hasSession();
        if (hasToken) {
          // Validate session with backend
          const result = await api.get<{ authenticated: boolean }>("/api/auth/session");
          if (result.ok && result.data.authenticated) {
            const storedUser = await getUser();
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear
            await clearSession();
          }
        }
      } catch {
        // Silently fail on startup validation
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (req: ApiLoginRequest) => {
    const result = await api.post<ApiLoginResponse>("/api/auth/login", req);

    if (result.ok) {
      await storeSession(result.data);
      setUser(result.data.user);
      setIsAuthenticated(true);
      return { ok: true };
    }

    return { ok: false, error: result.error.message };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Logout even if server call fails
    }
    await clearSession();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoading, isAuthenticated, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
