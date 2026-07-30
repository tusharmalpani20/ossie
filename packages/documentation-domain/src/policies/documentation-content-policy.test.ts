import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  normalize_documentation_blocks,
} from "./documentation-content-policy";

describe("documentation content policy", () => {
  it("normalizes constrained blocks and rejects executable content", () => {
    expect(
      normalize_documentation_blocks([
        { id: "01J00000000000000000000001", kind: "heading", level: 2, text: " Start " },
        { id: "01J00000000000000000000002", kind: "link", label: " API ", url: "https://example.test/api" },
        { id: "01J00000000000000000000003", kind: "divider" },
      ]),
    ).toEqual([
      { id: "01J00000000000000000000001", kind: "heading", level: 2, text: "Start", position: 1 },
      { id: "01J00000000000000000000002", kind: "link", label: "API", url: "https://example.test/api", position: 2 },
      { id: "01J00000000000000000000003", kind: "divider", position: 3 },
    ]);

    expect(() =>
      normalize_documentation_blocks([
        { id: "01J00000000000000000000001", kind: "link", label: "bad", url: "javascript:alert(1)" },
      ]),
    ).toThrow(DocumentationDomainError);
  });
});
