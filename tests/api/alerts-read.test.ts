import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    alert: {
      findMany: findManyMock
    }
  }
}));

import { GET } from "@/app/api/alerts/route";

describe("GET /api/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns alert list for current user", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: "a1",
        reason: "Energy has trended down.",
        action: "Try a short reset.",
        date: new Date("2026-02-14")
      }
    ]);

    const request = new Request("http://localhost/api/alerts", {
      headers: { cookie: `drift_session=${createSessionToken("u1")}` }
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledOnce();
  });

  it("returns unauthorized when user id is missing", async () => {
    const request = new Request("http://localhost/api/alerts");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
