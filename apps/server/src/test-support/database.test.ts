import { describe, expect, it, vi } from "vitest";
import { assert_test_maintenance_connection, insert_test_project } from "./database";

describe("test database maintenance safety", () => {
  const env = {
    NODE_ENV: "test",
    DEV_TYPE: "testing",
    DB_NAME: "ossie_test",
    DB_MAINTENANCE_USER: "maintenance",
  };

  it("accepts only the configured disposable test database and maintenance login", () => {
    expect(() => assert_test_maintenance_connection(
      { database: "ossie_test", user: "maintenance" },
      env,
    )).not.toThrow();
    expect(() => assert_test_maintenance_connection(
      { database: "production", user: "maintenance" },
      env,
    )).toThrow(/connection does not match/);
    expect(() => assert_test_maintenance_connection(
      { database: "ossie_test", user: "runtime" },
      env,
    )).toThrow(/connection does not match/);
  });

  it("rejects a test-looking database outside the testing runtime", () => {
    expect(() => assert_test_maintenance_connection(
      { database: "ossie_test", user: "maintenance" },
      { ...env, NODE_ENV: "production", DEV_TYPE: "production" },
    )).toThrow(/outside a disposable test database/);
  });

  it("creates a Project and Main Project Version as one maintenance fixture", async () => {
    const query = vi.fn<(text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>>(
      async () => ({ rows: [] }),
    );
    await insert_test_project(query, {
      project_id: "project_1",
      project_version_id: "project_version_1",
      organization_id: "org_1",
      actor_org_user_id: "org_user_1",
      name: "Fixture Project",
    });
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[0]).toContain("default_project_version_id");
    expect(query.mock.calls[1]?.[0]).toContain("project_schema.project_version");
    expect(query.mock.calls[1]?.[1]).toEqual([
      "project_version_1", "org_1", "project_1", "org_user_1",
    ]);
  });
});
