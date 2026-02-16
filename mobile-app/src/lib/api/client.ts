/**
 * API Client
 *
 * Provides typed fetch wrapper with Bearer token injection.
 * During UI phase, use MockApiClient. During integration, switch to RealApiClient.
 */

import { Platform } from "react-native";
import { getToken } from "../auth/session";
import type { ApiErrorResponse } from "../../types/api";

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiErrorResponse["error"]; status: number };

export interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>>;
  post<T>(path: string, body?: unknown): Promise<ApiResult<T>>;
  delete<T>(path: string): Promise<ApiResult<T>>;
}

// ── Real API Client (for integration phase) ──

/**
 * Base URL resolution:
 * - Production: EXPO_PUBLIC_API_URL or default production URL
 * - Dev: EXPO_PUBLIC_API_URL or platform-aware localhost
 *   - Android emulator uses 10.0.2.2 (loopback alias)
 *   - iOS simulator / web uses localhost
 */
function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, ""); // strip trailing slash

  if (!__DEV__) return "https://drift.vercel.app";

  // Android emulator cannot reach host via "localhost" — use 10.0.2.2
  const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${host}:3000`;
}

const BASE_URL = resolveBaseUrl();

export class RealApiClient implements ApiClient {
  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
    const url = new URL(path, BASE_URL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return this.request<T>(url.toString(), { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return this.request<T>(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>(`${BASE_URL}${path}`, { method: "DELETE" });
  }

  private async request<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
    const token = await getToken();
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...init, headers });

      // Content-type aware parsing: /api/export returns CSV, everything else JSON
      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json() : await res.text();

      if (res.ok) {
        return { ok: true, data: data as T, status: res.status };
      }

      // Error body may be JSON or plain text
      const errorObj = isJson
        ? (data as { error?: ApiErrorResponse["error"] }).error
        : undefined;
      return {
        ok: false,
        error: errorObj ?? { code: "UNKNOWN", message: String(data) || "Request failed" },
        status: res.status,
      };
    } catch {
      return {
        ok: false,
        error: { code: "NETWORK_ERROR", message: "Network request failed" },
        status: 0,
      };
    }
  }
}
