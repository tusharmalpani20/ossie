import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectVersionRouteBoundary } from "./ProjectVersionRouteBoundary";

const api = vi.hoisted(() => ({ getProject: vi.fn(), resolveProjectVersion: vi.fn(), listProjectVersions: vi.fn() }));
vi.mock("../../lib/api", async (original) => ({ ...(await original()), ...api }));
const version = { id: "version_1", organization_id: "org_1", project_id: "project_1", name: "Main", description: null,
  slug: "main", release_date: null, position: 1, status: "active", is_default: true, version: 1,
  created_by_id: "actor_1", updated_by_id: "actor_1", created_at: "2026-07-19T00:00:00.000Z", updated_at: "2026-07-19T00:00:00.000Z", aliases: [] };
const project = { id: "project_1", name: "Ossie", status: "active", access: { role: "project_admin" }, default_project_version: version };
beforeEach(() => { api.getProject.mockResolvedValue({ project }); api.resolveProjectVersion.mockResolvedValue({ project_version: version, resolution: "canonical" }); api.listProjectVersions.mockResolvedValue({ project_versions: [version] }); });

describe("ProjectVersionRouteBoundary", () => {
  it("renders current legacy content only for the active Default Version", async () => {
    render(<ProjectVersionRouteBoundary projectId="project_1" versionSlug="main">{() => <h1>Default content</h1>}</ProjectVersionRouteBoundary>);
    expect(await screen.findByRole("heading", { name: "Default content" })).toBeInTheDocument();
  });

  it("keeps a non-default Version on the honest empty workspace", async () => {
    api.resolveProjectVersion.mockResolvedValue({ project_version: { ...version, id: "version_2", slug: "q3", name: "Q3", is_default: false }, resolution: "canonical" });
    render(<ProjectVersionRouteBoundary projectId="project_1" versionSlug="q3">{() => <h1>Legacy content</h1>}</ProjectVersionRouteBoundary>);
    expect(await screen.findByText(/ready for version-owned content/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Legacy content" })).not.toBeInTheDocument();
  });

  it("canonicalizes an alias without accepting an external redirect", async () => {
    const replace = vi.fn(); api.resolveProjectVersion.mockResolvedValue({ project_version: version, resolution: "alias" });
    window.history.pushState({}, "", "/projects/project_1/versions/old/guides?tab=1#step");
    render(<ProjectVersionRouteBoundary projectId="project_1" versionSlug="old" replace={replace} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/projects/project_1/versions/main/guides?tab=1#step"));
  });
});
