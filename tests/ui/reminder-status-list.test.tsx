import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReminderStatusList } from "@/components/reminder-status-list";

describe("ReminderStatusList", () => {
  it("shows loading state", () => {
    render(<ReminderStatusList items={[]} loading error={null} />);
    expect(screen.getByText("Loading reminder status...")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<ReminderStatusList items={[]} loading={false} error={null} />);
    expect(screen.getByText("No reminder events yet.")).toBeInTheDocument();
  });

  it("shows reminder status items", () => {
    render(
      <ReminderStatusList
        items={[
          {
            id: "n1",
            status: "sent",
            channel: "email",
            sentAt: "2026-02-20T09:00:00Z"
          },
          {
            id: "n2",
            status: "failed",
            channel: "email",
            sentAt: "2026-02-20T09:05:00Z"
          }
        ]}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText("Status: Sent")).toBeInTheDocument();
    expect(screen.getByText("Status: Failed")).toBeInTheDocument();
    expect(screen.getAllByText("Channel: email")).toHaveLength(2);
  });

  it("shows generic error", () => {
    render(<ReminderStatusList items={[]} loading={false} error="Reminder status is unavailable." />);
    expect(screen.getByText("Reminder status is unavailable.")).toBeInTheDocument();
  });
});
