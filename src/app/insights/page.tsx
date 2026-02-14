"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buildLoginHref,
  buildSessionAuthorizationHeader,
  isLoggedIn
} from "@/lib/auth/client-auth";
import { trackClientEvent } from "@/lib/metrics/client-events";

type WeeklyInsights = {
  weekStart: string;
  weekEnd: string;
  days: number;
  summary: {
    checkinCount: number;
    alertCount: number;
    averages: {
      energy: number | null;
      stress: number | null;
      social: number | null;
      driftIndex: number | null;
    };
    driftLevel: "low" | "moderate" | "high";
    hasEnoughData: boolean;
  };
  highlights: string[];
  suggestions: string[];
};

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function normalizeWeeklyInsights(payload: unknown): WeeklyInsights | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Partial<WeeklyInsights>;
  if (
    typeof source.weekStart !== "string" ||
    typeof source.weekEnd !== "string" ||
    typeof source.days !== "number" ||
    !source.summary ||
    typeof source.summary !== "object"
  ) {
    return null;
  }

  const summary = source.summary as WeeklyInsights["summary"];
  if (
    typeof summary.checkinCount !== "number" ||
    typeof summary.alertCount !== "number" ||
    !summary.averages ||
    typeof summary.averages !== "object" ||
    (summary.driftLevel !== "low" && summary.driftLevel !== "moderate" && summary.driftLevel !== "high") ||
    typeof summary.hasEnoughData !== "boolean"
  ) {
    return null;
  }

  const averages = summary.averages;
  if (
    !isNumberOrNull(averages.energy) ||
    !isNumberOrNull(averages.stress) ||
    !isNumberOrNull(averages.social) ||
    !isNumberOrNull(averages.driftIndex)
  ) {
    return null;
  }

  const highlights = Array.isArray(source.highlights)
    ? source.highlights.filter((item): item is string => typeof item === "string")
    : [];
  const suggestions = Array.isArray(source.suggestions)
    ? source.suggestions.filter((item): item is string => typeof item === "string")
    : [];

  return {
    weekStart: source.weekStart,
    weekEnd: source.weekEnd,
    days: source.days,
    summary: {
      checkinCount: summary.checkinCount,
      alertCount: summary.alertCount,
      averages: {
        energy: averages.energy,
        stress: averages.stress,
        social: averages.social,
        driftIndex: averages.driftIndex
      },
      driftLevel: summary.driftLevel,
      hasEnoughData: summary.hasEnoughData
    },
    highlights,
    suggestions
  };
}

function formatMetric(value: number | null): string {
  return value === null ? "N/A" : value.toFixed(1);
}

export default function InsightsPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [days, setDays] = useState<7 | 14>(7);
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      const loggedIn = await isLoggedIn();
      if (!active) {
        return;
      }

      setAuthenticated(loggedIn);
      setAuthChecked(true);
    }

    resolveSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let active = true;

    async function loadWeeklyInsights() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/insights/weekly?days=${days}`, {
          method: "GET",
          headers: {
            accept: "application/json",
            ...buildSessionAuthorizationHeader()
          },
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) {
            setInsights(null);
            setError("Failed to load weekly insights.");
          }
          return;
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeWeeklyInsights(payload);
        if (active) {
          if (!normalized) {
            setInsights(null);
            setError("Failed to load weekly insights.");
          } else {
            setInsights(normalized);
            trackClientEvent("insights_viewed", {
              suggestionCount: normalized.suggestions.length
            });
          }
        }
      } catch {
        if (active) {
          setInsights(null);
          setError("Failed to load weekly insights.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadWeeklyInsights();

    return () => {
      active = false;
    };
  }, [authenticated, days]);

  if (!authChecked) {
    return <main><p>Checking authentication...</p></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Weekly Insights</h1>
        <p role="alert">Please log in to continue.</p>
        <Link href={buildLoginHref(pathname ?? "/insights", "/insights")}>Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Weekly Insights</h1>
      <p>Review trend quality and risk level from the real weekly insights API.</p>

      <section aria-label="Range picker">
        <button type="button" aria-pressed={days === 7} onClick={() => setDays(7)}>7 days</button>
        <button type="button" aria-pressed={days === 14} onClick={() => setDays(14)}>14 days</button>
      </section>

      {loading ? <p>Loading weekly insights...</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!loading && !error && insights ? (
        <section>
          <p>
            Window: <strong>{insights.weekStart}</strong> to <strong>{insights.weekEnd}</strong>
          </p>
          <p>
            Check-ins: {insights.summary.checkinCount} | Alerts: {insights.summary.alertCount} | Drift: {insights.summary.driftLevel}
          </p>
          <p>
            Averages - Energy: {formatMetric(insights.summary.averages.energy)}, Stress: {formatMetric(insights.summary.averages.stress)}, Social: {formatMetric(insights.summary.averages.social)}, DriftIndex: {formatMetric(insights.summary.averages.driftIndex)}
          </p>

          {insights.highlights.length > 0 ? (
            <>
              <h2>Highlights</h2>
              <ul>
                {insights.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}

          {insights.suggestions.length > 0 ? (
            <>
              <h2>Suggestions</h2>
              <ul>
                {insights.suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}

          {!insights.summary.hasEnoughData ? <p>Not enough data yet to derive stable trends.</p> : null}
        </section>
      ) : null}

      {!loading && !error && !insights ? <p>No weekly insights yet.</p> : null}
    </main>
  );
}
