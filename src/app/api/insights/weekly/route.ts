import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { buildWeeklyInsights } from "@/lib/insights/weekly";

function toUtcStartOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const now = new Date();
  const from = toUtcStartOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const to = toUtcStartOfDay(now);

  const checkins = await db.dailyCheckin.findMany({
    where: {
      userId,
      date: {
        gte: from
      }
    },
    orderBy: {
      date: "asc"
    },
    select: {
      date: true,
      energy: true,
      stress: true,
      social: true
    }
  });

  const insights = buildWeeklyInsights(checkins);
  return NextResponse.json({
    window: {
      days: 7,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10)
    },
    summary: insights.summary,
    recommendations: insights.recommendations
  });
}
