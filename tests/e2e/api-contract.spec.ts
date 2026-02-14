import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createSessionToken } from "@/lib/auth/session";

const db = new PrismaClient();

type ErrorPayload = {
  error: { code: string; message: string };
  requestId: string;
  timestamp: string;
};

function expectMeta(payload: { requestId?: unknown; timestamp?: unknown }) {
  expect(typeof payload.requestId).toBe("string");
  expect((payload.requestId as string).length).toBeGreaterThan(0);
  expect(typeof payload.timestamp).toBe("string");
  expect(Number.isNaN(Date.parse(payload.timestamp as string))).toBe(false);
}

function expectErrorContract(payload: ErrorPayload) {
  expect(typeof payload.error.code).toBe("string");
  expect(typeof payload.error.message).toBe("string");
  expectMeta(payload);
}

test("api contract: session + health + settings + insights carry requestId/timestamp and error envelope", async ({ page, context }) => {
  const sessionUnauthed = await page.request.get("/api/auth/session");
  expect(sessionUnauthed.status()).toBe(401);
  expectErrorContract((await sessionUnauthed.json()) as ErrorPayload);

  const healthUnauthed = await page.request.get("/api/health");
  expect(healthUnauthed.status()).toBe(200);
  const healthUnauthedJson = (await healthUnauthed.json()) as {
    status: string;
    authenticated: boolean;
    session: { userId: string | null };
    requestId: string;
    timestamp: string;
  };
  expect(healthUnauthedJson.status).toBe("ok");
  expect(healthUnauthedJson.authenticated).toBe(false);
  expect(healthUnauthedJson.session.userId).toBeNull();
  expectMeta(healthUnauthedJson);

  const settingsUnauthed = await page.request.get("/api/settings/reminder");
  expect(settingsUnauthed.status()).toBe(401);
  expectErrorContract((await settingsUnauthed.json()) as ErrorPayload);

  const insightsUnauthed = await page.request.get("/api/insights/weekly");
  expect(insightsUnauthed.status()).toBe(401);
  expectErrorContract((await insightsUnauthed.json()) as ErrorPayload);

  const user = await db.user.create({
    data: {
      email: `qa-week6-contract-${Date.now()}@example.com`,
      timezone: "UTC"
    }
  });

  await context.addCookies([
    {
      name: "drift_session",
      value: createSessionToken(user.id),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }
  ]);

  try {
    const sessionAuthed = await page.request.get("/api/auth/session");
    expect(sessionAuthed.status()).toBe(200);
    const sessionAuthedJson = (await sessionAuthed.json()) as {
      authenticated: boolean;
      session: { userId: string };
      requestId: string;
      timestamp: string;
    };
    expect(sessionAuthedJson.authenticated).toBe(true);
    expect(sessionAuthedJson.session.userId).toBe(user.id);
    expectMeta(sessionAuthedJson);

    const healthAuthed = await page.request.get("/api/health");
    expect(healthAuthed.status()).toBe(200);
    const healthAuthedJson = (await healthAuthed.json()) as {
      status: string;
      authenticated: boolean;
      session: { userId: string | null };
      requestId: string;
      timestamp: string;
    };
    expect(healthAuthedJson.status).toBe("ok");
    expect(healthAuthedJson.authenticated).toBe(true);
    expect(healthAuthedJson.session.userId).toBe(user.id);
    expectMeta(healthAuthedJson);

    const settingsAuthed = await page.request.get("/api/settings/reminder");
    expect(settingsAuthed.status()).toBe(200);
    const settingsAuthedJson = (await settingsAuthed.json()) as {
      settings: Record<string, unknown>;
      requestId: string;
      timestamp: string;
    };
    expect(settingsAuthedJson.settings).toBeDefined();
    expectMeta(settingsAuthedJson);

    const insightsAuthed = await page.request.get("/api/insights/weekly?days=7");
    expect(insightsAuthed.status()).toBe(200);
    const insightsAuthedJson = (await insightsAuthed.json()) as {
      weekStart: string;
      weekEnd: string;
      days: number;
      summary: Record<string, unknown>;
      requestId: string;
      timestamp: string;
    };
    expect(insightsAuthedJson.days).toBe(7);
    expect(insightsAuthedJson.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(insightsAuthedJson.weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(insightsAuthedJson.summary).toBeDefined();
    expectMeta(insightsAuthedJson);

    const insightsBadDays = await page.request.get("/api/insights/weekly?days=99");
    expect(insightsBadDays.status()).toBe(400);
    expectErrorContract((await insightsBadDays.json()) as ErrorPayload);
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});
