import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  storeSession,
  clearSession,
  hasSession,
  getUser,
  type StoredUser,
} from "./session";
import { api, setOnUnauthorized } from "../api";
import type { ApiLoginRequest, ApiLoginResponse, ApiSessionResponse } from "../../types/api";
import type { Tier } from "../../config/tier";

const ONBOARDED_KEY = "drift:onboarded";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  user: StoredUser | null;
  /** User's subscription tier from backend session. Defaults to "free". */
  tier: Tier;
  login: (req: ApiLoginRequest) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tier, setTier] = useState<Tier>("free");

  // Register 401 interceptor — auto-logout on expired token
  useEffect(() => {
    setOnUnauthorized(() => {
      clearSession().then(() => {
        setUser(null);
        setTier("free");
        setIsAuthenticated(false);
      });
    });
    return () => setOnUnauthorized(null);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const [hasToken, onboarded] = await Promise.all([
          hasSession(),
          AsyncStorage.getItem(ONBOARDED_KEY),
        ]);

        if (onboarded === "true") {
          setIsOnboarded(true);
        }

        if (hasToken) {
          // Validate session with backend and read tier
          const result = await api.get<ApiSessionResponse>("/api/auth/session");
          if (result.ok && result.data.authenticated) {
            const storedUser = await getUser();
            setUser(storedUser);
            setTier(result.data.session.tier ?? "free");
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

      // Fetch tier from session after login
      try {
        const sessionResult = await api.get<ApiSessionResponse>("/api/auth/session");
        if (sessionResult.ok) {
          setTier(sessionResult.data.session.tier ?? "free");
        }
      } catch {
        // Tier defaults to "free" if session call fails
      }

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
    setTier("free");
    setIsAuthenticated(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    setIsOnboarded(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoading, isAuthenticated, isOnboarded, user, tier, login, logout, completeOnboarding }}
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
