"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckinForm } from "@/components/checkin-form";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import { trackClientEvent } from "@/lib/metrics/client-events";
import { AuthRequiredState, ErrorState, LoadingState } from "@/components/page-feedback";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TodayCheckin = {
  energy: number;
  stress: number;
  social: number;
};

export default function CheckinPage() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingToday, setLoadingToday] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin | null>(null);
  const [todayError, setTodayError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      const loggedIn = await isLoggedIn();
      if (!active) {
        return;
      }

      setAuthenticated(loggedIn);
      setReady(true);
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

    async function loadTodayCheckin() {
      setLoadingToday(true);
      setTodayError(null);

      try {
        const response = await fetch("/api/checkins/today", {
          method: "GET",
          headers: { accept: "application/json" },
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) {
            setTodayError("Unable to load today's check-in status.");
          }
          return;
        }

        const payload = (await response.json()) as {
          checkedInToday?: unknown;
          checkin?: unknown;
        };

        if (!active) {
          return;
        }

        if (payload.checkedInToday === true && payload.checkin && typeof payload.checkin === "object") {
          const checkin = payload.checkin as {
            energy?: unknown;
            stress?: unknown;
            social?: unknown;
          };

          if (
            typeof checkin.energy === "number" &&
            typeof checkin.stress === "number" &&
            typeof checkin.social === "number"
          ) {
            setTodayCheckin({
              energy: checkin.energy,
              stress: checkin.stress,
              social: checkin.social
            });
            return;
          }
        }

        setTodayCheckin(null);
      } catch {
        if (active) {
          setTodayError("Unable to load today's check-in status.");
        }
      } finally {
        if (active) {
          setLoadingToday(false);
        }
      }
    }

    loadTodayCheckin();

    return () => {
      active = false;
    };
  }, [authenticated]);

  if (!ready) {
    return <main><LoadingState /></main>;
  }

  if (!authenticated) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Daily Check-in</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/checkin", "/checkin")} />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Daily Check-in</h1>
        <p className="text-sm text-slate-500">Complete your daily check-in in under 10 seconds.</p>
        <p className="text-xs text-slate-400">Use neutral wording only and avoid entering highly sensitive personal details.</p>
      </div>

      {loadingToday ? <LoadingState /> : null}
      {todayError ? <ErrorState message={todayError} /> : null}

      {!loadingToday && !todayError && !todayCheckin ? (
        <Card>
          <CardHeader>
            <p className="text-sm text-slate-600">You haven't checked in today.</p>
          </CardHeader>
          <CardBody>
            <CheckinForm
              onSubmitSuccess={(checkin) => {
                trackClientEvent("checkin_submitted");
                setTodayCheckin(checkin);
              }}
            />
          </CardBody>
        </Card>
      ) : null}

      {!loadingToday && !todayError && todayCheckin ? (
        <Card className="border-sage-200 bg-sage-50/50">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-sage-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-medium text-sage-700">
                Checked in today (energy/stress/social):{todayCheckin.energy}/{todayCheckin.stress}/{todayCheckin.social}
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="info">Energy: {todayCheckin.energy}</Badge>
              <Badge variant="high">Stress: {todayCheckin.stress}</Badge>
              <Badge variant="low">Social: {todayCheckin.social}</Badge>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </main>
  );
}
