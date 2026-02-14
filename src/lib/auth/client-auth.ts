const AUTH_STORAGE_KEY = "drift_auth_user";

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
