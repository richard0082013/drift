import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { checkRateLimit, getRateLimitConfig } from "@/lib/security/rate-limit";

const NOT_FOUND_ERROR = {
  error: {
    code: "ACCOUNT_NOT_FOUND",
    message: "Account does not exist."
  }
};

async function handleDelete(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    await writeAuditLog({
      action: "account.delete",
      actorId: "anon",
      status: "failed",
      meta: { reason: "unauthorized" }
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

  try {
    await db.user.delete({
      where: { id: userId }
    });

    await writeAuditLog({
      action: "account.delete",
      actorId: userId,
      status: "success",
      target: userId
    });
    return NextResponse.json({
      deleted: true,
      strategy: "hard"
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      await writeAuditLog({
        action: "account.delete",
        actorId: userId,
        status: "failed",
        target: userId,
        meta: { reason: "not_found" }
      });
      return NextResponse.json(NOT_FOUND_ERROR, { status: 404 });
    }

    await writeAuditLog({
      action: "account.delete",
      actorId: userId,
      status: "failed",
      target: userId,
      meta: { reason: "internal_error" }
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
