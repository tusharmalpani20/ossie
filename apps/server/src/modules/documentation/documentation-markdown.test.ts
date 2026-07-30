import { describe, expect, it } from "vitest";
import {
  DocumentationMarkdownError,
  inspect_documentation_markdown,
} from "./documentation-markdown";

describe("Documentation Markdown parser", () => {
  it("maps the accepted CommonMark subset into portable blocks", () => {
    expect(
      inspect_documentation_markdown(
        Buffer.from(
          [
            "# Getting started",
            "",
            "Welcome **friend**.",
            "",
            "## Install",
            "",
            "1. Download",
            "2. Run",
            "",
            "```ts",
            "console.log('ok')",
            "```",
            "",
            "[Ossie](https://example.test/docs)",
            "",
            "---",
          ].join("\n"),
        ),
        { filename_stem: "ignored" },
      ),
    ).toMatchObject({
      title: "Getting started",
      canonical_path: "ignored",
      blocks: [
        { kind: "paragraph", text: "Welcome **friend**.", position: 1 },
        { kind: "heading", level: 2, text: "Install", position: 2 },
        {
          kind: "ordered_list",
          items: [
            { text: "Download", position: 1 },
            { text: "Run", position: 2 },
          ],
        },
        { kind: "code", language: "ts", code: "console.log('ok')" },
        { kind: "link", label: "Ossie", url: "https://example.test/docs" },
        { kind: "divider" },
      ],
    });
  });

  it("rejects HTML, mixed inline links, nested lists, and non-one ordered starts", () => {
    for (const markdown of [
      "<script>alert(1)</script>",
      "Read [this](https://example.test) now.",
      "- outer\n  - inner",
      "2. starts wrong",
    ])
      expect(() =>
        inspect_documentation_markdown(Buffer.from(markdown), {
          filename_stem: "page",
        }),
      ).toThrow(DocumentationMarkdownError);
  });

  it("rejects standalone images but resolves declared package media", () => {
    const bytes = Buffer.from("![Dashboard](../assets/asset-0001.png \"Main\")");
    expect(() =>
      inspect_documentation_markdown(bytes, { filename_stem: "page" }),
    ).toThrow(/image/iu);
    expect(
      inspect_documentation_markdown(bytes, {
        filename_stem: "page",
        package_path: "pages/page-0001.md",
        asset_handle_by_path: {
          "assets/asset-0001.png": "asset-0001",
        },
      }).blocks[0],
    ).toMatchObject({
      kind: "image",
      asset_handle: "asset-0001",
      alt_text: "Dashboard",
      caption: "Main",
    });
  });
});
