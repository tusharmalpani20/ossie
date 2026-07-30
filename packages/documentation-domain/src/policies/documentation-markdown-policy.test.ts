import { describe, expect, it } from "vitest";
import {
  create_documentation_heading_destination,
  escape_documentation_markdown_text,
  export_documentation_page_markdown,
} from "./documentation-markdown-policy";

describe("Documentation Markdown policy", () => {
  it("escapes customer-authored structural Markdown characters", () => {
    expect(escape_documentation_markdown_text("A [label] (x) \\ `tick`")).toBe(
      "A \\[label\\] \\(x\\) \\\\ \\`tick\\`",
    );
  });

  it("creates deterministic heading destinations without locale behavior", () => {
    expect(
      create_documentation_heading_destination("Install & Configure"),
    ).toBe("install-configure");
    expect(
      create_documentation_heading_destination("Install & Configure"),
    ).toBe(create_documentation_heading_destination("Install & Configure"));
  });

  it("exports readable CommonMark with a fence longer than customer backticks", () => {
    expect(
      export_documentation_page_markdown({
        title: "Start [here]",
        blocks: [
          {
            handle: "block-0001",
            kind: "paragraph",
            position: 1,
            text: "Welcome",
          },
          {
            handle: "block-0002",
            kind: "code",
            position: 2,
            code: "const marker = ```;",
            language: "ts",
          },
          {
            handle: "block-0003",
            kind: "image",
            position: 3,
            asset_handle: "asset-0001",
            alt_text: "Private screen",
            caption: null,
          },
        ],
      }),
    ).toBe(
      "# Start \\[here\\]\n\nWelcome\n\n````ts\nconst marker = ```;\n````\n\n> Image omitted: Private screen\n",
    );
  });
});
