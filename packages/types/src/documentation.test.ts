import { describe, expect, it } from "vitest";
import {
  DocumentationBlockSchema,
  DocumentationCommentThreadCreateRequestSchema,
  DocumentationCreateSiteRequestSchema,
  DocumentationNavigationUpdateRequestSchema,
  DocumentationPageContentRequestSchema,
  DocumentationCreatePageRequestSchema,
  DocumentationPageUpdateRequestSchema,
  DocumentationPublicSearchResponseSchema,
  DocumentationRoutingUpdateRequestSchema,
  DocumentationCreateRevisionRequestSchema,
  DocumentationCreatePublicationRequestSchema,
  DocumentationRollbackPublicationRequestSchema,
  DocumentationApplyOpenApiRequestSchema,
} from "./documentation";

describe("Documentation shared contracts", () => {
  it("requires explicit row versions on mutable Documentation aggregates", () => {
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 2,
        canonical_path: "getting-started/install",
        keywords: ["install", "setup"],
      }).success,
    ).toBe(true);
    expect(
      DocumentationNavigationUpdateRequestSchema.safeParse({
        expected_version: 1,
        nodes: [
          {
            id: "01J00000000000000000000001",
            parent_id: null,
            kind: "page",
            label: null,
            page_id: "01J00000000000000000000002",
            position: 1,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      DocumentationRoutingUpdateRequestSchema.safeParse({
        expected_version: 1,
        rules: [
          {
            id: "01J00000000000000000000003",
            source_path: "old-install",
            outcome: "gone",
            target_page_id: null,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("keeps comment bodies plain and mentions membership-scoped", () => {
    expect(
      DocumentationCommentThreadCreateRequestSchema.safeParse({
        body: "Please clarify this step.",
        block_anchor_id: "01J00000000000000000000001",
        mentioned_project_membership_ids: [],
      }).success,
    ).toBe(true);
    expect(
      DocumentationCommentThreadCreateRequestSchema.safeParse({
        body: "<script>alert(1)</script>",
        block_anchor_id: null,
        mentioned_project_membership_ids: [],
      }).success,
    ).toBe(false);
  });

  it("separates checkpoint, publication, and rollback commands", () => {
    expect(
      DocumentationCreateRevisionRequestSchema.safeParse({
        expected_draft_version: 8,
      }).success,
    ).toBe(true);
    expect(
      DocumentationCreatePublicationRequestSchema.safeParse({
        revision_id: "01J00000000000000000000001",
        link: {
          mode: "create",
          name: "Product docs",
          slug: "product-docs",
          visibility: "public",
          expires_at: "2026-08-30T00:00:00.000Z",
          password: "safe local password",
        },
      }).success,
    ).toBe(true);
    expect(
      DocumentationRollbackPublicationRequestSchema.safeParse({
        site_publication_id: "01J00000000000000000000002",
        expected_entry_version: 2,
      }).success,
    ).toBe(true);
  });

  it("applies only a previously inspected OpenAPI File", () => {
    expect(
      DocumentationApplyOpenApiRequestSchema.safeParse({
        inspection_id: "01J00000000000000000000001",
        expected_source_version: null,
      }).success,
    ).toBe(true);
  });

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

  it("enforces the accepted saved-text ceiling per Page", () => {
    expect(
      DocumentationPageContentRequestSchema.safeParse({
        expected_page_version: 1,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            text: "x".repeat(4 * 1024 * 1024 + 1),
            position: 1,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(false);
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
    expect(() =>
      DocumentationCreatePageRequestSchema.parse({
        title: "Too deep",
        description: null,
        canonical_path: Array.from({ length: 9 }, () => "segment").join("/"),
      }),
    ).toThrow();
    expect(() =>
      DocumentationCreatePageRequestSchema.parse({
        title: "Long segment",
        description: null,
        canonical_path: "a".repeat(81),
      }),
    ).toThrow();
  });

  it("enforces the accepted Page keyword ceiling", () => {
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 1,
        keywords: Array.from({ length: 20 }, (_, index) => `keyword-${index}`),
      }).success,
    ).toBe(true);
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 1,
        keywords: Array.from({ length: 21 }, (_, index) => `keyword-${index}`),
      }).success,
    ).toBe(false);
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 1,
        keywords: ["k".repeat(81)],
      }).success,
    ).toBe(false);
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
