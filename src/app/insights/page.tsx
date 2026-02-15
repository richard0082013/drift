"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buildLoginHref,
  buildSessionAuthorizationHeader,
  isLoggedIn
} from "@/lib/auth/client-auth";
import { trackClientEvent } from "@/lib/metrics/client-events";
import { AuthRequiredState, ErrorState, LoadingState } from "@/components/page-feedback";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Weekly Insights</h1>
        <LoadingState />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Weekly Insights</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/insights", "/insights")} />
      </main>
    );
  }

  const metricBarColor = (label: string) => {
    switch (label) {
      case "Energy": return "bg-sage-500";
      case "Stress": return "bg-amber-500";
      case "Social": return "bg-coral-500";
      case "DriftIndex": return "bg-rose-500";
      default: return "bg-slate-400";
    }
  };

  const metrics: { label: string; value: number | null }[] = [
    { label: "Energy", value: insights?.summary.averages.energy ?? null },
    { label: "Stress", value: insights?.summary.averages.stress ?? null },
    { label: "Social", value: insights?.summary.averages.social ?? null },
    { label: "DriftIndex", value: insights?.summary.averages.driftIndex ?? null },
  ];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">Weekly Insights</h1>
        <p className="text-slate-500 text-sm">Review trend quality and risk level from the real weekly insights API.</p>
      </div>

      <section aria-label="Range picker">
        <div className="flex gap-2">
          <Button type="button" variant={days === 7 ? "primary" : "secondary"} size="sm" aria-pressed={days === 7} onClick={() => setDays(7)}>7 days</Button>
          <Button type="button" variant={days === 14 ? "primary" : "secondary"} size="sm" aria-pressed={days === 14} onClick={() => setDays(14)}>14 days</Button>
        </div>
      </section>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && insights ? (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-sm text-slate-600">
                Window: <strong className="text-slate-800">{insights.weekStart}</strong> to <strong className="text-slate-800">{insights.weekEnd}</strong>
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm font-body text-slate-700">
                Check-ins: {insights.summary.checkinCount} | Alerts: {insights.summary.alertCount} | Drift: {insights.summary.driftLevel}
                <Badge variant={insights.summary.driftLevel} className="ml-2">{insights.summary.driftLevel}</Badge>
              </p>

              <div>
                <p className="text-sm font-body text-slate-700">
                  Averages - Energy: {formatMetric(insights.summary.averages.energy)}, Stress: {formatMetric(insights.summary.averages.stress)}, Social: {formatMetric(insights.summary.averages.social)}, DriftIndex: {formatMetric(insights.summary.averages.driftIndex)}
                </p>
                <div className="mt-3 space-y-2">
                  {metrics.map((m) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <span className="text-xs font-body text-slate-500 w-20 text-right">{m.label}</span>
                      <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${metricBarColor(m.label)}`}
                          style={{ width: m.value !== null ? `${(m.value / 5) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs font-body text-slate-600 w-8">{formatMetric(m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {insights.highlights.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-heading font-semibold text-slate-700">Highlights</h2>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {insights.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm font-body text-slate-700">
                      <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-sage-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {insights.suggestions.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-heading font-semibold text-slate-700">Suggestions</h2>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {insights.suggestions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm font-body text-slate-700">
                      <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-coral-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {!insights.summary.hasEnoughData ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardBody>
                <p className="text-sm text-amber-700">Not enough data yet to derive stable trends.</p>
              </CardBody>
            </Card>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && !insights ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-slate-500">No weekly insights yet.</p>
          </CardBody>
        </Card>
      ) : null}
    </main>
  );
}
