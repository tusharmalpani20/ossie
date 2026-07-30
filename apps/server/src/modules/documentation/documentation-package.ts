import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { deflateRawSync } from "node:zlib";
import {
  DOCUMENTATION_PACKAGE_COMPRESSION_RATIO_MAX,
  DOCUMENTATION_PACKAGE_FORMAT,
  DOCUMENTATION_PACKAGE_FORMAT_VERSION,
} from "@repo/constants";
import {
  canonicalize_documentation_package_json,
  create_documentation_package_fingerprint,
  validate_documentation_package_graph,
} from "@repo/documentation-domain";
import {
  DocumentationPackageManifestV1Schema,
  DocumentationPortablePageV1Schema,
  DocumentationPortableSiteV1Schema,
  DocumentationPortableSnippetV1Schema,
  type DocumentationPackageManifestV1,
  type DocumentationPortableSiteV1,
} from "@repo/types";
import JSZip from "jszip";
import { inspect_documentation_archive } from "./documentation-archive";
import { parse_duplicate_safe_json } from "./documentation-json";
import { inspect_documentation_markdown } from "./documentation-markdown";

const README =
  "# Ossie Documentation package\n\nThis versioned archive contains a portable Documentation Site snapshot.\n";
const FIXED_ZIP_DATE = new Date("1980-01-01T00:00:00.000Z");

type PackageEntryInput = {
  path: string;
  role: DocumentationPackageManifestV1["entries"][number]["role"];
  mime_type: string;
  bytes: string | Buffer | object;
};

const bytes_for = (value: PackageEntryInput["bytes"]) => {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(canonicalize_documentation_package_json(value), "utf8");
};

const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

const compression_for = (bytes: Buffer) => {
  if (bytes.length === 0) return "STORE" as const;
  const compressed = deflateRawSync(bytes, { level: 9 });
  return bytes.length / Math.max(1, compressed.length) >
    DOCUMENTATION_PACKAGE_COMPRESSION_RATIO_MAX
    ? ("STORE" as const)
    : ("DEFLATE" as const);
};

type DocumentationSitePackageInput = {
  source: DocumentationPackageManifestV1["source"];
  site: DocumentationPortableSiteV1;
  profile?: DocumentationPackageManifestV1["profile"];
  entries: PackageEntryInput[];
};

const prepare_documentation_site_package = (
  input: DocumentationSitePackageInput,
) => {
  const profile = input.profile ?? "roundtrip";
  const site = validate_documentation_package_graph(input.site, { profile });
  const contentEntries: PackageEntryInput[] = [
    {
      path: "README.md",
      role: "readme",
      mime_type: "text/markdown",
      bytes: README,
    },
    {
      path: "site.json",
      role: "site",
      mime_type: "application/json",
      bytes: site,
    },
    ...input.entries,
  ];
  const prepared = contentEntries
    .map((entry) => ({ ...entry, buffer: bytes_for(entry.bytes) }))
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
  const descriptors = prepared.map((entry) => ({
    path: entry.path,
    role: entry.role,
    mime_type: entry.mime_type,
    size_bytes: entry.buffer.length,
    sha256: sha256(entry.buffer),
  }));
  const contentFingerprint = create_documentation_package_fingerprint({
    site,
    entries: descriptors,
  });
  const manifest = DocumentationPackageManifestV1Schema.parse({
    format: DOCUMENTATION_PACKAGE_FORMAT,
    format_version: DOCUMENTATION_PACKAGE_FORMAT_VERSION,
    profile,
    source: input.source,
    content_fingerprint: contentFingerprint,
    site_path: "site.json",
    readme_path: "README.md",
    entries: descriptors,
  });
  const allEntries = [
    {
      path: "ossie-docs.json",
      buffer: Buffer.from(
        canonicalize_documentation_package_json(manifest),
        "utf8",
      ),
    },
    ...prepared.map(({ path: entryPath, buffer }) => ({
      path: entryPath,
      buffer,
    })),
  ].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  const zip = new JSZip();
  for (const entry of allEntries)
    zip.file(entry.path, entry.buffer, {
      date: FIXED_ZIP_DATE,
      unixPermissions: 0o100644,
      compression: compression_for(entry.buffer),
      compressionOptions: { level: 9 },
      createFolders: false,
    });
  return { zip, manifest };
};

