import type { DocumentationCreateSiteRequest } from "@repo/types";
import type { DocumentationBlock } from "@repo/types";

export type DocumentationSiteSummary = {
  id: string;
  name: string;
  description: string | null;
  edition_id: string;
  primary_language: string;
  version: number;
  edition_version: number;
  updated_at: string;
};

const baseUrl = () => import.meta.env.VITE_OSSIE_API_URL ?? "";
const sitesPath = (projectId: string, versionSlug: string) =>
  `/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation-sites`;

const json = async <Result>(response: Response): Promise<Result> => {
  if (!response.ok) {
    throw new Error(`Documentation request failed (${response.status})`);
  }
  return (await response.json()) as Result;
};

export const listDocumentationSites = (
  projectId: string,
  versionSlug: string,
) =>
  fetch(`${baseUrl()}${sitesPath(projectId, versionSlug)}`, {
    credentials: "include",
  }).then((response) =>
    json<{ documentation_sites: DocumentationSiteSummary[] }>(response),
  );

export const createDocumentationSite = (
  projectId: string,
  versionSlug: string,
  input: DocumentationCreateSiteRequest,
) =>
  fetch(`${baseUrl()}${sitesPath(projectId, versionSlug)}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify(input),
  }).then((response) =>
    json<{
      site: { id: string; name: string; description: string | null };
      edition: { id: string; primary_language: string };
      working_draft: { id: string; version: number };
      home_page: {
        id: string;
        canonical_path: string;
      } | null;
    }>(response),
  );

export type DocumentationPage = {
  id: string;
  title: string;
  canonical_path: string;
  version: number;
  blocks: DocumentationBlock[];
};

const pagePath = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  pageId: string,
) =>
  `${sitesPath(projectId, versionSlug)}/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}`;

export const getDocumentationPage = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  pageId: string,
) =>
  fetch(`${baseUrl()}${pagePath(projectId, versionSlug, siteId, pageId)}`, {
    credentials: "include",
  }).then((response) => json<{ page: DocumentationPage }>(response));

export const saveDocumentationPage = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  pageId: string,
  input: { expected_page_version: number; blocks: DocumentationBlock[] },
) =>
  fetch(
    `${baseUrl()}${pagePath(projectId, versionSlug, siteId, pageId)}/content`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  ).then((response) => json<{ page: DocumentationPage }>(response));

export type DocumentationDraftPreview = {
  site: { id: string; name: string; description: string | null };
  working_draft: {
    id: string;
    home_page_id: string | null;
    version: number;
  };
  pages: Array<DocumentationPage & { description?: string | null }>;
  openapi_operations: Array<{
    destination_key: string;
    method: string;
    path: string;
    summary: string | null;
  }>;
};

const sitePath = (
  projectId: string,
  versionSlug: string,
  siteId: string,
) => `${sitesPath(projectId, versionSlug)}/${encodeURIComponent(siteId)}`;

export const getDocumentationPreview = (
  projectId: string,
  versionSlug: string,
  siteId: string,
) =>
  fetch(`${baseUrl()}${sitePath(projectId, versionSlug, siteId)}/preview`, {
    credentials: "include",
  }).then((response) => json<{ preview: DocumentationDraftPreview }>(response));

export const createDocumentationRevision = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  expectedDraftVersion: number,
) =>
  fetch(`${baseUrl()}${sitePath(projectId, versionSlug, siteId)}/revisions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify({ expected_draft_version: expectedDraftVersion }),
  }).then((response) =>
    json<{ revision: { id: string; revision_number: number } }>(response),
  );

export type PublicDocumentationSnapshot = {
  site: { name: string; description: string | null };
  revision: { primary_language: string; home_page_id: string };
  pages: Array<{
    id: string;
    title: string;
    description?: string | null;
    canonical_path: string;
    blocks?: DocumentationBlock[];
  }>;
  navigation: Array<{
    id: string;
    kind: "page" | "group";
    page_id: string | null;
    label: string | null;
  }>;
  openapi_operations: Array<{
    destination_key: string;
    method: string;
    path: string;
    summary: string | null;
  }>;
  page: {
    id: string;
    title: string;
    description: string | null;
    canonical_path: string;
    blocks: DocumentationBlock[];
  };
};

const publicDocumentationPath = (slug: string, versionSlug?: string) =>
  versionSlug
    ? `/api/v1/public/publish-links/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionSlug)}/documentation`
    : `/api/v1/public/publish-links/${encodeURIComponent(slug)}/documentation`;

export const getPublicDocumentationPage = async (
  slug: string,
  versionSlug?: string,
  pagePath?: string,
): Promise<PublicDocumentationSnapshot> => {
  const root = publicDocumentationPath(slug, versionSlug);
  if (pagePath) {
    return fetch(
      `${baseUrl()}${root}/pages/${pagePath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      { redirect: "follow" },
    ).then((response) => json<PublicDocumentationSnapshot>(response));
  }
  const snapshot = await fetch(`${baseUrl()}${root}`).then((response) =>
    json<Omit<PublicDocumentationSnapshot, "page">>(response),
  );
  const page =
    snapshot.pages.find(
      (candidate) => candidate.id === snapshot.revision.home_page_id,
    ) ?? snapshot.pages[0];
  if (!page) throw new Error("Documentation Page was not found");
  return {
    ...snapshot,
    page: {
      ...page,
      description: page.description ?? null,
      blocks: page.blocks ?? [],
    },
  };
};

export const searchPublicDocumentation = (
  slug: string,
  versionSlug: string | undefined,
  query: string,
) =>
  fetch(
    `${baseUrl()}${publicDocumentationPath(slug, versionSlug)}/search?q=${encodeURIComponent(query)}`,
  ).then((response) =>
    json<{
      results: Array<{
        page_id: string;
        title: string;
        excerpt: string;
        canonical_path: string;
      }>;
    }>(response),
  );
