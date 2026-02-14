export async function isLoggedIn(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store"
    });
    return response.status === 200;
  } catch {
    return false;
  }
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
