import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

test("authenticated flow: login -> checkin -> trends -> alerts", async ({ page }) => {
  const email = `qa-week6-auth-${Date.now()}@example.com`;

  try {
    await page.goto("/checkin");
    await expect(page.getByText("Please log in to continue.")).toBeVisible();

    await page.getByRole("link", { name: "Go to login" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckin/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Name").fill("QA Week6 User");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("http://127.0.0.1:3000/checkin");

    await page.getByLabel("Energy (1-5)").fill("4");
    await page.getByLabel("Stress (1-5)").fill("3");
    await page.getByLabel("Social (1-5)").fill("2");
    await page.getByRole("button", { name: "Submit Check-in" }).click();
    await expect(page.getByText("Check-in submitted successfully.")).toBeVisible();

    const user = await db.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();

    await db.alert.create({
      data: {
        userId: user!.id,
        date: new Date(),
        level: "moderate",
        message: "Energy drift risk",
        reason: "Energy has trended down over recent check-ins.",
        action: "Try a short reset today."
      }
    });

    const today = new Date().toISOString().slice(0, 10);

    await page.goto("/trends");
    await expect(page.getByText(new RegExp(`${today} E:4 S:3 C:2`))).toBeVisible();

    await page.goto("/alerts");
    await expect(page.getByText("Energy has trended down over recent check-ins.")).toBeVisible();
  } finally {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      await db.user.delete({ where: { id: user.id } });
    }
  }
});
