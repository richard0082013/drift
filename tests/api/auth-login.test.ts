import { beforeEach, describe, expect, it, vi } from "vitest";

const { userUpsertMock, notificationLogCreateMock } = vi.hoisted(() => ({
  userUpsertMock: vi.fn(),
  notificationLogCreateMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      upsert: userUpsertMock
    },
    notificationLog: {
      create: notificationLogCreateMock
    }
  }
}));

import { POST as loginPost } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_MAX_LOGIN = "20";

    userUpsertMock.mockResolvedValue({
      id: "u1",
      email: "u1@example.com",
      name: "U1"
    });
    notificationLogCreateMock.mockResolvedValue({ id: "audit1" });
  });

  it("logs in successfully, issues session cookie, and writes success audit log", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "1.2.3.4"
        },
        body: JSON.stringify({ email: "u1@example.com", name: "U1" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.id).toBe("u1");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("drift_session=");
    expect(cookie).toContain("HttpOnly");
    expect(notificationLogCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channel: "audit",
          template: "auth.login",
          status: "success",
          userId: "u1"
        })
      })
    );
  });

  it("returns 400 for invalid email and keeps audit write non-blocking", async () => {
    notificationLogCreateMock.mockRejectedValueOnce(new Error("fk failed"));

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "9.9.9.9"
        },
        body: JSON.stringify({ email: "invalid" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(userUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "anon:9.9.9.9" }
      })
    );
  });

  it("does not block login success when audit log create fails", async () => {
    notificationLogCreateMock.mockRejectedValueOnce(new Error("P2003"));

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "6.6.6.6"
        },
        body: JSON.stringify({ email: "u1@example.com" })
      })
    );

    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("drift_session=");
  });
});
