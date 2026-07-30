import { describe, expect, it, vi } from "vitest";
import { build_documentation_repository } from "./documentation.repository";

describe("Documentation repository", () => {
  it("creates Site, Edition, Working Draft, and Home Page atomically", async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);

    const result = await repository.create_site({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      actor_org_user_id: "actor",
      idempotency_key: "key",
      name: "Docs",
      description: null,
      primary_language: "en-US",
      initial_home_page: { title: "Home", path: "home" },
    });

    expect(statements[0]).toBe("BEGIN");
    expect(statements.some((sql) => sql.includes("documentation_site"))).toBe(
      true,
    );
    expect(statements.some((sql) => sql.includes("site_edition"))).toBe(true);
    expect(statements.some((sql) => sql.includes("site_working_draft"))).toBe(
      true,
    );
    expect(statements.some((sql) => sql.includes("documentation_page"))).toBe(
      true,
    );
    expect(statements.at(-1)).toBe("COMMIT");
    expect(result).toMatchObject({
      site: { name: "Docs" },
      edition: { primary_language: "en-US" },
      home_page: { canonical_path: "home" },
    });
  });

  it("rolls back the complete command when a child insert fails", async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        if (sql.includes("site_working_draft")) throw new Error("injected");
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    });

    await expect(
      repository.create_site({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        idempotency_key: "key",
        name: "Docs",
        description: null,
        primary_language: "en-US",
      }),
    ).rejects.toThrow("injected");
    expect(statements.at(-1)).toBe("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  it("rejects Page creation at the Edition hard ceiling", async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("SELECT edition.id edition_id"))
          return {
            rows: [{ edition_id: "edition", working_draft_id: "draft" }],
          };
        if (sql.includes("page_count"))
          return { rows: [{ page_count: 1_000 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);

    await expect(
      repository.create_page({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        site_id: "site",
        actor_org_user_id: "actor",
        idempotency_key: "key",
        data: {
          title: "Overflow",
          description: null,
          canonical_path: "overflow",
        },
      }),
    ).rejects.toMatchObject({ code: "documentation_page_limit_exceeded" });
    expect(
      client.query.mock.calls.some(([sql]) =>
        sql.includes("pg_advisory_xact_lock"),
      ),
    ).toBe(true);
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("rejects comment threads and replies at their hard ceilings", async () => {
    const buildRepository = (kind: "thread" | "reply") => {
      const client = {
        query: vi.fn(async (sql: string) => {
          if (sql.includes("FROM documentation_schema.documentation_page page"))
            return { rows: [{ site_edition_id: "edition" }] };
          if (sql.includes("FROM documentation_schema.comment_thread thread"))
            return { rows: [{ site_edition_id: "edition" }] };
          if (sql.includes("thread_count"))
            return { rows: [{ thread_count: 1_000 }] };
          if (sql.includes("reply_count"))
            return { rows: [{ reply_count: 500 }] };
          return { rows: [] };
        }),
        release: vi.fn(),
      };
      return {
        client,
        repository: build_documentation_repository({
          connect: vi.fn(async () => client),
          query: client.query,
        } as never),
        kind,
      };
    };
    const thread = buildRepository("thread");
    await expect(
      thread.repository.create_comment_thread({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        site_id: "site",
        page_id: "page",
        actor_org_user_id: "actor",
        idempotency_key: "thread-key",
        body: "Body",
        block_anchor_id: null,
        mentioned_project_membership_ids: [],
      }),
    ).rejects.toMatchObject({ code: "documentation_comment_limit_exceeded" });

    const reply = buildRepository("reply");
    await expect(
      reply.repository.create_comment_reply({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        site_id: "site",
        thread_id: "thread",
        actor_org_user_id: "actor",
        idempotency_key: "reply-key",
        body: "Body",
        mentioned_project_membership_ids: [],
      }),
    ).rejects.toMatchObject({ code: "documentation_comment_limit_exceeded" });
  });

  it("blocks new comment mutation when the owning Page is archived", async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("FROM documentation_schema.documentation_page page"))
          return {
            rows: [
              {
                site_edition_id: "edition",
                page_status: "archived",
                edition_status: "active",
              },
            ],
          };
        if (sql.includes("FROM documentation_schema.comment_thread thread"))
          return {
            rows: [
              {
                site_edition_id: "edition",
                page_status: "archived",
                edition_status: "active",
              },
            ],
          };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);
    const scope = {
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      site_id: "site",
      actor_org_user_id: "actor",
    };

    await expect(
      repository.create_comment_thread({
        ...scope,
        page_id: "page",
        idempotency_key: "thread-key",
        body: "Body",
        block_anchor_id: null,
        mentioned_project_membership_ids: [],
      }),
    ).rejects.toMatchObject({ code: "documentation_read_only" });
    await expect(
      repository.create_comment_reply({
        ...scope,
        thread_id: "thread",
        idempotency_key: "reply-key",
        body: "Body",
        mentioned_project_membership_ids: [],
      }),
    ).rejects.toMatchObject({ code: "documentation_read_only" });
  });

  it("filters Capture Asset choices by lifecycle and purge eligibility", async () => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      void sql;
      void values;
      return { rows: [] };
    });
    const repository = build_documentation_repository({
      connect: vi.fn(),
      query,
    } as never);

    await repository.list_assets({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      site_id: "site",
      source: "capture",
      status: "archived",
      include_archived_versions: false,
      include_in_use: true,
    });

    const [sql, parameters] = query.mock.calls[0]!;
    expect(sql).toContain("$4='active'");
    expect(sql).toContain("capture_asset_purge_operation");
    expect(sql).toContain("documentation_page_block");
    expect(sql).toContain("documentation_snippet_block");
    expect(parameters).toContain("archived");
    expect(parameters).toContain("site");
  });

  it("rejects Documentation Asset upload at the Edition hard ceiling", async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("SELECT id FROM documentation_schema.site_edition"))
          return { rows: [{ id: "edition" }] };
        if (sql.includes("asset_count"))
          return { rows: [{ asset_count: 2_000 }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);

    await expect(
      repository.create_asset({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        site_id: "site",
        actor_org_user_id: "actor",
        asset_id: "asset",
        file_id: "file",
        width: 1,
        height: 1,
        file: {
          storage_provider: "local",
          storage_key: "key",
          mime_type: "image/png",
          size_bytes: 1,
          original_name: "image.png",
          checksum_sha256: "digest",
        },
      }),
    ).rejects.toMatchObject({ code: "documentation_asset_limit_exceeded" });
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(
      client.query.mock.calls.some(([sql]) =>
        sql.includes("INSERT INTO file_schema.file"),
      ),
    ).toBe(false);
  });

  it("persists a protected actor-bound import inspection atomically", async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        if (sql.includes("FROM organization_schema.org_user"))
          return {
            rows: [
              {
                actor_label: "Editor",
                source_type: "web",
              },
            ],
          };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);

    const result = await repository.create_import_inspection({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      actor_org_user_id: "actor",
      idempotency_key: "inspect-1",
      inspection_id: "inspection",
      file_id: "file",
      kind: "page_markdown",
      source_file: {
        storage_provider: "local",
        storage_key:
          "organizations/org/projects/project/documentation-import-inspections/inspection/source.md",
        mime_type: "text/markdown",
        size_bytes: 8,
        checksum_sha256: "a".repeat(64),
      },
      content_fingerprint: "b".repeat(64),
      safe_report: { proposal: { title: "Start" } },
      expires_at: new Date("2026-07-30T18:00:00.000Z"),
    });

    expect(statements[0]).toBe("BEGIN");
    expect(
      statements.some((sql) => sql.includes("INSERT INTO file_schema.file")),
    ).toBe(true);
    expect(
      statements.some((sql) =>
        sql.includes(
          "INSERT INTO documentation_schema.documentation_import_inspection",
        ),
      ),
    ).toBe(true);
    expect(statements.at(-1)).toBe("COMMIT");
    expect(result).toMatchObject({
      id: "inspection",
      status: "ready",
      created_by_id: "actor",
    });
  });

  it("never returns an import inspection created by another actor", async () => {
    const query = vi.fn(async (sql: string) => {
      expect(sql).toContain("inspection.created_by_id=$5");
      return { rows: [] };
    });
    const repository = build_documentation_repository({
      connect: vi.fn(),
      query,
    } as never);
    await expect(
      repository.get_import_inspection({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        inspection_id: "inspection",
      }),
    ).resolves.toBeNull();
  });

  it("cancels only the creator's ready inspection in one audited transaction", async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        if (sql.includes("FROM organization_schema.org_user"))
          return {
            rows: [{ actor_label: "Editor", source_type: "web" }],
          };
        if (sql.includes("FOR UPDATE OF inspection"))
          return {
            rows: [
              {
                id: "inspection",
                status: "ready",
                version: 1,
                created_by_id: "actor",
                source_file_id: "file",
                source_file_version: 1,
              },
            ],
          };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);
    await expect(
      repository.cancel_import_inspection({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        idempotency_key: "cancel-1",
        inspection_id: "inspection",
      }),
    ).resolves.toMatchObject({ status: "cancelled" });
    expect(
      statements.some(
        (sql) =>
          sql.includes("created_by_id=$5") &&
          sql.includes("FOR UPDATE OF inspection"),
      ),
    ).toBe(true);
    expect(
      statements.some((sql) =>
        sql.includes("SET status='cancelled',cancelled_at=CURRENT_TIMESTAMP"),
      ),
    ).toBe(true);
    expect(statements.at(-1)).toBe("COMMIT");
  });

  it("applies inspected Markdown as one Page and consumes the source atomically", async () => {
    const statements: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        if (sql.includes("FROM organization_schema.org_user"))
          return { rows: [{ actor_label: "Editor", source_type: "web" }] };
        if (sql.includes("FROM documentation_schema.site_edition edition"))
          return {
            rows: [
              {
                edition_id: "edition",
                working_draft_id: "draft",
                draft_version: 3,
                home_page_id: null,
              },
            ],
          };
        if (sql.includes("FOR UPDATE OF inspection"))
          return {
            rows: [
              {
                id: "inspection",
                kind: "page_markdown",
                status: "ready",
                version: 1,
                source_file_id: "source-file",
                source_file_version: 1,
                source_digest: "a".repeat(64),
                content_fingerprint: "b".repeat(64),
                expires_at: new Date("2099-01-01T00:00:00.000Z"),
              },
            ],
          };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_repository({
      connect: vi.fn(async () => client),
      query: client.query,
    } as never);

    await expect(
      repository.apply_markdown_import({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        idempotency_key: "apply-1",
        inspection_id: "inspection",
        content_fingerprint: "b".repeat(64),
        site_id: "site",
        expected_draft_version: 3,
        title: "Start",
        canonical_path: "start",
        set_as_home: true,
        blocks: [
          {
            id: "01K00000000000000000000100",
            kind: "paragraph",
            position: 1,
            text: "Hello",
          },
        ],
      }),
    ).resolves.toMatchObject({
      inspection_id: "inspection",
      target_site_id: "site",
      created_page_id: expect.any(String),
    });
    expect(
      statements.some((sql) =>
        sql.includes("INSERT INTO documentation_schema.documentation_page"),
      ),
    ).toBe(true);
    expect(
      statements.some((sql) =>
        sql.includes(
          "INSERT INTO documentation_schema.documentation_import_application",
        ),
      ),
    ).toBe(true);
    expect(
      statements.some((sql) => sql.includes("SET status='consumed'")),
    ).toBe(true);
    expect(statements.at(-1)).toBe("COMMIT");
  });
});
