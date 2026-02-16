import { beforeEach, describe, expect, it, vi } from "vitest";

const { userUpsertMock, checkinCreateMock, validateCheckinInputMock, notificationLogCreateMock } =
  vi.hoisted(() => ({
  userUpsertMock: vi.fn(),
  checkinCreateMock: vi.fn(),
  validateCheckinInputMock: vi.fn(),
  notificationLogCreateMock: vi.fn()
  }));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: userUpsertMock
    },
    dailyCheckin: {
      create: checkinCreateMock
    },
    notificationLog: {
      create: notificationLogCreateMock
    }
  }
}));

vi.mock("@/lib/validation/checkin", () => ({
  validateCheckinInput: validateCheckinInputMock
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as checkinsPost } from "@/app/api/checkins/route";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import { GET as healthGet } from "@/app/api/health/route";

describe("real auth session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userUpsertMock.mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U1"
    });
    validateCheckinInputMock.mockReturnValue({
      ok: true,
      data: {
        date: "2026-02-15",
        energy: 3,
        stress: 3,
        social: 3,
        key_contact: "Alice"
      }
    });
    checkinCreateMock.mockResolvedValue({ id: "c1" });
    notificationLogCreateMock.mockResolvedValue({ id: "n1" });
  });

  it("issues HttpOnly session cookie on login", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email: "u1@example.com",
          name: "U1"
        })
      })
    );

    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("drift_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("protected api rejects legacy drift-user header without server session", async () => {
    const response = await checkinsPost(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer drift-user:u1"
        },
        body: JSON.stringify({
          date: "2026-02-15",
          energy: 3,
          stress: 3,
          social: 3
        })
      })
    );

    expect(response.status).toBe(401);
    expect(checkinCreateMock).not.toHaveBeenCalled();
  });

  it("accepts server session cookie and clears it on logout", async () => {
    const loginRes = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email: "u1@example.com",
          name: "U1"
        })
      })
    );
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const cookiePair = setCookie.split(";")[0];

    const checkinRes = await checkinsPost(
      new Request("http://localhost/api/checkins", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: cookiePair
        },
        body: JSON.stringify({
          date: "2026-02-15",
          energy: 3,
          stress: 3,
          social: 3
        })
      })
    );
    expect(checkinRes.status).toBe(201);

    const logoutRes = await logoutPost(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: cookiePair
        }
      })
    );
    const clearedCookie = logoutRes.headers.get("set-cookie") ?? "";
    expect(logoutRes.status).toBe(200);
    expect(clearedCookie).toContain("drift_session=");
    expect(clearedCookie).toContain("Max-Age=0");
    expect(clearedCookie).toContain("HttpOnly");
  });

  it("reports authenticated session shape and consistent health probe", async () => {
    const loginRes = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email: "u1@example.com",
          name: "U1"
        })
      })
    );
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const cookiePair = setCookie.split(";")[0];

    const sessionRes = await sessionGet(
      new Request("http://localhost/api/auth/session", {
        headers: { cookie: cookiePair }
      })
    );
    const sessionBody = await sessionRes.json();
    expect(sessionRes.status).toBe(200);
    expect(sessionBody).toEqual(
      expect.objectContaining({
        authenticated: true,
        session: { userId: "u1" },
        requestId: expect.any(String),
        timestamp: expect.any(String)
      })
    );

    const healthAuthedRes = await healthGet(
      new Request("http://localhost/api/health", {
        headers: { cookie: cookiePair }
      })
    );
    const healthAuthedBody = await healthAuthedRes.json();
    expect(healthAuthedRes.status).toBe(200);
    expect(healthAuthedBody.status).toBe("ok");
    expect(healthAuthedBody.authenticated).toBe(true);
    expect(healthAuthedBody.session.userId).toBe("u1");
    expect(typeof healthAuthedBody.requestId).toBe("string");
    expect(typeof healthAuthedBody.timestamp).toBe("string");

    const healthAnonRes = await healthGet(new Request("http://localhost/api/health"));
    const healthAnonBody = await healthAnonRes.json();
    expect(healthAnonRes.status).toBe(200);
    expect(healthAnonBody.status).toBe("ok");
    expect(healthAnonBody.authenticated).toBe(false);
    expect(healthAnonBody.session.userId).toBeNull();
    expect(typeof healthAnonBody.requestId).toBe("string");
    expect(typeof healthAnonBody.timestamp).toBe("string");
  });

  it("accepts valid Bearer token for session endpoint", async () => {
    const loginRes = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "u1@example.com",
          name: "U1"
        })
      })
    );
    const loginBody = await loginRes.json();

    const sessionRes = await sessionGet(
      new Request("http://localhost/api/auth/session", {
        headers: {
          authorization: `Bearer ${loginBody.accessToken as string}`
        }
      })
    );
    const sessionBody = await sessionRes.json();

    expect(sessionRes.status).toBe(200);
    expect(sessionBody).toEqual(
      expect.objectContaining({
        authenticated: true,
        session: { userId: "u1" }
      })
    );
  });

  it("returns 401 for invalid Bearer token on session endpoint", async () => {
    const sessionRes = await sessionGet(
      new Request("http://localhost/api/auth/session", {
        headers: {
          authorization: "Bearer invalid.token.value"
        }
      })
    );
    const sessionBody = await sessionRes.json();

    expect(sessionRes.status).toBe(401);
    expect(sessionBody).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "UNAUTHORIZED"
        })
      })
    );
  });
});
