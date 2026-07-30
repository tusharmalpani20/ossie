import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  normalize_documentation_asset_name,
  validate_documentation_asset_source,
} from "./documentation-asset-policy";

describe("documentation asset policy", () => {
  it("normalizes safe display names without leaking path components", () => {
    expect(
      normalize_documentation_asset_name("  ..\\install/overview.png  "),
    ).toBe("install overview.png");
  });

  it("accepts only implemented product asset identities", () => {
    expect(
      validate_documentation_asset_source({
        kind: "capture_asset",
        id: "01J00000000000000000000001",
      }),
    ).toEqual({
      kind: "capture_asset",
      id: "01J00000000000000000000001",
    });
    expect(() =>
      validate_documentation_asset_source({
        kind: "derived_asset",
        id: "01J00000000000000000000002",
      }),
    ).toThrow(DocumentationDomainError);
  });
});
