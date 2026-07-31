import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AUDIT_COMMANDS,
  AUDIT_COVERAGE_REGISTRY,
  find_audit_command,
} from "./audit-coverage-registry";

describe("audit coverage registry", () => {
  it("registers every current semantic mutation command", () => {
    expect(AUDIT_COVERAGE_REGISTRY).toHaveLength(134);
    expect(
      new Set(AUDIT_COVERAGE_REGISTRY.map(({ command }) => command)).size,
    ).toBe(134);
    expect(AUDIT_COMMANDS).toContain("setup.complete_first_run");
    expect(AUDIT_COMMANDS).toContain("guide.block.screenshot_upload");
    expect(AUDIT_COMMANDS).toContain("publish.viewer_session.touch");
    expect(AUDIT_COMMANDS).toContain("project.membership.assign");
    expect(AUDIT_COMMANDS).toContain("project_version.create");
    expect(AUDIT_COMMANDS).toContain("project_version.set_default");
    expect(AUDIT_COMMANDS).toContain("guide.revision.checkpoint");
    expect(AUDIT_COMMANDS).toContain("artifact.carry_forward");
    expect(AUDIT_COMMANDS).toContain("capture_asset.purge.complete");
    expect(AUDIT_COMMANDS).toContain("documentation.site.create");
    expect(AUDIT_COMMANDS).toContain("documentation.revision.create");
    expect(AUDIT_COMMANDS).toContain("documentation.snippet.content_replace");
    expect(AUDIT_COMMANDS).toContain("documentation.asset.archive");
    expect(AUDIT_COMMANDS).toContain("documentation.import.inspect");
    expect(AUDIT_COMMANDS).toContain(
      "documentation.page_markdown_import.apply",
    );
    expect(AUDIT_COMMANDS).toContain("documentation.site_package_import.apply");
    expect(AUDIT_COMMANDS).toContain("documentation.import.cancel");
    expect(AUDIT_COMMANDS).toContain("documentation.import.expire");
    expect(AUDIT_COMMANDS).toContain("documentation.carry_forward");
    expect(AUDIT_COMMANDS).toContain("documentation.edition.archive");
    expect(AUDIT_COMMANDS).toContain(
      "documentation.openapi_try_it_policy.create",
    );
    expect(AUDIT_COMMANDS).toContain(
      "documentation.publish_link_try_it_policy.enable",
    );
  });

  it("covers all product tables and the relational Publish Link DELETE boundary", () => {
    const writes = AUDIT_COVERAGE_REGISTRY.flatMap(({ writes }) => writes);
    expect(new Set(writes.map(({ table }) => table)).size).toBe(68);
    expect(
      new Set(
        writes.map(({ table, sql_operation }) => `${table}:${sql_operation}`),
      ).size,
    ).toBe(107);
    expect(
      writes
        .filter(({ sql_operation }) => sql_operation === "DELETE")
        .map(({ table }) => table),
    ).toEqual([
      "documentation_schema.documentation_page",
      "documentation_schema.documentation_review_maintainer",
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
    const migration_026 = readFileSync(
      new URL(
        "../../db/migrations/026_documentation_content_snippets_and_asset_workflows.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_027 = readFileSync(
      new URL(
        "../../db/migrations/027_documentation_import_export_portability.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_028 = readFileSync(
      new URL(
        "../../db/migrations/028_documentation_carry_forward_multi_site_lifecycle.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_029 = readFileSync(
      new URL(
        "../../db/migrations/029_documentation_review_and_approval_workflow.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_030 = readFileSync(
      new URL(
        "../../db/migrations/030_documentation_api_try_it.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_031 = readFileSync(
      new URL(
        "../../db/migrations/031_documentation_v1_operational_hardening.sql",
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
    const policy = `${migration_016.slice(policy_start, policy_end)}\n${migration_019.slice(new_policy_start, new_policy_end)}\n${migration_020.slice(version_policy_start, version_policy_end)}\n${migration_021}\n${migration_022}\n${migration_023}\n${migration_024}\n${migration_025}\n${migration_026}\n${migration_027}\n${migration_028}\n${migration_029}\n${migration_030}\n${migration_031}`;
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
    const migration_026 = readFileSync(
      new URL(
        "../../db/migrations/026_documentation_content_snippets_and_asset_workflows.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_027 = readFileSync(
      new URL(
        "../../db/migrations/027_documentation_import_export_portability.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_028 = readFileSync(
      new URL(
        "../../db/migrations/028_documentation_carry_forward_multi_site_lifecycle.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_029 = readFileSync(
      new URL(
        "../../db/migrations/029_documentation_review_and_approval_workflow.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_030 = readFileSync(
      new URL(
        "../../db/migrations/030_documentation_api_try_it.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const migration_031 = readFileSync(
      new URL(
        "../../db/migrations/031_documentation_v1_operational_hardening.sql",
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
      [
        "public_publish_viewer_session",
        "UPDATE",
        "public_publish_viewer_session_u_audit_ctx",
      ],
      ["file", "INSERT", "file_i_audit_ctx"],
      ["documentation_asset", "INSERT", "documentation_asset_i_audit_ctx"],
      ["documentation_site", "INSERT", "documentation_site_i_audit_ctx"],
      ["documentation_page", "INSERT", "documentation_page_i_audit_ctx"],
      ["documentation_page", "UPDATE", "documentation_page_u_audit_ctx"],
      ["navigation_tree", "UPDATE", "navigation_tree_u_audit_ctx"],
      ["routing_set", "UPDATE", "routing_set_u_audit_ctx"],
      ["comment_thread", "INSERT", "comment_thread_i_audit_ctx"],
      ["comment_thread", "UPDATE", "comment_thread_u_audit_ctx"],
      ["comment_reply", "INSERT", "comment_reply_i_audit_ctx"],
      ["openapi_source", "INSERT", "openapi_source_i_audit_ctx"],
      ["openapi_source", "UPDATE", "openapi_source_u_audit_ctx"],
      ["site_revision", "INSERT", "site_revision_i_audit_ctx"],
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
            : table === "documentation_asset" ||
                table === "documentation_site" ||
                table === "documentation_page" ||
                table === "navigation_tree" ||
                table === "routing_set" ||
                table === "comment_thread" ||
                table === "comment_reply" ||
                table === "openapi_source" ||
                table === "site_revision"
              ? "documentation_schema"
              : "publish_schema"
        }.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    const migration_029_up =
      migration_029.split("-- DOWN:")[0] ?? migration_029;
    for (const [schema, table, operation, triggerName] of [
      [
        "documentation_schema",
        "documentation_review_policy",
        "INSERT",
        "documentation_review_policy_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_policy",
        "UPDATE",
        "documentation_review_policy_u_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_maintainer",
        "INSERT",
        "documentation_review_maintainer_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_maintainer",
        "DELETE",
        "documentation_review_maintainer_d_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_request",
        "INSERT",
        "documentation_review_request_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_request",
        "UPDATE",
        "documentation_review_request_u_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_assignment",
        "INSERT",
        "documentation_review_assignment_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_decision",
        "INSERT",
        "documentation_review_decision_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_notification",
        "INSERT",
        "documentation_review_notification_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_review_notification",
        "UPDATE",
        "documentation_review_notification_u_audit_ctx",
      ],
      [
        "publish_schema",
        "documentation_publication_review_evidence",
        "INSERT",
        "documentation_publication_review_evidence_i_audit_ctx",
      ],
    ] as const) {
      const triggerStart = migration_029_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_029_up.indexOf(");", triggerStart);
      const commandArgument = [
        ...migration_029_up
          .slice(triggerStart, triggerEnd)
          .matchAll(/'([^']+)'/gu),
      ].at(-1)?.[1];
      actual.set(
        `${schema}.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    const migration_031_up =
      migration_031.split("-- DOWN:")[0] ?? migration_031;
    for (const [schema, table, operation, triggerName] of [
      [
        "documentation_schema",
        "organization_documentation_limits",
        "INSERT",
        "organization_documentation_limits_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "organization_documentation_limits",
        "UPDATE",
        "organization_documentation_limits_u_audit_ctx",
      ],
      [
        "publish_schema",
        "documentation_discovery_policy",
        "INSERT",
        "documentation_discovery_policy_i_audit_ctx",
      ],
      [
        "publish_schema",
        "documentation_discovery_policy",
        "UPDATE",
        "documentation_discovery_policy_u_audit_ctx",
      ],
    ] as const) {
      const triggerStart = migration_031_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_031_up.indexOf(");", triggerStart);
      const commandArgument = [
        ...migration_031_up
          .slice(triggerStart, triggerEnd)
          .matchAll(/'([^']+)'/gu),
      ].at(-1)?.[1];
      actual.set(
        `${schema}.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    const migration_027_up =
      migration_027.split("-- DOWN:")[0] ?? migration_027;
    for (const [schema, table, operation, triggerName] of [
      ["file_schema", "file", "INSERT", "file_i_audit_ctx"],
      ["file_schema", "file", "UPDATE", "file_u_audit_ctx"],
      [
        "documentation_schema",
        "documentation_asset",
        "INSERT",
        "documentation_asset_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_site",
        "INSERT",
        "documentation_site_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_page",
        "INSERT",
        "documentation_page_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_page",
        "DELETE",
        "documentation_page_d_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_snippet",
        "INSERT",
        "documentation_snippet_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "navigation_tree",
        "UPDATE",
        "navigation_tree_u_audit_ctx",
      ],
      [
        "documentation_schema",
        "routing_set",
        "UPDATE",
        "routing_set_u_audit_ctx",
      ],
      [
        "documentation_schema",
        "openapi_source",
        "INSERT",
        "openapi_source_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_import_inspection",
        "INSERT",
        "documentation_import_inspection_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_import_inspection",
        "UPDATE",
        "documentation_import_inspection_u_audit_ctx",
      ],
      [
        "documentation_schema",
        "documentation_import_application",
        "INSERT",
        "documentation_import_application_i_audit_ctx",
      ],
    ] as const) {
      const triggerStart = migration_027_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_027_up.indexOf(");", triggerStart);
      const commandArgument = [
        ...migration_027_up
          .slice(triggerStart, triggerEnd)
          .matchAll(/'([^']+)'/gu),
      ].at(-1)?.[1];
      actual.set(
        `${schema}.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    const migration_026_up =
      migration_026.split("-- DOWN:")[0] ?? migration_026;
    for (const [table, operation, triggerName] of [
      ["documentation_snippet", "UPDATE", "documentation_snippet_u_audit_ctx"],
      ["documentation_asset", "UPDATE", "documentation_asset_u_audit_ctx"],
    ] as const) {
      const triggerStart = migration_026_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_026_up.indexOf(");", triggerStart);
      const commandArgument = [
        ...migration_026_up
          .slice(triggerStart, triggerEnd)
          .matchAll(/'([^']+)'/gu),
      ].at(-1)?.[1];
      actual.set(
        `documentation_schema.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    const migration_028_up =
      migration_028.split("-- DOWN:")[0] ?? migration_028;
    for (const [table, operation, triggerName] of [
      [
        "documentation_carry_forward",
        "INSERT",
        "documentation_carry_forward_i_audit_ctx",
      ],
      [
        "documentation_carry_forward_item",
        "INSERT",
        "documentation_carry_forward_item_i_audit_ctx",
      ],
      ["site_revision", "INSERT", "site_revision_i_audit_ctx"],
      ["documentation_page", "INSERT", "documentation_page_i_audit_ctx"],
      ["documentation_snippet", "INSERT", "documentation_snippet_i_audit_ctx"],
      ["documentation_asset", "INSERT", "documentation_asset_i_audit_ctx"],
      ["openapi_source", "INSERT", "openapi_source_i_audit_ctx"],
      ["site_edition", "UPDATE", "site_edition_u_audit_ctx"],
      ["documentation_page", "UPDATE", "documentation_page_u_audit_ctx"],
      ["openapi_source", "UPDATE", "openapi_source_u_audit_ctx"],
      ["navigation_tree", "UPDATE", "navigation_tree_u_audit_ctx"],
      ["routing_set", "UPDATE", "routing_set_u_audit_ctx"],
    ] as const) {
      const triggerStart = migration_028_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_028_up.indexOf(");", triggerStart);
      const commandArgument = [
        ...migration_028_up
          .slice(triggerStart, triggerEnd)
          .matchAll(/'([^']+)'/gu),
      ].at(-1)?.[1];
      actual.set(
        `documentation_schema.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    const migration_030_up =
      migration_030.split("-- DOWN:")[0] ?? migration_030;
    for (const [schema, table, operation, triggerName] of [
      [
        "documentation_schema",
        "openapi_try_it_policy",
        "INSERT",
        "openapi_try_it_policy_i_audit_ctx",
      ],
      [
        "documentation_schema",
        "openapi_try_it_policy",
        "UPDATE",
        "openapi_try_it_policy_u_audit_ctx",
      ],
      [
        "publish_schema",
        "documentation_try_it_policy",
        "INSERT",
        "documentation_try_it_policy_i_audit_ctx",
      ],
      [
        "publish_schema",
        "documentation_try_it_policy",
        "UPDATE",
        "documentation_try_it_policy_u_audit_ctx",
      ],
    ] as const) {
      const triggerStart = migration_030_up.indexOf(
        `CREATE TRIGGER ${triggerName}`,
      );
      const triggerEnd = migration_030_up.indexOf(");", triggerStart);
      const commandArgument = [
        ...migration_030_up
          .slice(triggerStart, triggerEnd)
          .matchAll(/'([^']+)'/gu),
      ].at(-1)?.[1];
      actual.set(
        `${schema}.${table}:${operation}`,
        commandArgument?.split(",") ?? [],
      );
    }
    actual.delete("publish_schema.published_artifact_capture_asset:INSERT");

    expect(actual).toEqual(expected);
  });
});
