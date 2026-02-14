import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckinForm } from "@/components/checkin-form";

describe("CheckinForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders required checkin fields", () => {
    render(<CheckinForm />);

    expect(screen.getByLabelText("Energy (1-5)")).toBeInTheDocument();
    expect(screen.getByLabelText("Stress (1-5)")).toBeInTheDocument();
    expect(screen.getByLabelText("Social (1-5)")).toBeInTheDocument();
    expect(screen.getByLabelText("Key Contact")).toBeInTheDocument();
  });

  it("shows validation feedback and disables submit while submitting", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ checkin: { id: "c1" } }), {
        status: 201,
        headers: { "content-type": "application/json" }
      })
    );

    render(<CheckinForm />);

    const submit = screen.getByRole("button", { name: "Submit Check-in" });
    fireEvent.click(submit);

    expect(screen.getByText("Energy must be between 1 and 5.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Energy (1-5)"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Stress (1-5)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Social (1-5)"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Key Contact"), { target: { value: "Alice" } });

    fireEvent.click(submit);

    expect(submit).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Check-in submitted successfully.")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("shows error feedback when api fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Duplicate" } }), {
        status: 409,
        headers: { "content-type": "application/json" }
      })
    );

    render(<CheckinForm />);

    fireEvent.change(screen.getByLabelText("Energy (1-5)"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Stress (1-5)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Social (1-5)"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Check-in" }));

    await waitFor(() => {
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
    });
  });
});
