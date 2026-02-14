import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckinPage from "@/app/checkin/page";
import TrendsPage from "@/app/trends/page";
import LoginPage from "@/app/login/page";

const routerPush = vi.fn();
let mockPathname = "/checkin";
let mockNext = "/checkin";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => ({
    get: (key: string) => (key === "next" ? mockNext : null)
  })
}));

describe("auth gating", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    routerPush.mockReset();
    window.localStorage.clear();
    mockPathname = "/checkin";
    mockNext = "/checkin";
  });

  it("shows login guidance for unauthenticated checkin page", async () => {
    render(<CheckinPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Go to login" })).toHaveAttribute(
      "href",
      "/login?next=%2Fcheckin"
    );
  });

  it("blocks trends loading when unauthenticated", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    mockPathname = "/trends";
    render(<TrendsPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("redirects to next page after login", async () => {
    mockNext = "/alerts";

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/alerts");
    });
    expect(window.localStorage.getItem("drift_auth_user")).toBe("demo-user");
  });

  it("shows generic login error without internal details", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exploded");
    });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to sign in right now.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/quota exploded/i)).not.toBeInTheDocument();
  });
});
