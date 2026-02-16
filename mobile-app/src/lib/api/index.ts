/**
 * API module barrel export.
 *
 * UI phase: exports mockApi as the default client.
 * Integration phase: switch to RealApiClient.
 */

export type { ApiClient, ApiResult } from "./client";
export { RealApiClient } from "./client";
export { MockApiClient, mockApi } from "./mock";

/**
 * Current active API client.
 * Switch to `new RealApiClient()` during integration phase.
 */
import { mockApi } from "./mock";
export const api = mockApi;
