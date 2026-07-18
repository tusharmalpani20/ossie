import { describe, expect, it } from "vitest";
import { classify_audit_field } from "./audit-sensitive-field-policy";

describe("audit sensitive field policy", () => {
  it.each(["password", "password_hash", "session_token", "authorization", "api_key", "cookie"])(
    "denies %s",
    (field_name) => expect(() => classify_audit_field(field_name, [])).toThrowError(/forbidden_audit_field/),
  );

  it("allows an explicit scalar field and redacts an explicit opaque field", () => {
    expect(classify_audit_field("name", ["name"])).toBe("scalar");
    expect(classify_audit_field("metadata", [], ["metadata"])).toBe("redacted");
  });

  it("rejects unknown fields", () => {
    expect(() => classify_audit_field("unknown", ["name"])).toThrowError(/unapproved_audit_field/);
  });
});
