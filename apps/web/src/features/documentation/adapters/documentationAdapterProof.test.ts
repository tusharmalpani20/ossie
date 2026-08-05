import { describe, expect, it } from "vitest";
import { getDocumentationAdapterProofMode } from "./documentationAdapterProof";

describe("Documentation adapter proof selector", () => {
  it("accepts only the bounded proof modes in development", () => {
    expect(
      getDocumentationAdapterProofMode(
        "?__documentation_adapter_proof=tiptap-prose",
        true,
      ),
    ).toBe("tiptap-prose");
    expect(
      getDocumentationAdapterProofMode(
        "?__documentation_adapter_proof=tiptap-graph",
        true,
      ),
    ).toBe("tiptap-graph");
    expect(
      getDocumentationAdapterProofMode(
        "?__documentation_adapter_proof=fumadocs-headless",
        true,
      ),
    ).toBe("fumadocs-headless");
  });

  it("ignores the selector in production and for unknown values", () => {
    expect(
      getDocumentationAdapterProofMode(
        "?__documentation_adapter_proof=tiptap-prose",
        false,
      ),
    ).toBeNull();
    expect(
      getDocumentationAdapterProofMode(
        "?__documentation_adapter_proof=unknown",
        true,
      ),
    ).toBeNull();
  });
});
