import { test, expect } from "@playwright/test";

test("authenticated flow: login -> checkin -> trends -> alerts", async ({ page }) => {
  let authenticated = false;

  await page.route("**/api/auth/session", async (route) => {
    if (authenticated) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: { userId: "demo-user" } })
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } })
    });
  });

  await page.route("**/api/auth/login", async (route) => {
    authenticated = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.route("**/api/checkins", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        checkin: { id: "c1", date: "2026-02-14", energy: 4, stress: 3, social: 2 }
      })
    });
  });

  await page.route("**/api/trends?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ date: "2026-02-14", energy: 4, stress: 3, social: 2 }]
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
  await expect(page.getByText("Please log in to continue.")).toBeVisible();

  await page.getByRole("link", { name: "Go to login" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/checkin");

  await page.getByLabel("Energy (1-5)").fill("4");
  await page.getByLabel("Stress (1-5)").fill("3");
  await page.getByLabel("Social (1-5)").fill("2");
  await page.getByRole("button", { name: "Submit Check-in" }).click();
  await expect(page.getByText("Check-in submitted successfully.")).toBeVisible();

  await page.goto("http://127.0.0.1:3000/trends");
  await expect(page.getByText(/2026-02-14 E:4 S:3 C:2/)).toBeVisible();

  await page.goto("http://127.0.0.1:3000/alerts");
  await expect(page.getByText("Energy has trended down over recent check-ins.")).toBeVisible();
});
