import { NextResponse } from "next/server";
import crypto from "node:crypto";

const AUTH_ERROR = {
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required."
  }
};

const DEFAULT_SESSION_SECRET = "drift-dev-session-secret-change-me";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE_NAME = "drift_session";

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const pairs = cookieHeader.split(";").map((item) => item.trim());
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? DEFAULT_SESSION_SECRET;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(input: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(input)
    .digest("base64url");
}

type SessionPayload = {
  sub: string;
  exp: number;
};

function parseSessionToken(token: string): SessionPayload | null {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  if (sign(payloadEncoded) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payloadEncoded)) as SessionPayload;
    if (!parsed.sub || typeof parsed.sub !== "string") {
      return null;
    }
    if (!parsed.exp || typeof parsed.exp !== "number") {
      return null;
    }
    if (Date.now() >= parsed.exp * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string, now = Date.now()) {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS
  };
  const payloadEncoded = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function issueSessionCookie(userId: string, token = createSessionToken(userId)) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function getSessionUserId(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const bearerPayload = parseSessionToken(bearerToken);
      if (bearerPayload?.sub) {
        return bearerPayload.sub;
      }
    }
  }

  const sessionToken = readCookie(request, SESSION_COOKIE_NAME);
  if (!sessionToken) {
    return null;
  }

  const payload = parseSessionToken(sessionToken);
  return payload?.sub ?? null;
}

export function unauthorizedResponse() {
  return NextResponse.json(AUTH_ERROR, { status: 401 });
}
