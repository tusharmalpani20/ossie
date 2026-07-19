import { get_migrator } from "./migrator";
import {
  verify_audit_core_schema,
  verify_audit_schema,
  verify_artifact_edition_schema,
  verify_artifact_revision_schema,
  verify_evidence_schema,
  verify_project_membership_schema,
  verify_project_version_schema,
} from "./audit-schema-verification";

const command = process.argv[2];
const target = process.argv[3];

const run = async () => {
  const { pool, umzug } = get_migrator();
  const roles = {
    runtime_role: process.env.DB_USER ?? "",
    maintenance_role: process.env.DB_MAINTENANCE_USER ?? "",
  };
  try {
    if (command === "up") {
      await umzug.up(target ? { to: target } : undefined);
      const executed = await umzug.executed();
      if (executed.some(({ name }) => name === "015_audit_evidence_core.sql")) {
        const access_evidence = executed.some(
          ({ name }) =>
            name === "017_access_evidence_and_compliance_timelines.sql",
        );
        const comprehensive = executed.some(
          ({ name }) => name === "016_existing_mutation_audit_coverage.sql",
        );
        const project_membership = executed.some(
          ({ name }) => name === "019_project_membership_foundation.sql",
        );
        const project_version = executed.some(
          ({ name }) => name === "020_project_version_foundation.sql",
        );
        const artifact_edition = executed.some(
          ({ name }) =>
            name ===
            "022_guide_demo_edition_working_draft_relational_foundation.sql",
        );
        const artifact_revision = executed.some(
          ({ name }) =>
            name ===
            "023_guide_demo_revision_carry_forward_protected_assets.sql",
        );
        await (
          artifact_revision
            ? verify_artifact_revision_schema
            : artifact_edition
              ? verify_artifact_edition_schema
              : project_version
                ? verify_project_version_schema
                : project_membership
                  ? verify_project_membership_schema
                  : access_evidence
                    ? verify_evidence_schema
                    : comprehensive
                      ? verify_audit_schema
                      : verify_audit_core_schema
        )(pool, roles);
      }
    } else if (command === "down")
      await umzug.down(target ? { to: target } : undefined);
    else if (command === "status") {
      const [executed, pending] = await Promise.all([
        umzug.executed(),
        umzug.pending(),
      ]);
      const audit_schema = executed.some(
        ({ name }) => name === "015_audit_evidence_core.sql",
      )
        ? await (
            executed.some(
              ({ name }) =>
                name ===
                "023_guide_demo_revision_carry_forward_protected_assets.sql",
            )
              ? verify_artifact_revision_schema
              : executed.some(
                    ({ name }) =>
                      name ===
                      "022_guide_demo_edition_working_draft_relational_foundation.sql",
                  )
                ? verify_artifact_edition_schema
                : executed.some(
                      ({ name }) =>
                        name === "020_project_version_foundation.sql",
                    )
                  ? verify_project_version_schema
                  : executed.some(
                        ({ name }) =>
                          name === "019_project_membership_foundation.sql",
                      )
                    ? verify_project_membership_schema
                    : executed.some(
                          ({ name }) =>
                            name ===
                            "017_access_evidence_and_compliance_timelines.sql",
                        )
                      ? verify_evidence_schema
                      : executed.some(
                            ({ name }) =>
                              name ===
                              "016_existing_mutation_audit_coverage.sql",
                          )
                        ? verify_audit_schema
                        : verify_audit_core_schema
          )(pool, roles)
        : { status: "not_installed" as const };
      console.info(
        JSON.stringify(
          {
            executed,
            pending: pending.map((migration) => migration.name),
            audit_schema,
          },
          null,
          2,
        ),
      );
    } else throw new Error("Usage: migrate.ts up|down|status [target]");
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error(
    "Migration command failed",
    error instanceof Error ? error.message : "unknown_error",
  );
  process.exitCode = 1;
});
