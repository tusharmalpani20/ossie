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
    });

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
});
