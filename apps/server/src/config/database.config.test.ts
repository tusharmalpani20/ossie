import { describe, expect, it } from "vitest";
import { get_runtime_database_config } from "./database.config";

describe("runtime database config", () => {
  it("uses only runtime credentials", () => {
    const config = get_runtime_database_config({
      DB_HOST: "db",
      DB_PORT: "5432",
      DB_USER: "runtime",
      DB_PASSWORD: "runtime-password",
      DB_NAME: "ossie_test",
      DB_MAX_POOL: "7",
      DB_MAINTENANCE_USER: "maintenance",
      DB_MAINTENANCE_PASSWORD: "maintenance-password",
    });

    expect(config).toMatchObject({
      user: "runtime",
      password: "runtime-password",
      max: 7,
    });
    expect(JSON.stringify(config)).not.toContain("maintenance-password");
  });
});
