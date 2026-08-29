/**
 * @fileoverview Project Version context bar tests.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectVersionContextBar } from "./ProjectVersionContextBar";

const project = {
  id: "project_1",
  name: "Ossie",
  access: { role: "project_admin" },
} as never;
const main = {
  id: "version_1",
  name: "Main",
  slug: "main",
  status: "active" as const,
  position: 1,
  is_default: true,
};

describe("ProjectVersionContextBar", () => {
  it("shows the current Version selector and status badges", () => {
    const navigate = vi.fn();
    render(
      <ProjectVersionContextBar
        project={project}
        selected={main as never}
        versions={
          [
            main,
            {
              ...main,
              id: "version_2",
              name: "Q3",
              slug: "q3",
              position: 2,
              is_default: false,
            },
            {
              ...main,
              id: "version_3",
              name: "Old",
              slug: "old",
              position: 3,
              status: "archived",
              is_default: false,
            },
          ] as never
        }
        navigate={navigate}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Project Version: Main",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Manage versions" }),
    ).toBeInTheDocument();
    const actions = screen.getByRole("group", {
      name: "Project Version actions",
    });
    expect(within(actions).getByText("Default")).toBeInTheDocument();
    expect(
      within(actions).getByRole("link", { name: "Manage versions" }),
    ).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("listbox", { name: "Project Versions" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Archived versions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Q3" }));
    expect(navigate).toHaveBeenCalledWith("/projects/project_1/versions/q3");
  });

  it("preserves the current list route family when switching Project Versions", () => {
    const navigate = vi.fn();
    render(
      <ProjectVersionContextBar
        project={project}
        selected={main as never}
        versions={
          [
            main,
            {
              ...main,
              id: "version_2",
              name: "Q3",
              slug: "q3",
              position: 2,
              is_default: false,
            },
          ] as never
        }
        navigate={navigate}
        routeSuffix="/guides"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Project Version: Main" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Q3" }));

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project_1/versions/q3/guides",
    );
  });

  it("still shows the Version selector when only one Version exists", () => {
    render(
      <ProjectVersionContextBar
        project={project}
        selected={main as never}
        versions={[main] as never}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Project Version: Main" }),
    ).toBeInTheDocument();
  });
});
