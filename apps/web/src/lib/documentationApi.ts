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
