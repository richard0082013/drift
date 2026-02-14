const AUTH_COOKIE_KEY = "drift_session_user";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return document.cookie.split(";").some((part) => part.trim().startsWith(`${AUTH_COOKIE_KEY}=`));
}

export async function loginWithSession(userId = "demo-user"): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function buildSessionAuthorizationHeader(): Record<string, string> {
  return {};
}

export function sanitizeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

export function buildLoginHref(pathname: string, fallback = "/"): string {
  const target = sanitizeNextPath(pathname, fallback);
  return `/login?next=${encodeURIComponent(target)}`;
}
