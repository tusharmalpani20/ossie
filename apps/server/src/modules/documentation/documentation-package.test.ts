import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  create_documentation_site_package,
  inspect_documentation_site_package,
} from "./documentation-package";

const roots: string[] = [];
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
      title: "Start",
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
const page = {
  schema_version: 1 as const,
  handle: "page-0001",
  title: "Start",
  description: null,
  canonical_path: "start",
  keywords: [],
  blocks: [
    {
      handle: "block-0001",
      kind: "paragraph" as const,
      position: 1,
      text: "Welcome",
    },
  ],
};

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("Documentation Site package", () => {
  it("creates byte-identical V1 ZIPs and inspects the exact portable graph", async () => {
    const input = {
      source: {
        kind: "working_draft" as const,
        project_version_label: "v1",
        revision_number: null,
        publication_sequence: null,
      },
      site,
      entries: [
        {
          path: "pages/page-0001.json",
          role: "page_typed" as const,
          mime_type: "application/json",
          bytes: page,
        },
        {
          path: "pages/page-0001.md",
          role: "page_markdown" as const,
          mime_type: "text/markdown",
          bytes: "# Start\n\nWelcome\n",
        },
      ],
    };
    const first = await create_documentation_site_package(input);
    const second = await create_documentation_site_package({
      ...input,
      entries: [...input.entries].reverse(),
    });
    expect(first.bytes.equals(second.bytes)).toBe(true);
    expect(first.sha256).toMatch(/^[a-f0-9]{64}$/u);

    const root = await mkdtemp(path.join(tmpdir(), "ossie-package-"));
    roots.push(root);
    const filePath = path.join(root, "package.zip");
    await writeFile(filePath, first.bytes);
    await expect(
      inspect_documentation_site_package(filePath),
    ).resolves.toMatchObject({
      manifest: {
        format: "ossie.documentation-site",
        format_version: 1,
        profile: "roundtrip",
      },
      site,
      pages: [page],
      counts: { pages: 1, blocks: 1 },
    });
  });

  it("rejects a package whose declared entry digest does not match bytes", async () => {
    const result = await create_documentation_site_package({
      source: {
        kind: "working_draft",
        project_version_label: "v1",
        revision_number: null,
        publication_sequence: null,
      },
      site,
      entries: [
        {
          path: "pages/page-0001.json",
          role: "page_typed",
          mime_type: "application/json",
          bytes: page,
        },
        {
          path: "pages/page-0001.md",
          role: "page_markdown",
          mime_type: "text/markdown",
          bytes: "# Start\n\nWelcome\n",
        },
      ],
    });
    const zip = await (await import("jszip")).default.loadAsync(result.bytes);
    zip.file("pages/page-0001.md", "# Start\n\nChanged\n");
    const corrupted = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      platform: "UNIX",
    });
    const root = await mkdtemp(path.join(tmpdir(), "ossie-package-"));
    roots.push(root);
    const filePath = path.join(root, "package.zip");
    await writeFile(filePath, corrupted);
    await expect(inspect_documentation_site_package(filePath)).rejects.toThrow();
  });

  it("parses manifest-owned markdown-folder Pages into the portable graph", async () => {
    const markdownSite = {
      ...site,
      pages: site.pages.map((entry) => ({ ...entry, typed_path: null })),
    };
    const result = await create_documentation_site_package({
      profile: "markdown-folder",
      source: {
        kind: "working_draft",
        project_version_label: "v1",
        revision_number: null,
        publication_sequence: null,
      },
      site: markdownSite,
      entries: [
        {
          path: "pages/page-0001.md",
          role: "page_markdown",
          mime_type: "text/markdown",
          bytes: "# Start\n\nWelcome\n",
        },
      ],
    });
    const root = await mkdtemp(path.join(tmpdir(), "ossie-package-"));
    roots.push(root);
    const filePath = path.join(root, "package.zip");
    await writeFile(filePath, result.bytes);

    await expect(
      inspect_documentation_site_package(filePath),
    ).resolves.toMatchObject({
      manifest: { profile: "markdown-folder" },
      pages: [
        {
          handle: "page-0001",
          title: "Start",
          canonical_path: "start",
          blocks: [
            {
              handle: "block-0001",
              kind: "paragraph",
              text: "Welcome",
            },
          ],
        },
      ],
      counts: { pages: 1, blocks: 1 },
    });
  });
});
