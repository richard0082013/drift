"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import { trackClientEvent } from "@/lib/metrics/client-events";

type WeeklyInsight = {
  summary: string;
  suggestions: string[];
};

function normalizeInsightsPayload(payload: unknown): WeeklyInsight | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as { summary?: unknown; suggestions?: unknown; data?: unknown };
  const data = source.data && typeof source.data === "object" ? source.data as Record<string, unknown> : null;
  const summary = typeof source.summary === "string"
    ? source.summary
    : typeof data?.summary === "string"
      ? data.summary
      : null;
  const suggestionsRaw = Array.isArray(source.suggestions)
    ? source.suggestions
    : Array.isArray(data?.suggestions)
      ? data.suggestions
      : [];

  if (!summary) {
    return null;
  }

  const suggestions = suggestionsRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return { summary, suggestions };
}

export default function WeeklyInsightsPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);

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

    async function loadInsights() {
      setLoading(true);
      setError(null);
      setInsight(null);

      try {
        const response = await fetch("/api/insights/weekly", {
          method: "GET",
          headers: { accept: "application/json" },
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) {
            setError("Unable to load weekly insights.");
          }
          return;
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeInsightsPayload(payload);
        if (active) {
          setInsight(normalized);
          if (normalized) {
            trackClientEvent("insights_viewed", {
              suggestionCount: normalized.suggestions.length
            });
          }
        }
      } catch {
        if (active) {
          setError("Unable to load weekly insights.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInsights();
    return () => {
      active = false;
    };
  }, [authenticated]);

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
      {loading ? <p>Loading weekly insights...</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!loading && !error && !insight ? <p>No weekly insights yet.</p> : null}
      {!loading && !error && insight ? (
        <section>
          <p>{insight.summary}</p>
          {insight.suggestions.length > 0 ? (
            <ul>
              {insight.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No suggestions this week.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
