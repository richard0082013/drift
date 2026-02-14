import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createSessionToken } from "@/lib/auth/session";

const db = new PrismaClient();

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

test("real settings flow: load -> save -> trigger -> status visible", async ({ page, context }) => {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const reminderTime = formatHour(currentHour);
  const email = `qa-week6-settings-${Date.now()}@example.com`;

  const user = await db.user.create({
    data: {
      email,
      timezone: "UTC"
    }
  });

  await db.userPreference.upsert({
    where: { userId: user.id },
    update: {
      reminderHourLocal: currentHour,
      notificationsEnabled: true
    },
    create: {
      userId: user.id,
      reminderHourLocal: currentHour,
      notificationsEnabled: true
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
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Reminder Settings" })).toBeVisible();

    await expect(page.getByLabel("Reminder Time")).toHaveValue(reminderTime);
    await expect(page.getByLabel("Timezone")).toHaveValue("UTC");

    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/settings/reminder") && response.request().method() === "POST"
    );

    await page.getByLabel("Reminder Time").fill(reminderTime);
    await page.getByLabel("Timezone").fill("UTC");
    await page.getByLabel("Enable Reminders").check();
    await page.getByRole("button", { name: "Save Settings" }).click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.ok()).toBeTruthy();
    await expect(page.getByText("Settings saved.")).toBeVisible();

    const triggerPromise = page.waitForResponse(
      (response) => response.url().includes("/api/jobs/reminders") && response.request().method() === "POST"
    );

    await page.evaluate(async () => {
      await fetch("/api/jobs/reminders", { method: "POST" });
    });

    const triggerResponse = await triggerPromise;
    expect(triggerResponse.ok()).toBeTruthy();

    const triggerPayload = (await triggerResponse.json()) as { sentCount?: number; dueCount?: number };
    expect((triggerPayload.dueCount ?? 0) >= 1).toBeTruthy();
    expect((triggerPayload.sentCount ?? 0) >= 1).toBeTruthy();

    await page.reload();

    await expect(page.getByRole("heading", { name: "Recent Reminder Status" })).toBeVisible();
    await expect(page.getByText("Status: Sent")).toBeVisible();
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});
