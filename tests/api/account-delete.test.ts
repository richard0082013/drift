import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateUserMock, getSessionUserIdMock } = vi.hoisted(() => ({
  updateUserMock: vi.fn(),
  getSessionUserIdMock: vi.fn()
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

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: updateUserMock
    }
  }
}));

import { DELETE, POST } from "@/app/api/account/delete/route";

describe("/api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    getSessionUserIdMock.mockReturnValue(null);

    const response = await POST(
      new Request("http://localhost/api/account/delete", {
        method: "POST"
      })
    );

    expect(response.status).toBe(401);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("soft deletes account when session user exists", async () => {
    getSessionUserIdMock.mockReturnValue("u1");
    updateUserMock.mockResolvedValue({ id: "u1" });

    const response = await DELETE(
      new Request("http://localhost/api/account/delete", {
        method: "DELETE"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(body.strategy).toBe("soft");
    expect(typeof body.purgeAfter).toBe("string");
    expect(updateUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          purgeAfter: expect.any(Date)
        })
      })
    );
  });

  it("returns 404 when account does not exist", async () => {
    getSessionUserIdMock.mockReturnValue("u404");
    updateUserMock.mockRejectedValue({ code: "P2025" });

    const response = await POST(
      new Request("http://localhost/api/account/delete", {
        method: "POST"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });
});
