import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createSessionToken } from "@/lib/auth/session";

const db = new PrismaClient();

test("api contract: /api/health and /api/auth/session are consistent", async ({ page, context }) => {
  const healthUnauthed = await page.request.get("/api/health");
  expect(healthUnauthed.status()).toBe(200);
  const healthUnauthedJson = (await healthUnauthed.json()) as {
    status: string;
    authenticated: boolean;
    session: { userId: string | null };
  };
  expect(healthUnauthedJson.status).toBe("ok");
  expect(healthUnauthedJson.authenticated).toBe(false);
  expect(healthUnauthedJson.session.userId).toBeNull();

  const sessionUnauthed = await page.request.get("/api/auth/session");
  expect(sessionUnauthed.status()).toBe(401);

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
    };
    expect(sessionAuthedJson.authenticated).toBe(true);
    expect(sessionAuthedJson.session.userId).toBe(user.id);

    const healthAuthed = await page.request.get("/api/health");
    expect(healthAuthed.status()).toBe(200);
    const healthAuthedJson = (await healthAuthed.json()) as {
      status: string;
      authenticated: boolean;
      session: { userId: string | null };
    };
    expect(healthAuthedJson.status).toBe("ok");
    expect(healthAuthedJson.authenticated).toBe(true);
    expect(healthAuthedJson.session.userId).toBe(user.id);
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});
