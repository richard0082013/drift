import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

test("daily checkin status flow persists today state", async ({ page }) => {
  const email = `qa-milestone-a-${Date.now()}@example.com`;
  const name = "QA Milestone A";

  try {
    await page.goto("/checkin");
    await expect(page.getByRole("heading", { name: "Daily Check-in" })).toBeVisible();
    await expect(page.getByText("Please log in to continue.")).toBeVisible();
    await page.screenshot({ path: "test-results/milestone-a-step1-unauth-checkin.png", fullPage: true });

    await page.getByRole("link", { name: "Go to login" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckin/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("http://127.0.0.1:3000/checkin");
    await expect(page.getByText("今日未打卡，请填写。")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Check-in" })).toBeVisible();
    await page.screenshot({ path: "test-results/milestone-a-step2-not-checked-in.png", fullPage: true });

    await page.getByLabel("Energy (1-5)").fill("4");
    await page.getByLabel("Stress (1-5)").fill("3");
    await page.getByLabel("Social (1-5)").fill("2");
    await page.getByRole("button", { name: "Submit Check-in" }).click();

    await expect(page.getByText("今日已打卡（energy/stress/social）：4/3/2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Check-in" })).toHaveCount(0);
    await page.screenshot({ path: "test-results/milestone-a-step3-checked-in-after-submit.png", fullPage: true });

    await page.reload();

    await expect(page.getByText("今日已打卡（energy/stress/social）：4/3/2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Check-in" })).toHaveCount(0);
    await page.screenshot({ path: "test-results/milestone-a-step4-checked-in-after-refresh.png", fullPage: true });
  } finally {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      await db.user.delete({ where: { id: user.id } });
    }
  }
});
