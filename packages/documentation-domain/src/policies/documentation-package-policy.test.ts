import { describe, expect, it } from "vitest";
import {
  canonicalize_documentation_package_json,
  create_documentation_package_fingerprint,
  validate_documentation_package_graph,
  validate_documentation_package_handle,
} from "./documentation-package-policy";

const site = {
  schema_version: 1 as const,
  site: {
    name: "Docs",
    description: null,
    primary_language: "en-US",
  },
  home_page_handle: "page-0001",
  pages: [
    {
      handle: "page-0001",
      title: "Café",
      description: null,
      canonical_path: "start",
      keywords: [],
      typed_path: "pages/page-0001.json",
      markdown_path: "pages/page-0001.md",
    },
  ],
  snippets: [],
  assets: [],
  navigation: [
    {
      handle: "nav-0001",
      parent_handle: null,
      kind: "page" as const,
      label: null,
      page_handle: "page-0001",
      position: 1,
    },
  ],
  aliases: [],
  routes: [],
  openapi: null,
  external_bindings: [],
};

describe("Documentation package policy", () => {
  it("canonicalizes recursively sorted JSON without normalizing customer Unicode", () => {
    const decomposed = "Cafe\u0301";
    const result = canonicalize_documentation_package_json({
      z: decomposed,
      a: { z: 2, a: 1 },
    });
    expect(result).toBe(
      `{\n  "a": {\n    "a": 1,\n    "z": 2\n  },\n  "z": "${decomposed}"\n}\n`,
    );
    expect(result).not.toContain("Café");
  });

  it("creates a stable lowercase fingerprint independent of object insertion order", () => {
    expect(create_documentation_package_fingerprint({ z: 1, a: 2 })).toBe(
      create_documentation_package_fingerprint({ a: 2, z: 1 }),
    );
    expect(create_documentation_package_fingerprint({ a: 1 })).toMatch(
      /^[a-f0-9]{64}$/u,
    );
  });

  it("rejects unsafe handles and dangling or duplicate Site relationships", () => {
    expect(validate_documentation_package_handle("page-0001")).toBe(
      "page-0001",
    );
    expect(() => validate_documentation_package_handle("Page/1")).toThrow(
      /handle/iu,
    );
    expect(() =>
      validate_documentation_package_graph({
        ...site,
        home_page_handle: "missing-page",
      }),
    ).toThrow(/Home Page/iu);
    expect(() =>
      validate_documentation_package_graph({
        ...site,
        pages: [...site.pages, { ...site.pages[0]! }],
      }),
    ).toThrow(/duplicate/iu);
  });

  it("enforces profile-specific Page representation rules", () => {
    expect(
      validate_documentation_package_graph(site, { profile: "roundtrip" }),
    ).toEqual(site);
    expect(() =>
      validate_documentation_package_graph(site, {
        profile: "markdown-folder",
      }),
    ).toThrow(/typed_path/iu);
  });
});
