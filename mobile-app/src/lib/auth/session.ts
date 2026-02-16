/**
 * Auth Session Module
 *
 * Handles token storage/retrieval via SecureStore and session validation.
 * Token lifecycle: login → store → validate → logout/401 → clear
 */

import * as SecureStore from "expo-secure-store";
import type { ApiLoginResponse, ApiSessionResponse } from "../../types/api";

const TOKEN_KEY = "drift_access_token";
const USER_KEY = "drift_user";

export type StoredUser = {
  id: string;
  email: string;
  name?: string;
};

// ── Token Storage ──

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── User Storage ──

export async function storeUser(user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

// ── Session Lifecycle ──

export async function storeSession(loginResponse: ApiLoginResponse): Promise<void> {
  await storeToken(loginResponse.accessToken);
  await storeUser(loginResponse.user);
}

export async function clearSession(): Promise<void> {
  await clearToken();
  await clearUser();
}

export async function hasSession(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
