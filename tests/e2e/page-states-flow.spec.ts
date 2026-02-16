import { test, expect } from "@playwright/test";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test.describe("page states: settings / insights / trends / alerts", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ authenticated: true, session: { userId: "state-user" } })
      });
    });
  });

  test("settings loading + empty + error", async ({ page }) => {
    const settingsGate = deferred();
    const statusGate = deferred();

    await page.route("**/api/settings/reminder", async (route) => {
      await settingsGate.promise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          settings: {
            reminderHourLocal: 9,
            notificationsEnabled: true,
            reminderTime: "09:00",
            timezone: "UTC",
            enabled: true
          },
          requestId: "r1",
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.route("**/api/jobs/reminders/status?*", async (route) => {
      await statusGate.promise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], requestId: "r2", timestamp: new Date().toISOString() })
      });
    });

    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Loading...")).toBeVisible();
    await expect(page.getByText("Loading reminder status...")).toBeVisible();

    settingsGate.resolve();
    statusGate.resolve();

    await expect(page.getByText("No reminder events yet.")).toBeVisible();

    await page.unroute("**/api/settings/reminder");
    await page.unroute("**/api/jobs/reminders/status?*");

    await page.route("**/api/settings/reminder", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "boom" },
          requestId: "r3",
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.route("**/api/jobs/reminders/status?*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "boom" },
          requestId: "r4",
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.reload();
    await expect(page.getByText("Unable to load settings.")).toBeVisible();
    await expect(page.getByText("Reminder status is unavailable.")).toBeVisible();
  });

  test("insights loading + empty + error", async ({ page }) => {
    const insightsGate = deferred();

    await page.route("**/api/insights/weekly?days=7", async (route) => {
      await insightsGate.promise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          weekStart: "2026-02-08",
          weekEnd: "2026-02-14",
          days: 7,
          summary: {
            checkinCount: 0,
            alertCount: 0,
            averages: { energy: null, stress: null, social: null, driftIndex: null },
            driftLevel: "low",
            hasEnoughData: false
          },
          highlights: ["No check-ins were recorded this week."],
          suggestions: ["Keep your next check-in consistent to maintain trend quality."],
          requestId: "r5",
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.goto("/insights", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Loading...")).toBeVisible();
    insightsGate.resolve();

    await expect(page.getByText("No check-ins were recorded this week.")).toBeVisible();

    await page.unroute("**/api/insights/weekly?days=7");
    await page.route("**/api/insights/weekly?days=7", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "boom" },
          requestId: "r6",
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.reload();
    await expect(page.getByText("Failed to load weekly insights.")).toBeVisible();
  });

  test("trends loading + empty + error", async ({ page }) => {
    const trendsGate = deferred();

    await page.route("**/api/trends?days=7", async (route) => {
      await trendsGate.promise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] })
      });
    });

    await page.goto("/trends", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Loading...")).toBeVisible();
    trendsGate.resolve();

    await expect(page.getByText(/No trend data yet/)).toBeVisible();

    await page.unroute("**/api/trends?days=7");
    await page.route("**/api/trends?days=7", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom" } })
      });
    });

    await page.reload();
    await expect(page.getByText("Failed to load trends.")).toBeVisible();
  });

  test("alerts loading + empty + error", async ({ page }) => {
    const alertsGate = deferred();

    await page.route("**/api/alerts", async (route) => {
      await alertsGate.promise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] })
      });
    });

    await page.goto("/alerts", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Loading...")).toBeVisible();
    alertsGate.resolve();

    await expect(page.getByText(/No active alerts/)).toBeVisible();

    await page.unroute("**/api/alerts");
    await page.route("**/api/alerts", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom" } })
      });
    });

    await page.reload();
    await expect(page.getByText("Failed to load alerts.")).toBeVisible();
  });
});
