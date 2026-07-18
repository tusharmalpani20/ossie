import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

  it("keeps maintenance credentials out of the development API profile", () => {
    const environments = JSON.parse(readFileSync(
      new URL("../../.env-cmdrc.example", import.meta.url),
      "utf8",
    )) as Record<string, Record<string, string>>;
    const package_json = JSON.parse(readFileSync(
      new URL("../../package.json", import.meta.url),
      "utf8",
    )) as { scripts: Record<string, string> };

    expect(environments.development).not.toHaveProperty("DB_MAINTENANCE_USER");
    expect(environments.development).not.toHaveProperty("DB_MAINTENANCE_PASSWORD");
    expect(environments.development_maintenance).toMatchObject({
      DB_MAINTENANCE_USER: expect.any(String),
      DB_MAINTENANCE_PASSWORD: expect.any(String),
    });
    expect(package_json.scripts.dev).toContain("-e development");
    expect(package_json.scripts["migrate:up"]).toContain("-e development_maintenance");
    expect(package_json.scripts["test:db"]).toContain("-e testing_maintenance");
  });
});
