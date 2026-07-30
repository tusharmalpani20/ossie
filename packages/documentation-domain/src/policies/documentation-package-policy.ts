import { createHash } from "node:crypto";
import {
  DOCUMENTATION_PACKAGE_PROFILES,
  type DocumentationBlockKind,
} from "@repo/constants";
import {
  DocumentationPortableSiteV1Schema,
  type DocumentationPortableSiteV1,
} from "@repo/types";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

const HANDLE_PATTERN = /^[a-z][a-z0-9-]{0,63}$/u;

export const validate_documentation_package_handle = (value: string) => {
  if (!HANDLE_PATTERN.test(value))
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "Package-local handle is invalid",
    );
  return value;
};

const canonical_value = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical_value);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonical_value(child)]),
    );
  }
  if (typeof value === "number" && !Number.isFinite(value))
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "Package JSON contains a non-finite number",
    );
  return value;
};

export const canonicalize_documentation_package_json = (value: unknown) =>
  `${JSON.stringify(canonical_value(value), null, 2)}\n`;

export const create_documentation_package_fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(canonicalize_documentation_package_json(value), "utf8")
    .digest("hex");

const assert_unique = (
  values: string[],
  label: string,
  options: { caseInsensitive?: boolean } = {},
) => {
  const seen = new Set<string>();
  for (const value of values) {
    const key = options.caseInsensitive ? value.toLocaleLowerCase("en") : value;
    if (seen.has(key))
      throw new DocumentationDomainError(
        "documentation_package_invalid",
        `Package contains a duplicate ${label}`,
      );
    seen.add(key);
  }
};

const assert_contiguous = (
  values: Array<{ position: number }>,
  label: string,
) => {
  if (values.some((value, index) => value.position !== index + 1))
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      `${label} positions must be contiguous`,
    );
};

export const validate_documentation_package_graph = (
  input: DocumentationPortableSiteV1,
  options: {
    profile?: (typeof DOCUMENTATION_PACKAGE_PROFILES)[number];
  } = {},
) => {
  const site = DocumentationPortableSiteV1Schema.parse(input);
  const profile = options.profile ?? "roundtrip";
  assert_unique(
    [
      ...site.pages.map(({ handle }) => handle),
      ...site.snippets.map(({ handle }) => handle),
      ...site.assets.map(({ handle }) => handle),
      ...site.external_bindings.map(({ handle }) => handle),
    ],
    "package-local handle",
  );
  assert_unique(
    site.pages.map(({ canonical_path }) => canonical_path),
    "Page path",
    { caseInsensitive: true },
  );
  assert_unique(
    site.snippets.map(({ path }) => path),
    "Snippet path",
    { caseInsensitive: true },
  );
  assert_unique(
    site.assets.map(({ name }) => name),
    "Asset name",
    { caseInsensitive: true },
  );
  const pageHandles = new Set(site.pages.map(({ handle }) => handle));
  if (site.home_page_handle && !pageHandles.has(site.home_page_handle))
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "Package Home Page does not resolve",
    );
  if (
    site.navigation.some(
      (node) =>
        (node.kind === "page" &&
          (!node.page_handle || !pageHandles.has(node.page_handle))) ||
        (node.kind === "group" && node.page_handle !== null),
    )
  )
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "Package Navigation contains an unresolved Page",
    );
  assert_unique(
    site.navigation
      .filter(({ page_handle }) => page_handle)
      .map(({ page_handle }) => page_handle!),
    "Navigation Page placement",
  );
  const parentHandles = new Set(site.navigation.map(({ handle }) => handle));
  if (
    site.navigation.some(
      ({ parent_handle }) =>
        parent_handle !== null && !parentHandles.has(parent_handle),
    )
  )
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "Package Navigation contains an unresolved parent",
    );
  const siblings = new Map<string, typeof site.navigation>();
  for (const node of site.navigation) {
    const key = node.parent_handle ?? "root";
    siblings.set(key, [...(siblings.get(key) ?? []), node]);
  }
  for (const [parent, nodes] of siblings)
    assert_contiguous(nodes, `Navigation children for ${parent}`);
  if (
    profile === "roundtrip" &&
    site.pages.some(({ typed_path }) => typed_path === null)
  )
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "roundtrip Pages require typed_path",
    );
  if (
    profile === "markdown-folder" &&
    site.pages.some(({ typed_path }) => typed_path !== null)
  )
    throw new DocumentationDomainError(
      "documentation_package_invalid",
      "markdown-folder Pages forbid typed_path",
    );
  return site;
};

export const assert_exhaustive_documentation_block_kind = (
  kind: never,
): DocumentationBlockKind => {
  throw new DocumentationDomainError(
    "documentation_package_invalid",
    `Unsupported Documentation block kind: ${String(kind)}`,
  );
};
