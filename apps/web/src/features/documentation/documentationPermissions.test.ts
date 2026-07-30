import { describe, expect, it } from "vitest";
import {
  canDecideDocumentationReview,
  canManageDocumentationReview,
  canOverrideDocumentationReview,
  canPublishDocumentation,
  canRequestDocumentationReview,
} from "./documentationPermissions";

describe("Documentation portal permissions", () => {
  it.each([
    ["project_admin", true],
    ["editor", true],
    ["viewer", false],
  ] as const)("maps %s publication controls to %s", (role, expected) => {
    expect(canPublishDocumentation(role)).toBe(expected);
  });

  it("keeps review capabilities distinct", () => {
    expect(canRequestDocumentationReview("editor")).toBe(true);
    expect(canRequestDocumentationReview("viewer")).toBe(false);
    expect(canDecideDocumentationReview("viewer")).toBe(true);
    expect(canManageDocumentationReview("project_admin")).toBe(true);
    expect(canManageDocumentationReview("editor")).toBe(false);
    expect(canOverrideDocumentationReview("project_admin")).toBe(true);
    expect(canOverrideDocumentationReview("editor")).toBe(false);
  });
});
