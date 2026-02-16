import { beforeEach, describe, expect, it, vi } from "vitest";

const { userUpsertMock, checkinFindUniqueMock, notificationLogCreateMock } = vi.hoisted(() => ({
  userUpsertMock: vi.fn(),
  checkinFindUniqueMock: vi.fn(),
  notificationLogCreateMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: userUpsertMock
    },
    dailyCheckin: {
      findUnique: checkinFindUniqueMock
    },
    notificationLog: {
      create: notificationLogCreateMock
    }
  }
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as checkinTodayGet } from "@/app/api/checkins/today/route";

describe("Bearer auth on protected routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    userUpsertMock.mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U1"
    });
    checkinFindUniqueMock.mockResolvedValue(null);
    notificationLogCreateMock.mockResolvedValue({ id: "audit1" });
  });

  it("accepts valid Bearer token on protected endpoint", async () => {
    const loginRes = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "u1@example.com", name: "U1" })
      })
    );
    const loginBody = await loginRes.json();

    const response = await checkinTodayGet(
      new Request("http://localhost/api/checkins/today", {
        headers: {
          authorization: `Bearer ${loginBody.accessToken as string}`
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      checkedInToday: false,
      checkin: null
    });
  });

  it("rejects invalid Bearer token on protected endpoint", async () => {
    const response = await checkinTodayGet(
      new Request("http://localhost/api/checkins/today", {
        headers: {
          authorization: "Bearer not.a.valid.token"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "UNAUTHORIZED"
        })
      })
    );
  });
});
