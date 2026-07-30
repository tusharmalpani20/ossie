import { describe, expect, it } from "vitest";
import { canPublishDocumentation } from "./documentationPermissions";

describe("Documentation portal permissions", () => {
  it.each([
    ["project_admin", true],
    ["editor", true],
    ["viewer", false],
  ] as const)("maps %s publication controls to %s", (role, expected) => {
    expect(canPublishDocumentation(role)).toBe(expected);
  });
});
