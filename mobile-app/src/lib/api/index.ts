/**
 * API module barrel export.
 *
 * Client selection:
 * - __DEV__ (dev builds): MockApiClient by default, RealApiClient if EXPO_PUBLIC_USE_REAL_API=1
 * - Production builds: always RealApiClient (mock is never shipped)
 */

export type { ApiClient, ApiResult } from "./client";
export { RealApiClient } from "./client";
export { MockApiClient } from "./mock";

import { RealApiClient } from "./client";
import { MockApiClient } from "./mock";

function createClient() {
  if (!__DEV__) {
    // Production: always real API — mock code tree-shakes out
    return new RealApiClient();
  }

  // Dev: mock by default, opt-in to real via env
  if (process.env.EXPO_PUBLIC_USE_REAL_API === "1") {
    return new RealApiClient();
  }

  return new MockApiClient();
}

export const api = createClient();
