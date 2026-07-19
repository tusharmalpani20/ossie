import { get_migrator } from "./migrator";
import {
  verify_audit_core_schema,
  verify_audit_schema,
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
        const comprehensive = executed.some(
          ({ name }) => name === "016_existing_mutation_audit_coverage.sql",
        );
        await (comprehensive ? verify_audit_schema : verify_audit_core_schema)(
          pool,
          roles,
        );
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
              ({ name }) => name === "016_existing_mutation_audit_coverage.sql",
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
