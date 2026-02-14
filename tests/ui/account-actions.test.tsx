import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage from "@/app/privacy/page";
import AccountPage from "@/app/account/page";

let mockPathname = "/privacy";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

describe("privacy and account actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    mockPathname = "/privacy";
  });

  it("shows non-medical disclaimer and account entry", async () => {
    window.localStorage.setItem("drift_auth_user", "u1");
    render(<PrivacyPage />);

    await waitFor(() => {
      expect(screen.getByText(/not a medical service/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Go to account actions" })).toHaveAttribute(
      "href",
      "/account"
    );
  });

  it("requires auth and routes to login when unauthenticated", async () => {
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

  it("enforces second confirmation for delete action", async () => {
    window.localStorage.setItem("drift_auth_user", "u1");
    render(<AccountPage />);

    const deleteButton = await screen.findByRole("button", { name: "Delete account" });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    expect(deleteButton).toBeEnabled();
  });

  it("shows generic error when export fails", async () => {
    window.localStorage.setItem("drift_auth_user", "u1");
    vi.spyOn(global, "fetch").mockResolvedValue(
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
});
