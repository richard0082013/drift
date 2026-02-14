import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionUserIdMock,
  notificationFindManyMock,
  notificationFindFirstMock,
  preferenceFindUniqueMock
} = vi.hoisted(() => ({
  getSessionUserIdMock: vi.fn(),
  notificationFindManyMock: vi.fn(),
  notificationFindFirstMock: vi.fn(),
  preferenceFindUniqueMock: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionUserId: getSessionUserIdMock,
  unauthorizedResponse: () =>
    Response.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required."
        }
      },
      { status: 401 }
    )
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

  it("returns 401 when user session is missing", async () => {
    getSessionUserIdMock.mockReturnValue(null);

    const response = await GET(new Request("http://localhost/api/jobs/reminders/status"));
    expect(response.status).toBe(401);
  });

  it("returns recent reminder statuses for current user with limit and time window", async () => {
    getSessionUserIdMock.mockReturnValue("u1");
    notificationFindManyMock.mockResolvedValue([
      {
        id: "n1",
        status: "sent",
        createdAt: new Date("2026-02-16T11:59:00.000Z"),
        sentAt: new Date("2026-02-16T11:59:00.000Z"),
        channel: "in_app",
        payloadJson: { provider: "email" }
      },
      {
        id: "n2",
        status: "failed",
        createdAt: new Date("2026-02-16T11:30:00.000Z"),
        sentAt: null,
        channel: "in_app",
        payloadJson: { error: "smtp down" }
      }
    ]);
    preferenceFindUniqueMock.mockResolvedValue({
      reminderHourLocal: 20,
      notificationsEnabled: true,
      user: { timezone: "UTC" }
    });
    notificationFindFirstMock.mockResolvedValue({ id: "exists" });

    const response = await GET(
      new Request("http://localhost/api/jobs/reminders/status?limit=2&hours=6")
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
        take: 2
      })
    );
    expect(body.items).toHaveLength(2);
    expect(body.items[0].status).toBe("sent");
    expect(body.items[1].status).toBe("failed");
    expect(body.items[0].source).toBe("notification_log");
  });

  it("adds pending status when user is due but no log exists in current window", async () => {
    getSessionUserIdMock.mockReturnValue("u1");
    notificationFindManyMock.mockResolvedValue([]);
    preferenceFindUniqueMock.mockResolvedValue({
      reminderHourLocal: 12,
      notificationsEnabled: true,
      user: { timezone: "UTC" }
    });
    notificationFindFirstMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/jobs/reminders/status?limit=5"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].status).toBe("pending");
    expect(body.items[0].source).toBe("computed_pending");
  });
});
