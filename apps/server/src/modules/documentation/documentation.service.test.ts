import { describe, expect, it, vi } from "vitest";
import {
  DocumentationRowVersionConflictError,
  build_documentation_service,
} from "./documentation.service";

const page = {
  id: "page-a",
  title: "Home",
  canonical_path: "home",
  version: 1,
  blocks: [] as unknown[],
};

describe("Documentation service", () => {
  it("normalizes Site creation and delegates one atomic command", async () => {
    const create_site = vi.fn(async (input) => ({ id: "site", ...input }));
    const service = build_documentation_service({
      create_site,
      save_page: vi.fn(),
      create_revision: vi.fn(),
      prepare_publication: vi.fn(),
      switch_publication: vi.fn(),
      rollback_publication: vi.fn(),
    });

    await service.create_site({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      actor_org_user_id: "actor",
      idempotency_key: "key",
      data: {
        name: " API docs ",
        description: null,
        primary_language: "en-us",
        initial_home_page: { title: " Home ", path: "/Home/" },
      },
    });

    expect(create_site).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "API docs",
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      }),
    );
  });

  it("returns latest safe Page state on a stale independent Page save", async () => {
    const service = build_documentation_service({
      create_site: vi.fn(),
      save_page: vi.fn(async () => {
        throw new DocumentationRowVersionConflictError({
          ...page,
          version: 2,
        });
      }),
      create_revision: vi.fn(),
      prepare_publication: vi.fn(),
      switch_publication: vi.fn(),
      rollback_publication: vi.fn(),
    });

    await expect(
      service.save_page({
        organization_id: "org",
        project_id: "project",
        site_id: "site",
        page_id: "page-a",
        actor_org_user_id: "actor",
        expected_page_version: 1,
        blocks: [],
      }),
    ).rejects.toMatchObject({
      code: "documentation_row_version_conflict",
      latest_page: { id: "page-a", version: 2 },
    });
  });

  it("never switches a live link when Publication preparation fails", async () => {
    const switch_publication = vi.fn();
    const service = build_documentation_service({
      create_site: vi.fn(),
      save_page: vi.fn(),
      create_revision: vi.fn(async () => ({
        id: "revision-2",
        revision_number: 2,
      })),
      prepare_publication: vi.fn(async () => {
        throw new Error("injected preparation failure");
      }),
      switch_publication,
      rollback_publication: vi.fn(),
    });

    await expect(
      service.publish({
        organization_id: "org",
        project_id: "project",
        site_id: "site",
        site_edition_id: "edition",
        project_version_id: "version",
        actor_org_user_id: "actor",
        draft_state_token: "state",
        idempotency_key: "key",
      }),
    ).rejects.toMatchObject({
      code: "documentation_publication_preparation_failed",
    });
    expect(switch_publication).not.toHaveBeenCalled();
  });
});
