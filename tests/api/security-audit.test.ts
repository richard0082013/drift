import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const {
  userUpsertMock,
  userUpdateMock,
  checkinFindManyMock,
  driftFindManyMock,
  notificationLogCreateMock
} = vi.hoisted(() => ({
  userUpsertMock: vi.fn(),
  userUpdateMock: vi.fn(),
  checkinFindManyMock: vi.fn(),
  driftFindManyMock: vi.fn(),
  notificationLogCreateMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: userUpsertMock,
      update: userUpdateMock
    },
    dailyCheckin: {
      findMany: checkinFindManyMock
    },
    driftScore: {
      findMany: driftFindManyMock
    },
    notificationLog: {
      create: notificationLogCreateMock
    }
  }
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as exportGet } from "@/app/api/export/route";
import { POST as accountDeletePost } from "@/app/api/account/delete/route";

describe("security audit and rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_MAX_LOGIN = "1";
    process.env.RATE_LIMIT_MAX_EXPORT = "1";
    process.env.RATE_LIMIT_MAX_ACCOUNT_DELETE = "1";

    userUpsertMock.mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U1"
    });
    userUpdateMock.mockResolvedValue({ id: "u1" });
    checkinFindManyMock.mockResolvedValue([
      {
        date: new Date("2026-02-15"),
        energy: 3,
        stress: 3,
        social: 3,
        keyContact: null
      }
    ]);
    driftFindManyMock.mockResolvedValue([]);
    notificationLogCreateMock.mockResolvedValue({ id: "audit1" });
  });

  it("writes audit logs for login/export/account-delete", async () => {
    const loginRes = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "1.2.3.4"
        },
        body: JSON.stringify({
          email: "u1@example.com",
          name: "U1"
        })
      })
    );
    expect(loginRes.status).toBe(200);

    const exportRes = await exportGet(
      new Request("http://localhost/api/export", {
        headers: {
          cookie: `drift_session=${createSessionToken("u1")}`
        }
      })
    );
    expect(exportRes.status).toBe(200);

    const deleteRes = await accountDeletePost(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: {
          cookie: `drift_session=${createSessionToken("u1")}`
        }
      })
    );
    expect(deleteRes.status).toBe(200);

    expect(notificationLogCreateMock).toHaveBeenCalled();
    expect(
      notificationLogCreateMock.mock.calls.some(
        (call) => call[0]?.data?.channel === "audit" && call[0]?.data?.template === "auth.login"
      )
    ).toBe(true);
    expect(
      notificationLogCreateMock.mock.calls.some(
        (call) =>
          call[0]?.data?.channel === "audit" &&
          call[0]?.data?.payloadJson?.schemaVersion === "audit.v2" &&
          call[0]?.data?.payloadJson?.meta?.event === "auth.login"
      )
    ).toBe(true);
    expect(
      notificationLogCreateMock.mock.calls.some(
        (call) => call[0]?.data?.channel === "audit" && call[0]?.data?.template === "export.csv"
      )
    ).toBe(true);
    expect(
      notificationLogCreateMock.mock.calls.some(
        (call) => call[0]?.data?.channel === "audit" && call[0]?.data?.template === "account.delete"
      )
    ).toBe(true);
  });

  it("writes unified audit payload for login validation failure", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "7.7.7.7"
        },
        body: JSON.stringify({
          email: "invalid-email"
        })
      })
    );
    expect(response.status).toBe(400);
    expect(
      notificationLogCreateMock.mock.calls.some(
        (call) =>
          call[0]?.data?.channel === "audit" &&
          call[0]?.data?.template === "auth.login" &&
          call[0]?.data?.status === "failed" &&
          call[0]?.data?.payloadJson?.schemaVersion === "audit.v2" &&
          call[0]?.data?.payloadJson?.meta?.event === "auth.login"
      )
    ).toBe(true);
  });

  it("rate limits login and returns 429", async () => {
    const request = () =>
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "8.8.8.8"
        },
        body: JSON.stringify({
          email: "u1@example.com"
        })
      });

    const first = await loginPost(request());
    const second = await loginPost(request());

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    const body = await second.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("rate limits export and delete independently per route", async () => {
    const cookie = `drift_session=${createSessionToken("u2")}`;

    const exportFirst = await exportGet(
      new Request("http://localhost/api/export", {
        headers: { cookie }
      })
    );
    const exportSecond = await exportGet(
      new Request("http://localhost/api/export", {
        headers: { cookie }
      })
    );

    expect(exportFirst.status).toBe(200);
    expect(exportSecond.status).toBe(429);

    const deleteFirst = await accountDeletePost(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: { cookie }
      })
    );
    const deleteSecond = await accountDeletePost(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: { cookie }
      })
    );

    expect(deleteFirst.status).toBe(200);
    expect(deleteSecond.status).toBe(429);
  });
});
