import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  AuthRequiredState
} from "@/components/page-feedback";

describe("page-feedback components", () => {
  describe("LoadingState", () => {
    it("renders default loading message", () => {
      render(<LoadingState />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders custom loading message", () => {
      render(<LoadingState message="Fetching data..." />);

      expect(screen.getByText("Fetching data...")).toBeInTheDocument();
    });

    it("has a spinner element", () => {
      const { container } = render(<LoadingState />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("ErrorState", () => {
    it("renders the error message with alert role", () => {
      render(<ErrorState message="Something went wrong." />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Something went wrong.");
    });
  });

  describe("EmptyState", () => {
    it("renders the empty message", () => {
      render(<EmptyState message="No data available." />);

      expect(screen.getByText("No data available.")).toBeInTheDocument();
    });
  });

  describe("AuthRequiredState", () => {
    it("renders login guidance with link", () => {
      render(<AuthRequiredState loginHref="/login?next=%2Fcheckin" />);

      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
      const loginLink = screen.getByRole("link", { name: "Go to login" });
      expect(loginLink).toHaveAttribute("href", "/login?next=%2Fcheckin");
    });
  });
});
