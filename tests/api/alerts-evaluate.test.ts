import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, driftCreateMock, prefFindMock, alertCreateMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  driftCreateMock: vi.fn(),
  prefFindMock: vi.fn(),
  alertCreateMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyCheckin: { findMany: findManyMock },
    driftScore: { create: driftCreateMock },
    userPreference: { findUnique: prefFindMock },
    alert: { create: alertCreateMock }
  }
}));

import { POST } from "@/app/api/alerts/evaluate/route";

describe("POST /api/alerts/evaluate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([
      { energy: 5, stress: 1, social: 5 },
      { energy: 5, stress: 2, social: 5 },
      { energy: 4, stress: 2, social: 4 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 2, stress: 4, social: 2 },
      { energy: 1, stress: 5, social: 1 }
    ]);
    prefFindMock.mockResolvedValue({ alertThreshold: 0.65 });
    driftCreateMock.mockResolvedValue({ id: "ds1" });
    alertCreateMock.mockResolvedValue({ id: "a1", message: "gentle" });
  });

  it("creates alert when drift index is above threshold", async () => {
    const request = new Request("http://localhost/api/alerts/evaluate", {
      method: "POST",
      headers: {
        authorization: "Bearer drift-user:u1",
        "content-type": "application/json"
      },
      body: JSON.stringify({ date: "2026-02-15" })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alertCreated).toBe(true);
    expect(alertCreateMock).toHaveBeenCalledOnce();
  });

  it("does not create alert when drift index below threshold", async () => {
    findManyMock.mockResolvedValue([
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 },
      { energy: 3, stress: 3, social: 3 }
    ]);

    const request = new Request("http://localhost/api/alerts/evaluate", {
      method: "POST",
      headers: {
        authorization: "Bearer drift-user:u1",
        "content-type": "application/json"
      },
      body: JSON.stringify({ date: "2026-02-15" })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alertCreated).toBe(false);
    expect(alertCreateMock).not.toHaveBeenCalled();
  });

  it("uses gentle non-medical message", async () => {
    const request = new Request("http://localhost/api/alerts/evaluate", {
      method: "POST",
      headers: {
        authorization: "Bearer drift-user:u1",
        "content-type": "application/json"
      },
      body: JSON.stringify({ date: "2026-02-15" })
    });

    await POST(request);

    const payload = alertCreateMock.mock.calls[0]?.[0]?.data;
    expect(payload.message).toContain("gentle");
    expect(payload.message.toLowerCase()).not.toContain("diagnosis");
  });
});
