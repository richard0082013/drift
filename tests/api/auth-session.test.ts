import { beforeEach, describe, expect, it, vi } from "vitest";

const { userUpsertMock, checkinCreateMock, validateCheckinInputMock } = vi.hoisted(() => ({
  userUpsertMock: vi.fn(),
  checkinCreateMock: vi.fn(),
  validateCheckinInputMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: userUpsertMock
    },
    dailyCheckin: {
      create: checkinCreateMock
    }
  }
}));

vi.mock("@/lib/validation/checkin", () => ({
  validateCheckinInput: validateCheckinInputMock
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as checkinsPost } from "@/app/api/checkins/route";

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
});
