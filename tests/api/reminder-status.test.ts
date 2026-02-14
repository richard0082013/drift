import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const { notificationFindManyMock, notificationFindFirstMock, preferenceFindUniqueMock } =
  vi.hoisted(() => ({
    notificationFindManyMock: vi.fn(),
    notificationFindFirstMock: vi.fn(),
    preferenceFindUniqueMock: vi.fn()
  }));

vi.mock("@/lib/db", () => ({
  db: {
    notificationLog: {
      findMany: notificationFindManyMock,
      findFirst: notificationFindFirstMock
    },
    userPreference: {
      findUnique: preferenceFindUniqueMock
    }
  }
}));

import { GET } from "@/app/api/jobs/reminders/status/route";

describe("GET /api/jobs/reminders/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-16T12:10:00.000Z"));
  });

  it("returns 401 when session is missing", async () => {
    const response = await GET(new Request("http://localhost/api/jobs/reminders/status"));
    expect(response.status).toBe(401);
  });

  it("returns validation error when query is invalid", async () => {
    const response = await GET(
      new Request("http://localhost/api/jobs/reminders/status?limit=0&hours=99999", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(notificationFindManyMock).not.toHaveBeenCalled();
  });

  it("returns recent statuses and prepends computed pending when due", async () => {
    notificationFindManyMock.mockResolvedValue([
      {
        id: "n1",
        status: "sent",
        createdAt: new Date("2026-02-16T11:59:00.000Z"),
        sentAt: new Date("2026-02-16T11:59:00.000Z"),
        channel: "in_app"
      },
      {
        id: "n2",
        status: "failed",
        createdAt: new Date("2026-02-16T11:30:00.000Z"),
        sentAt: null,
        channel: "in_app"
      }
    ]);
    preferenceFindUniqueMock.mockResolvedValue({
      reminderHourLocal: 12,
      notificationsEnabled: true,
      user: { timezone: "UTC" }
    });
    notificationFindFirstMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/jobs/reminders/status?limit=3&hours=6", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(notificationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "u1",
          channel: "in_app",
          template: "daily_reminder"
        }),
        take: 3
      })
    );
    expect(body.meta).toEqual({ limit: 3, hours: 6 });
    expect(body.items).toHaveLength(3);
    expect(body.items[0].status).toBe("pending");
    expect(body.items[0].source).toBe("computed_pending");
    expect(body.items[1].status).toBe("sent");
    expect(body.items[2].status).toBe("failed");
  });
});
