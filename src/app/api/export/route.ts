import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { checkRateLimit, getRateLimitConfig } from "@/lib/security/rate-limit";
import { trackMetricEvent } from "@/lib/metrics/events";

type CsvRow = {
  date: string;
  energy: string;
  stress: string;
  social: string;
  key_contact: string;
  drift_index: string;
  drift_reasons: string;
};

function toCsvValue(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", '""')}"`;
  }
  return value;
}

function formatCsv(rows: CsvRow[]) {
  const header = "date,energy,stress,social,key_contact,drift_index,drift_reasons";
  const lines = rows.map((row) =>
    [
      row.date,
      row.energy,
      row.stress,
      row.social,
      row.key_contact,
      row.drift_index,
      row.drift_reasons
    ]
      .map((item) => toCsvValue(item))
      .join(",")
  );

  return [header, ...lines].join("\n");
}

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    await writeAuditLog({
      action: "export.csv",
      actorId: "anon",
      status: "failed",
      meta: { reason: "unauthorized" }
    });
    return unauthorizedResponse();
  }

  const config = getRateLimitConfig("RATE_LIMIT_MAX_EXPORT");
  const decision = checkRateLimit(`export.csv:${userId}`, config.max, config.windowMs);
  if (!decision.allowed) {
    await writeAuditLog({
      action: "export.csv",
      actorId: userId,
      status: "rate_limited",
      target: userId,
      meta: { retryAfterSeconds: decision.retryAfterSeconds }
    });
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later."
        }
      },
      { status: 429, headers: { "retry-after": String(decision.retryAfterSeconds) } }
    );
  }

  const [checkins, driftScores] = await Promise.all([
    db.dailyCheckin.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: {
        date: true,
        energy: true,
        stress: true,
        social: true,
        keyContact: true
      }
    }),
    db.driftScore.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: {
        date: true,
        driftIndex: true,
        reasonsJson: true
      }
    })
  ]);

  const driftByDate = new Map(
    driftScores.map((item) => [
      item.date.toISOString().slice(0, 10),
      {
        driftIndex: item.driftIndex,
        reasons: Array.isArray(item.reasonsJson) ? item.reasonsJson.map(String) : []
      }
    ])
  );

  const rows: CsvRow[] = checkins.map((item) => {
    const date = item.date.toISOString().slice(0, 10);
    const drift = driftByDate.get(date);

    return {
      date,
      energy: String(item.energy),
      stress: String(item.stress),
      social: String(item.social),
      key_contact: item.keyContact ?? "",
      drift_index: drift ? String(drift.driftIndex) : "",
      drift_reasons: drift ? drift.reasons.join(" | ") : ""
    };
  });

  const csv = formatCsv(rows);
  await trackMetricEvent({
    event: "export.csv",
    actorId: userId,
    status: "success",
    target: userId,
    properties: { rowCount: rows.length }
  });
  await writeAuditLog({
    action: "export.csv",
    actorId: userId,
    status: "success",
    target: userId,
    meta: { rowCount: rows.length }
  });
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=drift-export-${userId}.csv`
    }
  });
}
