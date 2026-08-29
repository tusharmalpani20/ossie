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
    expect(screen.getByLabelText("Project Version")).toHaveValue("main");
    expect(screen.getByText("Default version")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Manage versions" }),
    ).toBeInTheDocument();
    const actions = screen.getByRole("group", {
      name: "Project Version actions",
    });
    expect(within(actions).getByText("Default version")).toBeInTheDocument();
    expect(
      within(actions).getByRole("link", { name: "Manage versions" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Project Version"), {
      target: { value: "q3" },
    });
    expect(navigate).toHaveBeenCalledWith("/projects/project_1/versions/q3");
    expect(screen.getByRole("option", { name: "Old" })).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText("Project Version"), {
      target: { value: "q3" },
    });

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

    expect(screen.getByLabelText("Project Version")).toHaveValue("main");
  });
});
