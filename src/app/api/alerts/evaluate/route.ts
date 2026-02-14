import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateDrift } from "@/lib/drift/engine";
import { generateAlertPayload } from "@/lib/alerts/generate";

function normalizeDate(input?: string) {
  const base = input ? new Date(input) : new Date();
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") ?? process.env.DEFAULT_USER_ID;
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing user identity." } },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { date?: string };
  const date = normalizeDate(body.date);

  const checkins = await db.dailyCheckin.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    take: 6
  });

  const drift = calculateDrift(checkins);
  await db.driftScore.create({
    data: {
      userId,
      date,
      driftIndex: drift.driftIndex,
      reasonsJson: drift.reasons
    }
  });

  const pref = await db.userPreference.findUnique({ where: { userId } });
  const threshold = pref?.alertThreshold ?? 0.65;

  if (drift.driftIndex < threshold) {
    return NextResponse.json({ driftIndex: drift.driftIndex, reasons: drift.reasons, alertCreated: false });
  }

  const payload = generateAlertPayload(drift.driftIndex, drift.reasons);

  const alert = await db.alert.create({
    data: {
      userId,
      date,
      level: payload.level,
      message: payload.message,
      reason: payload.reason,
      action: payload.action
    }
  });

  return NextResponse.json({
    driftIndex: drift.driftIndex,
    reasons: drift.reasons,
    alertCreated: true,
    alert
  });
}
