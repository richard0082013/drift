import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const { userFindUniqueMock, preferenceFindUniqueMock, userUpsertMock, preferenceUpsertMock } =
  vi.hoisted(() => ({
    userFindUniqueMock: vi.fn(),
    preferenceFindUniqueMock: vi.fn(),
    userUpsertMock: vi.fn(),
    preferenceUpsertMock: vi.fn()
  }));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
      upsert: userUpsertMock
    },
    userPreference: {
      findUnique: preferenceFindUniqueMock,
      upsert: preferenceUpsertMock
    }
  }
}));

import { GET, POST } from "@/app/api/settings/reminder/route";

describe("/api/settings/reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    const response = await GET(new Request("http://localhost/api/settings/reminder"));

    expect(response.status).toBe(401);
  });

  it("returns current settings for authenticated user", async () => {
    userFindUniqueMock.mockResolvedValue({ timezone: "America/New_York" });
    preferenceFindUniqueMock.mockResolvedValue({
      reminderHourLocal: 8,
      notificationsEnabled: false
    });

    const response = await GET(
      new Request("http://localhost/api/settings/reminder", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      settings: {
        reminderTime: "08:00",
        timezone: "America/New_York",
        enabled: false
      }
    });
    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { timezone: true }
    });
  });

  it("validates payload and rejects non-hour reminder time", async () => {
    const response = await POST(
      new Request("http://localhost/api/settings/reminder", {
        method: "POST",
        headers: {
          cookie: `drift_session=${createSessionToken("u1")}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          reminderTime: "10:15",
          timezone: "UTC",
          enabled: true
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(userUpsertMock).not.toHaveBeenCalled();
    expect(preferenceUpsertMock).not.toHaveBeenCalled();
  });

  it("saves settings and upserts user preference", async () => {
    userUpsertMock.mockResolvedValue({ id: "u1" });
    preferenceUpsertMock.mockResolvedValue({ id: "p1" });

    const response = await POST(
      new Request("http://localhost/api/settings/reminder", {
        method: "POST",
        headers: {
          cookie: `drift_session=${createSessionToken("u1")}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          reminderTime: "10:00",
          timezone: "UTC",
          enabled: true
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      settings: {
        reminderTime: "10:00",
        timezone: "UTC",
        enabled: true
      }
    });

    expect(userUpsertMock).toHaveBeenCalledWith({
      where: { id: "u1" },
      update: { timezone: "UTC" },
      create: {
        id: "u1",
        email: "u1@local.drift",
        name: "Drift User",
        timezone: "UTC"
      }
    });

    expect(preferenceUpsertMock).toHaveBeenCalledWith({
      where: { userId: "u1" },
      update: {
        reminderHourLocal: 10,
        notificationsEnabled: true
      },
      create: {
        userId: "u1",
        reminderHourLocal: 10,
        notificationsEnabled: true
      }
    });
  });
});
