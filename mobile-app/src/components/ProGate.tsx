import React from "react";
import { MOCK_TIER, isFeatureUnlocked } from "../config/tier";
import { ProUpgradeCard } from "./ProUpgradeCard";

type ProGateProps = {
  /** Feature key from FeatureKey type (e.g., "trends_30d") */
  feature: string;
  children: React.ReactNode;
  /** Custom fallback when feature is locked. Defaults to ProUpgradeCard. */
  fallback?: React.ReactNode;
};

/**
 * Gate component that wraps Pro features.
 *
 * If the current tier has access to the feature, renders children.
 * Otherwise, renders a fallback (default: ProUpgradeCard).
 *
 * UI phase: uses MOCK_TIER constant. Change to "pro" to unlock all.
 * Integration phase: tier will come from backend.
 */
export function ProGate({ feature, children, fallback }: ProGateProps) {
  if (isFeatureUnlocked(feature, MOCK_TIER)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <ProUpgradeCard feature={feature} />}</>;
}
