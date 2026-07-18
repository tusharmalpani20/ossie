import { describe, expect, it } from "vitest";
import { quote_database_identifier, render_database_role_identifiers } from "./identifier";

describe("database identifier helpers", () => {
  it("quotes database identifiers and escapes embedded quotes", () => {
    expect(quote_database_identifier("ossie_test")).toBe('"ossie_test"');
    expect(quote_database_identifier('test-"dc"')).toBe('"test-""dc"""');
  });

  it("renders only the two exact role placeholders as quoted identifiers", () => {
    expect(render_database_role_identifiers(
      "GRANT TO __OSSIE_RUNTIME_DB_ROLE__; -- __OSSIE_MAINTENANCE_DB_ROLE__",
      { runtime_role: "runtime-role", maintenance_role: "maintenance-role" },
    )).toBe('GRANT TO "runtime-role"; -- "maintenance-role"');
  });

  it("rejects unknown and leftover placeholders", () => {
    expect(() => render_database_role_identifiers("SELECT __OSSIE_UNKNOWN_ROLE__", {
      runtime_role: "runtime",
      maintenance_role: "maintenance",
    })).toThrowError(/Unknown database role placeholder/);
  });
});
