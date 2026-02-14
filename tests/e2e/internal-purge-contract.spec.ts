import { test, expect } from "@playwright/test";

test("internal purge job contract: unauthorized and authorized responses", async ({ page }) => {
  const unauthorized = await page.request.post("/api/internal/jobs/purge-users");
  expect([401, 403]).toContain(unauthorized.status());
  const unauthorizedJson = (await unauthorized.json()) as {
    error?: { code?: string; message?: string };
  };
  expect(typeof unauthorizedJson.error?.code).toBe("string");
  expect(typeof unauthorizedJson.error?.message).toBe("string");

  const authorized = await page.request.post("/api/internal/jobs/purge-users?limit=5", {
    headers: {
      "x-internal-token": "drift-internal-dev-token-change-me"
    }
  });

  expect(authorized.status()).toBeGreaterThanOrEqual(200);
  expect(authorized.status()).toBeLessThan(300);

  const authorizedJson = (await authorized.json()) as {
    purgedCount?: unknown;
    purgedUserIds?: unknown;
    runAt?: unknown;
  };

  expect(typeof authorizedJson.purgedCount).toBe("number");
  expect(Array.isArray(authorizedJson.purgedUserIds)).toBe(true);
  expect(typeof authorizedJson.runAt).toBe("string");
  expect(Number.isNaN(Date.parse(authorizedJson.runAt as string))).toBe(false);
});
