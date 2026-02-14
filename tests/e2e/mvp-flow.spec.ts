import { test, expect } from "@playwright/test";

test("mvp flow: checkin -> trends -> alerts", async ({ page }) => {
  await page.route("**/api/trends?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          { date: "2026-02-14", energy: 4, stress: 3, social: 2 },
          { date: "2026-02-13", energy: 3, stress: 3, social: 3 }
        ]
      })
    });
  });

  await page.route("**/api/alerts", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "a1",
            reason: "Energy has trended down over recent check-ins.",
            action: "Try a short reset today."
          }
        ]
      })
    });
  });

  await page.goto("http://127.0.0.1:3000/checkin");

  await page.getByLabel("Energy (1-5)").fill("4");
  await page.getByLabel("Stress (1-5)").fill("3");
  await page.getByLabel("Social (1-5)").fill("2");
  await page.getByRole("button", { name: "Submit Check-in" }).click();
  await expect(
    page.getByText(/Check-in submitted successfully.|A check-in for this date already exists./)
  ).toBeVisible();

  await page.goto("http://127.0.0.1:3000/trends");
  await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
  await expect(page.getByText(/2026-02-14 E:4 S:3 C:2/)).toBeVisible();
  await page.getByRole("button", { name: "30 days" }).click();

  await page.goto("http://127.0.0.1:3000/alerts");
  await expect(page.getByRole("heading", { name: "Alerts" })).toBeVisible();
  await expect(page.getByText("Energy has trended down over recent check-ins.")).toBeVisible();
  await expect(page.getByText("Try a short reset today.")).toBeVisible();
});
