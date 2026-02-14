import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkinFindManyMock, driftFindManyMock } = vi.hoisted(() => ({
  checkinFindManyMock: vi.fn(),
  driftFindManyMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyCheckin: { findMany: checkinFindManyMock },
    driftScore: { findMany: driftFindManyMock }
  }
}));

import { GET } from "@/app/api/export/route";

describe("GET /api/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    checkinFindManyMock.mockResolvedValue([
      {
        date: new Date("2026-02-14"),
        energy: 4,
        stress: 3,
        social: 2,
        keyContact: "Alice"
      }
    ]);

    driftFindManyMock.mockResolvedValue([
      {
        date: new Date("2026-02-14"),
        driftIndex: 0.72,
        reasonsJson: ["Energy downtrend", "Stress uptrend"]
      }
    ]);
  });

  it("exports only current user data as parseable csv", async () => {
    const request = new Request("http://localhost/api/export", {
      headers: { authorization: "Bearer drift-user:u1" }
    });

    const response = await GET(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");

    expect(checkinFindManyMock.mock.calls[0][0].where.userId).toBe("u1");
    expect(driftFindManyMock.mock.calls[0][0].where.userId).toBe("u1");

    const lines = text.trim().split("\n");
    expect(lines[0]).toBe(
      "date,energy,stress,social,key_contact,drift_index,drift_reasons"
    );
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain("2026-02-14");
    expect(lines[1]).toContain("0.72");
  });

  it("returns unauthorized when user id is missing", async () => {
    const request = new Request("http://localhost/api/export");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("keeps contract fields consistent when optional values are empty", async () => {
    checkinFindManyMock.mockResolvedValue([
      {
        date: new Date("2026-02-15"),
        energy: 2,
        stress: 4,
        social: 3,
        keyContact: null
      }
    ]);
    driftFindManyMock.mockResolvedValue([]);

    const request = new Request("http://localhost/api/export", {
      headers: { authorization: "Bearer drift-user:u1" }
    });

    const response = await GET(request);
    const text = await response.text();
    const [header, dataLine] = text.trim().split("\n");

    expect(response.status).toBe(200);
    expect(header).toBe(
      "date,energy,stress,social,key_contact,drift_index,drift_reasons"
    );
    expect(dataLine).toBe("2026-02-15,2,4,3,,,");
  });
});
