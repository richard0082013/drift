import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prefFindManyMock,
  logFindFirstMock,
  logCreateMock,
  sendReminderMock
} = vi.hoisted(() => ({
  prefFindManyMock: vi.fn(),
  logFindFirstMock: vi.fn(),
  logCreateMock: vi.fn(),
  sendReminderMock: vi.fn()
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

vi.mock("@/lib/notifications/provider", () => ({
  sendReminder: sendReminderMock
}));

import { POST } from "@/app/api/jobs/reminders/route";

describe("POST /api/jobs/reminders provider behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:05:00.000Z"));
    vi.clearAllMocks();
  });

  it("supports noop provider path and records sent logs", async () => {
    prefFindManyMock.mockResolvedValue([
      {
        userId: "u-noop",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      }
    ]);
    logFindFirstMock.mockResolvedValue(null);
    sendReminderMock.mockResolvedValue({
      provider: "noop",
      delivered: false
    });
    logCreateMock.mockResolvedValue({ id: "n1" });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(sendReminderMock).toHaveBeenCalledTimes(1);
    expect(body.sentCount).toBe(1);
    expect(body.failedCount).toBe(0);
    expect(logCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u-noop",
          status: "sent"
        })
      })
    );
  });

  it("does not block batch when email provider fails and records failed log", async () => {
    prefFindManyMock.mockResolvedValue([
      {
        userId: "u-fail",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      },
      {
        userId: "u-ok",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      }
    ]);
    logFindFirstMock.mockResolvedValue(null);
    sendReminderMock
      .mockRejectedValueOnce(new Error("smtp down"))
      .mockResolvedValueOnce({
        provider: "email",
        delivered: true,
        messageId: "m-1"
      });
    logCreateMock.mockResolvedValue({ id: "n1" });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(sendReminderMock).toHaveBeenCalledTimes(2);
    expect(body.sentCount).toBe(1);
    expect(body.failedCount).toBe(1);
    expect(logCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u-fail",
          status: "failed"
        })
      })
    );
  });

  it("keeps idempotence by skipping when log already exists in current window", async () => {
    prefFindManyMock.mockResolvedValue([
      {
        userId: "u-dup",
        reminderHourLocal: 12,
        notificationsEnabled: true,
        user: { timezone: "UTC" }
      }
    ]);
    logFindFirstMock.mockResolvedValue({
      id: "existing-log",
      userId: "u-dup"
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.skippedCount).toBe(1);
    expect(body.sentCount).toBe(0);
    expect(sendReminderMock).not.toHaveBeenCalled();
    expect(logCreateMock).not.toHaveBeenCalled();
  });
});
