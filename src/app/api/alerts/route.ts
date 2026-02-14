import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? process.env.DEFAULT_USER_ID;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing user identity." } },
      { status: 401 }
    );
  }

  const alerts = await db.alert.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      level: true,
      message: true,
      reason: true,
      action: true
    }
  });

  return NextResponse.json({
    data: alerts.map((item) => ({
      id: item.id,
      date: item.date.toISOString().slice(0, 10),
      level: item.level,
      message: item.message,
      reason: item.reason,
      action: item.action
    }))
  });
}
