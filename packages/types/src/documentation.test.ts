import { describe, expect, it } from "vitest";
import {
  DocumentationBlockSchema,
  DocumentationCreateSiteRequestSchema,
  DocumentationPageContentRequestSchema,
  DocumentationCreatePageRequestSchema,
  DocumentationPublicSearchResponseSchema,
} from "./documentation";

describe("Documentation shared contracts", () => {
  it("strictly parses Site creation", () => {
    expect(
      DocumentationCreateSiteRequestSchema.parse({
        name: "API docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      }),
    ).toMatchObject({ name: "API docs", primary_language: "en-US" });
    expect(() =>
      DocumentationCreateSiteRequestSchema.parse({
        name: "API docs",
        primary_language: "en",
        unexpected: true,
      }),
    ).toThrow();
  });

  it("uses a strict discriminated block command", () => {
    expect(
      DocumentationBlockSchema.parse({
        id: "01J00000000000000000000001",
        kind: "heading",
        level: 2,
        text: "Start",
        position: 1,
        expected_version: null,
      }),
    ).toMatchObject({ kind: "heading" });
    expect(() =>
      DocumentationBlockSchema.parse({
        id: "01J00000000000000000000001",
        kind: "divider",
        position: 1,
        expected_version: null,
        text: "<script>",
      }),
    ).toThrow();
  });

  it("requires aggregate and child Row Versions for replacement", () => {
    expect(() =>
      DocumentationPageContentRequestSchema.parse({
        expected_page_version: 2,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            text: "Changed",
            position: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("strictly validates Page identity inputs and canonical paths", () => {
    expect(
      DocumentationCreatePageRequestSchema.parse({
        title: "Install",
        description: null,
        canonical_path: "getting-started/install",
      }),
    ).toMatchObject({ title: "Install" });
    expect(() =>
      DocumentationCreatePageRequestSchema.parse({
        title: "Bad",
        description: null,
        canonical_path: "../secret",
      }),
    ).toThrow();
  });

  it("does not permit comments in public search responses", () => {
    expect(() =>
      DocumentationPublicSearchResponseSchema.parse({
        results: [
          {
            page_id: "page",
            title: "Home",
            excerpt: "Public",
            canonical_path: "home",
            comments: ["private"],
          },
        ],
      }),
    ).toThrow();
  });
});
