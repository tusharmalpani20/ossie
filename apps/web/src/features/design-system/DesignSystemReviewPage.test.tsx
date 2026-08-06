/**
 * @fileoverview Tests for the dev-only design system review surface.
 */

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesignSystemReviewPage } from "./DesignSystemReviewPage";

describe("DesignSystemReviewPage", () => {
  it("renders representative workbench directions with synthetic states", () => {
    render(<DesignSystemReviewPage />);

    expect(
      screen.getByRole("heading", { name: "Design system review" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("main", { name: "Design system review workspace" }),
    ).toBeInTheDocument();

    const states = screen.getByRole("region", {
      name: "Shared state matrix",
    });
    expect(within(states).getByText("Loading")).toBeInTheDocument();
    expect(within(states).getByText("Archived / read-only")).toBeInTheDocument();
    expect(
      within(states).getByRole("button", { name: "Retry state" }),
    ).toBeInTheDocument();

    const library = screen.getByRole("region", {
      name: "Library operations direction",
    });
    expect(
      within(library).getByText("Long Project Version name that should wrap"),
    ).toBeInTheDocument();
    expect(
      within(library).getByText("Permission read-only"),
    ).toBeInTheDocument();

    const workbench = screen.getByRole("region", {
      name: "Authoring workbench direction",
    });
    expect(within(workbench).getByText("Navigator")).toBeInTheDocument();
    expect(within(workbench).getByText("Inspector")).toBeInTheDocument();
    expect(
      within(workbench).getByRole("heading", {
        level: 4,
        name: "Draft is read-only",
      }),
    ).toBeInTheDocument();

    const reader = screen.getByRole("region", {
      name: "Reader viewer direction",
    });
    expect(within(reader).getByText("Published link")).toBeInTheDocument();
    expect(
      within(reader).getByText("Reduced motion: instant state changes"),
    ).toBeInTheDocument();
  });
});
