import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const {
  userUpsertMock,
  checkinCreateMock,
  preferenceFindManyMock,
  logFindFirstMock,
  notificationLogCreateMock,
  checkinFindManyMock,
  driftFindManyMock,
  userDeleteMock,
  sendReminderMock
} = vi.hoisted(() => ({
  userUpsertMock: vi.fn(),
  checkinCreateMock: vi.fn(),
  preferenceFindManyMock: vi.fn(),
  logFindFirstMock: vi.fn(),
  notificationLogCreateMock: vi.fn(),
  checkinFindManyMock: vi.fn(),
  driftFindManyMock: vi.fn(),
  userDeleteMock: vi.fn(),
  sendReminderMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: userUpsertMock,
      delete: userDeleteMock
    },
    dailyCheckin: {
      create: checkinCreateMock,
      findMany: checkinFindManyMock
    },
    userPreference: {
      findMany: preferenceFindManyMock
    },
    notificationLog: {
      findFirst: logFindFirstMock,
      create: notificationLogCreateMock
    },
    driftScore: {
      findMany: driftFindManyMock
    }
  }
}));

vi.mock("@/lib/notifications/provider", () => ({
  sendReminder: sendReminderMock
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as checkinPost } from "@/app/api/checkins/route";
import { POST as remindersPost } from "@/app/api/jobs/reminders/route";
import { GET as exportGet } from "@/app/api/export/route";
import { POST as accountDeletePost } from "@/app/api/account/delete/route";

describe("metrics events on key flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-20T12:10:00.000Z"));

    process.env.RATE_LIMIT_MAX_LOGIN = "30";
    process.env.RATE_LIMIT_MAX_EXPORT = "30";
    process.env.RATE_LIMIT_MAX_ACCOUNT_DELETE = "30";

    userUpsertMock.mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U1"
    });
    userDeleteMock.mockResolvedValue({ id: "u1" });
    checkinCreateMock.mockResolvedValue({ id: "c1" });
    preferenceFindManyMock.mockResolvedValue([
      {
        userId: "u1",
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
    checkinFindManyMock.mockResolvedValue([
      {
        date: new Date("2026-02-20"),
        energy: 3,
        stress: 3,
        social: 3,
        keyContact: null
      }
    ]);
    driftFindManyMock.mockResolvedValue([]);
    notificationLogCreateMock.mockResolvedValue({ id: "n1" });
  });

  it("emits metrics for login/checkin/reminder/export/delete", async () => {
    await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "u1@example.com", name: "U1" })
      })
    );

    await checkinPost(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `drift_session=${createSessionToken("u1")}`
        },
        body: JSON.stringify({
          date: "2026-02-20",
          energy: 3,
          stress: 3,
          social: 3
        })
      })
    );

    await remindersPost();

    await exportGet(
      new Request("http://localhost/api/export", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );

    await accountDeletePost(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );

    const metricTemplates = notificationLogCreateMock.mock.calls
      .map((call) => call[0]?.data)
      .filter((data) => data?.channel === "metrics")
      .map((data) => data.template);

    expect(metricTemplates).toContain("auth.login");
    expect(metricTemplates).toContain("checkin.create");
    expect(metricTemplates).toContain("reminder.dispatch");
    expect(metricTemplates).toContain("export.csv");
    expect(metricTemplates).toContain("account.delete");
  });
});
