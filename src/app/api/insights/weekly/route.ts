import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { buildWeeklyInsights } from "@/lib/insights/weekly";

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function parseDays(url: string): number | null {
  const { searchParams } = new URL(url);
  const raw = searchParams.get("days");

  if (raw === null || raw === "") {
    return 7;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 14) {
    return null;
  }

  return value;
}

function getWindow(days: number, now: Date) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start, end, endExclusive };
}

function isWeeklyInsightsContract(value: unknown, expectedDays: number): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    weekStart?: unknown;
    weekEnd?: unknown;
    days?: unknown;
    summary?: unknown;
    highlights?: unknown;
    suggestions?: unknown;
  };

  if (
    typeof candidate.weekStart !== "string" ||
    typeof candidate.weekEnd !== "string" ||
    candidate.days !== expectedDays ||
    !candidate.summary ||
    typeof candidate.summary !== "object"
  ) {
    return false;
  }

  const summary = candidate.summary as {
    checkinCount?: unknown;
    alertCount?: unknown;
    averages?: unknown;
    driftLevel?: unknown;
    hasEnoughData?: unknown;
  };

  if (
    typeof summary.checkinCount !== "number" ||
    typeof summary.alertCount !== "number" ||
    !summary.averages ||
    typeof summary.averages !== "object" ||
    (summary.driftLevel !== "low" &&
      summary.driftLevel !== "moderate" &&
      summary.driftLevel !== "high") ||
    typeof summary.hasEnoughData !== "boolean"
  ) {
    return false;
  }

  const averages = summary.averages as {
    energy?: unknown;
    stress?: unknown;
    social?: unknown;
    driftIndex?: unknown;
  };

  if (
    !isFiniteNumberOrNull(averages.energy) ||
    !isFiniteNumberOrNull(averages.stress) ||
    !isFiniteNumberOrNull(averages.social) ||
    !isFiniteNumberOrNull(averages.driftIndex)
  ) {
    return false;
  }

  if (
    !Array.isArray(candidate.highlights) ||
    !candidate.highlights.every((item) => typeof item === "string") ||
    !Array.isArray(candidate.suggestions) ||
    !candidate.suggestions.every((item) => typeof item === "string")
  ) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const days = parseDays(request.url);
  if (days === null) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "days must be an integer between 1 and 14."
        }
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const window = getWindow(days, now);

  const [checkins, driftScores, alerts] = await Promise.all([
    db.dailyCheckin.findMany({
      where: {
        userId,
        date: {
          gte: window.start,
          lt: window.endExclusive
        }
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        energy: true,
        stress: true,
        social: true
      }
    }),
    db.driftScore.findMany({
      where: {
        userId,
        date: {
          gte: window.start,
          lt: window.endExclusive
        }
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        driftIndex: true,
        reasonsJson: true
      }
    }),
    db.alert.findMany({
      where: {
        userId,
        date: {
          gte: window.start,
          lt: window.endExclusive
        }
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        level: true
      }
    })
  ]);

  const insights = buildWeeklyInsights({
    checkins,
    driftScores,
    alerts,
    start: window.start,
    end: window.end,
    days
  });

  if (!isWeeklyInsightsContract(insights, days)) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Invalid weekly insights contract."
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json(insights);
}
