import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AUDIT_COMMANDS,
  AUDIT_COVERAGE_REGISTRY,
  find_audit_command,
} from "./audit-coverage-registry";

describe("audit coverage registry", () => {
  it("registers every current semantic mutation command", () => {
    expect(AUDIT_COVERAGE_REGISTRY).toHaveLength(84);
    expect(
      new Set(AUDIT_COVERAGE_REGISTRY.map(({ command }) => command)).size,
    ).toBe(84);
    expect(AUDIT_COMMANDS).toContain("setup.complete_first_run");
    expect(AUDIT_COMMANDS).toContain("guide.block.screenshot_upload");
    expect(AUDIT_COMMANDS).toContain("publish.viewer_session.touch");
    expect(AUDIT_COMMANDS).toContain("project.membership.assign");
    expect(AUDIT_COMMANDS).toContain("project_version.create");
    expect(AUDIT_COMMANDS).toContain("project_version.set_default");
    expect(AUDIT_COMMANDS).toContain("guide.revision.checkpoint");
    expect(AUDIT_COMMANDS).toContain("artifact.carry_forward");
    expect(AUDIT_COMMANDS).toContain("capture_asset.purge.complete");
  });

  it("covers all product tables and the relational Publish Link DELETE boundary", () => {
    const writes = AUDIT_COVERAGE_REGISTRY.flatMap(({ writes }) => writes);
    expect(new Set(writes.map(({ table }) => table)).size).toBe(43);
    expect(
      new Set(
        writes.map(({ table, sql_operation }) => `${table}:${sql_operation}`),
      ).size,
    ).toBe(67);
    expect(
      writes
        .filter(({ sql_operation }) => sql_operation === "DELETE")
        .map(({ table }) => table),
    ).toEqual([
      "publish_schema.publish_link_entry",
      "publish_schema.publish_link_entry",
    ]);
  });

  it("keeps public viewer maintenance system-only and normal commands org-user-only", () => {
    expect(find_audit_command("publish.viewer_session.create")).toMatchObject({
      actor_types: ["system"],
      source_types: ["system"],
    });
    expect(find_audit_command("project.create")).toMatchObject({
      actor_types: ["org_user"],
    });
    expect(find_audit_command("project_version.create")).toMatchObject({
      actor_types: ["org_user"],
      source_types: ["web", "api"],
    });
    expect(() => find_audit_command("missing.command")).toThrowError(
      /unknown_audit_command/,
    );
  });

  it("allows persisted import provenance for Capture ingestion commands", () => {
    const capture_commands = AUDIT_COVERAGE_REGISTRY.filter(
      ({ command }) =>
        command.startsWith("capture_") &&
        !command.startsWith("capture_asset.archive") &&
        !command.startsWith("capture_asset.restore") &&
        !command.startsWith("capture_asset.purge"),
    );

    expect(capture_commands).not.toHaveLength(0);
    expect(
      capture_commands.every(({ source_types }) =>
        source_types.includes("import"),
      ),
    ).toBe(true);
    expect(
      find_audit_command("guide.block.screenshot_upload").source_types,
    ).toContain("import");
  });

  it("models status and revocation timestamp changes as updates, not row deletion", () => {
    for (const command of [
      "authentication.session.revoke",
      "organization.invite.revoke",
      "publish.guide_link.revoke",
      "publish.interactive_demo_link.revoke",
      "publish.guide_link.settings_update",
      "publish.interactive_demo_link.settings_update",
    ]) {
      expect(
        find_audit_command(command).writes.every(({ evidence_operations }) =>
          evidence_operations.includes("update"),
        ),
      ).toBe(true);
    }
  });

  it("declares every table touched by multi-table atomic commands", () => {
    expect(
      find_audit_command("setup.complete_first_run").writes.map(
        ({ table }) => table,
      ),
    ).toEqual([
      "user_schema.user",
      "organization_schema.organization",
      "organization_schema.org_user",
      "auth_schema.auth_session",
    ]);
    expect(
      find_audit_command("guide.block.screenshot_upload").writes.map(
        ({ table }) => table,
      ),
    ).toEqual(
      expect.arrayContaining([
        "file_schema.file",
        "capture_schema.capture_asset",
        "guide_schema.guide_step",
        "guide_schema.guide_working_draft",
      ]),
    );
  });

  it("keeps the database command/action policy synchronized with the registry", () => {
    const migration_016 = readFileSync(
      new URL(
        "../../db/migrations/016_existing_mutation_audit_coverage.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_019 = readFileSync(
      new URL(
        "../../db/migrations/019_project_membership_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_020 = readFileSync(
      new URL(
        "../../db/migrations/020_project_version_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_021 = readFileSync(
      new URL(
        "../../db/migrations/021_capture_source_version_scoping.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_022 = readFileSync(
      new URL(
        "../../db/migrations/022_guide_demo_edition_working_draft_relational_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_023 = readFileSync(
      new URL(
        "../../db/migrations/023_guide_demo_revision_carry_forward_protected_assets.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_024 = readFileSync(
      new URL(
        "../../db/migrations/024_revision_backed_publication_and_publish_link_manifests.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_025 = readFileSync(
      new URL(
        "../../db/migrations/025_documentation_site_first_vertical_slice.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const policy_start = migration_016.indexOf("FROM (VALUES");
    const policy_end = migration_016.indexOf(") AS policy(command, action)");
    const new_policy_start = migration_019.indexOf(
      "(selected_command, selected_action) IN (",
    );
    const new_policy_end = migration_019.indexOf(
      "AND selected_actor_type",
      new_policy_start,
    );
    const version_policy_start = migration_020.indexOf(
      "(selected_command, selected_action) IN (",
    );
    const version_policy_end = migration_020.indexOf(
      "AND selected_actor_type",
      version_policy_start,
    );
    const policy = `${migration_016.slice(policy_start, policy_end)}\n${migration_019.slice(new_policy_start, new_policy_end)}\n${migration_020.slice(version_policy_start, version_policy_end)}\n${migration_021}\n${migration_022}\n${migration_023}\n${migration_024}\n${migration_025}`;
    const pairs = [...policy.matchAll(/\('([^']+)',\s*'([^']+)'\)/gu)]
      .map(([, command, action]) => ({ command, action }))
      .filter(({ command }) =>
        AUDIT_COMMANDS.includes(command as (typeof AUDIT_COMMANDS)[number]),
      );
    const current_pairs = [
      ...new Map(pairs.map((pair) => [pair.command, pair])).values(),
    ];

    expect(
      [...current_pairs].sort((left, right) =>
        (left.command ?? "").localeCompare(right.command ?? ""),
      ),
    ).toEqual(
      AUDIT_COVERAGE_REGISTRY.map(({ command, action }) => ({
        command,
        action,
      })).sort((left, right) => left.command.localeCompare(right.command)),
    );
  });

  it("keeps migration trigger command arguments synchronized with registry order", () => {
    const migration_016 = readFileSync(
      new URL(
        "../../db/migrations/016_existing_mutation_audit_coverage.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const expected = new Map<string, string[]>();
    for (const registration of AUDIT_COVERAGE_REGISTRY) {
      for (const write of registration.writes) {
        const key = `${write.table}:${write.sql_operation}`;
        const commands = expected.get(key) ?? [];
        if (!commands.includes(registration.command))
          commands.push(registration.command);
        expected.set(key, commands);
      }
    }
    const migration_019 = readFileSync(
      new URL(
        "../../db/migrations/019_project_membership_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_020 = readFileSync(
      new URL(
        "../../db/migrations/020_project_version_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_022 = readFileSync(
      new URL(
        "../../db/migrations/022_guide_demo_edition_working_draft_relational_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_023 = readFileSync(
      new URL(
        "../../db/migrations/023_guide_demo_revision_carry_forward_protected_assets.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_024 = readFileSync(
      new URL(
        "../../db/migrations/024_revision_backed_publication_and_publish_link_manifests.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_025 = readFileSync(
      new URL(
        "../../db/migrations/025_documentation_site_first_vertical_slice.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const rows = [
      ...`${migration_016}\n${migration_019}\n${migration_020}\n${migration_022}`.matchAll(
        /\('([^']+)', '([^']+)', '(INSERT|UPDATE)', '[^']+', '[^']+', '([^']+)'\)/gu,
      ),
      ...migration_023.matchAll(
        /\('([^']+)', '([^']+)', '(INSERT|UPDATE)', '[^']+', '([^']+)'\)/gu,
      ),
    ];
    const actual = new Map(
      rows.map(([, schema, table, operation, commands]) => [
        `${schema}.${table}:${operation}`,
        commands!.split(","),
      ]),
    );
    actual.set("project_schema.project_membership:INSERT", [
      "project.create",
      "project.membership.assign",
    ]);
    actual.set("project_schema.project_membership:UPDATE", [
      "project.membership.assign",
      "project.membership.role_change",
      "project.membership.remove",
    ]);
    actual.set("project_schema.project:UPDATE", [
      "project_version.set_default",
      "project.update",
      "project.delete",
    ]);
    actual.set("project_schema.project_version:INSERT", [
      "project.create",
      "project_version.create",
    ]);
    actual.set("project_schema.project_version:UPDATE", [
      "project_version.update",
      "project_version.reorder",
      "project_version.archive",
      "project_version.restore",
    ]);
    actual.set("project_schema.project_version_alias:INSERT", [
      "project_version.update",
    ]);
    actual.set("capture_schema.capture_session:UPDATE", [
      "capture_session.update",
      "capture_session.complete",
      "capture_session.delete",
      "capture_session.reassign_project_version",
    ]);
    actual.delete("guide_schema.guide:UPDATE");
    actual.delete("interactive_demo_schema.interactive_demo:UPDATE");
    for (const key of [...actual.keys()]) {
      if (
        key.startsWith("guide_schema.") ||
        key.startsWith("interactive_demo_schema.")
      )
        actual.delete(key);
    }
    for (const [
      ,
      schema,
      table,
      operation,
      ,
      commands,
    ] of migration_022.matchAll(
      /\('([^']+)', '([^']+)', '(INSERT|UPDATE)', '([^']+)', '([^']+)'\)/gu,
    )) {
      actual.set(`${schema}.${table}:${operation}`, commands!.split(","));
    }
    const migration_023_up =
      migration_023.split("-- DOWN:")[0] ?? migration_023;
    for (const [
      ,
      schema,
      table,
      operation,
      commands,
    ] of migration_023_up.matchAll(
      /\('([^']+)', '([^']+)', '(INSERT|UPDATE)', '[^']+', '([^']+)'\)/gu,
    )) {
      actual.set(`${schema}.${table}:${operation}`, commands!.split(","));
    }
    const migration_024_up =
      migration_024.split("-- DOWN:")[0] ?? migration_024;
    for (const [, table, operation, , commands] of migration_024_up.matchAll(
      /\('([^']+)',\s*'(INSERT|UPDATE)',\s*'([^']+)',\s*'([^']+)'\)/gu,
    )) {
      actual.set(`publish_schema.${table}:${operation}`, commands!.split(","));
    }
    for (const [, schema, table, , commands] of migration_024_up.matchAll(
      /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/gu,
    )) {
      if (schema?.endsWith("_schema"))
        actual.set(`${schema}.${table}:INSERT`, commands!.split(","));
    }
    actual.set("publish_schema.publish_link_entry:DELETE", [
      "publish.guide_link.manifest_update",
      "publish.interactive_demo_link.manifest_update",
    ]);
    const migration_025_up =
      migration_025.split("-- DOWN:")[0] ?? migration_025;
    for (const [table, operation, triggerName] of [
      ["publish_link", "INSERT", "publish_link_i_audit_ctx"],
      ["publish_link", "UPDATE", "publish_link_u_audit_ctx"],
      ["publish_link_entry", "INSERT", "publish_link_entry_i_audit_ctx"],
      ["publish_link_entry", "UPDATE", "publish_link_entry_u_audit_ctx"],
      ["file", "INSERT", "file_i_audit_ctx"],
      [
        "documentation_asset",
        "INSERT",
        "documentation_asset_i_audit_ctx",
      ],
    ] as const) {
      const triggerStart = migration_025_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_025_up.indexOf(");", triggerStart);
      const triggerDefinition = migration_025_up.slice(
        triggerStart,
        triggerEnd,
      );
      const commandArgument = [...triggerDefinition.matchAll(/'([^']+)'/gu)].at(
        -1,
      )?.[1];
      actual.set(
        `${
          table === "file"
            ? "file_schema"
            : table === "documentation_asset"
              ? "documentation_schema"
              : "publish_schema"
        }.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    actual.delete("publish_schema.published_artifact_capture_asset:INSERT");

    expect(actual).toEqual(expected);
  });
});
