import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyCheckin: {
      findUnique: findUniqueMock
    }
  }
}));

import { GET } from "@/app/api/checkins/today/route";

describe("GET /api/checkins/today", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21T16:20:00.000Z"));
  });

  it("returns 401 when unauthenticated", async () => {
    const response = await GET(new Request("http://localhost/api/checkins/today"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns checkedInToday false when no checkin for today", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/checkins/today", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkedInToday).toBe(false);
    expect(body.checkin).toBeNull();
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        userId_date: {
          userId: "u1",
          date: new Date("2026-02-21T00:00:00.000Z")
        }
      }
    });
  });

  it("returns today's checkin when already submitted", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "c1",
      userId: "u1",
      date: new Date("2026-02-21T00:00:00.000Z"),
      energy: 4,
      stress: 3,
      social: 5,
      keyContact: "alice",
      notes: null,
      createdAt: new Date("2026-02-21T00:10:00.000Z"),
      updatedAt: new Date("2026-02-21T00:10:00.000Z")
    });

    const response = await GET(
      new Request("http://localhost/api/checkins/today", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkedInToday).toBe(true);
    expect(body.checkin).toMatchObject({
      id: "c1",
      date: "2026-02-21",
      energy: 4,
      stress: 3,
      social: 5,
      keyContact: "alice"
    });
  });
});
