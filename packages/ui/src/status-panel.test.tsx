import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPanel } from "./status-panel";

describe("StatusPanel", () => {
  it("keeps loading states announced as busy status and preserves actions", () => {
    render(
      <StatusPanel
        tone="loading"
        title="Loading workspace"
        description="Checking workspace readiness."
        action={<button type="button">Cancel</button>}
      />,
    );

    const panel = screen.getByRole("status", { name: "Loading workspace" });
    const visualPanel = panel.closest("section");

    expect(visualPanel).toHaveAttribute("aria-busy", "true");
    expect(panel).not.toHaveAttribute("aria-busy");
    expect(panel).toHaveTextContent("Checking workspace readiness.");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(panel).not.toContainElement(
      screen.getByRole("button", { name: "Cancel" }),
    );
    expect(panel.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/ossie-app-icon-256.png",
    );
    expect(panel.querySelector("img")).toHaveAttribute("aria-hidden", "true");
  });

  it("announces failures as alerts while keeping the recovery message visible", () => {
    render(
      <StatusPanel
        tone="error"
        title="Workspace unavailable"
        description="Try again or return to Projects."
      />,
    );

    const panel = screen.getByRole("alert", { name: "Workspace unavailable" });

    expect(panel).toHaveTextContent("Try again or return to Projects.");
    expect(panel).not.toHaveAttribute("aria-busy");
  });

  it("keeps standalone page headings at page scale", () => {
    render(<StatusPanel title="Page not found" titleAs="h1" tone="not-found" />);

    expect(
      screen.getByRole("heading", { name: "Page not found", level: 1 }),
    ).toHaveClass("[font-size:var(--ossie-font-size-xl)]");
  });

  it("keeps static empty and access states as named regions instead of live alerts", () => {
    render(
      <StatusPanel
        action={<button type="button">Create project</button>}
        description="There is nothing here yet."
        title="No projects yet"
        tone="empty"
      />,
    );

    const panel = screen.getByRole("region", { name: "No projects yet" });

    expect(panel).toHaveTextContent("There is nothing here yet.");
    expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "No projects yet" }),
    ).not.toBeInTheDocument();
  });
});
