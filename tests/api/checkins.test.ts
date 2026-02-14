import { describe, expect, it, vi, beforeEach } from "vitest";

const { createMock, upsertMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  upsertMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: upsertMock
    },
    dailyCheckin: {
      create: createMock
    }
  }
}));

import { POST } from "@/app/api/checkins/route";

describe("POST /api/checkins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ id: "u1" });
  });

  it("creates a checkin with valid payload", async () => {
    createMock.mockResolvedValueOnce({
      id: "c1",
      userId: "u1",
      date: new Date("2026-02-14T00:00:00.000Z"),
      energy: 4,
      stress: 2,
      social: 5,
      keyContact: "alice"
    });

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer drift-user:u1"
      },
      body: JSON.stringify({
        date: "2026-02-14",
        energy: 4,
        stress: 2,
        social: 5,
        key_contact: "alice"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(body.checkin.id).toBe("c1");
  });

  it("rejects values outside 1-5", async () => {
    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer drift-user:u1"
      },
      body: JSON.stringify({
        date: "2026-02-14",
        energy: 0,
        stress: 3,
        social: 4
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate checkin for same user/date", async () => {
    createMock.mockRejectedValueOnce({
      code: "P2002"
    });

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer drift-user:u1"
      },
      body: JSON.stringify({
        date: "2026-02-14",
        energy: 3,
        stress: 3,
        social: 3
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("DUPLICATE_CHECKIN");
  });
});
