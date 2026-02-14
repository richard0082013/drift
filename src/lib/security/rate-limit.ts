type Bucket = {
  windowStart: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

function nowMs() {
  return Date.now();
}

function clampInt(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

export function getRateLimitConfig(maxEnvKey: string) {
  const max = clampInt(Number(process.env[maxEnvKey]), 30);
  const windowMs = clampInt(Number(process.env.RATE_LIMIT_WINDOW_MS), 60_000);
  return { max, windowMs };
}

export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitDecision {
  const now = nowMs();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000), remaining: max - 1 };
  }

  if (existing.count >= max) {
    const elapsed = now - existing.windowStart;
    const remainingMs = Math.max(windowMs - elapsed, 0);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
      remaining: 0
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000), remaining: max - existing.count };
}
