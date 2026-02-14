import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";

let mockPathname = "/settings";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

const DEFAULT_SETTINGS = {
  reminderTime: "09:00",
  timezone: "UTC",
  enabled: true
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function setupFetchMock(options?: {
  sessionStatus?: number;
  settings?: Record<string, unknown>;
  settingsStatus?: number;
  saveStatus?: number;
  saveBody?: Record<string, unknown>;
  statusItems?: unknown[];
  statusStatus?: number;
}) {
  const {
    sessionStatus = 200,
    settings = DEFAULT_SETTINGS,
    settingsStatus = 200,
    saveStatus = 200,
    saveBody,
    statusItems = [],
    statusStatus = 200
  } = options ?? {};

  return vi.spyOn(global, "fetch").mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const method = (init?.method ?? "GET").toUpperCase();

    if (url === "/api/auth/session") {
      return jsonResponse({ ok: sessionStatus === 200 }, sessionStatus);
    }

    if (url === "/api/settings/reminder" && method === "GET") {
      return jsonResponse({ settings }, settingsStatus);
    }

    if (url.startsWith("/api/jobs/reminders/status")) {
      return jsonResponse({ items: statusItems }, statusStatus);
    }

    if (url === "/api/settings/reminder" && method === "POST") {
      return jsonResponse(saveBody ?? { ok: saveStatus === 200 }, saveStatus);
    }

    return jsonResponse({ error: "unexpected request" }, 500);
  });
}

describe("reminder settings page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/settings";
  });

  it("shows login guidance when unauthenticated", async () => {
    setupFetchMock({ sessionStatus: 401 });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Go to login" })).toHaveAttribute(
      "href",
      "/login?next=%2Fsettings"
    );
  });

  it("loads and saves reminder settings", async () => {
    const fetchSpy = setupFetchMock({
      settings: {
        reminderTime: "08:30",
        timezone: "America/Los_Angeles",
        enabled: true
      }
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Reminder Time")).toHaveValue("08:30");
      expect(screen.getByLabelText("Timezone")).toHaveValue("America/Los_Angeles");
    });

    fireEvent.change(screen.getByLabelText("Reminder Time"), { target: { value: "10:15" } });
    fireEvent.change(screen.getByLabelText("Timezone"), { target: { value: "UTC" } });
    fireEvent.click(screen.getByLabelText("Enable Reminders"));
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(screen.getByText("Settings saved.")).toBeInTheDocument();
    });

    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === "/api/settings/reminder" && init?.method === "POST"
    );

    expect(postCall).toBeDefined();
    const body = JSON.parse(String(postCall?.[1]?.body ?? "{}"));
    expect(body).toEqual({
      reminderTime: "10:15",
      timezone: "UTC",
      enabled: false
    });
  });

  it("validates time and shows clear error", async () => {
    const fetchSpy = setupFetchMock();

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Settings" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Reminder Time"), { target: { value: "25:99" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(screen.getByText("Reminder time must be in HH:MM format.")).toBeInTheDocument();
    });

    const hasPost = fetchSpy.mock.calls.some(
      ([url, init]) => url === "/api/settings/reminder" && init?.method === "POST"
    );
    expect(hasPost).toBe(false);
  });

  it("shows generic save error without internal details", async () => {
    setupFetchMock({ saveStatus: 500, saveBody: { error: { message: "db timeout stack trace" } } });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Settings" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to save settings.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });
});
