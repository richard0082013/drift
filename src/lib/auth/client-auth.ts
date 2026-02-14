const AUTH_STORAGE_KEY = "drift_auth_user";
const AUTH_COOKIE_KEY = "drift_session_user";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function markLoggedIn(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, userId);
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(userId)}; Path=/; SameSite=Lax`;
}

export function getLoggedInUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const userId = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return userId && userId.trim() ? userId : null;
  } catch {
    return null;
  }
}

export function buildSessionAuthorizationHeader(): Record<string, string> {
  const userId = getLoggedInUserId();
  if (!userId) {
    return {};
  }

  return {
    authorization: `Bearer drift-user:${userId}`
  };
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
