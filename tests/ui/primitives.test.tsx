import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-coral-500");
  });

  it("applies danger variant", () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-rose-500");
  });

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-cream-100");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-transparent");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("px-6");
  });

  it("disables when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("Card", () => {
  it("renders with children", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveTextContent("Content");
  });

  it("renders header, body, and footer slots", () => {
    render(
      <Card>
        <CardHeader data-testid="header">Header</CardHeader>
        <CardBody data-testid="body">Body</CardBody>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>
    );
    expect(screen.getByTestId("header")).toHaveTextContent("Header");
    expect(screen.getByTestId("body")).toHaveTextContent("Body");
    expect(screen.getByTestId("footer")).toHaveTextContent("Footer");
  });

  it("applies card styling classes", () => {
    render(<Card data-testid="card">Styled</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("shadow-card");
  });
});

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders without label", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Name" error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("shows helper text when no error", () => {
    render(<Input label="Bio" id="bio" helperText="Max 200 chars" />);
    expect(screen.getByText("Max 200 chars")).toBeInTheDocument();
  });

  it("applies error styling", () => {
    render(<Input label="Name" error="Bad" />);
    const input = screen.getByLabelText("Name");
    expect(input.className).toContain("border-rose-400");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Badge", () => {
  it("renders with info variant by default", () => {
    render(<Badge>Info</Badge>);
    const badge = screen.getByText("Info");
    expect(badge.className).toContain("bg-coral-50");
  });

  it("renders low severity variant", () => {
    render(<Badge variant="low">Low</Badge>);
    expect(screen.getByText("Low").className).toContain("bg-sage-100");
  });

  it("renders moderate severity variant", () => {
    render(<Badge variant="moderate">Moderate</Badge>);
    expect(screen.getByText("Moderate").className).toContain("bg-amber-100");
  });

  it("renders high severity variant", () => {
    render(<Badge variant="high">High</Badge>);
    expect(screen.getByText("High").className).toContain("bg-rose-100");
  });
});
