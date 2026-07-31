import { describe, expect, it } from "vitest";
import { generateDocumentationTryItExamples } from "./documentationTryItExamples";

describe("Documentation Try-It examples", () => {
  it("uses placeholders and language-specific escaping without executing", () => {
    const examples = generateDocumentationTryItExamples({
      url: "https://api.example.com/pets?q=a%27b",
      method: "POST",
      headers: {
        Authorization: "Bearer actual-secret",
        "X-Name": "O'Reilly",
      },
      sensitive_header_names: ["Authorization"],
      body: '{"password":"<PASSWORD>"}',
      timeout_ms: 15_000,
    });
    expect(examples.curl).toContain("<BEARER_TOKEN>");
    expect(examples.javascript).toContain('credentials: "omit"');
    expect(examples.python).toContain("urllib.request");
    expect(JSON.stringify(examples)).not.toContain("actual-secret");
  });
});
