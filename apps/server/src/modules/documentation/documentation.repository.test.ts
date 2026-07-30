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
});
