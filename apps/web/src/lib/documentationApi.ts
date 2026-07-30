import type { DocumentationCreateSiteRequest } from "@repo/types";

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
