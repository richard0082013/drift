import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";

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
    return unauthorizedResponse();
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
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=drift-export-${userId}.csv`
    }
  });
}
