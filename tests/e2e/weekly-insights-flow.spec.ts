import { test, expect, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createSessionToken } from "@/lib/auth/session";

const db = new PrismaClient();

async function createAuthenticatedUser(context: BrowserContext) {
  const user = await db.user.create({
    data: {
      email: `qa-week5-insights-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
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

  return user;
}

test("weekly insights entry: unauthenticated shows login guard", async ({ page }) => {
  await page.goto("/insights");
  await expect(page.getByRole("heading", { name: "Weekly Insights" })).toBeVisible();
  await expect(page.getByText("Please log in to continue.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to login" })).toHaveAttribute(
    "href",
    /\/login\?next=%2Finsights/
  );
});

test("weekly insights empty data state from real api", async ({ page, context }) => {
  const user = await createAuthenticatedUser(context);

  try {
    await page.goto("/insights");

    await expect(page.getByRole("heading", { name: "Weekly Insights" })).toBeVisible();
    await expect(page.getByText("Check-ins: 0 | Alerts: 0 | Drift: low")).toBeVisible();
    await expect(page.getByText("No check-ins were recorded this week.")).toBeVisible();
    await expect(page.getByText("Not enough data yet to derive stable trends.")).toBeVisible();
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});

test("weekly insights data state from real api", async ({ page, context }) => {
  const user = await createAuthenticatedUser(context);
  const now = new Date();

  const day0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  const day1 = new Date(day0);
  day1.setUTCDate(day1.getUTCDate() - 1);
  const day2 = new Date(day0);
  day2.setUTCDate(day2.getUTCDate() - 2);

  await db.dailyCheckin.createMany({
    data: [
      { userId: user.id, date: day2, energy: 4, stress: 3, social: 3 },
      { userId: user.id, date: day1, energy: 4, stress: 2, social: 4 },
      { userId: user.id, date: day0, energy: 3, stress: 3, social: 3 }
    ]
  });

  await db.driftScore.createMany({
    data: [
      { userId: user.id, date: day2, driftIndex: 0.8, reasonsJson: { reason: "r1" } },
      { userId: user.id, date: day1, driftIndex: 0.9, reasonsJson: { reason: "r2" } },
      { userId: user.id, date: day0, driftIndex: 0.7, reasonsJson: { reason: "r3" } }
    ]
  });

  await db.alert.create({
    data: {
      userId: user.id,
      date: day0,
      level: "high",
      message: "Drift high",
      reason: "Drift index elevated",
      action: "Reduce load"
    }
  });

  try {
    await page.goto("/insights");

    await expect(page.getByText("Check-ins: 3 | Alerts: 1 | Drift: high")).toBeVisible();
    await expect(page.getByText("3/7 check-ins completed in this window.")).toBeVisible();
    await expect(page.getByText("Average drift index is 0.8.")).toBeVisible();
    await expect(
      page.getByText("Drift risk is high; keep tomorrow lighter and review your warning signals.")
    ).toBeVisible();
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});

test("weekly insights error state when api returns validation error", async ({ page, context }) => {
  const user = await createAuthenticatedUser(context);

  await page.route("**/api/insights/weekly?days=7", async (route) => {
    const target = route.request().url().replace("days=7", "days=99");
    await route.continue({ url: target });
  });

  try {
    await page.goto("/insights");
    await expect(page.getByText("Failed to load weekly insights.")).toBeVisible();
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});
