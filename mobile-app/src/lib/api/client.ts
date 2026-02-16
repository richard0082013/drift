/**
 * API Client
 *
 * Provides typed fetch wrapper with Bearer token injection.
 * During UI phase, use MockApiClient. During integration, switch to RealApiClient.
 */

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

const BASE_URL = __DEV__
  ? "http://localhost:3000"
  : "https://drift.vercel.app";

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
      const data = await res.json();

      if (res.ok) {
        return { ok: true, data: data as T, status: res.status };
      }

      return {
        ok: false,
        error: data.error ?? { code: "UNKNOWN", message: "Request failed" },
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