export const stream_documentation_site_package = async (
  input: DocumentationSitePackageInput,
) => {
  const { zip, manifest } = prepare_documentation_site_package(input);
  return {
    stream: new Readable().wrap(
      zip.generateNodeStream({
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
        platform: "UNIX",
        streamFiles: false,
        comment: "",
      }),
    ),
    manifest,
  };
};

export const create_documentation_site_package = async (
  input: DocumentationSitePackageInput,
) => {
  const generated = await stream_documentation_site_package(input);
  const chunks: Buffer[] = [];
  for await (const chunk of generated.stream)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);
  return { bytes, sha256: sha256(bytes), manifest: generated.manifest };
};

export const inspect_documentation_site_package = async (filePath: string) => {
  const entries = new Map<string, { sha256: string; size_bytes: number }>();
  let manifestBytes: Buffer | null = null;
  let siteBytes: Buffer | null = null;
  let hasReadme = false;
  const archive = await inspect_documentation_archive({
    file_path: filePath,
    on_entry: async (entry) => {
      entries.set(entry.path, {
        sha256: entry.sha256,
        size_bytes: entry.bytes.length,
      });
      if (entry.path === "ossie-docs.json") manifestBytes = entry.bytes;
      if (entry.path === "site.json") siteBytes = entry.bytes;
      if (entry.path === "README.md") hasReadme = true;
    },
  });
  if (!manifestBytes || !siteBytes || !hasReadme)
    throw new Error("Documentation package is missing a required entry");
  const manifest = DocumentationPackageManifestV1Schema.parse(
    parse_duplicate_safe_json(manifestBytes),
  );
  const site = DocumentationPortableSiteV1Schema.parse(
    parse_duplicate_safe_json(siteBytes),
  );
  const expectedDescriptors = new Map<
    string,
    {
      role: DocumentationPackageManifestV1["entries"][number]["role"];
      mime_type: string;
    }
  >([
    ["README.md", { role: "readme", mime_type: "text/markdown" }],
    ["site.json", { role: "site", mime_type: "application/json" }],
  ]);
  for (const page of site.pages) {
    expectedDescriptors.set(page.markdown_path, {
      role: "page_markdown",
      mime_type: "text/markdown",
    });
    if (page.typed_path)
      expectedDescriptors.set(page.typed_path, {
        role: "page_typed",
        mime_type: "application/json",
      });
  }
  for (const snippet of site.snippets)
    expectedDescriptors.set(snippet.path, {
      role: "snippet",
      mime_type: "application/json",
    });
  for (const asset of site.assets)
    expectedDescriptors.set(asset.path, {
      role: "asset",
      mime_type: asset.mime_type,
    });
  if (site.openapi)
    expectedDescriptors.set(site.openapi.path, {
      role: "openapi",
      mime_type:
        site.openapi.original_format === "json"
          ? "application/json"
          : "application/yaml",
    });
  if (
    expectedDescriptors.size !== manifest.entries.length ||
    manifest.entries.some((descriptor) => {
      const expected = expectedDescriptors.get(descriptor.path);
      return (
        !expected ||
        descriptor.role !== expected.role ||
        descriptor.mime_type !== expected.mime_type
      );
    })
  )
    throw new Error(
      "Documentation package descriptor disagrees with site.json",
    );
  const blockingIssues: Array<{
    severity: "blocking";
    code:
      | "content_unsupported"
      | "identity_duplicate"
      | "relationship_unresolved";
    location: "site.json";
    message: string;
  }> = [];
  try {
    validate_documentation_package_graph(site, {
      profile: manifest.profile,
    });
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "documentation_package_invalid"
    )
      throw error;
    const message =
      error instanceof Error
        ? error.message
        : "The package graph contains unsupported content.";
    blockingIssues.push({
      severity: "blocking",
      code: /duplicate/iu.test(message)
        ? "identity_duplicate"
        : /(?:resolve|home page)/iu.test(message)
          ? "relationship_unresolved"
          : "content_unsupported",
      location: "site.json",
      message,
    });
  }
  const describedPaths = new Set<string>();
  for (const descriptor of manifest.entries) {
    const observed = entries.get(descriptor.path);
    if (
      !observed ||
      observed.size_bytes !== descriptor.size_bytes ||
      observed.sha256 !== descriptor.sha256 ||
      describedPaths.has(descriptor.path)
    )
      throw new Error("Documentation package entry integrity mismatch");
    describedPaths.add(descriptor.path);
  }
  if (
    entries.size !== manifest.entries.length + 1 ||
    [...entries.keys()].some(
      (entryPath) =>
        entryPath !== "ossie-docs.json" && !describedPaths.has(entryPath),
    )
  )
    throw new Error("Documentation package contains an undeclared entry");
  const recomputedFingerprint = create_documentation_package_fingerprint({
    site,
    entries: manifest.entries,
  });
  if (recomputedFingerprint !== manifest.content_fingerprint)
    throw new Error("Documentation package fingerprint mismatch");

  const pages: Array<
    ReturnType<typeof DocumentationPortablePageV1Schema.parse>
  > = [];
  const snippets: Array<
    ReturnType<typeof DocumentationPortableSnippetV1Schema.parse>
  > = [];
  const pageByPath = new Map(
    site.pages
      .filter(({ typed_path }) => typed_path !== null)
      .map((page) => [page.typed_path as string, page]),
  );
  const snippetByPath = new Map(
    site.snippets.map((snippet) => [snippet.path, snippet]),
  );
  const markdownPageByPath = new Map(
    site.pages.map((page) => [page.markdown_path, page]),
  );
  const pageHandleByPath = Object.fromEntries(
    site.pages.map((page) => [page.markdown_path, page.handle]),
  );
  const assetHandleByPath = Object.fromEntries(
    site.assets.map((asset) => [asset.path, asset.handle]),
  );
  if (manifest.profile === "roundtrip" && pageByPath.size !== site.pages.length)
    throw new Error("roundtrip Page is missing typed content");
  await inspect_documentation_archive({
    file_path: filePath,
    on_entry: async (entry) => {
      const pageIndex = pageByPath.get(entry.path);
      if (pageIndex) {
        const page = DocumentationPortablePageV1Schema.parse(
          parse_duplicate_safe_json(entry.bytes),
        );
        if (
          page.handle !== pageIndex.handle ||
          page.title !== pageIndex.title ||
          page.description !== pageIndex.description ||
          page.canonical_path !== pageIndex.canonical_path ||
          JSON.stringify(page.keywords) !== JSON.stringify(pageIndex.keywords)
        )
          throw new Error("roundtrip Page metadata disagrees with site.json");
        pages.push(page);
      }
      const markdownPageIndex = markdownPageByPath.get(entry.path);
      if (manifest.profile === "markdown-folder" && markdownPageIndex) {
        const markdownPage = inspect_documentation_markdown(entry.bytes, {
          filename_stem: markdownPageIndex.canonical_path,
          package_path: entry.path,
          asset_handle_by_path: assetHandleByPath,
          page_handle_by_path: pageHandleByPath,
        });
        if (
          markdownPage.title !== markdownPageIndex.title ||
          markdownPage.canonical_path !== markdownPageIndex.canonical_path
        )
          throw new Error(
            "markdown-folder Page metadata disagrees with site.json",
          );
        pages.push(
          DocumentationPortablePageV1Schema.parse({
            schema_version: 1,
            handle: markdownPageIndex.handle,
            title: markdownPageIndex.title,
            description: markdownPageIndex.description,
            canonical_path: markdownPageIndex.canonical_path,
            keywords: markdownPageIndex.keywords,
            blocks: markdownPage.blocks,
          }),
        );
      }
      const snippetIndex = snippetByPath.get(entry.path);
      if (snippetIndex) {
        const snippet = DocumentationPortableSnippetV1Schema.parse(
          parse_duplicate_safe_json(entry.bytes),
        );
        if (snippet.handle !== snippetIndex.handle)
          throw new Error("Snippet handle disagrees with site.json");
        snippets.push(snippet);
      }
    },
  });
  if (
    pages.length !== site.pages.length ||
    snippets.length !== site.snippets.length
  )
    throw new Error("Documentation package typed content is incomplete");
  return {
    manifest,
    site,
    pages,
    snippets,
    blocking_issues: blockingIssues,
    archive,
    counts: {
      pages: site.pages.length,
      snippets: site.snippets.length,
      assets: site.assets.length,
      openapi_sources: site.openapi ? 1 : 0,
      external_bindings: site.external_bindings.length,
      navigation_nodes: site.navigation.length,
      aliases: site.aliases.length,
      routes: site.routes.length,
      blocks: pages.reduce(
        (total, page) => total + (page?.blocks.length ?? 0),
        0,
      ),
    },
  };
};
