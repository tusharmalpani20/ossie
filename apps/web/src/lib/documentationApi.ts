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

type RawPublicDocumentationSnapshot = Omit<
  PublicDocumentationSnapshot,
  "site" | "revision" | "page"
> & {
  revision: {
    site_name: string;
    site_description: string | null;
    primary_language: string;
    home_page_id: string;
  };
  page?: PublicDocumentationSnapshot["page"];
  aliases?: Array<{
    former_path: string;
    documentation_page_id: string;
  }>;
  redirects?: Array<{
    source_path: string;
    outcome: "redirect" | "gone";
    target_page_id: string | null;
  }>;
};

const normalizePublicDocumentationSnapshot = (
  raw: RawPublicDocumentationSnapshot,
  page: PublicDocumentationSnapshot["page"],
): PublicDocumentationSnapshot => ({
  ...raw,
  site: {
    name: raw.revision.site_name,
    description: raw.revision.site_description,
  },
  revision: {
    primary_language: raw.revision.primary_language,
    home_page_id: raw.revision.home_page_id,
  },
  page,
});

const publicDocumentationPath = (slug: string, versionSlug?: string) =>
  versionSlug
    ? `/api/v1/public/publish-links/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionSlug)}/documentation`
    : `/api/v1/public/publish-links/${encodeURIComponent(slug)}/documentation`;

export class DocumentationCanonicalRedirect extends Error {
  constructor(readonly location: string) {
    super("Documentation Page moved permanently");
    this.name = "DocumentationCanonicalRedirect";
  }
}

export const getPublicDocumentationPage = async (
  slug: string,
  versionSlug?: string,
  pagePath?: string,
): Promise<PublicDocumentationSnapshot> => {
  const root = publicDocumentationPath(slug, versionSlug);
  if (pagePath?.startsWith("operations/")) {
    const operationKey = pagePath.slice("operations/".length);
    const raw = await fetch(`${baseUrl()}${root}`).then((response) =>
      json<RawPublicDocumentationSnapshot>(response),
    );
    const { operation } = await fetch(
      `${baseUrl()}${root}/operations/${encodeURIComponent(operationKey)}`,
    ).then((response) =>
      json<{
        operation: {
          destination_key: string;
          method: string;
          path: string;
          summary: string | null;
        };
      }>(response),
    );
    return normalizePublicDocumentationSnapshot(raw, {
      id: `operation:${operation.destination_key}`,
      title: operation.summary ?? `${operation.method.toUpperCase()} ${operation.path}`,
      description: `${operation.method.toUpperCase()} ${operation.path}`,
      canonical_path: pagePath,
      blocks: [
        {
          id: `operation:${operation.destination_key}:path`,
          kind: "code",
          position: 1,
          expected_version: 1,
          code: `${operation.method.toUpperCase()} ${operation.path}`,
          language: "http",
        },
      ],
    });
  }
  if (pagePath) {
    const raw = await fetch(`${baseUrl()}${root}`).then((response) =>
      json<RawPublicDocumentationSnapshot>(response),
    );
    const page = raw.pages.find(
      (candidate) => candidate.canonical_path === pagePath,
    );
    if (page)
      return normalizePublicDocumentationSnapshot(raw, {
        ...page,
        description: page.description ?? null,
        blocks: page.blocks ?? [],
      });
    const rule = raw.redirects?.find(
      (candidate) => candidate.source_path === pagePath,
    );
    if (rule?.outcome === "gone")
      throw new Error("Documentation Page is gone");
    const alias = raw.aliases?.find(
      (candidate) => candidate.former_path === pagePath,
    );
    const targetId = alias?.documentation_page_id ?? rule?.target_page_id;
    const target = raw.pages.find((candidate) => candidate.id === targetId);
    if (!target) throw new Error("Documentation Page was not found");
    const browserBase = versionSlug
      ? `/docs/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionSlug)}`
      : `/docs/${encodeURIComponent(slug)}`;
    throw new DocumentationCanonicalRedirect(
      `${browserBase}/${target.canonical_path}`,
    );
  }
  const snapshot = await fetch(`${baseUrl()}${root}`).then((response) =>
    json<RawPublicDocumentationSnapshot>(response),
  );
  const page =
    snapshot.pages.find(
      (candidate) => candidate.id === snapshot.revision.home_page_id,
    ) ?? snapshot.pages[0];
  if (!page) throw new Error("Documentation Page was not found");
  return normalizePublicDocumentationSnapshot(snapshot, {
    ...page,
    description: page.description ?? null,
    blocks: page.blocks ?? [],
  });
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

export type DocumentationCommentThread = {
  id: string;
  body: string;
  state: "open" | "resolved";
  version: number;
  block_anchor_id: string | null;
  replies: Array<{ id: string; body: string }>;
};

const commentsPath = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  pageId: string,
) => `${pagePath(projectId, versionSlug, siteId, pageId)}/comments`;

export const listDocumentationComments = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  pageId: string,
) =>
  fetch(
    `${baseUrl()}${commentsPath(projectId, versionSlug, siteId, pageId)}`,
    { credentials: "include" },
  ).then((response) =>
    json<{ comments: DocumentationCommentThread[] }>(response),
  );

export const createDocumentationComment = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  pageId: string,
  body: string,
) =>
  fetch(
    `${baseUrl()}${commentsPath(projectId, versionSlug, siteId, pageId)}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        body,
        block_anchor_id: null,
        mentioned_project_membership_ids: [],
      }),
    },
  ).then((response) =>
    json<{ thread: Omit<DocumentationCommentThread, "replies"> }>(response),
  );

const threadPath = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  threadId: string,
) =>
  `${sitePath(projectId, versionSlug, siteId)}/comments/${encodeURIComponent(threadId)}`;

export const createDocumentationCommentReply = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  threadId: string,
  body: string,
) =>
  fetch(`${baseUrl()}${threadPath(projectId, versionSlug, siteId, threadId)}/replies`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify({ body, mentioned_project_membership_ids: [] }),
  }).then((response) =>
    json<{ reply: { id: string; body: string } }>(response),
  );

export const transitionDocumentationComment = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  threadId: string,
  expectedVersion: number,
  transition: "resolve" | "reopen",
) =>
  fetch(`${baseUrl()}${threadPath(projectId, versionSlug, siteId, threadId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      expected_version: expectedVersion,
      transition,
    }),
  }).then((response) =>
    json<{ thread: Omit<DocumentationCommentThread, "replies"> }>(response),
  );
