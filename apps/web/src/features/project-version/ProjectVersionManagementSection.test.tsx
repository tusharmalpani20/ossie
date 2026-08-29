/**
 * @fileoverview Project Version management section tests.
 */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectVersionManagementSection } from "./ProjectVersionManagementSection";
const api = vi.hoisted(() => ({
  listProjectVersions: vi.fn(),
  getProjectVersion: vi.fn(),
  createProjectVersion: vi.fn(),
}));
vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  ...api,
}));
const version = {
  id: "version_1",
  name: "Main",
  slug: "main",
  status: "active",
  position: 1,
  is_default: true,
  version: 1,
};
const project = { id: "project_1", status: "active", version: 1 } as never;

describe("ProjectVersionManagementSection", () => {
  it("creates a Version while preserving optional null fields", async () => {
    api.listProjectVersions.mockResolvedValue({ project_versions: [version] });
    api.getProjectVersion.mockResolvedValue({
      project_version: { ...version, aliases: [] },
    });
    api.createProjectVersion.mockResolvedValue({ project_version: version });
    render(<ProjectVersionManagementSection project={project} />);
    await screen.findByRole("heading", { name: "Project Versions" });
    expect(
      screen.queryByRole("dialog", { name: "Create a Project Version" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create version" }));
    const createDialog = screen.getByRole("dialog", {
      name: "Create a Project Version",
    });
    expect(
      within(createDialog).getByRole("heading", {
        name: "Create a Project Version",
      }),
    ).toBeInTheDocument();
    fireEvent.change(within(createDialog).getByLabelText("Name"), {
      target: { value: "Q3" },
    });
    fireEvent.click(
      within(createDialog).getByRole("button", {
        name: "Create Project Version",
      }),
    );
    await waitFor(() =>
      expect(api.createProjectVersion).toHaveBeenCalledWith("project_1", {
        name: "Q3",
        description: null,
        release_date: null,
      }),
    );
  });

  it("keeps Row Version out of normal management copy", async () => {
    api.listProjectVersions.mockResolvedValue({ project_versions: [version] });
    api.getProjectVersion.mockResolvedValue({
      project_version: { ...version, aliases: [] },
    });

    render(<ProjectVersionManagementSection project={project} />);

    await screen.findByRole("heading", { name: "Project Versions" });
    expect(
      screen.getByRole("region", { name: "Active versions" }),
    ).toBeInTheDocument();
    const archived = screen.getByRole("region", { name: "Archived versions" });
    expect(
      within(archived).getByRole("img", { name: "No archived versions" }),
    ).toHaveAttribute(
      "src",
      "/illustrations/ossie-versions-archived-empty.png",
    );
    expect(screen.queryByText(/Row Version/i)).not.toBeInTheDocument();
  });

  it("explains why the Default Project Version cannot be archived", async () => {
    api.listProjectVersions.mockResolvedValue({ project_versions: [version] });
    api.getProjectVersion.mockResolvedValue({
      project_version: { ...version, aliases: [] },
    });

    render(<ProjectVersionManagementSection project={project} />);

    await screen.findByRole("heading", { name: "Project Versions" });
    expect(
      screen.getByText("Default Project Version cannot be archived."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeDisabled();
  });
});
