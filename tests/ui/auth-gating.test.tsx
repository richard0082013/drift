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
    mockPathname = "/checkin";
    mockNext = "/checkin";
  });

  it("shows login guidance for unauthenticated checkin page", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

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
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    mockPathname = "/trends";
    render(<TrendsPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/session", expect.any(Object));
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/trends/), expect.anything());
  });

  it("redirects to next page after login", async () => {
    mockNext = "/alerts";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/alerts");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "demo@drift.local", name: "Demo User" })
      })
    );
  });

  it("falls back to /checkin when next is unsafe", async () => {
    mockNext = "//evil.example";
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/checkin");
    });
  });

  it("shows validation message for invalid email payload", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "A valid email is required." } }), {
        status: 400,
        headers: { "content-type": "application/json" }
      })
    );

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "demo" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email.")).toBeInTheDocument();
    });
  });

  it("shows generic login error without internal details", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "internal stack trace" } }), {
        status: 500,
        headers: { "content-type": "application/json" }
      })
    );

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to sign in right now.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });

  it("retries login after failure and then redirects", async () => {
    mockNext = "/checkin";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "temporary" } }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to sign in right now.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/checkin");
    });
  });
});
