import { beforeEach, describe, expect, it, vi } from "vitest";

const { prefFindManyMock, logFindFirstMock, logCreateMock } = vi.hoisted(() => ({
  prefFindManyMock: vi.fn(),
  logFindFirstMock: vi.fn(),
  logCreateMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    userPreference: {
      findMany: prefFindManyMock
    },
    notificationLog: {
      findFirst: logFindFirstMock,
      create: logCreateMock
    }
  }
}));

import { POST } from "@/app/api/jobs/reminders/route";

describe("POST /api/jobs/reminders", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:05:00.000Z"));
    vi.clearAllMocks();
  });

  it("filters users due in current UTC window by timezone + reminder hour", async () => {
    prefFindManyMock.mockResolvedValue([
      {
        userId: "u-utc",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      },
      {
        userId: "u-sh",
        reminderHourLocal: 20,
        notificationsEnabled: true,
        user: { timezone: "Asia/Shanghai" }
      },
      {
        userId: "u-ny",
        reminderHourLocal: 8,
        notificationsEnabled: true,
        user: { timezone: "America/New_York" }
      }
    ]);
    logFindFirstMock.mockResolvedValue(null);
    logCreateMock.mockResolvedValue({ id: "n1" });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.candidateCount).toBe(3);
    expect(body.dueCount).toBe(2);
    expect(body.sentCount).toBe(2);
    expect(body.failedCount).toBe(0);
    expect(logCreateMock).toHaveBeenCalledTimes(4);
  });

  it("records send log with reminder payload fields", async () => {
    prefFindManyMock.mockResolvedValue([
      {
        userId: "u-utc",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      }
    ]);
    logFindFirstMock.mockResolvedValue(null);
    logCreateMock.mockResolvedValue({ id: "n1" });

    await POST();

    expect(logCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u-utc",
          channel: "in_app",
          template: "daily_reminder",
          status: "sent",
          payloadJson: expect.objectContaining({
            type: "reminder",
            timezone: "UTC",
            reminderHourLocal: 12
          })
        })
      })
    );
  });

  it("is idempotent in same UTC window and skips duplicate sends", async () => {
    prefFindManyMock.mockResolvedValue([
      {
        userId: "u-utc",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      }
    ]);
    logFindFirstMock.mockResolvedValue({
      id: "existing-log",
      userId: "u-utc"
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dueCount).toBe(1);
    expect(body.sentCount).toBe(0);
    expect(body.skippedCount).toBe(1);
    expect(logCreateMock).not.toHaveBeenCalled();
  });
});
