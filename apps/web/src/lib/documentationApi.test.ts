import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DocumentationCanonicalRedirect,
  getPublicDocumentationPage,
  inspectDocumentationImport,
  listDocumentationAssets,
  saveDocumentationSnippet,
} from "./documentationApi";

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const snapshot = {
  revision: {
    site_name: "Product docs",
    site_description: "Safe help",
    primary_language: "en-US",
    home_page_id: "page",
  },
  pages: [
    {
      id: "page",
      title: "Install",
      description: null,
      canonical_path: "install",
      blocks: [],
    },
  ],
  navigation: [],
  openapi_operations: [],
};

describe("Documentation public API adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes frozen Site metadata from the Revision contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ ...snapshot, page: snapshot.pages[0] })),
    );
    await expect(
      getPublicDocumentationPage("product-docs", undefined, "install"),
    ).resolves.toMatchObject({
      site: { name: "Product docs", description: "Safe help" },
      revision: { primary_language: "en-US", home_page_id: "page" },
    });
  });

  it("surfaces only a trusted same-link canonical redirect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          ...snapshot,
          aliases: [
            { former_path: "old-install", documentation_page_id: "page" },
          ],
        }),
      ),
    );
    await expect(
      getPublicDocumentationPage("product-docs", undefined, "old-install"),
    ).rejects.toEqual(
      new DocumentationCanonicalRedirect("/docs/product-docs/install"),
    );
  });

  it("builds a read-only operation destination from the exact snapshot", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          ...snapshot,
          openapi_operations: [
            {
              destination_key: "get-widgets",
              method: "get",
              path: "/widgets",
              summary: "List widgets",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        json({
          operation: {
            destination_key: "get-widgets",
            method: "get",
            path: "/widgets",
            summary: "List widgets",
          },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(
      getPublicDocumentationPage(
        "product-docs",
        undefined,
        "operations/get-widgets",
      ),
    ).resolves.toMatchObject({
      page: {
        title: "List widgets",
        canonical_path: "operations/get-widgets",
      },
    });
  });
});

describe("Documentation authoring API adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests typed Asset sources without exposing storage coordinates", async () => {
    const fetch = vi.fn(async () => json({ assets: [] }));
    vi.stubGlobal("fetch", fetch);
    await listDocumentationAssets("project", "main", "site", {
      source: "capture",
      status: "active",
      includeArchivedVersions: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/documentation-sites/site/assets?source=capture&status=active&include_archived_versions=true",
      ),
      { credentials: "include" },
    );
  });

  it("sends the independent Snippet Row Version with its replacement", async () => {
    const fetch = vi.fn(async () =>
      json({
        snippet: {
          id: "snippet",
          name: "Note",
          status: "active",
          version: 3,
          blocks: [],
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    await saveDocumentationSnippet("project", "main", "site", "snippet", 2, []);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/snippets/snippet/content"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          expected_snippet_version: 2,
          blocks: [],
        }),
      }),
    );
  });

  it("uploads one actor-scoped portability inspection with idempotency", async () => {
    const fetch = vi.fn(async () =>
      json({
        inspection: {
          id: "inspection",
          kind: "page_markdown",
          status: "ready",
        },
      }, 201),
    );
    vi.stubGlobal("fetch", fetch);
    await inspectDocumentationImport(
      "project",
      "main",
      "page_markdown",
      new File(["# Page"], "page.md", { type: "text/markdown" }),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/documentation-import-inspections?kind=page_markdown",
      ),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "idempotency-key": expect.any(String),
        }),
        body: expect.any(FormData),
      }),
    );
  });
});
