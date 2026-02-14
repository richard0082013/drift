import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/log";

const DEFAULT_INTERNAL_TOKEN = "drift-internal-dev-token-change-me";

function getInternalToken() {
  return process.env.INTERNAL_JOB_TOKEN ?? DEFAULT_INTERNAL_TOKEN;
}

function parseLimit(url: string) {
  const { searchParams } = new URL(url);
  const raw = Number(searchParams.get("limit") ?? 100);
  if (!Number.isInteger(raw) || raw <= 0 || raw > 1000) {
    return null;
  }
  return raw;
}

function isInternalAuthorized(request: Request) {
  const token = request.headers.get("x-internal-token")?.trim();
  return Boolean(token) && token === getInternalToken();
}

export async function POST(request: Request) {
  if (!isInternalAuthorized(request)) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Internal authorization required."
        }
      },
      { status: 403 }
    );
  }

  const limit = parseLimit(request.url);
  if (limit === null) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "limit must be an integer between 1 and 1000."
        }
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const dueUsers = await db.user.findMany({
    where: {
      deletedAt: { not: null },
      purgeAfter: { not: null, lte: now }
    },
    orderBy: { purgeAfter: "asc" },
    take: limit,
    select: { id: true }
  });

  const userIds = dueUsers.map((user) => user.id);
  if (userIds.length > 0) {
    await db.user.deleteMany({
      where: { id: { in: userIds } }
    });
  }

  await writeAuditLog({
    action: "account.purge",
    actorId: "internal:purge-job",
    status: "success",
    meta: {
      requestedLimit: limit,
      purgedCount: userIds.length,
      purgedUserIds: userIds,
      occurredAt: now.toISOString()
    }
  });

  return NextResponse.json({
    purgedCount: userIds.length,
    purgedUserIds: userIds,
    runAt: now.toISOString()
  });
}
