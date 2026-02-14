import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

test("account retention flow: export metadata + soft delete messaging + protected route behavior", async ({ page }) => {
  const email = `qa-week7-account-${Date.now()}@example.com`;

  try {
    await page.goto("/account");
    await expect(page.getByText("Please log in to continue.")).toBeVisible();

    await page.getByRole("link", { name: "Go to login" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Faccount/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Name").fill("QA Week7 Account");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("http://127.0.0.1:3000/account");

    await page.getByRole("button", { name: "Export my data" }).click();
    await expect(page.getByText("Export generated.")).toBeVisible();
    await expect(page.getByText("Generated at")).toBeVisible();
    await expect(page.getByText("Record count")).toBeVisible();
    await expect(page.getByText("Version")).toBeVisible();

    await expect(page.getByText("Deletion is soft-first. Your account enters a retention window before permanent purge.")).toBeVisible();

    await page.getByRole("button", { name: "Start delete confirmation" }).click();
    await expect(page.getByText(/Delete confirmation unlocks in \d+s\./)).toBeVisible();

    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await page.waitForTimeout(5500);
    await page.getByRole("button", { name: "Delete account" }).click();

    await expect(page.getByText(/Account entered retention window and is scheduled for purge after/)).toBeVisible();
    await expect(
      page.getByText("If you need to restore access during the retention window, contact support.")
    ).toBeVisible();

    await page.goto("/checkin");
    await expect(page.getByRole("heading", { name: "Daily Check-in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Check-in" })).toBeVisible();
  } finally {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      await db.user.delete({ where: { id: user.id } });
    }
  }
});
