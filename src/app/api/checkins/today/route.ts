import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";

function todayUtcDate(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const today = todayUtcDate();

  const checkin = await db.dailyCheckin.findUnique({
    where: {
      userId_date: {
        userId,
        date: today
      }
    }
  });

  if (!checkin) {
    return NextResponse.json({ checkedInToday: false, checkin: null });
  }

  return NextResponse.json({
    checkedInToday: true,
    checkin: {
      id: checkin.id,
      date: checkin.date.toISOString().slice(0, 10),
      energy: checkin.energy,
      stress: checkin.stress,
      social: checkin.social,
      keyContact: checkin.keyContact,
      notes: checkin.notes,
      createdAt: checkin.createdAt.toISOString(),
      updatedAt: checkin.updatedAt.toISOString()
    }
  });
}
