import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { checkRateLimit, getRateLimitConfig } from "@/lib/security/rate-limit";
import { trackMetricEvent } from "@/lib/metrics/events";

const NOT_FOUND_ERROR = {
  error: {
    code: "ACCOUNT_NOT_FOUND",
    message: "Account does not exist."
  }
};

const DEFAULT_PURGE_WINDOW_DAYS = 30;

function getPurgeAfter(now: Date) {
  const days = Number(process.env.ACCOUNT_PURGE_WINDOW_DAYS ?? DEFAULT_PURGE_WINDOW_DAYS);
  const safeDays = Number.isInteger(days) && days > 0 && days <= 365 ? days : DEFAULT_PURGE_WINDOW_DAYS;
  return new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000);
}

function isPrismaRetentionArgError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes("Unknown argument `deletedAt`") ||
    error.message.includes("Unknown argument `purgeAfter`")
  );
}

async function markUserForPurge(userId: string, now: Date, purgeAfter: Date) {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        deletedAt: now,
        purgeAfter
      }
    });
    return;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      throw error;
    }
    if (!isPrismaRetentionArgError(error)) {
      throw error;
    }
  }

  const updated = await db.$executeRawUnsafe(
    `UPDATE "User" SET deletedAt = ?, purgeAfter = ?, updatedAt = ? WHERE id = ?`,
    now.toISOString(),
    purgeAfter.toISOString(),
    now.toISOString(),
    userId
  );

  if (!updated) {
    throw { code: "P2025" };
  }
}

async function handleDelete(request: Request) {
  const userId = getSessionUserId(request);
  const now = new Date();
  if (!userId) {
    await writeAuditLog({
      action: "account.delete",
      actorId: "anon",
      status: "failed",
      meta: { reason: "unauthorized", event: "account.delete", occurredAt: now.toISOString() }
    });
    return unauthorizedResponse();
  }

  const config = getRateLimitConfig("RATE_LIMIT_MAX_ACCOUNT_DELETE");
  const decision = checkRateLimit(`account.delete:${userId}`, config.max, config.windowMs);
  if (!decision.allowed) {
    await writeAuditLog({
      action: "account.delete",
      actorId: userId,
      status: "rate_limited",
      target: userId,
      meta: {
        retryAfterSeconds: decision.retryAfterSeconds,
        event: "account.delete",
        occurredAt: now.toISOString()
      }
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

  try {
    const purgeAfter = getPurgeAfter(now);
    await markUserForPurge(userId, now, purgeAfter);

    await trackMetricEvent({
      event: "account.delete",
      actorId: userId,
      status: "success",
      target: userId,
      properties: { strategy: "soft", purgeAfter: purgeAfter.toISOString() }
    });
    await writeAuditLog({
      action: "account.delete",
      actorId: userId,
      status: "success",
      target: userId,
      meta: {
        strategy: "soft",
        purgeAfter: purgeAfter.toISOString(),
        event: "account.delete",
        occurredAt: now.toISOString()
      }
    });
    return NextResponse.json({
      deleted: true,
      strategy: "soft",
      purgeAfter: purgeAfter.toISOString(),
      message: "Account scheduled for permanent deletion."
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      await writeAuditLog({
        action: "account.delete",
        actorId: userId,
        status: "failed",
        target: userId,
        meta: { reason: "not_found", event: "account.delete", occurredAt: now.toISOString() }
      });
      return NextResponse.json(NOT_FOUND_ERROR, { status: 404 });
    }

    await writeAuditLog({
      action: "account.delete",
      actorId: userId,
      status: "failed",
      target: userId,
      meta: { reason: "internal_error", event: "account.delete", occurredAt: now.toISOString() }
    });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to delete account."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleDelete(request);
}

export async function DELETE(request: Request) {
  return handleDelete(request);
}
