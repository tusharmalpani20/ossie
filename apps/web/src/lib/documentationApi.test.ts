import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DocumentationCanonicalRedirect,
  getPublicDocumentationPage,
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
        })),
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
