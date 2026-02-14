"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  buildLoginHref,
  buildSessionAuthorizationHeader,
  isLoggedIn
} from "@/lib/auth/client-auth";
import { AuthRequiredState, EmptyState, ErrorState, LoadingState } from "@/components/page-feedback";

type AlertItem = {
  id: string;
  reason: string;
  action: string;
};

const toSafeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

function normalizeAlertsPayload(payload: unknown): AlertItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const source = payload as {
    data?: unknown;
    alerts?: unknown;
    items?: unknown;
  };

  const list = Array.isArray(source.alerts)
    ? source.alerts
    : Array.isArray(source.items)
      ? source.items
      : Array.isArray(source.data)
        ? source.data
        : [];

  return list
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as { id?: unknown; reason?: unknown; action?: unknown };
      const reason = toSafeText(candidate.reason);
      const action = toSafeText(candidate.action);

      if (!reason || !action) {
        return null;
      }

      const id = toSafeText(candidate.id) ?? `alert-${index}`;
      return { id, reason, action };
    })
    .filter((item): item is AlertItem => item !== null);
}

export default function AlertsPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<AlertItem[]>([]);
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

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/alerts", {
          method: "GET",
          headers: {
            accept: "application/json",
            ...buildSessionAuthorizationHeader()
          },
          cache: "no-store"
        });
        if (!response.ok) {
          if (active) {
            setError("Failed to load alerts.");
            setData([]);
          }
          return;
        }

        const json = (await response.json()) as unknown;
        const normalized = normalizeAlertsPayload(json);
        if (active) {
          setData(normalized);
        }
      } catch {
        if (active) {
          setError("Failed to load alerts.");
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
  }, [authenticated]);

  if (!authChecked) {
    return <main><LoadingState /></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Alerts</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/alerts", "/alerts")} />
      </main>
    );
  }

  return (
    <main>
      <h1>Alerts</h1>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyState message="No active alerts." /> : null}
      {!loading && !error && data.length > 0 ? (
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              <p>{item.reason}</p>
              <p>{item.action}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
