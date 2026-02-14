import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueSessionCookie } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { checkRateLimit, getRateLimitConfig } from "@/lib/security/rate-limit";
import { trackMetricEvent } from "@/lib/metrics/events";

type LoginPayload = {
  email?: string;
  name?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const config = getRateLimitConfig("RATE_LIMIT_MAX_LOGIN");
  const decision = checkRateLimit(`auth.login:${ip}`, config.max, config.windowMs);
  if (!decision.allowed) {
    await writeAuditLog({
      action: "auth.login",
      actorId: `anon:${ip}`,
      status: "rate_limited",
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

  const payload = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const name = payload.name?.trim() ?? "";

  if (!email || !isValidEmail(email)) {
    await writeAuditLog({
      action: "auth.login",
      actorId: `anon:${ip}`,
      status: "failed",
      meta: { reason: "validation_error" }
    });
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid email is required."
        }
      },
      { status: 400 }
    );
  }

  const user = await db.user.upsert({
    where: { email },
    update: {
      name: name || undefined
    },
    create: {
      email,
      name: name || undefined
    }
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
  response.headers.append("set-cookie", issueSessionCookie(user.id));
  await trackMetricEvent({
    event: "auth.login",
    actorId: user.id,
    status: "success",
    target: user.id,
    properties: { ip }
  });
  await writeAuditLog({
    action: "auth.login",
    actorId: user.id,
    status: "success",
    target: user.id,
    meta: { ip }
  });
  return response;
}
