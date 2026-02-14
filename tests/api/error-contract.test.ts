import { describe, expect, it } from "vitest";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import { POST as reminderPost } from "@/app/api/settings/reminder/route";
import { GET as weeklyGet } from "@/app/api/insights/weekly/route";
import { createSessionToken } from "@/lib/auth/session";

describe("api error contract", () => {
  it("returns unified unauthorized error shape for session endpoint", async () => {
    const response = await sessionGet(new Request("http://localhost/api/auth/session"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(typeof body.error.message).toBe("string");
    expect(typeof body.requestId).toBe("string");
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns unified validation error shape for reminder settings", async () => {
    const response = await reminderPost(
      new Request("http://localhost/api/settings/reminder", {
        method: "POST",
        headers: {
          cookie: `drift_session=${createSessionToken("u1")}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ reminderHourLocal: 77, notificationsEnabled: true })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof body.requestId).toBe("string");
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns unified validation error shape for weekly insights", async () => {
    const response = await weeklyGet(
      new Request("http://localhost/api/insights/weekly?days=99", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof body.requestId).toBe("string");
    expect(typeof body.timestamp).toBe("string");
  });
});
