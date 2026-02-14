"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendChart } from "@/components/trend-chart";
import {
  buildLoginHref,
  buildSessionAuthorizationHeader,
  isLoggedIn
} from "@/lib/auth/client-auth";

type TrendPoint = {
  date: string;
  energy: number;
  stress: number;
  social: number;
};

type TrendSeriesPayload = {
  dates?: unknown;
  energy?: unknown;
  stress?: unknown;
  social?: unknown;
};

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function normalizeTrendsPayload(payload: unknown): TrendPoint[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const source = payload as {
    data?: unknown;
    series?: TrendSeriesPayload;
  };

  if (Array.isArray(source.data)) {
    return source.data
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const candidate = item as Partial<TrendPoint>;
        if (
          typeof candidate.date !== "string" ||
          !isNumber(candidate.energy) ||
          !isNumber(candidate.stress) ||
          !isNumber(candidate.social)
        ) {
          return null;
        }
        return {
          date: candidate.date,
          energy: candidate.energy,
          stress: candidate.stress,
          social: candidate.social
        };
      })
      .filter((item): item is TrendPoint => item !== null);
  }

  if (!source.series || typeof source.series !== "object") {
    return [];
  }

  const dates = Array.isArray(source.series.dates) ? source.series.dates : [];
  const energy = Array.isArray(source.series.energy) ? source.series.energy : [];
  const stress = Array.isArray(source.series.stress) ? source.series.stress : [];
  const social = Array.isArray(source.series.social) ? source.series.social : [];
  const count = Math.min(dates.length, energy.length, stress.length, social.length);
  const points: TrendPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    if (
      typeof dates[index] !== "string" ||
      !isNumber(energy[index]) ||
      !isNumber(stress[index]) ||
      !isNumber(social[index])
    ) {
      continue;
    }

    points.push({
      date: dates[index],
      energy: energy[index],
      stress: stress[index],
      social: social[index]
    });
  }

  return points;
}

export default function TrendsPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/trends?days=${period}`, {
          method: "GET",
          headers: {
            accept: "application/json",
            ...buildSessionAuthorizationHeader()
          },
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) {
            setError("Failed to load trends.");
            setData([]);
          }
          return;
        }

        const json = (await response.json()) as unknown;
        const normalized = normalizeTrendsPayload(json);
        if (active) {
          setData(normalized);
        }
      } catch {
        if (active) {
          setError("Failed to load trends.");
          setData([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [period, authenticated]);

  if (!authChecked) {
    return <main><p>Checking authentication...</p></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Trends</h1>
        <p role="alert">Please log in to continue.</p>
        <Link href={buildLoginHref(pathname ?? "/trends", "/trends")}>Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Trends</h1>
      <TrendChart period={period} data={data} loading={loading} error={error} onPeriodChange={setPeriod} />
    </main>
  );
}
