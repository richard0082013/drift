/**
 * Conversion Trigger Hook
 *
 * Determines when to surface the soft paywall based on usage milestones.
 *
 * Triggers:
 *   - Day 3 teaser: after 3 check-ins, show a one-time teaser nudge
 *   - Day 7 partial lock: after 7 check-ins, show paywall for Pro features
 *
 * Rules:
 *   - NEVER triggers before the first check-in (acceptance criteria)
 *   - Each trigger fires at most once per session (tracked in-memory)
 *   - Dismissed triggers don't re-fire until next app restart
 */

import { useState, useCallback, useRef } from "react";
import type { Tier } from "../../config/tier";

export type TriggerType = "day3_teaser" | "day7_lock";

export type ConversionTriggerResult = {
  /** Whether a paywall should be shown right now */
  shouldShowPaywall: boolean;
  /** Which trigger caused it, if any */
  activeTrigger: TriggerType | null;
  /** Call to evaluate triggers after a data fetch (e.g. insights/trends load) */
  evaluate: (checkinCount: number, tier: Tier) => void;
  /** Call when the user dismisses the paywall */
  dismiss: () => void;
};

/**
 * Hook to manage conversion trigger state.
 *
 * Usage:
 * ```
 * const { shouldShowPaywall, activeTrigger, evaluate, dismiss } = useConversionTrigger();
 *
 * useEffect(() => {
 *   evaluate(insights.summary.checkinCount, tier);
 * }, [insights]);
 * ```
 */
export function useConversionTrigger(): ConversionTriggerResult {
  const [shouldShowPaywall, setShouldShowPaywall] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<TriggerType | null>(null);

  // Track which triggers have already fired this session
  const firedRef = useRef<Set<TriggerType>>(new Set());

  const evaluate = useCallback((checkinCount: number, tier: Tier) => {
    // Pro users never see the paywall
    if (tier === "pro") return;

    // Never trigger before first check-in
    if (checkinCount < 1) return;

    // Day 7 lock takes priority over Day 3 teaser.
    // When day7 fires, also suppress day3 so it can't fire on a later evaluate.
    if (checkinCount >= 7 && !firedRef.current.has("day7_lock")) {
      firedRef.current.add("day7_lock");
      firedRef.current.add("day3_teaser"); // suppress lower-tier trigger
      setActiveTrigger("day7_lock");
      setShouldShowPaywall(true);
      return;
    }

    // Day 3 teaser (only if day7 hasn't already fired this session)
    if (checkinCount >= 3 && !firedRef.current.has("day3_teaser")) {
      firedRef.current.add("day3_teaser");
      setActiveTrigger("day3_teaser");
      setShouldShowPaywall(true);
      return;
    }
  }, []);

  const dismiss = useCallback(() => {
    setShouldShowPaywall(false);
    setActiveTrigger(null);
  }, []);

  return { shouldShowPaywall, activeTrigger, evaluate, dismiss };
}
