import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage from "@/app/privacy/page";
import AccountPage from "@/app/account/page";

let mockPathname = "/privacy";

async function flushCountdown(seconds: number) {
  for (let i = 0; i < seconds; i += 1) {
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
  }
}

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

describe("privacy and account actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/privacy";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows non-medical disclaimer and account entry", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ session: { userId: "u1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    render(<PrivacyPage />);

    await waitFor(() => {
      expect(screen.getByText(/not a medical service/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/soft-delete retention window/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to account actions" })).toHaveAttribute(
      "href",
      "/account"
    );
  });

  it("enforces second confirmation for delete action", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ session: { userId: "u1" } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    render(<AccountPage />);

    const deleteButton = await screen.findByRole("button", { name: "Delete account" });
    expect(deleteButton).toBeDisabled();
    vi.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "Start delete confirmation" }));
    expect(screen.getByText("Delete confirmation unlocks in 5s.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    expect(deleteButton).toBeDisabled();

    await flushCountdown(5);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.queryByText(/unlocks in/i)).not.toBeInTheDocument();
    });
    expect(deleteButton).toBeEnabled();
  });

  it("shows generic error when export fails", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "db stack trace" } }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      );

    render(<AccountPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Export my data" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to export data right now.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });

  it("shows export metadata after successful export", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response("date,energy\n2026-02-15,4", {
          status: 200,
          headers: {
            "content-type": "text/csv",
            "x-export-generated-at": "2026-02-15T01:23:45.000Z",
            "x-export-record-count": "12",
            "x-export-version": "2026-02-15.v2"
          }
        })
      );

    render(<AccountPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Export my data" }));

    await waitFor(() => {
      expect(screen.getByText("Export generated.")).toBeInTheDocument();
      expect(screen.getByText("2026-02-15T01:23:45.000Z")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("2026-02-15.v2")).toBeInTheDocument();
    });
  });

  it("shows recovery hint when delete request fails", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "failed" } }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      );

    render(<AccountPage />);
    await screen.findByRole("button", { name: "Delete account" });
    vi.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "Start delete confirmation" }));
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    await flushCountdown(5);
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to delete account right now.")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Deletion failed. You can retry after reviewing your connection and confirmation details."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows retention-window messaging when delete succeeds", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ deleted: true, strategy: "soft", purgeAfter: "2026-03-17T00:00:00.000Z" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    render(<AccountPage />);
    await screen.findByRole("button", { name: "Delete account" });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Start delete confirmation" }));
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    await flushCountdown(5);
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Account entered retention window and is scheduled for purge after 2026-03-17T00:00:00.000Z."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText("If you need to restore access during the retention window, contact support.")
      ).toBeInTheDocument();
    });
  });

  it("requires auth and routes to login when unauthenticated", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );
    mockPathname = "/account";
    render(<AccountPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Go to login" })).toHaveAttribute(
      "href",
      "/login?next=%2Faccount"
    );
  });
});
