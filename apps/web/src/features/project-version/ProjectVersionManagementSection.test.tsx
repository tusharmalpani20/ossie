import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectVersionManagementSection } from "./ProjectVersionManagementSection";
const api = vi.hoisted(() => ({ listProjectVersions: vi.fn(), getProjectVersion: vi.fn(), createProjectVersion: vi.fn() }));
vi.mock("../../lib/api", async (original) => ({ ...(await original()), ...api }));
const version = { id: "version_1", name: "Main", slug: "main", status: "active", position: 1, is_default: true, version: 1 };
const project = { id: "project_1", status: "active", version: 1 } as never;

describe("ProjectVersionManagementSection", () => {
  it("creates a Version while preserving optional null fields", async () => {
    api.listProjectVersions.mockResolvedValue({ project_versions: [version] }); api.getProjectVersion.mockResolvedValue({ project_version: { ...version, aliases: [] } }); api.createProjectVersion.mockResolvedValue({ project_version: version });
    render(<ProjectVersionManagementSection project={project} />);
    await screen.findByRole("heading", { name: "Project Versions" });
    fireEvent.change(screen.getAllByLabelText("Name")[0]!, { target: { value: "Q3" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Project Version" }));
    await waitFor(() => expect(api.createProjectVersion).toHaveBeenCalledWith("project_1", {
      name: "Q3", description: null, release_date: null,
    }));
  });
});
