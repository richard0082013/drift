"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  buildLoginHref,
  buildSessionAuthorizationHeader,
  isLoggedIn
} from "@/lib/auth/client-auth";
import { AuthRequiredState, EmptyState, ErrorState, LoadingState } from "@/components/page-feedback";
import { Card, CardBody } from "@/components/ui/card";

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
    return <main className="space-y-6"><LoadingState /></main>;
  }

  if (!authenticated) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Alerts</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/alerts", "/alerts")} />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-slate-800">Alerts</h1>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyState message="No active alerts." /> : null}
      {!loading && !error && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((item) => (
            <Card key={item.id} className="border-l-4 border-amber-500">
              <CardBody>
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700">{item.reason}</p>
                    <p className="text-sm text-slate-500 italic mt-1">{item.action}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}
    </main>
  );
}
