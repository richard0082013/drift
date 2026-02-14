import crypto from "node:crypto";
import { NextResponse } from "next/server";

type RequestMeta = {
  requestId: string;
  timestamp: string;
};

function normalizeHeaderRequestId(request: Request): string | null {
  const value = request.headers.get("x-request-id")?.trim();
  return value ? value : null;
}

export function createRequestMeta(request: Request): RequestMeta {
  return {
    requestId: normalizeHeaderRequestId(request) ?? crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
}

export function successJson(
  payload: Record<string, unknown>,
  meta: RequestMeta,
  status = 200
) {
  return NextResponse.json(
    {
      ...payload,
      requestId: meta.requestId,
      timestamp: meta.timestamp
    },
    { status }
  );
}

export function errorJson(
  code: string,
  message: string,
  meta: RequestMeta,
  status: number
) {
  return NextResponse.json(
    {
      error: {
        code,
        message
      },
      requestId: meta.requestId,
      timestamp: meta.timestamp
    },
    { status }
  );
}
