import { describe, expect, it, vi } from "vitest";
import {
  DefaultProjectVersionArchiveError,
  InvalidProjectVersionOrderError,
  ProjectVersionArchivedError,
  ProjectVersionUnchangedError,
  build_project_version_service,
} from "./project-version.service";

const version = (overrides: Record<string, unknown> = {}) => ({
  id: "version_1",
  organization_id: "org_1",
  project_id: "project_1",
  name: "Main",
  description: null,
  slug: "main",
  release_date: null,
  position: 1,
  status: "active" as const,
  is_default: true,
  version: 1,
  created_by_id: "actor_1",
  updated_by_id: "actor_1",
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
  aliases: [],
  ...overrides,
});

const setup = (versions = [version()]) => {
  const access = { authorize: vi.fn(async () => ({ role: "project_admin" as const, source: "project_membership" as const })) };
  const repository = {
    list_versions: vi.fn(async () => versions),
    find_version: vi.fn(async ({ project_version_id }: { project_version_id: string }) =>
      versions.find(({ id }) => id === project_version_id) ?? null),
    resolve_version: vi.fn(async () => ({ project_version: versions[0]!, resolution: "canonical" as const })),
    create_version: vi.fn(async (input) => version({
      id: "version_2", name: input.data.name, slug: input.data.slug,
      is_default: false, position: 2,
    })),
    update_version: vi.fn(async (input) => version({ ...versions[0], ...input.data, version: 2 })),
    reorder_versions: vi.fn(async () => versions),
    archive_version: vi.fn(async () => version({ ...versions[0], status: "archived", is_default: false, version: 2 })),
    restore_version: vi.fn(async () => version({ ...versions[0], status: "active", version: 2 })),
    set_default_version: vi.fn(async () => ({ project: { version: 2 }, project_version: versions[0] })),
  };
  return { access, repository, service: build_project_version_service({ access, repository }) };
};

const auth = { organization_id: "org_1", actor_org_user_id: "actor_1" };

describe("Project Version service", () => {
  it("authorizes reads and derives a canonical slug when creating", async () => {
    const { access, repository, service } = setup();
    const created = await service.create({
      auth, project_id: "project_1", data: { name: "  Crème 2026 Q3  " },
    });
    expect(access.authorize).toHaveBeenCalledWith({
      auth, project_id: "project_1", capability: "project_version.manage",
    });
    expect(repository.create_version).toHaveBeenCalledWith(expect.objectContaining({
      data: { name: "Crème 2026 Q3", description: null, slug: "creme-2026-q3", release_date: null },
    }));
    expect(created.slug).toBe("creme-2026-q3");
  });

  it("rejects no-op and archived metadata updates", async () => {
    const active = setup();
    await expect(active.service.update({
      auth, project_id: "project_1", project_version_id: "version_1",
      data: { expected_version: 1, name: "Main" },
    })).rejects.toBeInstanceOf(ProjectVersionUnchangedError);

    const archived = setup([version({ status: "archived", is_default: false })]);
    await expect(archived.service.update({
      auth, project_id: "project_1", project_version_id: "version_1",
      data: { expected_version: 1, name: "Archived Main" },
    })).rejects.toBeInstanceOf(ProjectVersionArchivedError);
  });

  it("does not archive the Default Project Version", async () => {
    const { service } = setup();
    await expect(service.archive({
      auth, project_id: "project_1", project_version_id: "version_1",
      data: { expected_version: 1 },
    })).rejects.toBeInstanceOf(DefaultProjectVersionArchiveError);
  });

  it("requires reorder to contain every active Version exactly once", async () => {
    const { service } = setup([
      version(),
      version({ id: "version_2", slug: "next", name: "Next", position: 2, is_default: false }),
    ]);
    await expect(service.reorder({
      auth, project_id: "project_1",
      data: { project_versions: [{ id: "version_1", expected_version: 1 }] },
    })).rejects.toBeInstanceOf(InvalidProjectVersionOrderError);
  });
});
