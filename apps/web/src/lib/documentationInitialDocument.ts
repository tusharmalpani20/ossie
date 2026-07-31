import {
  normalizePublicDocumentationSnapshot,
  type PublicDocumentationSnapshot,
  type RawPublicDocumentationSnapshot,
} from "./documentationApi";

export const readDocumentationInitialDocument = (input: {
  slug: string;
  versionSlug?: string;
  pagePath?: string;
}): PublicDocumentationSnapshot | null => {
  const node = document.getElementById("ossie-documentation-initial-data");
  if (!(node instanceof HTMLScriptElement)) return null;
  if (
    node.dataset.slug !== input.slug ||
    (node.dataset.versionSlug || undefined) !== input.versionSlug ||
    (node.dataset.pagePath || undefined) !== input.pagePath
  )
    return null;
  try {
    const raw = JSON.parse(
      node.textContent ?? "",
    ) as RawPublicDocumentationSnapshot;
    const page = raw.page;
    if (
      !page ||
      !raw.revision ||
      !Array.isArray(raw.pages) ||
      !raw.navigation ||
      !Array.isArray(raw.openapi_operations) ||
      typeof page.id !== "string" ||
      typeof page.canonical_path !== "string"
    )
      return null;
    return normalizePublicDocumentationSnapshot(raw, {
      ...page,
      description: page.description ?? null,
      blocks: page.blocks ?? [],
    });
  } catch {
    return null;
  }
};
