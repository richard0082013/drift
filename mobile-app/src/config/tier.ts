/**
 * Drift Tier Gating Configuration
 *
 * Tier is sourced from backend session (GET /api/auth/session → session.tier).
 * ProGate reads tier from AuthContext; MOCK_TIER kept for testing only.
 */

export type Tier = "free" | "pro";

export type FeatureKey =
  | "trends_30d"
  | "trends_90d"
  | "sensitivity_tuning"
  | "action_plan"
  | "weekly_detail"
  | "insight_history";

/**
 * Change to "pro" to unlock all Pro features during development/testing.
 */
export const MOCK_TIER: Tier = "free";

const PRO_FEATURES: Record<string, true> = {
  trends_30d: true,
  trends_90d: true,
  sensitivity_tuning: true,
  action_plan: true,
  weekly_detail: true,
  insight_history: true,
};

export function isProFeature(key: string): boolean {
  return key in PRO_FEATURES;
}

export function isFeatureUnlocked(key: string, tier: Tier): boolean {
  if (!isProFeature(key)) return true;
  return tier === "pro";
}
