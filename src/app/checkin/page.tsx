"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckinForm } from "@/components/checkin-form";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import { trackClientEvent } from "@/lib/metrics/client-events";
import { AuthRequiredState, ErrorState, LoadingState } from "@/components/page-feedback";

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
      <main>
        <h1>Daily Check-in</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/checkin", "/checkin")} />
      </main>
    );
  }

  return (
    <main>
      <h1>Daily Check-in</h1>
      <p>Complete your daily check-in in under 10 seconds.</p>
      <p>Use neutral wording only and avoid entering highly sensitive personal details.</p>
      {loadingToday ? <LoadingState /> : null}
      {todayError ? <ErrorState message={todayError} /> : null}
      {!loadingToday && !todayError && !todayCheckin ? <p>今日未打卡，请填写。</p> : null}
      {!loadingToday && !todayError && todayCheckin ? (
        <p>
          今日已打卡（energy/stress/social）：{todayCheckin.energy}/{todayCheckin.stress}/
          {todayCheckin.social}
        </p>
      ) : null}
      {!loadingToday && !todayError && !todayCheckin ? (
        <CheckinForm
          onSubmitSuccess={(checkin) => {
            trackClientEvent("checkin_submitted");
            setTodayCheckin(checkin);
          }}
        />
      ) : null}
    </main>
  );
}
