import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function daysToDate(days: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
}

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? process.env.DEFAULT_USER_ID;
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing user identity." } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const daysParam = Number(searchParams.get("days") ?? 7);

  if (![7, 30].includes(daysParam)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "days must be 7 or 30." } },
      { status: 400 }
    );
  }

  const from = daysToDate(daysParam);

  const checkins = await db.dailyCheckin.findMany({
    where: {
      userId,
      date: { gte: from }
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      energy: true,
      stress: true,
      social: true
    }
  });

  return NextResponse.json({
    days: daysParam,
    data: checkins.map((item) => ({
      date: item.date.toISOString().slice(0, 10),
      energy: item.energy,
      stress: item.stress,
      social: item.social
    }))
  });
}
