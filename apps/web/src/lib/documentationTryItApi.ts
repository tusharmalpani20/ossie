import {
  DocumentationPublishLinkTryItPolicyResponseSchema,
  DocumentationTryItConfigurationSchema,
  DocumentationTryItPolicyResponseSchema,
  type DocumentationTryItConfiguration,
} from "@repo/types";
import { DocumentationApiError } from "./documentationApi";

const baseUrl = () => import.meta.env.VITE_OSSIE_API_URL ?? "";

const errorFor = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as {
    error?: { type?: string; message?: string };
  } | null;
  return new DocumentationApiError(
    response.status,
    body?.error?.type ?? "documentation_try_it_request_failed",
    body?.error?.message ?? "Try It is unavailable.",
  );
};

const configurationResponse = async (
  response: Response,
): Promise<DocumentationTryItConfiguration> => {
  if (!response.ok) throw await errorFor(response);
  return DocumentationTryItConfigurationSchema.parse(await response.json());
};

const internalRoot = (projectId: string, versionSlug: string, siteId: string) =>
  `/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation-sites/${encodeURIComponent(siteId)}`;

const publicRoot = (slug: string, versionSlug?: string) =>
  versionSlug
    ? `/api/v1/public/publish-links/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionSlug)}/documentation`
    : `/api/v1/public/publish-links/${encodeURIComponent(slug)}/documentation`;

export const getPublicDocumentationTryItConfiguration = (
  slug: string,
  operationKey: string,
  versionSlug?: string,
) =>
  fetch(
    `${baseUrl()}${publicRoot(slug, versionSlug)}/operations/${encodeURIComponent(operationKey)}/try-it-configuration`,
    {
      credentials: "include",
      cache: "no-store",
      headers: { "x-ossie-access-surface": "public_reader" },
    },
  ).then(configurationResponse);

export const reportPublicDocumentationTryItAttempt = async (
  slug: string,
  operationKey: string,
  attemptToken: string,
  outcome:
    | "completed"
    | "browser_network_blocked"
    | "timed_out"
    | "aborted"
    | "response_blocked"
    | "client_validation_blocked",
  versionSlug?: string,
) => {
  const response = await fetch(
    `${baseUrl()}${publicRoot(slug, versionSlug)}/operations/${encodeURIComponent(operationKey)}/try-it-attempts`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-ossie-access-surface": "public_reader",
      },
      body: JSON.stringify({ attempt_token: attemptToken, outcome }),
    },
  );
  if (!response.ok) throw await errorFor(response);
};

export const getDocumentationTryItConfiguration = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  operationKey: string,
  selection:
    | { source: "draft" }
    | { source: "revision"; revision_number: number } = { source: "draft" },
) => {
  const query =
    selection.source === "draft"
      ? "source=draft"
      : `source=revision&revision_number=${selection.revision_number}`;
  return fetch(
    `${baseUrl()}${internalRoot(projectId, versionSlug, siteId)}/openapi/operations/${encodeURIComponent(operationKey)}/try-it-configuration?${query}`,
    { credentials: "include", cache: "no-store" },
  ).then(configurationResponse);
};

export const reportDocumentationTryItAttempt = async (
  projectId: string,
  versionSlug: string,
  siteId: string,
  operationKey: string,
  attemptToken: string,
  outcome:
    | "completed"
    | "browser_network_blocked"
    | "timed_out"
    | "aborted"
    | "response_blocked"
    | "client_validation_blocked",
  selection:
    | { source: "draft" }
    | { source: "revision"; revision_number: number } = { source: "draft" },
) => {
  const query =
    selection.source === "draft"
      ? "source=draft"
      : `source=revision&revision_number=${selection.revision_number}`;
  const response = await fetch(
    `${baseUrl()}${internalRoot(projectId, versionSlug, siteId)}/openapi/operations/${encodeURIComponent(operationKey)}/try-it-attempts?${query}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attempt_token: attemptToken, outcome }),
    },
  );
  if (!response.ok) throw await errorFor(response);
};

export const getDocumentationTryItPolicy = async (
  projectId: string,
  versionSlug: string,
  siteId: string,
) => {
  const response = await fetch(
    `${baseUrl()}${internalRoot(projectId, versionSlug, siteId)}/openapi/try-it-policy`,
    { credentials: "include", cache: "no-store" },
  );
  if (!response.ok) throw await errorFor(response);
  return DocumentationTryItPolicyResponseSchema.parse(await response.json());
};

export const putDocumentationTryItPolicy = async (
  projectId: string,
  versionSlug: string,
  siteId: string,
  input: {
    expected_policy_version: number | null;
    status: "disabled" | "enabled";
    approved_origin: string | null;
    base_path: string | null;
    allow_bearer: boolean;
    api_key_header_name: string | null;
    operation_destination_keys: string[];
  },
) => {
  const response = await fetch(
    `${baseUrl()}${internalRoot(projectId, versionSlug, siteId)}/openapi/try-it-policy`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) throw await errorFor(response);
  return response.json();
};

export const getDocumentationPublishLinkTryItPolicy = async (
  projectId: string,
  versionSlug: string,
  siteId: string,
  linkId: string,
) => {
  const response = await fetch(
    `${baseUrl()}${internalRoot(projectId, versionSlug, siteId)}/publish-links/${encodeURIComponent(linkId)}/try-it-policy`,
    { credentials: "include", cache: "no-store" },
  );
  if (!response.ok) throw await errorFor(response);
  return DocumentationPublishLinkTryItPolicyResponseSchema.parse(
    await response.json(),
  );
};

export const patchDocumentationPublishLinkTryItPolicy = async (
  projectId: string,
  versionSlug: string,
  siteId: string,
  linkId: string,
  input: {
    expected_policy_version: number | null;
    expected_link_version: number;
    enabled: boolean;
  },
) => {
  const response = await fetch(
    `${baseUrl()}${internalRoot(projectId, versionSlug, siteId)}/publish-links/${encodeURIComponent(linkId)}/try-it-policy`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) throw await errorFor(response);
  return response.json();
};
