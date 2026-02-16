/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

type ApiError = { code?: string; message?: string };

type RequestResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: ApiError | null;
  headers: Headers;
};

type LoginResponse = {
  user: { id: string; email: string; name?: string };
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

const BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const TEST_EMAIL = "mobile-test@drift.local";
const TEST_NAME = "Mobile Test User";
const prisma = new PrismaClient();

function assertOk(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function clamp(value: number, min = 1, max = 5) {
  return Math.max(min, Math.min(max, value));
}

function utcDateString(offsetDays: number) {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + offsetDays);
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function cleanupTestUser() {
  await prisma.user.deleteMany({
    where: { email: TEST_EMAIL }
  });
}

async function requestJson<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<RequestResult<T>> {
  const headers = new Headers(init.headers);
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body
  });

  const contentType = response.headers.get("content-type") ?? "";
  let payload: unknown = null;
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? ((payload as { error?: ApiError }).error ?? null)
        : { code: "HTTP_ERROR", message: String(payload) };

    return {
      ok: false,
      status: response.status,
      data: null,
      error,
      headers: response.headers
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload as T,
    error: null,
    headers: response.headers
  };
}

async function loginTestUser() {
  const result = await requestJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: TEST_EMAIL, name: TEST_NAME })
  });
  assertOk(result.ok && result.data, `Login failed: ${result.error?.message ?? result.status}`);
  return result.data;
}

async function seedCheckins(token: string) {
  const outcomes: Array<{ date: string; status: number; code: string }> = [];
  for (let i = 13; i >= 0; i -= 1) {
    const index = 13 - i; // oldest -> newest
    const date = utcDateString(-i);
    const energy = clamp(5 - Math.floor((index + 1) / 2));
    const stress = clamp(1 + Math.floor((index + 1) / 2));
    const social = clamp(5 - Math.floor((index + 1) / 2));

    const result = await requestJson<{ checkin: unknown }>("/api/checkins", {
      method: "POST",
      token,
      body: JSON.stringify({
        date,
        energy,
        stress,
        social,
        key_contact: index % 3 === 0 ? "Alex" : undefined
      })
    });

    if (result.ok) {
      outcomes.push({ date, status: result.status, code: "CREATED" });
      continue;
    }

    if (result.status === 409 && result.error?.code === "DUPLICATE_CHECKIN") {
      outcomes.push({ date, status: result.status, code: "DUPLICATE_CHECKIN" });
      continue;
    }

    throw new Error(
      `Check-in seed failed for ${date}: ${result.status} ${result.error?.code ?? "UNKNOWN"}`
    );
  }
  return outcomes;
}

async function ensureAtLeastOneAlert(token: string) {
  const existing = await requestJson<{ data: unknown[] }>("/api/alerts", { token });
  if (!existing.ok || !existing.data) {
    throw new Error(`Unable to read alerts: ${existing.status} ${existing.error?.code ?? ""}`);
  }
  if (existing.data.data.length > 0) {
    return existing.data.data.length;
  }

  const evaluate = await requestJson<{ alertCreated: boolean }>("/api/alerts/evaluate", {
    method: "POST",
    token,
    body: JSON.stringify({ date: utcDateString(0) })
  });
  if (!evaluate.ok) {
    throw new Error(
      `Alert evaluate failed: ${evaluate.status} ${evaluate.error?.code ?? evaluate.error?.message ?? ""}`
    );
  }

  const finalRead = await requestJson<{ data: unknown[] }>("/api/alerts", { token });
  if (!finalRead.ok || !finalRead.data) {
    throw new Error(`Unable to read alerts after evaluate: ${finalRead.status}`);
  }
  return finalRead.data.data.length;
}

async function verifyEndpoints(token: string) {
  const today = await requestJson<{ checkedInToday: boolean; checkin: unknown | null }>(
    "/api/checkins/today",
    { token }
  );
  const trends7 = await requestJson<{ days: number; data: unknown[] }>("/api/trends?days=7", { token });
  const trends30 = await requestJson<{ days: number; data: unknown[] }>("/api/trends?days=30", { token });
  const insights7 = await requestJson<{ summary: { hasEnoughData: boolean } }>(
    "/api/insights/weekly?days=7",
    { token }
  );
  const reminder = await requestJson<{ settings: Record<string, unknown> }>("/api/settings/reminder", {
    token
  });
  const exportCsv = await requestJson<string>("/api/export", { token });
  const alertsCount = await ensureAtLeastOneAlert(token);

  const csvRows =
    exportCsv.ok && typeof exportCsv.data === "string"
      ? exportCsv.data.split("\n").filter((line) => line.trim().length > 0).length - 1
      : 0;

  return {
    checkinsToday: today.ok && Boolean(today.data?.checkedInToday),
    trends7Points: trends7.ok && trends7.data ? trends7.data.data.length : 0,
    trends30Points: trends30.ok && trends30.data ? trends30.data.data.length : 0,
    alertsCount,
    insightsHasEnoughData: insights7.ok && Boolean(insights7.data?.summary.hasEnoughData),
    reminderLoaded: reminder.ok && Boolean(reminder.data?.settings),
    exportCsvRows: csvRows
  };
}

async function main() {
  console.log(`Seeding mobile integration data via ${BASE_URL}`);
  await cleanupTestUser();
  const login = await loginTestUser();
  const token = login.accessToken;
  await prisma.userPreference.upsert({
    where: { userId: login.user.id },
    create: { userId: login.user.id, alertThreshold: 0.5 },
    update: { alertThreshold: 0.5 }
  });

  const checkinOutcomes = await seedCheckins(token);
  const verification = await verifyEndpoints(token);

  console.log("\n=== Mobile Seed Summary ===");
  console.log(`test_user_email: ${login.user.email}`);
  console.log(`test_user_id: ${login.user.id}`);
  console.log(`bearer_token: ${token}`);
  console.log(`checkins_seeded_attempts: ${checkinOutcomes.length}`);
  console.log(
    `checkins_created: ${checkinOutcomes.filter((item) => item.code === "CREATED").length}, duplicates: ${
      checkinOutcomes.filter((item) => item.code === "DUPLICATE_CHECKIN").length
    }`
  );

  console.log("\n=== Endpoint Verification ===");
  console.table([
    { endpoint: "GET /api/checkins/today", result: verification.checkinsToday ? "PASS" : "FAIL" },
    { endpoint: "GET /api/trends?days=7", result: verification.trends7Points === 7 ? "PASS" : "FAIL", details: verification.trends7Points },
    {
      endpoint: "GET /api/trends?days=30",
      result: verification.trends30Points >= 14 ? "PASS" : "FAIL",
      details: verification.trends30Points
    },
    { endpoint: "GET /api/alerts", result: verification.alertsCount >= 1 ? "PASS" : "FAIL", details: verification.alertsCount },
    {
      endpoint: "GET /api/insights/weekly?days=7",
      result: verification.insightsHasEnoughData ? "PASS" : "FAIL"
    },
    { endpoint: "GET /api/settings/reminder", result: verification.reminderLoaded ? "PASS" : "FAIL" },
    { endpoint: "GET /api/export", result: verification.exportCsvRows > 0 ? "PASS" : "FAIL", details: verification.exportCsvRows }
  ]);
}

main()
  .catch((error) => {
    console.error("\nSeed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
