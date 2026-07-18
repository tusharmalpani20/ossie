import pg from "pg";
import { get_maintenance_admin_config } from "../config/maintenance-database.config";
import { quote_database_identifier } from "./identifier";

const db_name = process.env.DB_NAME;
const node_env = process.env.NODE_ENV;
const dev_type = process.env.DEV_TYPE;

const is_testing_runtime = node_env === "test" || node_env === "testing" || dev_type === "testing";
const is_test_database_name = Boolean(
  db_name && (db_name.endsWith("_test") || db_name.startsWith("test-") || db_name.startsWith("test_"))
);

if (!db_name) {
  console.error("DB_NAME is not set in environment variables");
  process.exit(1);
}

if (!is_testing_runtime) {
  console.error("Refusing to drop database outside testing runtime");
  process.exit(1);
}

if (!is_test_database_name) {
  console.error(`Refusing to drop non-test database "${db_name}"`);
  process.exit(1);
}

const test_db_name = db_name;

const client = new pg.Client(get_maintenance_admin_config());

async function run() {
  try {
    await client.connect();
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
      AND pid <> pg_backend_pid()
    `, [test_db_name]);
    await client.query(`DROP DATABASE IF EXISTS ${quote_database_identifier(test_db_name)}`);
    console.log(`Database "${test_db_name}" dropped`);
  } catch (error) {
    console.error("Error dropping database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
