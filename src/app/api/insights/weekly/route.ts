import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { buildWeeklyInsights } from "@/lib/insights/weekly";

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

  return NextResponse.json(
    buildWeeklyInsights({
      checkins,
      driftScores,
      alerts,
      start: window.start,
      end: window.end,
      days
    })
  );
}
