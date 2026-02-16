import React from "react";
import { isFeatureUnlocked } from "../config/tier";
import { useAuth } from "../lib/auth/AuthContext";
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
 * Tier is read from AuthContext (sourced from backend session).
 */
export function ProGate({ feature, children, fallback }: ProGateProps) {
  const { tier } = useAuth();

  if (isFeatureUnlocked(feature, tier)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <ProUpgradeCard feature={feature} />}</>;
}
