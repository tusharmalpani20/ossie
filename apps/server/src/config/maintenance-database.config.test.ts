import { describe, expect, it } from "vitest";
import { get_maintenance_database_config } from "./maintenance-database.config";

describe("maintenance database config", () => {
  it("requires maintenance credentials without falling back to runtime", () => {
    expect(() =>
      get_maintenance_database_config({
        DB_HOST: "db",
        DB_PORT: "5432",
        DB_USER: "runtime",
        DB_PASSWORD: "runtime-password",
        DB_NAME: "ossie_test",
        DB_MAX_POOL: "7",
      }),
    ).toThrowError(/Maintenance database configuration must be defined/);
  });

  it("uses the separate maintenance login", () => {
    expect(
      get_maintenance_database_config({
        DB_HOST: "db",
        DB_PORT: "5432",
        DB_NAME: "ossie_test",
        DB_MAX_POOL: "7",
        DB_MAINTENANCE_USER: "maintenance",
        DB_MAINTENANCE_PASSWORD: "maintenance-password",
      }),
    ).toMatchObject({ user: "maintenance", password: "maintenance-password" });
  });
});
