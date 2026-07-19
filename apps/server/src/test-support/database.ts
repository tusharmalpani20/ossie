import pg, { type Client } from "pg";
import { get_maintenance_database_config } from "../config/maintenance-database.config";

type TestDatabaseEnv = Record<string, string | undefined>;

type FixtureQuery = (
  text: string,
  values?: unknown[],
) => Promise<{ rows: unknown[] }>;

export const insert_test_project = async (
  query: FixtureQuery,
  input: {
    project_id: string;
    project_version_id: string;
    organization_id: string;
    actor_org_user_id: string;
    name: string;
  },
) => {
  await query(`
    INSERT INTO project_schema.project (
      id, organization_id, name, default_project_version_id,
      created_by_id, updated_by_id
    ) VALUES ($1, $2, $3, $4, $5, $5)
  `, [
    input.project_id,
    input.organization_id,
    input.name,
    input.project_version_id,
    input.actor_org_user_id,
  ]);
  await query(`
    INSERT INTO project_schema.project_version (
      id, organization_id, project_id, name, slug, position,
      status, created_by_id, updated_by_id
    ) VALUES ($1, $2, $3, 'Main', 'main', 1, 'active', $4, $4)
  `, [
    input.project_version_id,
    input.organization_id,
    input.project_id,
    input.actor_org_user_id,
  ]);
};

const assert_disposable_test_database = (
  env: TestDatabaseEnv = process.env,
) => {
  const database = env.DB_NAME ?? "";
  const testing_runtime = env.NODE_ENV === "test" || env.DEV_TYPE === "testing";
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

export const assert_test_maintenance_connection = (
  connection: { database: string; user: string },
  env: TestDatabaseEnv = process.env,
) => {
  assert_disposable_test_database(env);
  if (
    connection.database !== env.DB_NAME ||
    connection.user !== env.DB_MAINTENANCE_USER
  ) {
    throw new Error(
      "Maintenance connection does not match the configured disposable test database",
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
    const connection = await client.query<{ database: string; user: string }>(
      "SELECT current_database() AS database, current_user AS user",
    );
    const context = connection.rows[0];
    if (!context)
      throw new Error("Maintenance connection context is unavailable");
    assert_test_maintenance_connection(context);
    await client.query("BEGIN");
    try {
      await client.query(
        "SELECT set_config('ossie.maintenance_mode', 'on', true)",
      );
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    await client.end();
  }
};

export const run_test_fixture_mutation = (text: string, values?: unknown[]) =>
  with_maintenance_client((client) => client.query(text, values));

export const reset_test_database = async () =>
  with_maintenance_client(async (client) => {
    await client.query(`
      TRUNCATE TABLE
        audit_schema.audit_change_item,
        audit_schema.audit_event,
        audit_schema.access_event,
        publish_schema.public_publish_viewer_session,
        publish_schema.publish_link,
        publish_schema.published_artifact,
        interactive_demo_schema.demo_transition,
        interactive_demo_schema.demo_hotspot,
        interactive_demo_schema.demo_scene,
        interactive_demo_schema.interactive_demo_working_draft,
        interactive_demo_schema.interactive_demo_edition,
        interactive_demo_schema.interactive_demo,
        guide_schema.guide_annotation,
        guide_schema.guide_step,
        guide_schema.guide_block,
        guide_schema.guide_working_draft,
        guide_schema.guide_edition,
        guide_schema.guide,
        capture_schema.capture_event,
        capture_schema.capture_asset,
        capture_schema.capture_session,
        file_schema.file,
        organization_schema.org_invite,
        auth_schema.auth_session,
        project_schema.project_membership,
        project_schema.project_version_alias,
        project_schema.project_version,
        project_schema.project,
        organization_schema.org_user,
        organization_schema.organization,
        user_schema.user
      RESTART IDENTITY
    `);
  });
