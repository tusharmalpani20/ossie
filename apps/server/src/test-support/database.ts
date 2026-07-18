import pg, { type Client } from "pg";
import { get_maintenance_database_config } from "../config/maintenance-database.config";

const assert_disposable_test_database = () => {
  const database = process.env.DB_NAME ?? "";
  const testing_runtime =
    process.env.NODE_ENV === "test" || process.env.DEV_TYPE === "testing";
  const test_name =
    database.endsWith("_test") ||
    database.startsWith("test-") ||
    database.startsWith("test_");
  if (!testing_runtime || !test_name) {
    throw new Error(
      "Refusing maintenance fixture operation outside a disposable test database",
    );
  }
};

export const with_maintenance_client = async <Result>(
  callback: (client: Client) => Promise<Result>,
) => {
  assert_disposable_test_database();
  const client = new pg.Client(get_maintenance_database_config());
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
};

export const reset_test_database = async () =>
  with_maintenance_client(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        "SELECT set_config('ossie.maintenance_mode', 'on', true)",
      );
      await client.query(`
      TRUNCATE TABLE
        audit_schema.audit_change_item,
        audit_schema.audit_event,
        publish_schema.public_publish_viewer_session,
        publish_schema.publish_link,
        publish_schema.published_artifact,
        interactive_demo_schema.demo_hotspot,
        interactive_demo_schema.demo_scene,
        interactive_demo_schema.interactive_demo,
        guide_schema.guide_step,
        guide_schema.guide_block,
        guide_schema.guide,
        capture_schema.capture_event,
        capture_schema.capture_asset,
        capture_schema.capture_session,
        file_schema.file,
        organization_schema.org_invite,
        auth_schema.auth_session,
        project_schema.project,
        organization_schema.org_user,
        organization_schema.organization,
        user_schema.user
      RESTART IDENTITY CASCADE
    `);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
