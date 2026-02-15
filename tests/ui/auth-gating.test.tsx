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

  it("shows not-checked-in state with form for authenticated users", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/auth/session") {
        return new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (url === "/api/checkins/today") {
        return new Response(JSON.stringify({ checkedInToday: false, checkin: null }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: { message: "unexpected request" } }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    });

    render(<CheckinPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't checked in today.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Submit Check-in" })).toBeInTheDocument();
    });
  });

  it("shows checked-in summary and hides form when already submitted", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/auth/session") {
        return new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (url === "/api/checkins/today") {
        return new Response(
          JSON.stringify({
            checkedInToday: true,
            checkin: { energy: 4, stress: 3, social: 5 }
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        );
      }

      return new Response(JSON.stringify({ error: { message: "unexpected request" } }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    });

    render(<CheckinPage />);

    await waitFor(() => {
      expect(screen.getByText("Checked in today (energy/stress/social):4/3/5")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Submit Check-in" })).not.toBeInTheDocument();
  });

  it("switches to checked-in state immediately after successful submit", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      const method = (init?.method ?? "GET").toUpperCase();

      if (url === "/api/auth/session") {
        return new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (url === "/api/checkins/today") {
        return new Response(JSON.stringify({ checkedInToday: false, checkin: null }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      if (url === "/api/checkins" && method === "POST") {
        return new Response(
          JSON.stringify({ checkin: { id: "c1", energy: 3, stress: 2, social: 4 } }),
          {
            status: 201,
            headers: { "content-type": "application/json" }
          }
        );
      }

      return new Response(JSON.stringify({ error: { message: "unexpected request" } }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    });

    render(<CheckinPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit Check-in" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Energy (1-5)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Stress (1-5)"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Social (1-5)"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Check-in" }));

    await waitFor(() => {
      expect(screen.getByText("Checked in today (energy/stress/social):3/2/4")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Submit Check-in" })).not.toBeInTheDocument();
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
