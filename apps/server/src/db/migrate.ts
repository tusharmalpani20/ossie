import { get_migrator } from "./migrator";

const command = process.argv[2];
const target = process.argv[3];

const run = async () => {
  const { pool, umzug } = get_migrator();
  try {
    if (command === "up") await umzug.up(target ? { to: target } : undefined);
    else if (command === "down") await umzug.down(target ? { to: target } : undefined);
    else if (command === "status") {
      const [executed, pending] = await Promise.all([umzug.executed(), umzug.pending()]);
      console.info(JSON.stringify({ executed, pending: pending.map((migration) => migration.name) }, null, 2));
    } else throw new Error("Usage: migrate.ts up|down|status [target]");
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error("Migration command failed", error instanceof Error ? error.message : "unknown_error");
  process.exitCode = 1;
});
