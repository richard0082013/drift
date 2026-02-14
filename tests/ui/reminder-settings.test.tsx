import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";

let mockPathname = "/settings";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

describe("reminder settings page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/settings";
    window.localStorage.clear();
  });

  it("shows login guidance when unauthenticated", async () => {
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
    window.localStorage.setItem("drift_auth_user", "u1");

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            settings: {
              reminderTime: "08:30",
              timezone: "America/Los_Angeles",
              enabled: true
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

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

    expect(fetchSpy).toHaveBeenCalledWith("/api/settings/reminder", expect.any(Object));
  });

  it("validates time and shows clear error", async () => {
    window.localStorage.setItem("drift_auth_user", "u1");

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ settings: {} }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Settings" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Reminder Time"), { target: { value: "25:99" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(screen.getByText("Reminder time must be in HH:MM format.")).toBeInTheDocument();
    });
  });

  it("shows generic save error without internal details", async () => {
    window.localStorage.setItem("drift_auth_user", "u1");

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ settings: DEFAULT_SETTINGS }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "db timeout stack trace" } }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      );

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

const DEFAULT_SETTINGS = {
  reminderTime: "09:00",
  timezone: "UTC",
  enabled: true
};
