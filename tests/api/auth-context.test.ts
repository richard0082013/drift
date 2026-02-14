import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionUserIdMock,
  validateCheckinMock,
  upsertMock,
  checkinCreateMock,
  checkinFindManyMock,
  alertFindManyMock,
  driftCreateMock,
  prefFindUniqueMock,
  alertCreateMock,
  driftFindManyMock
} = vi.hoisted(() => ({
  getSessionUserIdMock: vi.fn(),
  validateCheckinMock: vi.fn(),
  upsertMock: vi.fn(),
  checkinCreateMock: vi.fn(),
  checkinFindManyMock: vi.fn(),
  alertFindManyMock: vi.fn(),
  driftCreateMock: vi.fn(),
  prefFindUniqueMock: vi.fn(),
  alertCreateMock: vi.fn(),
  driftFindManyMock: vi.fn()
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

vi.mock("@/lib/validation/checkin", () => ({
  validateCheckinInput: validateCheckinMock
}));

vi.mock("@/lib/drift/engine", () => ({
  calculateDrift: () => ({ driftIndex: 0.7, reasons: ["trend"], rules: [] })
}));

vi.mock("@/lib/alerts/generate", () => ({
  generateAlertPayload: () => ({
    level: "moderate",
    message: "gentle",
    reason: "trend",
    action: "reset"
  })
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { upsert: upsertMock },
    dailyCheckin: {
      create: checkinCreateMock,
      findMany: checkinFindManyMock
    },
    alert: {
      findMany: alertFindManyMock,
      create: alertCreateMock
    },
    driftScore: {
      create: driftCreateMock,
      findMany: driftFindManyMock
    },
    userPreference: {
      findUnique: prefFindUniqueMock
    }
  }
}));

import { POST as checkinsPost } from "@/app/api/checkins/route";
import { GET as trendsGet } from "@/app/api/trends/route";
import { GET as alertsGet } from "@/app/api/alerts/route";
import { POST as alertsEvaluatePost } from "@/app/api/alerts/evaluate/route";
import { GET as exportGet } from "@/app/api/export/route";

describe("auth context on api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    validateCheckinMock.mockReturnValue({
      ok: true,
      data: {
        date: "2026-02-14",
        energy: 4,
        stress: 3,
        social: 2,
        key_contact: "Alice"
      }
    });

    upsertMock.mockResolvedValue({ id: "session-user" });
    checkinCreateMock.mockResolvedValue({ id: "c1" });

    checkinFindManyMock.mockResolvedValue([
      { date: new Date("2026-02-14"), energy: 4, stress: 3, social: 2 }
    ]);

    alertFindManyMock.mockResolvedValue([
      {
        id: "a1",
        date: new Date("2026-02-14"),
        level: "moderate",
        message: "gentle",
        reason: "trend",
        action: "reset"
      }
    ]);

    driftCreateMock.mockResolvedValue({ id: "d1" });
    driftFindManyMock.mockResolvedValue([
      {
        date: new Date("2026-02-14"),
        driftIndex: 0.7,
        reasonsJson: ["trend"]
      }
    ]);

    prefFindUniqueMock.mockResolvedValue({ alertThreshold: 0.65 });
    alertCreateMock.mockResolvedValue({ id: "a1" });
  });

  it("returns 401 for unauthenticated requests across routes", async () => {
    getSessionUserIdMock.mockReturnValue(null);

    const checkinsRes = await checkinsPost(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: "2026-02-14",
          energy: 4,
          stress: 3,
          social: 2
        })
      })
    );

    const trendsRes = await trendsGet(new Request("http://localhost/api/trends?days=7"));
    const alertsRes = await alertsGet(new Request("http://localhost/api/alerts"));

    const evaluateRes = await alertsEvaluatePost(
      new Request("http://localhost/api/alerts/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: "2026-02-14" })
      })
    );

    const exportRes = await exportGet(new Request("http://localhost/api/export"));

    expect(checkinsRes.status).toBe(401);
    expect(trendsRes.status).toBe(401);
    expect(alertsRes.status).toBe(401);
    expect(evaluateRes.status).toBe(401);
    expect(exportRes.status).toBe(401);

    expect(getSessionUserIdMock).toHaveBeenCalledTimes(5);
  });

  it("uses resolved session user for authenticated paths", async () => {
    getSessionUserIdMock.mockReturnValue("session-user");

    await checkinsPost(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: "2026-02-14",
          energy: 4,
          stress: 3,
          social: 2
        })
      })
    );

    await trendsGet(new Request("http://localhost/api/trends?days=7"));
    await alertsGet(new Request("http://localhost/api/alerts"));

    await alertsEvaluatePost(
      new Request("http://localhost/api/alerts/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: "2026-02-14" })
      })
    );

    await exportGet(new Request("http://localhost/api/export"));

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "session-user" } })
    );
    expect(checkinFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "session-user" }) })
    );
    expect(alertFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "session-user" } })
    );
    expect(driftCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "session-user" })
      })
    );
    expect(driftFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "session-user" } })
    );
  });
});
