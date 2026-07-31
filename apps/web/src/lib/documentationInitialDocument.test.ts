import { afterEach, describe, expect, it } from "vitest";
import { readDocumentationInitialDocument } from "./documentationInitialDocument";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Documentation initial document", () => {
  it("accepts only route-matched safe public bootstrap data", () => {
    const script = document.createElement("script");
    script.id = "ossie-documentation-initial-data";
    script.type = "application/json";
    script.dataset.slug = "product-docs";
    script.dataset.pagePath = "install";
    script.textContent = JSON.stringify({
      revision: {
        site_name: "Product",
        site_description: null,
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
      navigation: { nodes: [] },
      openapi_operations: [],
      page: {
        id: "page",
        title: "Install",
        description: null,
        canonical_path: "install",
        blocks: [],
      },
    });
    document.body.append(script);

    expect(
      readDocumentationInitialDocument({
        slug: "product-docs",
        pagePath: "install",
      }),
    ).toMatchObject({ site: { name: "Product" }, page: { id: "page" } });
    expect(
      readDocumentationInitialDocument({
        slug: "different",
        pagePath: "install",
      }),
    ).toBeNull();
  });

  it("fails safely for malformed data", () => {
    document.body.innerHTML =
      '<script id="ossie-documentation-initial-data" type="application/json" data-slug="product-docs">{</script>';
    expect(
      readDocumentationInitialDocument({ slug: "product-docs" }),
    ).toBeNull();
  });
});
