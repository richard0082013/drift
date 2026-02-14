import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyCheckin: {
      findMany: findManyMock
    }
  }
}));

import { GET } from "@/app/api/trends/route";

describe("GET /api/trends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns trend points for current user and days window", async () => {
    findManyMock.mockResolvedValueOnce([
      { date: new Date("2026-02-10"), energy: 4, stress: 3, social: 2 },
      { date: new Date("2026-02-11"), energy: 3, stress: 3, social: 3 }
    ]);

    const request = new Request("http://localhost/api/trends?days=7", {
      headers: { cookie: `drift_session=${createSessionToken("u1")}` }
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledOnce();
    expect(body.data).toHaveLength(2);
  });

  it("rejects unsupported days value", async () => {
    const request = new Request("http://localhost/api/trends?days=14", {
      headers: { cookie: `drift_session=${createSessionToken("u1")}` }
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
