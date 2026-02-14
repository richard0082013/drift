import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findManyMock,
  deleteManyMock,
  notificationLogCreateMock,
  userUpsertMock,
  queryRawUnsafeMock
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  deleteManyMock: vi.fn(),
  notificationLogCreateMock: vi.fn(),
  userUpsertMock: vi.fn(),
  queryRawUnsafeMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: findManyMock,
      deleteMany: deleteManyMock,
      upsert: userUpsertMock
    },
    $queryRawUnsafe: queryRawUnsafeMock,
    notificationLog: {
      create: notificationLogCreateMock
    }
  }
}));

import { POST } from "@/app/api/internal/jobs/purge-users/route";

describe("POST /api/internal/jobs/purge-users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_JOB_TOKEN = "token-123";
    findManyMock.mockResolvedValue([]);
    deleteManyMock.mockResolvedValue({ count: 0 });
    userUpsertMock.mockResolvedValue({ id: "internal:purge-job" });
    notificationLogCreateMock.mockResolvedValue({ id: "audit1" });
    queryRawUnsafeMock.mockResolvedValue([]);
  });

  it("returns forbidden for missing internal token", async () => {
    const response = await POST(new Request("http://localhost/api/internal/jobs/purge-users"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("purges due users up to limit", async () => {
    findManyMock.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);

    const response = await POST(
      new Request("http://localhost/api/internal/jobs/purge-users?limit=2", {
        method: "POST",
        headers: { "x-internal-token": "token-123" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.purgedCount).toBe(2);
    expect(body.purgedUserIds).toEqual(["u1", "u2"]);
    expect(typeof body.runAt).toBe("string");
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: { in: ["u1", "u2"] } }
    });
    expect(notificationLogCreateMock).toHaveBeenCalled();
  });

  it("falls back to raw query when prisma client does not know retention args", async () => {
    findManyMock.mockRejectedValue(new Error("Unknown argument `deletedAt`"));
    queryRawUnsafeMock.mockResolvedValue([{ id: "u9" }]);

    const response = await POST(
      new Request("http://localhost/api/internal/jobs/purge-users?limit=1", {
        method: "POST",
        headers: { "x-internal-token": "token-123" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.purgedUserIds).toEqual(["u9"]);
    expect(queryRawUnsafeMock).toHaveBeenCalled();
  });

  it("validates limit boundary", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/jobs/purge-users?limit=2000", {
        method: "POST",
        headers: { "x-internal-token": "token-123" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});
