import { describe, expect, it } from "vitest";
import { assert_test_maintenance_connection } from "./database";

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
});
