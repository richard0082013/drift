import { NextResponse } from "next/server";

const AUTH_ERROR = {
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required."
  }
};

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

export function getSessionUserId(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token.startsWith("drift-user:")) {
      const userId = token.slice("drift-user:".length);
      if (userId) {
        return userId;
      }
    }
  }

  const cookieUserId = readCookie(request, "drift_session_user");
  if (cookieUserId) {
    return cookieUserId;
  }

  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json(AUTH_ERROR, { status: 401 });
}
