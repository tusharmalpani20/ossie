import { createHash } from "node:crypto";
import { ulid } from "ulid";
import {
  DOCUMENTATION_COMMENT_REPLIES_PER_THREAD_MAX,
  DOCUMENTATION_COMMENT_THREADS_PER_PAGE_MAX,
  DOCUMENTATION_ASSETS_PER_EDITION_MAX,
  DOCUMENTATION_PAGES_PER_EDITION_MAX,
  DOCUMENTATION_SNIPPETS_PER_EDITION_MAX,
} from "@repo/constants";
import {
  assert_documentation_comment_transition,
  build_documentation_search_document,
  inspect_openapi_document,
  normalize_documentation_asset_name,
  normalize_documentation_snippet_name,
  validate_documentation_revision_aggregate,
  validate_documentation_navigation,
  validate_documentation_routes,
} from "@repo/documentation-domain";
import {
  DocumentationIdempotencyConflictError,
  DocumentationRowVersionConflictError,
} from "./documentation.service";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";

type QueryResult<Row> = { rows: Row[] };
type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};
type Client = Queryable & { release: () => void };
type Database = Queryable & { connect: () => Promise<Client> };

const with_transaction = async <T>(
  database: Database,
  work: (client: Queryable) => Promise<T>,
) => {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const lock_documentation_path_namespace = (
  client: Queryable,
  site_edition_id: string,
) =>
  client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", [
    site_edition_id,
  ]);

const validate_mutable_content_references = async (
  client: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    site_edition_id: string;
    owner_id: string;
    owner_kind: "page" | "snippet";
    blocks: Array<Record<string, unknown>>;
  },
) => {
  const table =
    input.owner_kind === "page"
      ? "documentation_page_block"
      : "documentation_snippet_block";
  const ownerColumn =
    input.owner_kind === "page"
      ? "documentation_page_id"
      : "documentation_snippet_id";
  const snippetSelect =
    input.owner_kind === "page" ? "snippet_id" : "NULL::varchar snippet_id";
  const previous = await client.query<{
    id: string;
    snippet_id: string | null;
    documentation_asset_id: string | null;
    capture_asset_id: string | null;
    version: number;
  }>(
    `SELECT id,${snippetSelect},documentation_asset_id,capture_asset_id,version
       FROM documentation_schema.${table}
      WHERE ${ownerColumn}=$1 AND organization_id=$2 AND project_id=$3
      ORDER BY id FOR SHARE`,
    [input.owner_id, input.organization_id, input.project_id],
  );
  const priorByBlock = new Map(previous.rows.map((row) => [row.id, row]));
  const snippetIds = input.blocks
    .filter((block) => block.kind === "snippet_reference")
    .map((block) => String(block.snippet_id));
  const documentationAssetIds: string[] = [];
  const captureAssetIds: string[] = [];
  const linkedPageIds: string[] = [];
  const openApiSourceIds: string[] = [];
  const publicationIds: string[] = [];
  for (const block of input.blocks) {
    if (block.kind === "link" && block.page_id)
      linkedPageIds.push(String(block.page_id));
    if (block.kind === "api_reference")
      openApiSourceIds.push(String(block.openapi_source_id));
    if (
      block.kind === "guide_publication" ||
      block.kind === "interactive_demo_publication"
    )
      publicationIds.push(String(block.published_artifact_id));
    if (block.kind !== "image") continue;
    const source =
      block.source && typeof block.source === "object"
        ? (block.source as { kind: string; id: string })
        : block.asset_id
          ? { kind: "documentation_asset", id: String(block.asset_id) }
          : null;
    if (source?.kind === "documentation_asset")
      documentationAssetIds.push(source.id);
    if (source?.kind === "capture_asset") captureAssetIds.push(source.id);
  }
  const snippets = snippetIds.length
    ? await client.query<{ id: string; status: "active" | "archived" }>(
        `SELECT id,status
           FROM documentation_schema.documentation_snippet
          WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3
            AND id=ANY($4::varchar[])
          ORDER BY id FOR SHARE`,
        [
          input.site_edition_id,
          input.organization_id,
          input.project_id,
          snippetIds,
        ],
      )
    : { rows: [] };
  const documentationAssets = documentationAssetIds.length
    ? await client.query<{ id: string; status: "active" | "archived" }>(
        `SELECT id,status
           FROM documentation_schema.documentation_asset
          WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3
            AND id=ANY($4::varchar[])
          ORDER BY id FOR SHARE`,
        [
          input.site_edition_id,
          input.organization_id,
          input.project_id,
          documentationAssetIds,
        ],
      )
    : { rows: [] };
  const captureAssets = captureAssetIds.length
    ? await client.query<{ id: string; status: "active" | "archived" }>(
        `SELECT asset.id,asset.status
           FROM capture_schema.capture_asset asset
           JOIN file_schema.file file
             ON file.id=asset.file_id AND file.organization_id=asset.organization_id
          WHERE asset.organization_id=$1 AND asset.project_id=$2
            AND asset.id=ANY($3::varchar[])
            AND asset.is_deleted=FALSE AND file.is_deleted=FALSE
            AND asset.asset_type IN ('screenshot','redacted_screenshot')
            AND file.mime_type IN ('image/png','image/jpeg','image/webp')
            AND NOT EXISTS (
              SELECT 1
                FROM capture_schema.capture_asset_purge_operation purge
               WHERE purge.capture_asset_id=asset.id
            )
          ORDER BY asset.id FOR SHARE OF asset,file`,
        [input.organization_id, input.project_id, captureAssetIds],
      )
    : { rows: [] };
  const linkedPages = linkedPageIds.length
    ? await client.query<{ id: string; linked_block_id: string | null }>(
        `SELECT page.id,block.id linked_block_id
           FROM documentation_schema.documentation_page page
           LEFT JOIN documentation_schema.documentation_page_block block
             ON block.documentation_page_id=page.id
          WHERE page.site_edition_id=$1 AND page.organization_id=$2
            AND page.project_id=$3 AND page.id=ANY($4::varchar[])
          ORDER BY page.id,block.id FOR SHARE OF page`,
        [
          input.site_edition_id,
          input.organization_id,
          input.project_id,
          linkedPageIds,
        ],
      )
    : { rows: [] };
  const openApiSources = openApiSourceIds.length
    ? await client.query<{
        id: string;
        destination_key: string | null;
      }>(
        `SELECT source.id,operation.destination_key
           FROM documentation_schema.openapi_source source
           LEFT JOIN documentation_schema.openapi_operation operation
             ON operation.openapi_source_id=source.id
          WHERE source.site_edition_id=$1 AND source.organization_id=$2
            AND source.project_id=$3 AND source.id=ANY($4::varchar[])
          ORDER BY source.id,operation.destination_key
          FOR SHARE OF source`,
        [
          input.site_edition_id,
          input.organization_id,
          input.project_id,
          openApiSourceIds,
        ],
      )
    : { rows: [] };
  const publications = publicationIds.length
    ? await client.query<{ id: string; artifact_type: string }>(
        `SELECT id,artifact_type
           FROM publish_schema.published_artifact
          WHERE organization_id=$1 AND project_id=$2
            AND id=ANY($3::varchar[])
          ORDER BY id FOR SHARE`,
        [input.organization_id, input.project_id, publicationIds],
      )
    : { rows: [] };
  const snippetStatus = new Map(
    snippets.rows.map((row) => [row.id, row.status]),
  );
  const documentationAssetStatus = new Map(
    documentationAssets.rows.map((row) => [row.id, row.status]),
  );
  const captureAssetStatus = new Map(
    captureAssets.rows.map((row) => [row.id, row.status]),
  );
  const linkedPageSet = new Set(linkedPages.rows.map((row) => row.id));
  const linkedHeadingSet = new Set(
    linkedPages.rows
      .filter((row) => row.linked_block_id)
      .map((row) => `${row.id}:${row.linked_block_id}`),
  );
  const openApiSourceSet = new Set(openApiSources.rows.map((row) => row.id));
  const openApiOperationSet = new Set(
    openApiSources.rows
      .filter((row) => row.destination_key)
      .map((row) => `${row.id}:${row.destination_key}`),
  );
  const publicationType = new Map(
    publications.rows.map((row) => [row.id, row.artifact_type]),
  );
  for (const block of input.blocks) {
    const prior = priorByBlock.get(String(block.id));
    const expectedVersion =
      typeof block.expected_version === "number"
        ? block.expected_version
        : null;
    if (
      (prior && expectedVersion !== prior.version) ||
      (!prior && expectedVersion !== null)
    ) {
      const error = new Error("Documentation content changed");
      Object.assign(error, { code: "documentation_row_version_conflict" });
      throw error;
    }
    if (block.kind === "link" && block.page_id) {
      const pageId = String(block.page_id);
      const targetBlockId = block.target_block_id
        ? String(block.target_block_id)
        : null;
      if (
        !linkedPageSet.has(pageId) ||
        (targetBlockId && !linkedHeadingSet.has(`${pageId}:${targetBlockId}`))
      ) {
        const error = new Error("Documentation internal link is broken");
        Object.assign(error, { code: "documentation_internal_link_broken" });
        throw error;
      }
    }
    if (block.kind === "api_reference") {
      const sourceId = String(block.openapi_source_id);
      const operationKey = block.operation_key
        ? String(block.operation_key)
        : null;
      if (
        !openApiSourceSet.has(sourceId) ||
        (operationKey &&
          !openApiOperationSet.has(`${sourceId}:${operationKey}`))
      ) {
        const error = new Error("OpenAPI reference is unavailable");
        Object.assign(error, { code: "documentation_revision_invalid" });
        throw error;
      }
    }
    if (
      block.kind === "guide_publication" ||
      block.kind === "interactive_demo_publication"
    ) {
      const id = String(block.published_artifact_id);
      const expectedType =
        block.kind === "guide_publication" ? "guide" : "interactive_demo";
      const actualType = publicationType.get(id);
      if (!actualType) {
        const error = new Error("Artifact Publication was not found");
        Object.assign(error, {
          code: "documentation_artifact_publication_not_found",
        });
        throw error;
      }
      if (actualType !== expectedType) {
        const error = new Error("Artifact Publication type does not match");
        Object.assign(error, {
          code: "documentation_artifact_publication_type_mismatch",
        });
        throw error;
      }
    }
    if (block.kind === "snippet_reference") {
      const id = String(block.snippet_id);
      const status = snippetStatus.get(id);
      if (!status) {
        const error = new Error("Documentation Snippet is unavailable");
        Object.assign(error, { code: "documentation_snippet_not_found" });
        throw error;
      }
      if (status === "archived" && prior?.snippet_id !== id) {
        const error = new Error("Archived Snippet cannot be introduced");
        Object.assign(error, { code: "documentation_snippet_archived" });
        throw error;
      }
    }
    if (block.kind !== "image") continue;
    const source =
      block.source && typeof block.source === "object"
        ? (block.source as { kind: string; id: string })
        : block.asset_id
          ? { kind: "documentation_asset", id: String(block.asset_id) }
          : null;
    if (!source) continue;
    const status =
      source.kind === "documentation_asset"
        ? documentationAssetStatus.get(source.id)
        : captureAssetStatus.get(source.id);
    if (!status) {
      const error = new Error("Asset source is unavailable");
      Object.assign(error, { code: "documentation_asset_source_unavailable" });
      throw error;
    }
    const retained =
      source.kind === "documentation_asset"
        ? prior?.documentation_asset_id === source.id
        : prior?.capture_asset_id === source.id;
    if (status === "archived" && !retained) {
      const error = new Error("Archived Asset cannot be introduced");
      Object.assign(error, { code: "documentation_asset_archived" });
      throw error;
    }
  }
};

const command_digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const read_command_receipt = async (
  client: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    operation: string;
    idempotency_key: string;
    request_digest: string;
  },
) => {
  const receipt = await client.query<{
    request_digest: string;
    response_body: Record<string, unknown>;
  }>(
    `SELECT request_digest,response_body
       FROM documentation_schema.documentation_command_receipt
      WHERE organization_id=$1 AND project_id=$2
        AND operation=$3 AND idempotency_key=$4`,
    [
      input.organization_id,
      input.project_id,
      input.operation,
      input.idempotency_key,
    ],
  );
  if (!receipt.rows[0]) return null;
  if (receipt.rows[0].request_digest !== input.request_digest)
    throw new DocumentationIdempotencyConflictError();
  return { ...receipt.rows[0].response_body, idempotent_replay: true };
};

const write_command_receipt = async (
  client: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    actor_org_user_id: string;
    operation: string;
    idempotency_key: string;
    request_digest: string;
    response_status: number;
    response_body: unknown;
  },
) =>
  client.query(
    `INSERT INTO documentation_schema.documentation_command_receipt
      (id,organization_id,project_id,operation,idempotency_key,request_digest,
       response_status,response_body,created_by_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
    [
      ulid(),
      input.organization_id,
      input.project_id,
      input.operation,
      input.idempotency_key,
      input.request_digest,
      input.response_status,
      JSON.stringify(input.response_body),
      input.actor_org_user_id,
    ],
  );

const insert_comment_mentions = async (
  client: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    site_edition_id: string;
    thread_id: string;
    reply_id: string | null;
    actor_org_user_id: string;
    project_membership_ids: string[];
  },
) => {
  const uniqueIds = [...new Set(input.project_membership_ids)];
  if (!uniqueIds.length) return;
  const memberships = await client.query<{
    id: string;
    org_user_id: string;
  }>(
    `SELECT id,org_user_id
       FROM project_schema.project_membership
      WHERE organization_id=$1 AND project_id=$2 AND status='active'
        AND id=ANY($3::varchar[])`,
    [input.organization_id, input.project_id, uniqueIds],
  );
  if (memberships.rows.length !== uniqueIds.length) {
    const error = new Error("Mention must target an active Project member");
    Object.assign(error, { code: "documentation_comment_invalid" });
    throw error;
  }
  for (const membership of memberships.rows) {
    await client.query(
      `INSERT INTO documentation_schema.comment_mention
        (id,organization_id,project_id,site_edition_id,comment_thread_id,
         comment_reply_id,project_membership_id,mentioned_org_user_id,
         created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        ulid(),
        input.organization_id,
        input.project_id,
        input.site_edition_id,
        input.thread_id,
        input.reply_id,
        membership.id,
        membership.org_user_id,
        input.actor_org_user_id,
      ],
    );
  }
};

const bump_working_draft = (
  client: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    site_edition_id: string;
    actor_org_user_id: string;
  },
) =>
  client.query(
    `UPDATE documentation_schema.site_working_draft
        SET version=version+1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP
      WHERE organization_id=$2 AND project_id=$3 AND site_edition_id=$4`,
    [
      input.actor_org_user_id,
      input.organization_id,
      input.project_id,
      input.site_edition_id,
    ],
  );

const search_text_for_blocks = (
  title: string,
  description: string | null,
  blocks: Array<Record<string, unknown>>,
) => {
  const headings: string[] = [];
  const body: string[] = [];
  for (const block of blocks) {
    if (block.kind === "heading" && typeof block.text === "string")
      headings.push(block.text);
    for (const field of [
      "text",
      "code",
      "label",
      "title",
      "attribution",
      "alt_text",
      "caption",
    ]) {
      const value = block[field];
      if (typeof value === "string") body.push(value);
    }
    if (Array.isArray(block.items))
      for (const item of block.items) {
        if (typeof item !== "object" || item === null) continue;
        for (const field of ["text", "label", "body"]) {
          const value = (item as Record<string, unknown>)[field];
          if (typeof value === "string") body.push(value);
        }
      }
    if (Array.isArray(block.rows))
      for (const row of block.rows)
        if (
          typeof row === "object" &&
          row !== null &&
          "cells" in row &&
          Array.isArray(row.cells)
        )
          for (const cell of row.cells)
            if (
              typeof cell === "object" &&
              cell !== null &&
              "text" in cell &&
              typeof cell.text === "string"
            )
              body.push(cell.text);
  }
  return build_documentation_search_document({
    title,
    description,
    headings,
    body_text: body.join(" "),
  }).text;
};

const insert_draft_search_document = (
  client: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    site_edition_id: string;
    page_id: string;
    title: string;
    description: string | null;
    canonical_path: string;
    search_text: string;
  },
) =>
  client.query(
    `INSERT INTO documentation_schema.documentation_draft_search_document
      (id,organization_id,project_id,project_version_id,documentation_site_id,
       site_edition_id,documentation_page_id,title,description,canonical_path,
       search_text)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (documentation_page_id) DO UPDATE
       SET title=EXCLUDED.title,description=EXCLUDED.description,
           canonical_path=EXCLUDED.canonical_path,
           search_text=EXCLUDED.search_text,updated_at=CURRENT_TIMESTAMP`,
    [
      ulid(),
      input.organization_id,
      input.project_id,
      input.project_version_id,
      input.site_id,
      input.site_edition_id,
      input.page_id,
      input.title,
      input.description,
      input.canonical_path,
      input.search_text,
    ],
  );

const begin_documentation_audit_context = async (
  client: Queryable,
  input: {
    organization_id: string;
    actor_org_user_id: string;
    command: string;
    action: string;
  },
) => {
  const event_id = ulid();
  const context = await resolve_org_user_audit_context(client, input);
  for (const [name, value] of [
    ["ossie.audit_event_id", event_id],
    ["ossie.audit_organization_id", input.organization_id],
    ["ossie.audit_action", input.action],
    ["ossie.audit_command", input.command],
    ["ossie.audit_actor_type", "org_user"],
    ["ossie.audit_source_type", context.mutation.source_type],
  ]) {
    await client.query("SELECT set_config($1,$2,true)", [name, value]);
  }
  return {
    event_id,
    actor_label: context.actor_label,
    source_type: context.mutation.source_type,
    occurred_at: new Date().toISOString(),
  };
};

const write_documentation_audit_event = async (
  client: Queryable,
  input: {
    audit: Awaited<ReturnType<typeof begin_documentation_audit_context>>;
    organization_id: string;
    project_id: string;
    site_id: string;
    actor_org_user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    before_version: number | null;
    after_version: number | null;
  },
) => {
  const before =
    input.before_version === null ? null : { version: input.before_version };
  const after =
    input.after_version === null ? null : { version: input.after_version };
  const audit_event = build_entity_audit_event({
    id: input.audit.event_id,
    organization_id: input.organization_id,
    project_id: input.project_id,
    root_resource_type: "documentation_site",
    root_resource_id: input.site_id,
    action: input.action,
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.audit.actor_label,
    source_type: input.audit.source_type,
    occurred_at: input.audit.occurred_at,
    before_row_version: input.before_version,
    after_row_version: input.after_version,
    changes: [
      {
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        parent_entity_type: "documentation_site",
        parent_entity_id: input.site_id,
        before,
        after,
        safe_fields:
          before && after ? { version: "integer" as const } : undefined,
      },
    ],
  });
  if (audit_event) await write_audit_event(client, audit_event);
};

type CreateSiteInput = {
  organization_id: string;
  project_id: string;
  project_version_id: string;
  actor_org_user_id: string;
  idempotency_key: string;
  name: string;
  description: string | null;
  primary_language: string;
  initial_home_page?: { title: string; path: string };
};

const to_documentation_block = (row: Record<string, unknown>) => {
  const base = {
    id: row.id,
    kind: row.kind,
    position: row.position,
    expected_version: row.version,
  };
  switch (row.kind) {
    case "paragraph":
      return { ...base, text: row.text_content };
    case "heading":
      return { ...base, level: row.heading_level, text: row.text_content };
    case "code":
      return {
        ...base,
        code: row.text_content,
        language: row.code_language,
      };
    case "link":
      return {
        ...base,
        label: row.text_content,
        ...(row.link_url
          ? { url: row.link_url }
          : { page_id: row.linked_page_id }),
        ...(row.linked_block_id
          ? { target_block_id: row.linked_block_id }
          : {}),
      };
    case "image":
      return {
        ...base,
        source: row.capture_asset_id
          ? { kind: "capture_asset", id: row.capture_asset_id }
          : {
              kind: "documentation_asset",
              id: row.documentation_asset_id,
            },
        alt_text: row.alt_text,
        caption: row.image_caption,
      };
    case "ordered_list":
    case "unordered_list":
      return { ...base, items: row.items };
    case "api_reference":
      return {
        ...base,
        openapi_source_id: row.openapi_source_id,
        operation_key: row.operation_key,
      };
    case "divider":
      return base;
    case "quote":
      return {
        ...base,
        text: row.text_content,
        attribution: row.quote_attribution,
      };
    case "table":
      return { ...base, caption: row.table_caption, rows: row.rows };
    case "code_example":
      return {
        ...base,
        code: row.text_content,
        language: row.code_language,
        title: row.display_title,
      };
    case "callout":
      return {
        ...base,
        tone: row.callout_tone,
        title: row.display_title,
        text: row.text_content,
      };
    case "tabs":
      return { ...base, items: row.items };
    case "snippet_reference":
      return { ...base, snippet_id: row.snippet_id };
    case "guide_publication":
    case "interactive_demo_publication":
      return {
        ...base,
        published_artifact_id: row.published_artifact_id,
        ...(row.artifact_reference
          ? { publication: row.artifact_reference }
          : {}),
      };
    default:
      return base;
  }
};

const load_draft_snapshot = async (
  db: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
  },
) => {
  const aggregate = await db.query<{
    site_id: string;
    site_name: string;
    site_description: string | null;
    site_edition_id: string;
    primary_language: string;
    working_draft_id: string;
    home_page_id: string | null;
    draft_version: number;
    navigation_version: number;
    routing_version: number;
  }>(
    `SELECT site.id site_id,site.name site_name,
            site.description site_description,edition.id site_edition_id,
            edition.primary_language,draft.id working_draft_id,
            draft.home_page_id,draft.version draft_version,
            navigation.version navigation_version,
            routing.version routing_version
       FROM documentation_schema.documentation_site site
       JOIN documentation_schema.site_edition edition
         ON edition.documentation_site_id=site.id
       JOIN documentation_schema.site_working_draft draft
         ON draft.site_edition_id=edition.id
       JOIN documentation_schema.navigation_tree navigation
         ON navigation.site_edition_id=edition.id
       JOIN documentation_schema.routing_set routing
         ON routing.site_edition_id=edition.id
      WHERE site.organization_id=$1 AND site.project_id=$2
        AND edition.project_version_id=$3 AND site.id=$4`,
    [
      input.organization_id,
      input.project_id,
      input.project_version_id,
      input.site_id,
    ],
  );
  const root = aggregate.rows[0];
  if (!root) return null;
  const pages = await db.query<{
    id: string;
    title: string;
    description: string | null;
    canonical_path: string;
    version: number;
  }>(
    `SELECT id,title,description,canonical_path,version
       FROM documentation_schema.documentation_page
      WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3
      ORDER BY canonical_path,id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const pageIds = pages.rows.map((page) => page.id as string);
  const blocks = pageIds.length
    ? await db.query<Record<string, unknown>>(
        `SELECT block.id,block.documentation_page_id,block.kind,block.position,
                block.heading_level,block.text_content,block.code_language,
                block.link_url,block.linked_page_id,block.linked_block_id,
                block.documentation_asset_id,block.capture_asset_id,
                block.openapi_source_id,block.operation_key,block.snippet_id,
                block.published_artifact_id,block.callout_tone,
                block.display_title,block.quote_attribution,
                block.table_caption,block.alt_text,block.image_caption,
                block.version,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',item.id,'text',item.text_content,
                    'position',item.position,'expected_version',item.version
                  ) ORDER BY item.position,item.id)
                    FROM documentation_schema.documentation_list_item item
                   WHERE item.documentation_page_block_id=block.id
                ),'[]'::jsonb) list_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',tab.id,'label',tab.label,'body',tab.body,
                    'position',tab.position,'expected_version',tab.version
                  ) ORDER BY tab.position,tab.id)
                    FROM documentation_schema.documentation_tab_item tab
                   WHERE tab.documentation_page_block_id=block.id
                ),'[]'::jsonb) tab_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',row.id,'position',row.position,
                    'expected_version',row.version,'cells',(
                      SELECT jsonb_agg(jsonb_build_object(
                        'id',cell.id,
                        'column_position',cell.column_position,
                        'expected_version',cell.version,
                        'is_header',cell.is_header,'text',cell.text_content
                      ) ORDER BY cell.column_position,cell.id)
                      FROM documentation_schema.documentation_table_cell cell
                      WHERE cell.documentation_table_row_id=row.id
                    )
                  ) ORDER BY row.position,row.id)
                  FROM documentation_schema.documentation_table_row row
                  WHERE row.documentation_page_block_id=block.id
                ),'[]'::jsonb) rows
           FROM documentation_schema.documentation_page_block block
          WHERE block.organization_id=$1 AND block.project_id=$2
            AND block.documentation_page_id=ANY($3::varchar[])
          ORDER BY block.documentation_page_id,block.position,block.id`,
        [input.organization_id, input.project_id, pageIds],
      )
    : { rows: [] };
  const keywords = pageIds.length
    ? await db.query<Record<string, unknown>>(
        `SELECT id,documentation_page_id,keyword,position,version
           FROM documentation_schema.documentation_page_keyword
          WHERE organization_id=$1 AND project_id=$2
            AND documentation_page_id=ANY($3::varchar[])
          ORDER BY documentation_page_id,position,id`,
        [input.organization_id, input.project_id, pageIds],
      )
    : { rows: [] };
  const navigation = await db.query<Record<string, unknown>>(
    `SELECT node.id,node.parent_id,node.kind,node.label,
            node.documentation_page_id page_id,node.position,node.version
       FROM documentation_schema.navigation_node node
      WHERE node.organization_id=$1 AND node.project_id=$2
        AND node.site_edition_id=$3
      ORDER BY node.parent_id NULLS FIRST,node.position,node.id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const aliases = await db.query<Record<string, unknown>>(
    `SELECT id,documentation_page_id,former_path
       FROM documentation_schema.page_slug_alias
      WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3
      ORDER BY former_path,id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const redirects = await db.query<Record<string, unknown>>(
    `SELECT id,source_path,outcome,target_page_id,version
       FROM documentation_schema.documentation_redirect_rule
      WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3
      ORDER BY source_path,id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const operations = await db.query<Record<string, unknown>>(
    `SELECT operation.id,operation.method,operation.path,
            operation.operation_id,operation.destination_key,
            operation.summary,operation.openapi_source_id
       FROM documentation_schema.openapi_operation operation
      WHERE operation.organization_id=$1 AND operation.project_id=$2
        AND operation.site_edition_id=$3
      ORDER BY operation.destination_key,operation.id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const assets = await db.query<Record<string, unknown>>(
    `SELECT id,file_id,mime_type,byte_size,width,height,digest,name,status,version
       FROM documentation_schema.documentation_asset
      WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3
      ORDER BY id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const snippets = await db.query<Record<string, unknown>>(
    `SELECT id,name,status,version
       FROM documentation_schema.documentation_snippet
      WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3
      ORDER BY lower(name),id`,
    [input.organization_id, input.project_id, root.site_edition_id],
  );
  const snippetIds = snippets.rows.map((snippet) => snippet.id as string);
  const snippetBlocks = snippetIds.length
    ? await db.query<Record<string, unknown>>(
        `SELECT block.id,block.documentation_snippet_id,block.kind,
                block.position,block.heading_level,block.text_content,
                block.code_language,block.link_url,block.linked_page_id,
                block.linked_block_id,block.documentation_asset_id,
                block.capture_asset_id,block.openapi_source_id,
                block.operation_key,block.published_artifact_id,
                block.callout_tone,block.display_title,
                block.quote_attribution,block.table_caption,block.alt_text,
                block.image_caption,block.version,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',item.id,'text',item.text_content,
                    'position',item.position,'expected_version',item.version
                  ) ORDER BY item.position,item.id)
                    FROM documentation_schema.documentation_snippet_list_item item
                   WHERE item.documentation_snippet_block_id=block.id
                ),'[]'::jsonb) list_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',tab.id,'label',tab.label,'body',tab.body,
                    'position',tab.position,'expected_version',tab.version
                  ) ORDER BY tab.position,tab.id)
                    FROM documentation_schema.documentation_snippet_tab_item tab
                   WHERE tab.documentation_snippet_block_id=block.id
                ),'[]'::jsonb) tab_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',row.id,'position',row.position,
                    'expected_version',row.version,'cells',(
                      SELECT jsonb_agg(jsonb_build_object(
                        'id',cell.id,
                        'column_position',cell.column_position,
                        'expected_version',cell.version,
                        'is_header',cell.is_header,'text',cell.text_content
                      ) ORDER BY cell.column_position,cell.id)
                      FROM documentation_schema.documentation_snippet_table_cell cell
                      WHERE cell.documentation_snippet_table_row_id=row.id
                    )
                  ) ORDER BY row.position,row.id)
                  FROM documentation_schema.documentation_snippet_table_row row
                  WHERE row.documentation_snippet_block_id=block.id
                ),'[]'::jsonb) rows
           FROM documentation_schema.documentation_snippet_block block
          WHERE block.organization_id=$1 AND block.project_id=$2
            AND block.documentation_snippet_id=ANY($3::varchar[])
          ORDER BY block.documentation_snippet_id,block.position,block.id`,
        [input.organization_id, input.project_id, snippetIds],
      )
    : { rows: [] };
  return {
    site: {
      id: root.site_id,
      name: root.site_name,
      description: root.site_description,
    },
    edition: {
      id: root.site_edition_id,
      project_version_id: input.project_version_id,
      primary_language: root.primary_language,
    },
    working_draft: {
      id: root.working_draft_id,
      home_page_id: root.home_page_id,
      version: root.draft_version,
    },
    pages: pages.rows.map((page) => ({
      ...page,
      keywords: keywords.rows
        .filter((keyword) => keyword.documentation_page_id === page.id)
        .map((keyword) => ({
          id: keyword.id,
          keyword: keyword.keyword,
          position: keyword.position,
          expected_version: keyword.version,
        })),
      blocks: blocks.rows
        .filter((block) => block.documentation_page_id === page.id)
        .map((row) =>
          to_documentation_block({
            ...row,
            items: row.kind === "tabs" ? row.tab_items : row.list_items,
          }),
        ),
    })),
    navigation: {
      version: root.navigation_version,
      nodes: navigation.rows,
    },
    routing: {
      version: root.routing_version,
      aliases: aliases.rows,
      rules: redirects.rows,
    },
    openapi_operations: operations.rows,
    assets: assets.rows,
    snippets: snippets.rows.map((snippet) => ({
      id: snippet.id as string,
      name: snippet.name as string,
      status: snippet.status as "active" | "archived",
      version: snippet.version as number,
      blocks: snippetBlocks.rows
        .filter((block) => block.documentation_snippet_id === snippet.id)
        .map((row) =>
          to_documentation_block({
            ...row,
            items: row.kind === "tabs" ? row.tab_items : row.list_items,
          }),
        ),
    })),
  };
};

const load_revision_snapshot = async (
  db: Queryable,
  input: {
    site_revision_id: string;
    organization_id?: string;
    project_id?: string;
    project_version_id?: string;
    site_id?: string;
  },
) => {
  const values: unknown[] = [input.site_revision_id];
  const scope =
    input.organization_id && input.project_id
      ? "AND revision.organization_id=$2 AND revision.project_id=$3"
      : "";
  if (scope) values.push(input.organization_id, input.project_id);
  const versionScope = input.project_version_id
    ? `AND revision.project_version_id=$${values.push(input.project_version_id)}`
    : "";
  const siteScope = input.site_id
    ? `AND revision.documentation_site_id=$${values.push(input.site_id)}`
    : "";
  const revision = await db.query<{
    id: string;
    documentation_site_id: string;
    site_edition_id: string;
    project_version_id: string;
    revision_number: number;
    site_name: string;
    site_description: string | null;
    home_page_id: string;
    primary_language: string;
    content_digest: string;
    created_at: Date;
  }>(
    `SELECT revision.id,revision.documentation_site_id,
            revision.site_edition_id,revision.project_version_id,
            revision.revision_number,revision.site_name,
            revision.site_description,revision.home_page_id,
            revision.primary_language,revision.content_digest,
            revision.created_at
       FROM documentation_schema.site_revision revision
      WHERE revision.id=$1 ${scope} ${versionScope} ${siteScope}`,
    values,
  );
  const root = revision.rows[0];
  if (!root) return null;
  const pages = await db.query<Record<string, unknown>>(
    `SELECT id,source_page_id,title,description,canonical_path,content_text
       FROM documentation_schema.site_revision_page
      WHERE site_revision_id=$1 ORDER BY canonical_path,id`,
    [root.id],
  );
  const pageRowIds = pages.rows.map((page) => page.id as string);
  const blocks = pageRowIds.length
    ? await db.query<Record<string, unknown>>(
        `SELECT block.id,block.site_revision_page_id,
                block.source_block_id id,block.kind,block.position,
                block.heading_level,block.text_content,block.code_language,
                block.link_url,block.linked_source_page_id linked_page_id,
                block.linked_source_block_id linked_block_id,
                CASE WHEN block.source_kind='documentation_asset'
                  THEN block.source_asset_id END documentation_asset_id,
                CASE WHEN block.source_kind='capture_asset'
                  THEN block.source_asset_id END capture_asset_id,
                block.source_snippet_id snippet_id,
                block.source_openapi_source_id openapi_source_id,
                block.operation_key,block.published_artifact_id,
                block.callout_tone,block.display_title,
                block.quote_attribution,block.table_caption,
                block.alt_text,block.image_caption,
                1 version,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',item.source_list_item_id,'text',item.text_content,
                    'position',item.position,'expected_version',1
                  ) ORDER BY item.position,item.id)
                    FROM documentation_schema.site_revision_list_item item
                   WHERE item.site_revision_page_block_id=block.id
                ),'[]'::jsonb) list_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',item.source_tab_item_id,'label',item.label,
                    'body',item.body,'position',item.position,
                    'expected_version',1
                  ) ORDER BY item.position,item.id)
                    FROM documentation_schema.site_revision_page_tab_item item
                   WHERE item.site_revision_page_block_id=block.id
                ),'[]'::jsonb) tab_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',row.source_row_id,'position',row.position,
                    'expected_version',1,'cells',(
                      SELECT jsonb_agg(jsonb_build_object(
                        'id',cell.source_cell_id,
                        'column_position',cell.column_position,
                        'expected_version',1,'is_header',cell.is_header,
                        'text',cell.text_content
                      ) ORDER BY cell.column_position,cell.id)
                      FROM documentation_schema.site_revision_page_table_cell cell
                      WHERE cell.site_revision_page_table_row_id=row.id
                    )
                  ) ORDER BY row.position,row.id)
                  FROM documentation_schema.site_revision_page_table_row row
                  WHERE row.site_revision_page_block_id=block.id
                ),'[]'::jsonb) rows,
                (
                  SELECT jsonb_build_object(
                    'published_artifact_id',reference.published_artifact_id,
                    'artifact_type',reference.artifact_type,
                    'title',reference.frozen_title,
                    'description',reference.frozen_description,
                    'project_version',jsonb_build_object(
                      'id',reference.project_version_id,
                      'name',reference.project_version_name,
                      'slug',reference.project_version_slug
                    ),
                    'revision_number',reference.revision_number,
                    'publication_sequence',reference.publication_sequence
                  )
                  FROM documentation_schema.site_revision_artifact_reference reference
                  WHERE reference.site_revision_id=block.site_revision_id
                    AND reference.source_block_id=block.source_block_id
                ) artifact_reference
           FROM documentation_schema.site_revision_page_block block
          WHERE block.site_revision_id=$1
          ORDER BY block.site_revision_page_id,block.position,block.id`,
        [root.id],
      )
    : { rows: [] };
  const keywords = await db.query<Record<string, unknown>>(
    `SELECT site_revision_page_id,keyword,position
       FROM documentation_schema.site_revision_page_keyword
      WHERE site_revision_id=$1 ORDER BY site_revision_page_id,position,id`,
    [root.id],
  );
  const navigation = await db.query<Record<string, unknown>>(
    `SELECT source_navigation_node_id id,
            parent_source_navigation_node_id parent_id,kind,label,
            source_page_id page_id,position
       FROM documentation_schema.site_revision_navigation_node
      WHERE site_revision_id=$1 ORDER BY parent_source_navigation_node_id NULLS FIRST,position,id`,
    [root.id],
  );
  const aliases = await db.query<Record<string, unknown>>(
    `SELECT source_page_id documentation_page_id,former_path
       FROM documentation_schema.site_revision_page_alias
      WHERE site_revision_id=$1 ORDER BY former_path,id`,
    [root.id],
  );
  const redirects = await db.query<Record<string, unknown>>(
    `SELECT source_path,outcome,target_source_page_id target_page_id
       FROM documentation_schema.site_revision_redirect_rule
      WHERE site_revision_id=$1 ORDER BY source_path,id`,
    [root.id],
  );
  const operations = await db.query<Record<string, unknown>>(
    `SELECT source_openapi_operation_id id,method,path,operation_id,
            destination_key,summary
       FROM documentation_schema.site_revision_openapi_operation
      WHERE site_revision_id=$1 ORDER BY destination_key,id`,
    [root.id],
  );
  const snippets = await db.query<Record<string, unknown>>(
    `SELECT id,source_snippet_id,name,source_status
       FROM documentation_schema.site_revision_snippet
      WHERE site_revision_id=$1 ORDER BY lower(name),source_snippet_id`,
    [root.id],
  );
  const snippetRowIds = snippets.rows.map((snippet) => snippet.id as string);
  const snippetBlocks = snippetRowIds.length
    ? await db.query<Record<string, unknown>>(
        `SELECT block.id,block.site_revision_snippet_id,
                block.source_block_id id,block.kind,block.position,
                block.heading_level,block.text_content,block.code_language,
                block.link_url,block.linked_source_page_id linked_page_id,
                block.linked_source_block_id linked_block_id,
                CASE WHEN block.source_kind='documentation_asset'
                  THEN block.source_asset_id END documentation_asset_id,
                CASE WHEN block.source_kind='capture_asset'
                  THEN block.source_asset_id END capture_asset_id,
                block.source_openapi_source_id openapi_source_id,
                block.operation_key,block.published_artifact_id,
                block.callout_tone,block.display_title,
                block.quote_attribution,block.table_caption,block.alt_text,
                block.image_caption,1 version,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',item.source_list_item_id,'text',item.text_content,
                    'position',item.position,'expected_version',1
                  ) ORDER BY item.position,item.id)
                    FROM documentation_schema.site_revision_snippet_list_item item
                   WHERE item.site_revision_snippet_block_id=block.id
                ),'[]'::jsonb) list_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',item.source_tab_item_id,'label',item.label,
                    'body',item.body,'position',item.position,
                    'expected_version',1
                  ) ORDER BY item.position,item.id)
                    FROM documentation_schema.site_revision_snippet_tab_item item
                   WHERE item.site_revision_snippet_block_id=block.id
                ),'[]'::jsonb) tab_items,
                COALESCE((
                  SELECT jsonb_agg(jsonb_build_object(
                    'id',row.source_row_id,'position',row.position,
                    'expected_version',1,'cells',(
                      SELECT jsonb_agg(jsonb_build_object(
                        'id',cell.source_cell_id,
                        'column_position',cell.column_position,
                        'expected_version',1,'is_header',cell.is_header,
                        'text',cell.text_content
                      ) ORDER BY cell.column_position,cell.id)
                      FROM documentation_schema.site_revision_snippet_table_cell cell
                      WHERE cell.site_revision_snippet_table_row_id=row.id
                    )
                  ) ORDER BY row.position,row.id)
                  FROM documentation_schema.site_revision_snippet_table_row row
                  WHERE row.site_revision_snippet_block_id=block.id
                ),'[]'::jsonb) rows,
                (
                  SELECT jsonb_build_object(
                    'published_artifact_id',reference.published_artifact_id,
                    'artifact_type',reference.artifact_type,
                    'title',reference.frozen_title,
                    'description',reference.frozen_description,
                    'project_version',jsonb_build_object(
                      'id',reference.project_version_id,
                      'name',reference.project_version_name,
                      'slug',reference.project_version_slug
                    ),
                    'revision_number',reference.revision_number,
                    'publication_sequence',reference.publication_sequence
                  )
                  FROM documentation_schema.site_revision_artifact_reference reference
                  WHERE reference.site_revision_id=block.site_revision_id
                    AND reference.source_block_id=block.source_block_id
                ) artifact_reference
           FROM documentation_schema.site_revision_snippet_block block
          WHERE block.site_revision_id=$1
          ORDER BY block.site_revision_snippet_id,block.position,block.id`,
        [root.id],
      )
    : { rows: [] };
  return {
    revision: {
      ...root,
      created_at: root.created_at.toISOString(),
    },
    pages: pages.rows.map((page) => ({
      id: page.source_page_id,
      title: page.title,
      description: page.description,
      canonical_path: page.canonical_path,
      keywords: keywords.rows
        .filter((keyword) => keyword.site_revision_page_id === page.id)
        .map((keyword) => keyword.keyword),
      blocks: blocks.rows
        .filter((block) => block.site_revision_page_id === page.id)
        .map((row) =>
          to_documentation_block({
            ...row,
            items: row.kind === "tabs" ? row.tab_items : row.list_items,
          }),
        ),
    })),
    navigation: navigation.rows,
    aliases: aliases.rows,
    redirects: redirects.rows,
    openapi_operations: operations.rows,
    snippets: snippets.rows.map((snippet) => ({
      id: snippet.source_snippet_id,
      name: snippet.name,
      status: snippet.source_status,
      blocks: snippetBlocks.rows
        .filter((block) => block.site_revision_snippet_id === snippet.id)
        .map((row) =>
          to_documentation_block({
            ...row,
            items: row.kind === "tabs" ? row.tab_items : row.list_items,
          }),
        ),
    })),
  };
};

export const build_documentation_repository = (database: Database) => ({
  create_asset: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    asset_id: string;
    file_id: string;
    width: number;
    height: number;
    file: {
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
      original_name: string;
      checksum_sha256: string;
    };
  }) =>
    with_transaction(database, async (client) => {
      const edition = await client.query<{ id: string }>(
        `SELECT id FROM documentation_schema.site_edition
          WHERE organization_id=$1 AND project_id=$2
            AND project_version_id=$3 AND documentation_site_id=$4`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      if (!edition.rows[0]) throw new Error("Documentation Site was not found");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
        [`documentation-assets:${edition.rows[0].id}`],
      );
      const count = await client.query<{ asset_count: number }>(
        `SELECT COUNT(*)::integer asset_count
           FROM documentation_schema.documentation_asset
          WHERE site_edition_id=$1`,
        [edition.rows[0].id],
      );
      if (
        Number(count.rows[0]?.asset_count ?? 0) >=
        DOCUMENTATION_ASSETS_PER_EDITION_MAX
      ) {
        const error = new Error("Documentation Asset limit has been reached");
        Object.assign(error, { code: "documentation_asset_limit_exceeded" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.asset.upload",
        action: "documentation.asset.uploaded",
      });
      await client.query(
        `INSERT INTO file_schema.file
          (id,organization_id,storage_provider,storage_key,mime_type,
           size_bytes,original_name,checksum_sha256,metadata,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10)`,
        [
          input.file_id,
          input.organization_id,
          input.file.storage_provider,
          input.file.storage_key,
          input.file.mime_type,
          input.file.size_bytes,
          input.file.original_name,
          input.file.checksum_sha256,
          JSON.stringify({ purpose: "documentation_asset" }),
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.documentation_asset
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           file_id,mime_type,byte_size,width,height,digest,name,created_by_id,
           updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
        [
          input.asset_id,
          input.organization_id,
          input.project_id,
          input.site_id,
          edition.rows[0].id,
          input.file_id,
          input.file.mime_type,
          input.file.size_bytes,
          input.width,
          input.height,
          input.file.checksum_sha256,
          normalize_documentation_asset_name(input.file.original_name),
          input.actor_org_user_id,
        ],
      );
      const audit_event = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: input.site_id,
        action: "documentation.asset.uploaded",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: null,
        after_row_version: null,
        changes: [
          {
            entity_type: "file",
            entity_id: input.file_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: null,
            after: { id: input.file_id },
          },
          {
            entity_type: "documentation_asset",
            entity_id: input.asset_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: null,
            after: { id: input.asset_id },
          },
        ],
      });
      if (audit_event) await write_audit_event(client, audit_event);
      return {
        id: input.asset_id,
        file_id: input.file_id,
        mime_type: input.file.mime_type,
        byte_size: input.file.size_bytes,
        width: input.width,
        height: input.height,
        digest: input.file.checksum_sha256,
        name: normalize_documentation_asset_name(input.file.original_name),
        status: "active",
        version: 1,
      };
    }),

  create_openapi_inspection: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    file_id: string;
    inspection_id: string;
    file: {
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
      original_name: string;
      checksum_sha256: string;
    };
    document: unknown;
    summary: {
      openapi_version: string;
      title: string;
      operation_count: number;
      operations: Array<{
        method: string;
        path: string;
        operation_id?: string;
        destination_key: string;
      }>;
    };
  }) =>
    with_transaction(database, async (client) => {
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.openapi.inspect",
        action: "documentation.openapi.inspected",
      });
      const edition = await client.query<{ id: string }>(
        `SELECT id FROM documentation_schema.site_edition
          WHERE organization_id=$1 AND project_id=$2
            AND project_version_id=$3 AND documentation_site_id=$4`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      if (!edition.rows[0]) throw new Error("Documentation Site was not found");
      await client.query(
        `INSERT INTO file_schema.file
          (id,organization_id,storage_provider,storage_key,mime_type,
           size_bytes,original_name,checksum_sha256,metadata,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10)`,
        [
          input.file_id,
          input.organization_id,
          input.file.storage_provider,
          input.file.storage_key,
          input.file.mime_type,
          input.file.size_bytes,
          input.file.original_name,
          input.file.checksum_sha256,
          JSON.stringify({ purpose: "documentation_openapi_inspection" }),
          input.actor_org_user_id,
        ],
      );
      const expires_at = new Date(Date.now() + 60 * 60 * 1000);
      await client.query(
        `INSERT INTO documentation_schema.openapi_inspection
          (id,organization_id,project_id,documentation_site_id,
           site_edition_id,file_id,digest,openapi_version,title,
           operation_count,parsed_document,expires_at,created_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13)`,
        [
          input.inspection_id,
          input.organization_id,
          input.project_id,
          input.site_id,
          edition.rows[0].id,
          input.file_id,
          input.file.checksum_sha256,
          input.summary.openapi_version,
          input.summary.title,
          input.summary.operation_count,
          JSON.stringify(input.document),
          expires_at,
          input.actor_org_user_id,
        ],
      );
      const audit_event = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: input.site_id,
        action: "documentation.openapi.inspected",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: null,
        after_row_version: null,
        changes: [
          {
            entity_type: "file",
            entity_id: input.file_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: null,
            after: { id: input.file_id },
          },
          {
            entity_type: "openapi_inspection",
            entity_id: input.inspection_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: null,
            after: { id: input.inspection_id },
          },
        ],
      });
      if (audit_event) await write_audit_event(client, audit_event);
      const result = {
        id: input.inspection_id,
        digest: input.file.checksum_sha256,
        openapi_version: input.summary.openapi_version,
        title: input.summary.title,
        operation_count: input.summary.operation_count,
        warnings: [],
        expires_at: expires_at.toISOString(),
      };
      return result;
    }),

  apply_openapi_source: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    inspection_id: string;
    expected_source_version: number | null;
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        site_id: input.site_id,
        inspection_id: input.inspection_id,
        expected_source_version: input.expected_source_version,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.openapi.apply",
        request_digest,
      });
      if (replay) return replay;
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.openapi.apply",
        action: "documentation.openapi_inspection_applied",
      });
      const inspection = await client.query<{
        id: string;
        site_edition_id: string;
        file_id: string;
        digest: string;
        openapi_version: string;
        title: string;
        parsed_document: unknown;
        expires_at: Date;
        consumed_at: Date | null;
      }>(
        `SELECT inspection.id,inspection.site_edition_id,inspection.file_id,
                inspection.digest,inspection.openapi_version,inspection.title,
                inspection.parsed_document,inspection.expires_at,
                inspection.consumed_at
           FROM documentation_schema.openapi_inspection inspection
           JOIN documentation_schema.site_edition edition
             ON edition.id=inspection.site_edition_id
          WHERE inspection.id=$1 AND inspection.organization_id=$2
            AND inspection.project_id=$3
            AND inspection.documentation_site_id=$4
            AND edition.project_version_id=$5
          FOR UPDATE OF inspection`,
        [
          input.inspection_id,
          input.organization_id,
          input.project_id,
          input.site_id,
          input.project_version_id,
        ],
      );
      const inspected = inspection.rows[0];
      if (
        !inspected ||
        inspected.expires_at.getTime() <= Date.now() ||
        inspected.consumed_at
      ) {
        const error = new Error("OpenAPI inspection expired");
        Object.assign(error, { code: "documentation_inspection_expired" });
        throw error;
      }
      const current = await client.query<{ id: string; version: number }>(
        `SELECT id,version FROM documentation_schema.openapi_source
          WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3
          FOR UPDATE`,
        [inspected.site_edition_id, input.organization_id, input.project_id],
      );
      if (
        (current.rows[0]?.version ?? null) !== input.expected_source_version
      ) {
        const error = new Error("OpenAPI Source changed; reload and retry");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      const source_id = current.rows[0]?.id ?? ulid();
      if (current.rows[0]) {
        await client.query(
          `DELETE FROM documentation_schema.openapi_operation
            WHERE openapi_source_id=$1 AND organization_id=$2 AND project_id=$3`,
          [source_id, input.organization_id, input.project_id],
        );
        await client.query(
          `UPDATE documentation_schema.openapi_source
              SET file_id=$1,digest=$2,openapi_version=$3,title=$4,
                  version=version+1,updated_by_id=$5,
                  updated_at=CURRENT_TIMESTAMP
            WHERE id=$6`,
          [
            inspected.file_id,
            inspected.digest,
            inspected.openapi_version,
            inspected.title,
            input.actor_org_user_id,
            source_id,
          ],
        );
      } else {
        await client.query(
          `INSERT INTO documentation_schema.openapi_source
            (id,organization_id,project_id,site_edition_id,file_id,digest,
             openapi_version,title,created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
          [
            source_id,
            input.organization_id,
            input.project_id,
            inspected.site_edition_id,
            inspected.file_id,
            inspected.digest,
            inspected.openapi_version,
            inspected.title,
            input.actor_org_user_id,
          ],
        );
      }
      const summary = inspect_openapi_document(inspected.parsed_document);
      const operations = [];
      for (const operation of summary.operations) {
        const persisted = { id: ulid(), ...operation };
        operations.push(persisted);
        await client.query(
          `INSERT INTO documentation_schema.openapi_operation
            (id,organization_id,project_id,site_edition_id,openapi_source_id,
             method,path,operation_id,destination_key)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            persisted.id,
            input.organization_id,
            input.project_id,
            inspected.site_edition_id,
            source_id,
            persisted.method,
            persisted.path,
            persisted.operation_id ?? null,
            persisted.destination_key,
          ],
        );
      }
      await client.query(
        `UPDATE documentation_schema.openapi_inspection
            SET consumed_at=CURRENT_TIMESTAMP WHERE id=$1`,
        [input.inspection_id],
      );
      await bump_working_draft(client, {
        ...input,
        site_edition_id: inspected.site_edition_id,
      });
      const result = {
        source: {
          id: source_id,
          digest: inspected.digest,
          openapi_version: inspected.openapi_version,
          title: inspected.title,
          version: (current.rows[0]?.version ?? 0) + 1,
        },
        operations,
      };
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.openapi_inspection_applied",
        entity_type: "openapi_source",
        entity_id: source_id,
        before_version: current.rows[0]?.version ?? null,
        after_version: (current.rows[0]?.version ?? 0) + 1,
      });
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.openapi.apply",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  get_openapi_source: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
  }) => {
    const source = await database.query<Record<string, unknown>>(
      `SELECT source.id,source.digest,source.openapi_version,source.title,
              source.version
         FROM documentation_schema.openapi_source source
         JOIN documentation_schema.site_edition edition
           ON edition.id=source.site_edition_id
        WHERE source.organization_id=$1 AND source.project_id=$2
          AND edition.project_version_id=$3
          AND edition.documentation_site_id=$4`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
      ],
    );
    if (!source.rows[0]) return null;
    const operations = await database.query<Record<string, unknown>>(
      `SELECT id,method,path,operation_id,destination_key,summary
         FROM documentation_schema.openapi_operation
        WHERE openapi_source_id=$1 AND organization_id=$2 AND project_id=$3
        ORDER BY destination_key,id`,
      [source.rows[0].id, input.organization_id, input.project_id],
    );
    return { source: source.rows[0], operations: operations.rows };
  },

  search_draft: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    query: string;
  }) => {
    const result = await database.query<{
      page_id: string;
      title: string;
      description: string | null;
      canonical_path: string;
      excerpt: string;
    }>(
      `SELECT documentation_page_id page_id,title,description,canonical_path,
              COALESCE(description,left(search_text,240)) excerpt
         FROM documentation_schema.documentation_draft_search_document
        WHERE organization_id=$1 AND project_id=$2
          AND project_version_id=$3 AND documentation_site_id=$4
          AND search_vector @@ plainto_tsquery('simple',$5)
        ORDER BY ts_rank(search_vector,plainto_tsquery('simple',$5)) DESC,
                 canonical_path,page_id
        LIMIT 50`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.query,
      ],
    );
    return result.rows;
  },

  get_preview: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
  }) => load_draft_snapshot(database, input),

  create_revision: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    expected_draft_version: number;
    verified_asset_digests?: Record<string, string>;
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        project_version_id: input.project_version_id,
        site_id: input.site_id,
        expected_draft_version: input.expected_draft_version,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.revision.create",
        request_digest,
      });
      if (replay) return replay;
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.revision.create",
        action: "documentation.revision_created",
      });
      const locked = await client.query<{ version: number }>(
        `SELECT draft.version
           FROM documentation_schema.site_working_draft draft
           JOIN documentation_schema.site_edition edition
             ON edition.id=draft.site_edition_id
          WHERE draft.organization_id=$1 AND draft.project_id=$2
            AND edition.project_version_id=$3
            AND draft.documentation_site_id=$4
          FOR UPDATE OF draft`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      if (!locked.rows[0]) throw new Error("Documentation Site was not found");
      if (locked.rows[0].version !== input.expected_draft_version) {
        const error = new Error("Working Draft changed; reload and retry");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      const snapshot = await load_draft_snapshot(client, input);
      if (!snapshot || !snapshot.working_draft.home_page_id) {
        const error = new Error("Documentation Revision requires a Home Page");
        Object.assign(error, { code: "documentation_revision_invalid" });
        throw error;
      }
      const pageIds = new Set(snapshot.pages.map((page) => page.id as string));
      if (!pageIds.has(snapshot.working_draft.home_page_id)) {
        const error = new Error("Documentation Home Page is invalid");
        Object.assign(error, { code: "documentation_revision_invalid" });
        throw error;
      }
      for (const page of snapshot.pages) {
        for (const block of page.blocks as Array<Record<string, unknown>>) {
          if (
            block.kind === "link" &&
            block.page_id &&
            !pageIds.has(block.page_id as string)
          ) {
            const error = new Error("Documentation internal link is broken");
            Object.assign(error, {
              code: "documentation_internal_link_broken",
            });
            throw error;
          }
          if (block.kind === "snippet_reference") {
            const snippet = snapshot.snippets.find(
              (candidate) => candidate.id === block.snippet_id,
            );
            if (!snippet) {
              const error = new Error("Documentation Snippet is not available");
              Object.assign(error, { code: "documentation_revision_invalid" });
              throw error;
            }
          }
        }
      }
      const referencedSnippetIds = new Set(
        snapshot.pages.flatMap((page) =>
          (page.blocks as Array<Record<string, unknown>>)
            .filter((block) => block.kind === "snippet_reference")
            .map((block) => block.snippet_id as string),
        ),
      );
      snapshot.snippets = snapshot.snippets.filter(
        (snippet) =>
          snippet.status === "active" ||
          referencedSnippetIds.has(snippet.id as string),
      );
      validate_documentation_revision_aggregate(snapshot);
      const imageBlocksForDigest = [
        ...snapshot.pages.flatMap(
          (page) => page.blocks as Array<Record<string, unknown>>,
        ),
        ...snapshot.snippets.flatMap(
          (snippet) => snippet.blocks as Array<Record<string, unknown>>,
        ),
      ].filter((block) => block.kind === "image");
      const protectedAssetDigests = new Map<string, string>();
      for (const block of imageBlocksForDigest) {
        const source = block.source as
          | { kind: "documentation_asset" | "capture_asset"; id: string }
          | undefined;
        if (!source) continue;
        const key = `${source.kind}:${source.id}`;
        const verified = input.verified_asset_digests?.[key];
        if (verified) {
          protectedAssetDigests.set(key, verified);
          continue;
        }
        if (source.kind === "documentation_asset") {
          const asset = snapshot.assets.find(
            (candidate) => candidate.id === source.id,
          ) as { digest?: string } | undefined;
          if (asset?.digest) protectedAssetDigests.set(key, asset.digest);
          continue;
        }
        const capture = await client.query<{ digest: string | null }>(
          `SELECT file.checksum_sha256 digest
             FROM capture_schema.capture_asset asset
             JOIN file_schema.file file ON file.id=asset.file_id
            WHERE asset.id=$1 AND asset.organization_id=$2
              AND asset.project_id=$3 AND asset.is_deleted=FALSE
              AND file.is_deleted=FALSE
              AND asset.asset_type IN ('screenshot','redacted_screenshot')
              AND asset.status IN ('active','archived')
              AND file.mime_type IN ('image/png','image/jpeg','image/webp')
              AND NOT EXISTS (
                SELECT 1
                  FROM capture_schema.capture_asset_purge_operation purge
                 WHERE purge.capture_asset_id=asset.id
              )
            FOR UPDATE OF asset,file`,
          [source.id, input.organization_id, input.project_id],
        );
        if (capture.rows[0]?.digest)
          protectedAssetDigests.set(key, capture.rows[0].digest);
      }
      if (
        protectedAssetDigests.size !==
        new Set(
          imageBlocksForDigest.map((block) => {
            const source = block.source as { kind: string; id: string };
            return `${source.kind}:${source.id}`;
          }),
        ).size
      ) {
        const error = new Error("Documentation Asset bytes are unavailable");
        Object.assign(error, {
          code: "documentation_asset_source_unavailable",
        });
        throw error;
      }
      const content_digest = command_digest({
        ...snapshot,
        protected_asset_digests: [...protectedAssetDigests.entries()].sort(
          ([left], [right]) => left.localeCompare(right),
        ),
      });
      const existing = await client.query<{
        id: string;
        revision_number: number;
        content_digest: string;
        created_at: Date;
      }>(
        `SELECT id,revision_number,content_digest,created_at
           FROM documentation_schema.site_revision
          WHERE site_edition_id=$1 AND content_digest=$2`,
        [snapshot.edition.id, content_digest],
      );
      if (existing.rows[0]) {
        const result = {
          ...existing.rows[0],
          created_at: existing.rows[0].created_at.toISOString(),
        };
        await write_command_receipt(client, {
          ...input,
          operation: "documentation.revision.create",
          request_digest,
          response_status: 200,
          response_body: result,
        });
        return { ...result, idempotent_replay: true };
      }
      const sequence = await client.query<{ next: number }>(
        `SELECT COALESCE(MAX(revision_number),0)+1 next
           FROM documentation_schema.site_revision
          WHERE site_edition_id=$1`,
        [snapshot.edition.id],
      );
      const revision = {
        id: ulid(),
        revision_number: Number(sequence.rows[0]!.next),
        content_digest,
      };
      await client.query(
        `INSERT INTO documentation_schema.site_revision
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           project_version_id,revision_number,site_name,site_description,
           home_page_id,primary_language,content_digest,created_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          revision.id,
          input.organization_id,
          input.project_id,
          input.site_id,
          snapshot.edition.id,
          input.project_version_id,
          revision.revision_number,
          snapshot.site.name,
          snapshot.site.description,
          snapshot.working_draft.home_page_id,
          snapshot.edition.primary_language,
          content_digest,
          input.actor_org_user_id,
        ],
      );
      for (const page of snapshot.pages) {
        const revisionPageId = ulid();
        const expandedSnippetBlocks = (
          page.blocks as Array<Record<string, unknown>>
        ).flatMap((block) => {
          if (block.kind !== "snippet_reference") return [];
          return (snapshot.snippets.find(
            (snippet) => snippet.id === block.snippet_id,
          )?.blocks ?? []) as Array<Record<string, unknown>>;
        });
        const searchable = search_text_for_blocks(
          page.title as string,
          page.description as string | null,
          [
            ...(page.blocks as Array<Record<string, unknown>>),
            ...expandedSnippetBlocks,
          ],
        );
        await client.query(
          `INSERT INTO documentation_schema.site_revision_page
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_page_id,title,description,canonical_path,content_text)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            revisionPageId,
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            page.id,
            page.title,
            page.description,
            page.canonical_path,
            searchable,
          ],
        );
        for (const keyword of page.keywords as Array<Record<string, unknown>>) {
          await client.query(
            `INSERT INTO documentation_schema.site_revision_page_keyword
              (id,organization_id,project_id,site_edition_id,site_revision_id,
               site_revision_page_id,keyword,position)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              ulid(),
              input.organization_id,
              input.project_id,
              snapshot.edition.id,
              revision.id,
              revisionPageId,
              keyword.keyword,
              keyword.position,
            ],
          );
        }
        for (const block of page.blocks as Array<Record<string, unknown>>) {
          const revisionBlockId = ulid();
          await client.query(
            `INSERT INTO documentation_schema.site_revision_page_block
              (id,organization_id,project_id,site_edition_id,site_revision_id,
               site_revision_page_id,source_block_id,kind,position,
               heading_level,text_content,code_language,link_url,
               linked_source_page_id,linked_source_block_id,source_kind,
               source_asset_id,source_snippet_id,source_openapi_source_id,
               operation_key,published_artifact_id,published_artifact_type,
               callout_tone,display_title,quote_attribution,table_caption,
               alt_text,image_caption)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                     $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
            [
              revisionBlockId,
              input.organization_id,
              input.project_id,
              snapshot.edition.id,
              revision.id,
              revisionPageId,
              block.id,
              block.kind,
              block.position,
              block.level ?? null,
              block.text ?? block.code ?? block.label ?? null,
              block.language ?? null,
              block.url ?? null,
              block.page_id ?? null,
              block.target_block_id ?? null,
              (block.source as { kind?: string } | undefined)?.kind ?? null,
              (block.source as { id?: string } | undefined)?.id ?? null,
              block.snippet_id ?? null,
              block.openapi_source_id ?? null,
              block.operation_key ?? null,
              block.published_artifact_id ?? null,
              block.kind === "guide_publication"
                ? "guide"
                : block.kind === "interactive_demo_publication"
                  ? "interactive_demo"
                  : null,
              block.tone ?? null,
              block.title ?? null,
              block.attribution ?? null,
              block.caption ?? null,
              block.alt_text ?? null,
              block.caption ?? null,
            ],
          );
          if (
            (block.kind === "ordered_list" ||
              block.kind === "unordered_list") &&
            Array.isArray(block.items)
          ) {
            for (const item of block.items as Array<Record<string, unknown>>) {
              await client.query(
                `INSERT INTO documentation_schema.site_revision_list_item
                  (id,organization_id,project_id,site_edition_id,
                   site_revision_id,site_revision_page_block_id,
                   source_list_item_id,text_content,position)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                  ulid(),
                  input.organization_id,
                  input.project_id,
                  snapshot.edition.id,
                  revision.id,
                  revisionBlockId,
                  item.id,
                  item.text,
                  item.position,
                ],
              );
            }
          }
          if (block.kind === "tabs" && Array.isArray(block.items)) {
            for (const item of block.items as Array<Record<string, unknown>>) {
              await client.query(
                `INSERT INTO documentation_schema.site_revision_page_tab_item
                  (id,organization_id,project_id,site_edition_id,
                   site_revision_id,site_revision_page_block_id,
                   source_tab_item_id,label,body,position)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                  ulid(),
                  input.organization_id,
                  input.project_id,
                  snapshot.edition.id,
                  revision.id,
                  revisionBlockId,
                  item.id,
                  item.label,
                  item.body,
                  item.position,
                ],
              );
            }
          }
          if (block.kind === "table" && Array.isArray(block.rows)) {
            for (const row of block.rows as Array<Record<string, unknown>>) {
              const revisionRowId = ulid();
              await client.query(
                `INSERT INTO documentation_schema.site_revision_page_table_row
                  (id,organization_id,project_id,site_edition_id,
                   site_revision_id,site_revision_page_block_id,
                   source_row_id,position)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                  revisionRowId,
                  input.organization_id,
                  input.project_id,
                  snapshot.edition.id,
                  revision.id,
                  revisionBlockId,
                  row.id,
                  row.position,
                ],
              );
              for (const cell of row.cells as Array<Record<string, unknown>>)
                await client.query(
                  `INSERT INTO documentation_schema.site_revision_page_table_cell
                    (id,organization_id,project_id,site_edition_id,
                     site_revision_id,site_revision_page_table_row_id,
                     source_cell_id,column_position,is_header,text_content)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                  [
                    ulid(),
                    input.organization_id,
                    input.project_id,
                    snapshot.edition.id,
                    revision.id,
                    revisionRowId,
                    cell.id,
                    cell.column_position,
                    cell.is_header,
                    cell.text,
                  ],
                );
            }
          }
          if (
            block.kind === "guide_publication" ||
            block.kind === "interactive_demo_publication"
          ) {
            const type =
              block.kind === "guide_publication" ? "guide" : "interactive_demo";
            const publication = await client.query<{
              id: string;
              project_version_id: string;
              project_version_name: string;
              project_version_slug: string;
              publication_sequence: number;
              revision_number: number;
              title: string;
              description: string | null;
            }>(
              `SELECT publication.id,publication.project_version_id,
                      version.name project_version_name,
                      version.slug project_version_slug,
                      publication.publication_sequence,
                      COALESCE(guide_revision.revision_number,
                               demo_revision.revision_number) revision_number,
                      COALESCE(guide_revision.title,demo_revision.title) title,
                      left(COALESCE(guide_revision.description,
                                    demo_revision.description),1000) description
                 FROM publish_schema.published_artifact publication
                 JOIN project_schema.project_version version
                   ON version.id=publication.project_version_id
                 LEFT JOIN guide_schema.guide_revision guide_revision
                   ON guide_revision.id=publication.guide_revision_id
                 LEFT JOIN interactive_demo_schema.interactive_demo_revision demo_revision
                   ON demo_revision.id=publication.interactive_demo_revision_id
                WHERE publication.id=$1 AND publication.artifact_type=$2
                  AND publication.organization_id=$3
                  AND publication.project_id=$4`,
              [
                block.published_artifact_id,
                type,
                input.organization_id,
                input.project_id,
              ],
            );
            const exact = publication.rows[0];
            if (!exact) {
              const error = new Error("Artifact Publication is not available");
              Object.assign(error, {
                code: "documentation_artifact_publication_not_found",
              });
              throw error;
            }
            await client.query(
              `INSERT INTO documentation_schema.site_revision_artifact_reference
                (id,organization_id,project_id,site_edition_id,
                 site_revision_id,source_block_id,published_artifact_id,
                 artifact_type,frozen_title,frozen_description,
                 project_version_id,project_version_name,project_version_slug,
                 revision_number,publication_sequence)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
              [
                ulid(),
                input.organization_id,
                input.project_id,
                snapshot.edition.id,
                revision.id,
                block.id,
                exact.id,
                type,
                exact.title,
                exact.description,
                exact.project_version_id,
                exact.project_version_name,
                exact.project_version_slug,
                exact.revision_number,
                exact.publication_sequence,
              ],
            );
          }
        }
      }
      for (const snippet of snapshot.snippets) {
        const revisionSnippetId = ulid();
        await client.query(
          `INSERT INTO documentation_schema.site_revision_snippet
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_snippet_id,name,source_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            revisionSnippetId,
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            snippet.id,
            snippet.name,
            snippet.status,
          ],
        );
        for (const block of snippet.blocks as Array<Record<string, unknown>>) {
          const revisionBlockId = ulid();
          const source = block.source as
            | { kind: string; id: string }
            | undefined;
          const artifactType =
            block.kind === "guide_publication"
              ? "guide"
              : block.kind === "interactive_demo_publication"
                ? "interactive_demo"
                : null;
          await client.query(
            `INSERT INTO documentation_schema.site_revision_snippet_block
              (id,organization_id,project_id,site_edition_id,site_revision_id,
               site_revision_snippet_id,source_snippet_id,source_block_id,
               kind,position,heading_level,text_content,code_language,link_url,
               linked_source_page_id,linked_source_block_id,source_kind,
               source_asset_id,source_openapi_source_id,operation_key,
               published_artifact_id,published_artifact_type,callout_tone,
               display_title,quote_attribution,table_caption,alt_text,
               image_caption)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                     $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
            [
              revisionBlockId,
              input.organization_id,
              input.project_id,
              snapshot.edition.id,
              revision.id,
              revisionSnippetId,
              snippet.id,
              block.id,
              block.kind,
              block.position,
              block.level ?? null,
              block.text ?? block.code ?? block.label ?? null,
              block.language ?? null,
              block.url ?? null,
              block.page_id ?? null,
              block.target_block_id ?? null,
              source?.kind ?? null,
              source?.id ?? null,
              block.openapi_source_id ?? null,
              block.operation_key ?? null,
              block.published_artifact_id ?? null,
              artifactType,
              block.tone ?? null,
              block.title ?? null,
              block.attribution ?? null,
              block.caption ?? null,
              block.alt_text ?? null,
              block.caption ?? null,
            ],
          );
          if (
            (block.kind === "ordered_list" ||
              block.kind === "unordered_list") &&
            Array.isArray(block.items)
          )
            for (const item of block.items as Array<Record<string, unknown>>)
              await client.query(
                `INSERT INTO documentation_schema.site_revision_snippet_list_item
                  (id,organization_id,project_id,site_edition_id,
                   site_revision_id,site_revision_snippet_block_id,
                   source_list_item_id,text_content,position)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                  ulid(),
                  input.organization_id,
                  input.project_id,
                  snapshot.edition.id,
                  revision.id,
                  revisionBlockId,
                  item.id,
                  item.text,
                  item.position,
                ],
              );
          if (block.kind === "tabs" && Array.isArray(block.items))
            for (const item of block.items as Array<Record<string, unknown>>)
              await client.query(
                `INSERT INTO documentation_schema.site_revision_snippet_tab_item
                  (id,organization_id,project_id,site_edition_id,
                   site_revision_id,site_revision_snippet_block_id,
                   source_tab_item_id,label,body,position)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                  ulid(),
                  input.organization_id,
                  input.project_id,
                  snapshot.edition.id,
                  revision.id,
                  revisionBlockId,
                  item.id,
                  item.label,
                  item.body,
                  item.position,
                ],
              );
          if (block.kind === "table" && Array.isArray(block.rows))
            for (const row of block.rows as Array<Record<string, unknown>>) {
              const revisionRowId = ulid();
              await client.query(
                `INSERT INTO documentation_schema.site_revision_snippet_table_row
                  (id,organization_id,project_id,site_edition_id,
                   site_revision_id,site_revision_snippet_block_id,
                   source_row_id,position)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                  revisionRowId,
                  input.organization_id,
                  input.project_id,
                  snapshot.edition.id,
                  revision.id,
                  revisionBlockId,
                  row.id,
                  row.position,
                ],
              );
              for (const cell of row.cells as Array<Record<string, unknown>>)
                await client.query(
                  `INSERT INTO documentation_schema.site_revision_snippet_table_cell
                    (id,organization_id,project_id,site_edition_id,
                     site_revision_id,site_revision_snippet_table_row_id,
                     source_cell_id,column_position,is_header,text_content)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                  [
                    ulid(),
                    input.organization_id,
                    input.project_id,
                    snapshot.edition.id,
                    revision.id,
                    revisionRowId,
                    cell.id,
                    cell.column_position,
                    cell.is_header,
                    cell.text,
                  ],
                );
            }
          if (
            block.kind === "guide_publication" ||
            block.kind === "interactive_demo_publication"
          ) {
            const type =
              block.kind === "guide_publication" ? "guide" : "interactive_demo";
            const publication = await client.query<{
              id: string;
              project_version_id: string;
              project_version_name: string;
              project_version_slug: string;
              publication_sequence: number;
              revision_number: number;
              title: string;
              description: string | null;
            }>(
              `SELECT publication.id,publication.project_version_id,
                      version.name project_version_name,
                      version.slug project_version_slug,
                      publication.publication_sequence,
                      COALESCE(guide_revision.revision_number,
                               demo_revision.revision_number) revision_number,
                      COALESCE(guide_revision.title,demo_revision.title) title,
                      left(COALESCE(guide_revision.description,
                                    demo_revision.description),1000) description
                 FROM publish_schema.published_artifact publication
                 JOIN project_schema.project_version version
                   ON version.id=publication.project_version_id
                 LEFT JOIN guide_schema.guide_revision guide_revision
                   ON guide_revision.id=publication.guide_revision_id
                 LEFT JOIN interactive_demo_schema.interactive_demo_revision demo_revision
                   ON demo_revision.id=publication.interactive_demo_revision_id
                WHERE publication.id=$1 AND publication.artifact_type=$2
                  AND publication.organization_id=$3
                  AND publication.project_id=$4`,
              [
                block.published_artifact_id,
                type,
                input.organization_id,
                input.project_id,
              ],
            );
            const exact = publication.rows[0];
            if (!exact) {
              const error = new Error("Artifact Publication is not available");
              Object.assign(error, {
                code: "documentation_artifact_publication_not_found",
              });
              throw error;
            }
            await client.query(
              `INSERT INTO documentation_schema.site_revision_artifact_reference
                (id,organization_id,project_id,site_edition_id,
                 site_revision_id,source_block_id,published_artifact_id,
                 artifact_type,frozen_title,frozen_description,
                 project_version_id,project_version_name,project_version_slug,
                 revision_number,publication_sequence)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
              [
                ulid(),
                input.organization_id,
                input.project_id,
                snapshot.edition.id,
                revision.id,
                block.id,
                exact.id,
                type,
                exact.title,
                exact.description,
                exact.project_version_id,
                exact.project_version_name,
                exact.project_version_slug,
                exact.revision_number,
                exact.publication_sequence,
              ],
            );
          }
        }
      }
      for (const node of snapshot.navigation.nodes) {
        await client.query(
          `INSERT INTO documentation_schema.site_revision_navigation_node
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_navigation_node_id,parent_source_navigation_node_id,kind,
             label,source_page_id,position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            node.id,
            node.parent_id,
            node.kind,
            node.label,
            node.page_id,
            node.position,
          ],
        );
      }
      for (const alias of snapshot.routing.aliases) {
        await client.query(
          `INSERT INTO documentation_schema.site_revision_page_alias
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_page_id,former_path)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            alias.documentation_page_id,
            alias.former_path,
          ],
        );
      }
      for (const rule of snapshot.routing.rules) {
        await client.query(
          `INSERT INTO documentation_schema.site_revision_redirect_rule
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_path,outcome,target_source_page_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            rule.source_path,
            rule.outcome,
            rule.target_page_id,
          ],
        );
      }
      for (const operation of snapshot.openapi_operations) {
        await client.query(
          `INSERT INTO documentation_schema.site_revision_openapi_operation
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_openapi_operation_id,method,path,operation_id,
             destination_key,summary)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            operation.id,
            operation.method,
            operation.path,
            operation.operation_id,
            operation.destination_key,
            operation.summary,
          ],
        );
      }
      const imageBlocks = [
        ...snapshot.pages.flatMap(
          (page) => page.blocks as Array<Record<string, unknown>>,
        ),
        ...snapshot.snippets.flatMap(
          (snippet) => snippet.blocks as Array<Record<string, unknown>>,
        ),
      ].filter((block) => block.kind === "image");
      for (const block of imageBlocks) {
        const source = block.source as
          | { kind: "documentation_asset" | "capture_asset"; id: string }
          | undefined;
        if (!source) {
          const error = new Error("Documentation Asset source is invalid");
          Object.assign(error, { code: "documentation_revision_invalid" });
          throw error;
        }
        let asset:
          | {
              id: string;
              file_id: string;
              mime_type: string;
              byte_size: number;
              width: number;
              height: number;
              digest: string;
            }
          | undefined;
        if (source.kind === "documentation_asset") {
          asset = snapshot.assets.find(
            (candidate) => candidate.id === source.id,
          ) as typeof asset;
        } else {
          const capture = await client.query<{
            id: string;
            file_id: string;
            mime_type: string;
            byte_size: number;
            width: number;
            height: number;
            digest: string;
          }>(
            `SELECT asset.id,asset.file_id,file.mime_type,
                    file.size_bytes byte_size,asset.width,asset.height,
                    file.checksum_sha256 digest
               FROM capture_schema.capture_asset asset
               JOIN file_schema.file file ON file.id=asset.file_id
              WHERE asset.id=$1 AND asset.organization_id=$2
                AND asset.project_id=$3 AND asset.is_deleted=FALSE
                AND file.is_deleted=FALSE
                AND asset.asset_type IN ('screenshot','redacted_screenshot')
                AND asset.status IN ('active','archived')
                AND file.mime_type IN ('image/png','image/jpeg','image/webp')
              FOR UPDATE OF asset,file`,
            [source.id, input.organization_id, input.project_id],
          );
          asset = capture.rows[0];
        }
        if (!asset) {
          const error = new Error("Documentation Asset is not available");
          Object.assign(error, { code: "documentation_revision_invalid" });
          throw error;
        }
        await client.query(
          `INSERT INTO documentation_schema.site_revision_asset_reference
            (id,organization_id,project_id,site_edition_id,site_revision_id,
             source_kind,source_asset_id,file_id,mime_type,digest,byte_size,
             width,height,alt_text)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (site_revision_id,source_kind,source_asset_id)
           DO NOTHING`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            snapshot.edition.id,
            revision.id,
            source.kind,
            asset.id,
            asset.file_id,
            asset.mime_type,
            protectedAssetDigests.get(`${source.kind}:${source.id}`) ??
              asset.digest,
            asset.byte_size,
            asset.width,
            asset.height,
            block.alt_text,
          ],
        );
      }
      const result = { ...revision, created_at: new Date().toISOString() };
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.revision_created",
        entity_type: "site_revision",
        entity_id: revision.id,
        before_version: null,
        after_version: revision.revision_number,
      });
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.revision.create",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  list_revisions: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
  }) => {
    const result = await database.query<{
      id: string;
      revision_number: number;
      content_digest: string;
      created_at: Date;
    }>(
      `SELECT revision.id,revision.revision_number,revision.content_digest,
              revision.created_at
         FROM documentation_schema.site_revision revision
        WHERE revision.organization_id=$1 AND revision.project_id=$2
          AND revision.project_version_id=$3
          AND revision.documentation_site_id=$4
        ORDER BY revision.revision_number DESC`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
      ],
    );
    return result.rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    }));
  },

  list_publications: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
  }) => {
    const result = await database.query<{
      id: string;
      publication_sequence: number;
      revision_id: string;
      revision_number: number;
      output_digest: string;
      published_at: Date;
    }>(
      `SELECT publication.id,publication.publication_sequence,
              revision.id revision_id,revision.revision_number,
              publication.output_digest,publication.published_at
         FROM publish_schema.site_publication publication
         JOIN documentation_schema.site_revision revision
           ON revision.id=publication.site_revision_id
        WHERE publication.organization_id=$1 AND publication.project_id=$2
          AND publication.project_version_id=$3
          AND publication.documentation_site_id=$4
        ORDER BY publication.publication_sequence DESC`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
      ],
    );
    return result.rows.map((row) => ({
      ...row,
      published_at: row.published_at.toISOString(),
    }));
  },

  list_publish_links: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
  }) => {
    const links = await database.query<{
      id: string;
      name: string;
      slug: string;
      visibility: "public" | "restricted";
      status: "active" | "revoked";
      version: number;
      expires_at: Date | null;
    }>(
      `SELECT id,name,slug,visibility,status,version,expires_at
         FROM publish_schema.publish_link
        WHERE organization_id=$1 AND project_id=$2
          AND documentation_site_id=$3
          AND resource_family='documentation_site'
        ORDER BY created_at,id`,
      [input.organization_id, input.project_id, input.site_id],
    );
    if (!links.rows.length) return [];
    const entries = await database.query<{
      id: string;
      publish_link_id: string;
      project_version_id: string;
      site_publication_id: string;
      version: number;
      is_default: boolean;
      position: number;
    }>(
      `SELECT id,publish_link_id,project_version_id,site_publication_id,
              version,is_default,position
         FROM publish_schema.publish_link_entry
        WHERE organization_id=$1 AND project_id=$2
          AND publish_link_id=ANY($3::varchar[])
          AND project_version_id=$4
        ORDER BY position,id`,
      [
        input.organization_id,
        input.project_id,
        links.rows.map((link) => link.id),
        input.project_version_id,
      ],
    );
    return links.rows.map((link) => ({
      ...link,
      expires_at: link.expires_at?.toISOString() ?? null,
      entries: entries.rows.filter(
        (entry) => entry.publish_link_id === link.id,
      ),
    }));
  },

  get_revision: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    revision_number: number;
  }) => {
    const revision = await database.query<{ id: string }>(
      `SELECT revision.id
         FROM documentation_schema.site_revision revision
        WHERE revision.organization_id=$1 AND revision.project_id=$2
          AND revision.project_version_id=$3
          AND revision.documentation_site_id=$4
          AND revision.revision_number=$5`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.revision_number,
      ],
    );
    const site_revision_id = revision.rows[0]?.id;
    if (!site_revision_id) return null;
    return load_revision_snapshot(database, { ...input, site_revision_id });
  },

  create_publication: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    revision_id: string;
    link:
      | {
          mode: "create";
          name: string;
          slug: string;
          visibility: "public" | "restricted";
          expires_at: string | null;
          password_hash: string | null;
          password_salt: string | null;
        }
      | {
          mode: "existing";
          link_id: string;
          entry_id: string;
          expected_entry_version: number;
        };
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        project_version_id: input.project_version_id,
        site_id: input.site_id,
        revision_id: input.revision_id,
        link: input.link,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.publication.create",
        request_digest,
      });
      if (replay) return replay;
      const audit_command =
        input.link.mode === "create"
          ? {
              command: "publish.documentation_link.create",
              action: "documentation.publish_link.created",
            }
          : {
              command: "publish.documentation_link.manifest_update",
              action: "documentation.publish_link.manifest_updated",
            };
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        ...audit_command,
      });
      const snapshot = await load_revision_snapshot(client, {
        organization_id: input.organization_id,
        project_id: input.project_id,
        site_revision_id: input.revision_id,
      });
      if (
        !snapshot ||
        snapshot.revision.documentation_site_id !== input.site_id ||
        snapshot.revision.project_version_id !== input.project_version_id
      ) {
        const error = new Error("Documentation Revision was not found");
        Object.assign(error, { code: "documentation_revision_invalid" });
        throw error;
      }
      const prior = await client.query<{
        id: string;
        publication_sequence: number;
        output_digest: string;
        published_at: Date;
      }>(
        `SELECT id,publication_sequence,output_digest,published_at
           FROM publish_schema.site_publication
          WHERE site_revision_id=$1 AND preparation_version=1`,
        [input.revision_id],
      );
      let publication = prior.rows[0]
        ? {
            ...prior.rows[0],
            published_at: prior.rows[0].published_at.toISOString(),
          }
        : null;
      if (!publication) {
        const sequence = await client.query<{ next: number }>(
          `SELECT COALESCE(MAX(publication_sequence),0)+1 next
             FROM publish_schema.site_publication
            WHERE site_edition_id=$1`,
          [snapshot.revision.site_edition_id],
        );
        publication = {
          id: ulid(),
          publication_sequence: Number(sequence.rows[0]!.next),
          output_digest: command_digest(snapshot),
          published_at: new Date().toISOString(),
        };
        await client.query(
          `INSERT INTO publish_schema.site_publication
            (id,organization_id,project_id,documentation_site_id,
             site_edition_id,project_version_id,site_revision_id,
             publication_sequence,preparation_version,output_digest,
             created_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10)`,
          [
            publication.id,
            input.organization_id,
            input.project_id,
            input.site_id,
            snapshot.revision.site_edition_id,
            input.project_version_id,
            input.revision_id,
            publication.publication_sequence,
            publication.output_digest,
            input.actor_org_user_id,
          ],
        );
        for (const page of snapshot.pages) {
          const expandedSnippetBlocks = (
            page.blocks as Array<Record<string, unknown>>
          ).flatMap((block) => {
            if (block.kind !== "snippet_reference") return [];
            return (snapshot.snippets.find(
              (snippet) => snippet.id === block.snippet_id,
            )?.blocks ?? []) as Array<Record<string, unknown>>;
          });
          const searchText = search_text_for_blocks(
            page.title as string,
            page.description as string | null,
            [
              ...(page.blocks as Array<Record<string, unknown>>),
              ...expandedSnippetBlocks,
              ...((page.keywords as string[]).map((text) => ({ text })) ?? []),
            ],
          );
          await client.query(
            `INSERT INTO publish_schema.site_publication_search_document
              (id,organization_id,project_id,site_publication_id,
               source_page_id,title,description,canonical_path,search_text)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              ulid(),
              input.organization_id,
              input.project_id,
              publication.id,
              page.id,
              page.title,
              page.description,
              page.canonical_path,
              searchText,
            ],
          );
        }
      }
      let link: { id: string; slug: string; version: number };
      let entry: { id: string; version: number };
      let entryBeforeVersion: number | null = null;
      if (input.link.mode === "create") {
        link = { id: ulid(), slug: input.link.slug, version: 1 };
        entry = { id: ulid(), version: 1 };
        await client.query(
          `INSERT INTO publish_schema.publish_link
            (id,organization_id,project_id,resource_family,
             documentation_site_id,name,slug,visibility,expires_at,
             password_hash,password_salt,password_set_at,password_updated_at,
             status,version,created_by_id)
           VALUES ($1,$2,$3,'documentation_site',$4,$5,$6,$7,$8,$9,$10,
                   CASE WHEN $9::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
                   CASE WHEN $9::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
                   'active',1,$11)`,
          [
            link.id,
            input.organization_id,
            input.project_id,
            input.site_id,
            input.link.name,
            input.link.slug,
            input.link.visibility,
            input.link.expires_at,
            input.link.password_hash,
            input.link.password_salt,
            input.actor_org_user_id,
          ],
        );
        await client.query(
          `INSERT INTO publish_schema.publish_link_entry
            (id,organization_id,project_id,publish_link_id,
             project_version_id,documentation_site_id,site_edition_id,
             site_publication_id,position,is_default,version,
             created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,TRUE,1,$9,$9)`,
          [
            entry.id,
            input.organization_id,
            input.project_id,
            link.id,
            input.project_version_id,
            input.site_id,
            snapshot.revision.site_edition_id,
            publication.id,
            input.actor_org_user_id,
          ],
        );
      } else {
        const selected = await client.query<{
          link_id: string;
          slug: string;
          link_version: number;
          entry_id: string;
          entry_version: number;
          site_edition_id: string;
        }>(
          `SELECT link.id link_id,link.slug,link.version link_version,
                  entry.id entry_id,entry.version entry_version,
                  entry.site_edition_id
             FROM publish_schema.publish_link link
             JOIN publish_schema.publish_link_entry entry
               ON entry.publish_link_id=link.id
            WHERE link.id=$1 AND entry.id=$2
              AND link.organization_id=$3 AND link.project_id=$4
              AND link.documentation_site_id=$5
              AND link.resource_family='documentation_site'
              AND link.status='active'
            FOR UPDATE OF link,entry`,
          [
            input.link.link_id,
            input.link.entry_id,
            input.organization_id,
            input.project_id,
            input.site_id,
          ],
        );
        const selectedEntry = selected.rows[0];
        if (
          !selectedEntry ||
          selectedEntry.entry_version !== input.link.expected_entry_version ||
          selectedEntry.site_edition_id !== snapshot.revision.site_edition_id
        ) {
          const error = new Error("Publish Link entry changed or is invalid");
          Object.assign(error, { code: "documentation_publication_busy" });
          throw error;
        }
        entryBeforeVersion = selectedEntry.entry_version;
        await client.query(
          `UPDATE publish_schema.publish_link_entry
              SET site_publication_id=$1,version=version+1,
                  updated_by_id=$2,updated_at=CURRENT_TIMESTAMP
            WHERE id=$3 AND publish_link_id=$4`,
          [
            publication.id,
            input.actor_org_user_id,
            selectedEntry.entry_id,
            selectedEntry.link_id,
          ],
        );
        link = {
          id: selectedEntry.link_id,
          slug: selectedEntry.slug,
          version: selectedEntry.link_version,
        };
        entry = {
          id: selectedEntry.entry_id,
          version: selectedEntry.entry_version + 1,
        };
      }
      const result = {
        publication,
        link: {
          ...link,
          resource_family: "documentation_site" as const,
          documentation_site_id: input.site_id,
        },
        entry: { ...entry, site_publication_id: publication.id },
      };
      const audit_event = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: input.site_id,
        action: audit_command.action,
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: entryBeforeVersion,
        after_row_version: entry.version,
        changes: [
          ...(input.link.mode === "create"
            ? [
                {
                  entity_type: "publish_link",
                  entity_id: link.id,
                  parent_entity_type: "documentation_site",
                  parent_entity_id: input.site_id,
                  before: null,
                  after: { id: link.id, version: link.version },
                  safe_fields: { version: "integer" as const },
                },
              ]
            : []),
          {
            entity_type: "publish_link_entry",
            entity_id: entry.id,
            parent_entity_type: "publish_link",
            parent_entity_id: link.id,
            before:
              entryBeforeVersion === null
                ? null
                : { id: entry.id, version: entryBeforeVersion },
            after: { id: entry.id, version: entry.version },
            safe_fields: { version: "integer" as const },
          },
        ],
      });
      if (audit_event) await write_audit_event(client, audit_event);
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.publication.create",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  rollback_publication: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    link_id: string;
    entry_id: string;
    site_publication_id: string;
    expected_entry_version: number;
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        link_id: input.link_id,
        entry_id: input.entry_id,
        site_publication_id: input.site_publication_id,
        expected_entry_version: input.expected_entry_version,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.publication.rollback",
        request_digest,
      });
      if (replay) return replay;
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "publish.documentation_link.entry_rollback",
        action: "documentation.publish_link.entry_rolled_back",
      });
      const target = await client.query<{
        publication_sequence: number;
        site_edition_id: string;
      }>(
        `SELECT publication_sequence,site_edition_id
           FROM publish_schema.site_publication
          WHERE id=$1 AND organization_id=$2 AND project_id=$3
            AND documentation_site_id=$4 AND project_version_id=$5`,
        [
          input.site_publication_id,
          input.organization_id,
          input.project_id,
          input.site_id,
          input.project_version_id,
        ],
      );
      const current = await client.query<{
        version: number;
        site_edition_id: string;
        current_sequence: number;
      }>(
        `SELECT entry.version,entry.site_edition_id,
                publication.publication_sequence current_sequence
           FROM publish_schema.publish_link_entry entry
           JOIN publish_schema.publish_link link ON link.id=entry.publish_link_id
           JOIN publish_schema.site_publication publication
             ON publication.id=entry.site_publication_id
          WHERE entry.id=$1 AND link.id=$2
            AND link.organization_id=$3 AND link.project_id=$4
            AND link.documentation_site_id=$5
            AND link.resource_family='documentation_site'
            AND link.status='active'
          FOR UPDATE OF entry`,
        [
          input.entry_id,
          input.link_id,
          input.organization_id,
          input.project_id,
          input.site_id,
        ],
      );
      const destination = target.rows[0];
      const selected = current.rows[0];
      if (
        !destination ||
        !selected ||
        selected.version !== input.expected_entry_version ||
        selected.site_edition_id !== destination.site_edition_id ||
        destination.publication_sequence >= selected.current_sequence
      ) {
        const error = new Error("Rollback target is invalid");
        Object.assign(error, { code: "documentation_rollback_invalid" });
        throw error;
      }
      await client.query(
        `UPDATE publish_schema.publish_link_entry
            SET site_publication_id=$1,version=version+1,
                updated_by_id=$2,updated_at=CURRENT_TIMESTAMP
          WHERE id=$3 AND publish_link_id=$4`,
        [
          input.site_publication_id,
          input.actor_org_user_id,
          input.entry_id,
          input.link_id,
        ],
      );
      const result = {
        link_id: input.link_id,
        entry_id: input.entry_id,
        site_publication_id: input.site_publication_id,
        version: selected.version + 1,
      };
      const audit_event = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: input.site_id,
        action: "documentation.publish_link.entry_rolled_back",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: selected.version,
        after_row_version: selected.version + 1,
        changes: [
          {
            entity_type: "publish_link_entry",
            entity_id: input.entry_id,
            parent_entity_type: "publish_link",
            parent_entity_id: input.link_id,
            before: { id: input.entry_id, version: selected.version },
            after: { id: input.entry_id, version: selected.version + 1 },
            safe_fields: { version: "integer" },
          },
        ],
      });
      if (audit_event) await write_audit_event(client, audit_event);
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.publication.rollback",
        request_digest,
        response_status: 200,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  revoke_publish_link: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    link_id: string;
    expected_link_version: number;
  }) =>
    with_transaction(database, async (client) => {
      const selected = await client.query<{
        id: string;
        name: string;
        slug: string;
        status: "active" | "revoked";
        version: number;
      }>(
        `SELECT link.id,link.name,link.slug,link.status,link.version
           FROM publish_schema.publish_link link
          WHERE link.id=$1 AND link.organization_id=$2 AND link.project_id=$3
            AND link.documentation_site_id=$4
            AND link.resource_family='documentation_site'
            AND EXISTS (
              SELECT 1 FROM publish_schema.publish_link_entry entry
               WHERE entry.publish_link_id=link.id
                 AND entry.project_version_id=$5
            )
          FOR UPDATE`,
        [
          input.link_id,
          input.organization_id,
          input.project_id,
          input.site_id,
          input.project_version_id,
        ],
      );
      const link = selected.rows[0];
      if (!link) {
        const error = new Error("Documentation Publish Link was not found");
        Object.assign(error, { code: "publish_link_not_found" });
        throw error;
      }
      if (
        link.status !== "active" ||
        link.version !== input.expected_link_version
      ) {
        const error = new Error("Documentation Publish Link changed");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      const sessions = await client.query<{
        id: string;
        revoked_at: Date | null;
      }>(
        `SELECT id,revoked_at
           FROM publish_schema.public_publish_viewer_session
          WHERE publish_link_id=$1 AND revoked_at IS NULL
          FOR UPDATE`,
        [input.link_id],
      );
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "publish.documentation_link.revoke",
        action: "documentation.publish_link.revoked",
      });
      const revokedAt = new Date();
      await client.query(
        `UPDATE publish_schema.publish_link
            SET status='revoked',version=version+1,revoked_by_id=$1,
                revoked_at=$2,updated_at=$2
          WHERE id=$3`,
        [input.actor_org_user_id, revokedAt, input.link_id],
      );
      await client.query(
        `UPDATE publish_schema.public_publish_viewer_session
            SET revoked_at=$1
          WHERE publish_link_id=$2 AND revoked_at IS NULL`,
        [revokedAt, input.link_id],
      );
      const auditEvent = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: input.site_id,
        action: "documentation.publish_link.revoked",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: link.version,
        after_row_version: link.version + 1,
        changes: [
          {
            entity_type: "publish_link",
            entity_id: link.id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: { version: link.version },
            after: { version: link.version + 1 },
            safe_fields: { version: "integer" },
          },
          ...sessions.rows.map((session) => ({
            entity_type: "public_publish_viewer_session",
            entity_id: session.id,
            parent_entity_type: "publish_link",
            parent_entity_id: link.id,
            before: { revoked_at: session.revoked_at },
            after: { revoked_at: revokedAt },
            safe_fields: { revoked_at: "timestamp" as const },
          })),
        ],
      });
      if (auditEvent) await write_audit_event(client, auditEvent);
      return {
        publish_link: {
          ...link,
          status: "revoked" as const,
          version: link.version + 1,
          revoked_at: revokedAt.toISOString(),
        },
      };
    }),

  get_asset_file_record: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    asset_id: string;
  }) => {
    const result = await database.query<{
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
      checksum_sha256: string;
      width: number;
      height: number;
    }>(
      `SELECT file.storage_provider,file.storage_key,file.mime_type,
              file.size_bytes,file.checksum_sha256,asset.width,asset.height
         FROM documentation_schema.documentation_asset asset
         JOIN documentation_schema.site_edition edition
           ON edition.id=asset.site_edition_id
         JOIN file_schema.file file
           ON file.id=asset.file_id AND file.organization_id=asset.organization_id
        WHERE asset.id=$1 AND asset.organization_id=$2 AND asset.project_id=$3
          AND asset.documentation_site_id=$4
          AND edition.project_version_id=$5
          AND file.is_deleted=FALSE`,
      [
        input.asset_id,
        input.organization_id,
        input.project_id,
        input.site_id,
        input.project_version_id,
      ],
    );
    return result.rows[0] ?? null;
  },

  get_capture_asset_file_record: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    asset_id: string;
  }) => {
    const result = await database.query<{
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
      checksum_sha256: string;
      width: number;
      height: number;
    }>(
      `SELECT file.storage_provider,file.storage_key,file.mime_type,
              file.size_bytes,file.checksum_sha256,asset.width,asset.height
         FROM capture_schema.capture_asset asset
         JOIN file_schema.file file
           ON file.id=asset.file_id AND file.organization_id=asset.organization_id
        WHERE asset.id=$1 AND asset.organization_id=$2 AND asset.project_id=$3
          AND asset.is_deleted=FALSE AND file.is_deleted=FALSE
          AND asset.asset_type IN ('screenshot','redacted_screenshot')
          AND file.mime_type IN ('image/png','image/jpeg','image/webp')
          AND NOT EXISTS (
            SELECT 1
              FROM capture_schema.capture_asset_purge_operation purge
             WHERE purge.capture_asset_id=asset.id
          )
          AND (
            asset.status='active'
            OR (
              asset.status='archived'
              AND EXISTS (
                SELECT 1
                  FROM documentation_schema.site_edition edition
                 WHERE edition.documentation_site_id=$4
                   AND edition.project_version_id=$5
                   AND edition.organization_id=$2
                   AND edition.project_id=$3
                   AND (
                     EXISTS (
                       SELECT 1
                         FROM documentation_schema.documentation_page_block block
                        WHERE block.site_edition_id=edition.id
                          AND block.capture_asset_id=asset.id
                     )
                     OR EXISTS (
                       SELECT 1
                         FROM documentation_schema.documentation_snippet_block block
                        WHERE block.site_edition_id=edition.id
                          AND block.capture_asset_id=asset.id
                     )
                   )
              )
            )
          )`,
      [
        input.asset_id,
        input.organization_id,
        input.project_id,
        input.site_id,
        input.project_version_id,
      ],
    );
    return result.rows[0] ?? null;
  },

  get_public_asset_file_record: async (input: {
    slug: string;
    version_slug: string | null;
    asset_id: string;
  }) => {
    const result = await database.query<{
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
    }>(
      `SELECT file.storage_provider,file.storage_key,file.mime_type,
              file.size_bytes
         FROM publish_schema.publish_link link
         JOIN publish_schema.publish_link_entry entry
           ON entry.publish_link_id=link.id
         JOIN project_schema.project_version version
           ON version.id=entry.project_version_id
         JOIN publish_schema.site_publication publication
           ON publication.id=entry.site_publication_id
         JOIN documentation_schema.site_revision_asset_reference reference
          ON reference.site_revision_id=publication.site_revision_id
          AND reference.source_asset_id=$3
          AND reference.source_kind='documentation_asset'
         JOIN file_schema.file file ON file.id=reference.file_id
        WHERE link.slug=$1 AND link.resource_family='documentation_site'
          AND link.status='active' AND link.visibility='public'
          AND (link.expires_at IS NULL OR link.expires_at>CURRENT_TIMESTAMP)
          AND (
            ($2::varchar IS NULL AND entry.is_default)
            OR ($2::varchar IS NOT NULL AND version.slug=$2)
          )
          AND file.is_deleted=FALSE
        LIMIT 1`,
      [input.slug, input.version_slug, input.asset_id],
    );
    return result.rows[0] ?? null;
  },

  get_public_capture_asset_file_record: async (input: {
    slug: string;
    version_slug: string | null;
    asset_id: string;
  }) => {
    const result = await database.query<{
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
    }>(
      `SELECT file.storage_provider,file.storage_key,reference.mime_type,
              reference.byte_size size_bytes
         FROM publish_schema.publish_link link
         JOIN publish_schema.publish_link_entry entry
           ON entry.publish_link_id=link.id
         JOIN project_schema.project_version version
           ON version.id=entry.project_version_id
         JOIN publish_schema.site_publication publication
           ON publication.id=entry.site_publication_id
         JOIN documentation_schema.site_revision_asset_reference reference
           ON reference.site_revision_id=publication.site_revision_id
          AND reference.source_asset_id=$3
          AND reference.source_kind='capture_asset'
         JOIN file_schema.file file ON file.id=reference.file_id
        WHERE link.slug=$1 AND link.resource_family='documentation_site'
          AND link.status='active'
          AND (link.expires_at IS NULL OR link.expires_at>CURRENT_TIMESTAMP)
          AND (
            ($2::varchar IS NULL AND entry.is_default)
            OR ($2::varchar IS NOT NULL AND version.slug=$2)
          )
          AND file.is_deleted=FALSE
        LIMIT 1`,
      [input.slug, input.version_slug, input.asset_id],
    );
    return result.rows[0] ?? null;
  },

  resolve_public_site: async (input: {
    slug: string;
    version_slug: string | null;
  }) => {
    const selection = await database.query<{
      link_id: string;
      name: string;
      slug: string;
      visibility: "public" | "restricted";
      expires_at: Date | null;
      status: "active" | "revoked";
      entry_id: string;
      project_version_name: string;
      project_version_slug: string;
      site_publication_id: string;
      publication_sequence: number;
      site_revision_id: string;
      output_digest: string;
    }>(
      `SELECT link.id link_id,link.name,link.slug,link.visibility,
              link.expires_at,link.status,entry.id entry_id,
              version.name project_version_name,
              version.slug project_version_slug,
              publication.id site_publication_id,
              publication.publication_sequence,
              publication.site_revision_id,publication.output_digest
         FROM publish_schema.publish_link link
         JOIN publish_schema.publish_link_entry entry
           ON entry.publish_link_id=link.id
         JOIN project_schema.project_version version
           ON version.id=entry.project_version_id
         JOIN publish_schema.site_publication publication
           ON publication.id=entry.site_publication_id
        WHERE link.slug=$1 AND link.resource_family='documentation_site'
          AND (
            ($2::varchar IS NULL AND entry.is_default)
            OR ($2::varchar IS NOT NULL AND version.slug=$2)
          )
        LIMIT 1`,
      [input.slug, input.version_slug],
    );
    const selected = selection.rows[0];
    if (
      !selected ||
      selected.status !== "active" ||
      (selected.expires_at && selected.expires_at.getTime() <= Date.now())
    )
      return null;
    const snapshot = await load_revision_snapshot(database, {
      site_revision_id: selected.site_revision_id,
    });
    if (!snapshot) return null;
    const search_documents = await database.query<{
      page_id: string;
      title: string;
      description: string | null;
      canonical_path: string;
      search_text: string;
    }>(
      `SELECT source_page_id page_id,title,description,canonical_path,search_text
         FROM publish_schema.site_publication_search_document
        WHERE site_publication_id=$1
        ORDER BY canonical_path,page_id`,
      [selected.site_publication_id],
    );
    return {
      resource_family: "documentation_site" as const,
      link: {
        id: selected.link_id,
        name: selected.name,
        slug: selected.slug,
        visibility: selected.visibility,
      },
      entry: {
        id: selected.entry_id,
        project_version_name: selected.project_version_name,
        project_version_slug: selected.project_version_slug,
      },
      publication: {
        id: selected.site_publication_id,
        publication_sequence: selected.publication_sequence,
        output_digest: selected.output_digest,
      },
      search_documents: search_documents.rows,
      ...snapshot,
    };
  },

  list_comments: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
  }) => {
    const threads = await database.query<Record<string, unknown>>(
      `SELECT thread.id,thread.documentation_page_id,thread.block_anchor_id,
              thread.body,thread.state,thread.version,thread.created_by_id,
              thread.created_at,thread.updated_at
         FROM documentation_schema.comment_thread thread
         JOIN documentation_schema.site_edition edition
           ON edition.id=thread.site_edition_id
        WHERE thread.organization_id=$1 AND thread.project_id=$2
          AND edition.project_version_id=$3
          AND edition.documentation_site_id=$4
          AND thread.documentation_page_id=$5
        ORDER BY thread.created_at,thread.id`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.page_id,
      ],
    );
    const ids = threads.rows.map((thread) => thread.id as string);
    if (!ids.length) return [];
    const replies = await database.query<Record<string, unknown>>(
      `SELECT id,comment_thread_id,body,version,created_by_id,created_at
         FROM documentation_schema.comment_reply
        WHERE organization_id=$1 AND project_id=$2
          AND comment_thread_id=ANY($3::varchar[])
        ORDER BY created_at,id`,
      [input.organization_id, input.project_id, ids],
    );
    const mentions = await database.query<{
      comment_thread_id: string;
      comment_reply_id: string | null;
      project_membership_id: string;
    }>(
      `SELECT comment_thread_id,comment_reply_id,project_membership_id
         FROM documentation_schema.comment_mention
        WHERE organization_id=$1 AND project_id=$2
          AND comment_thread_id=ANY($3::varchar[])
        ORDER BY created_at,id`,
      [input.organization_id, input.project_id, ids],
    );
    return threads.rows.map((thread) => ({
      ...thread,
      mentioned_project_membership_ids: mentions.rows
        .filter(
          (mention) =>
            mention.comment_thread_id === thread.id &&
            mention.comment_reply_id === null,
        )
        .map((mention) => mention.project_membership_id),
      replies: replies.rows
        .filter((reply) => reply.comment_thread_id === thread.id)
        .map((reply) => ({
          ...reply,
          mentioned_project_membership_ids: mentions.rows
            .filter((mention) => mention.comment_reply_id === reply.id)
            .map((mention) => mention.project_membership_id),
        })),
    }));
  },

  update_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
    actor_org_user_id: string;
    data: {
      expected_version: number;
      title?: string;
      description?: string | null;
      canonical_path?: string;
      keywords?: string[];
    };
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        title: string;
        description: string | null;
        canonical_path: string;
        version: number;
      }>(
        `SELECT page.id,page.site_edition_id,page.title,page.description,
                page.canonical_path,page.version
           FROM documentation_schema.documentation_page page
           JOIN documentation_schema.site_edition edition
             ON edition.id=page.site_edition_id
          WHERE page.organization_id=$1 AND page.project_id=$2
            AND edition.project_version_id=$3
            AND page.documentation_site_id=$4 AND page.id=$5
          FOR UPDATE OF page`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.page_id,
        ],
      );
      const page = current.rows[0];
      if (!page) throw new Error("Documentation Page was not found");
      await lock_documentation_path_namespace(client, page.site_edition_id);
      if (page.version !== input.data.expected_version)
        throw new DocumentationRowVersionConflictError({
          ...page,
          blocks: [],
        });
      const canonical_path = input.data.canonical_path ?? page.canonical_path;
      const page_audit =
        canonical_path === page.canonical_path
          ? {
              command: "documentation.page.update",
              action: "documentation.page_updated",
            }
          : {
              command: "documentation.page.path_change",
              action: "documentation.page_path_changed",
            };
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        ...page_audit,
      });

      if (canonical_path !== page.canonical_path) {
        const reserved = await client.query(
          `SELECT 1
             FROM documentation_schema.page_slug_alias alias
            WHERE alias.site_edition_id=$1 AND alias.former_path=$2
           UNION ALL
           SELECT 1
             FROM documentation_schema.documentation_redirect_rule rule
            WHERE rule.site_edition_id=$1 AND rule.source_path=$2
           LIMIT 1`,
          [page.site_edition_id, canonical_path],
        );
        if (reserved.rows[0]) {
          const error = new Error("Documentation path is retired");
          Object.assign(error, { code: "documentation_path_retired" });
          throw error;
        }
        const routing = await client.query<{ id: string }>(
          `SELECT id FROM documentation_schema.routing_set
            WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3`,
          [page.site_edition_id, input.organization_id, input.project_id],
        );
        await client.query(
          `INSERT INTO documentation_schema.page_slug_alias
            (id,organization_id,project_id,site_edition_id,routing_set_id,
             documentation_page_id,former_path,created_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            page.site_edition_id,
            routing.rows[0]!.id,
            input.page_id,
            page.canonical_path,
            input.actor_org_user_id,
          ],
        );
      }

      if (input.data.keywords) {
        await client.query(
          `DELETE FROM documentation_schema.documentation_page_keyword
            WHERE documentation_page_id=$1 AND organization_id=$2 AND project_id=$3`,
          [input.page_id, input.organization_id, input.project_id],
        );
        for (const [index, keyword] of input.data.keywords.entries()) {
          await client.query(
            `INSERT INTO documentation_schema.documentation_page_keyword
              (id,organization_id,project_id,site_edition_id,
               documentation_page_id,keyword,position)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              ulid(),
              input.organization_id,
              input.project_id,
              page.site_edition_id,
              input.page_id,
              keyword,
              index + 1,
            ],
          );
        }
      }
      const title = input.data.title ?? page.title;
      const description =
        "description" in input.data
          ? (input.data.description ?? null)
          : page.description;
      await client.query(
        `UPDATE documentation_schema.documentation_page
            SET title=$1,description=$2,canonical_path=$3,version=version+1,
                updated_by_id=$4,updated_at=CURRENT_TIMESTAMP
          WHERE id=$5 AND organization_id=$6 AND project_id=$7`,
        [
          title,
          description,
          canonical_path,
          input.actor_org_user_id,
          input.page_id,
          input.organization_id,
          input.project_id,
        ],
      );
      await bump_working_draft(client, {
        ...input,
        site_edition_id: page.site_edition_id,
      });
      await client.query(
        `UPDATE documentation_schema.documentation_draft_search_document
            SET title=$1,description=$2,canonical_path=$3,
                updated_at=CURRENT_TIMESTAMP
          WHERE documentation_page_id=$4 AND organization_id=$5
            AND project_id=$6`,
        [
          title,
          description,
          canonical_path,
          input.page_id,
          input.organization_id,
          input.project_id,
        ],
      );
      const result = {
        ...page,
        title,
        description,
        canonical_path,
        version: page.version + 1,
        keywords: input.data.keywords ?? [],
      };
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: page_audit.action,
        entity_type: "documentation_page",
        entity_id: input.page_id,
        before_version: page.version,
        after_version: page.version + 1,
      });
      return result;
    }),

  replace_navigation: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    expected_version: number;
    nodes: Array<{
      id: string;
      parent_id: string | null;
      kind: "group" | "page";
      label: string | null;
      page_id: string | null;
      position: number;
    }>;
  }) =>
    with_transaction(database, async (client) => {
      validate_documentation_navigation(
        input.nodes.map((node) => ({
          id: node.id,
          parent_id: node.parent_id,
          kind: node.kind,
          page_id: node.page_id,
        })),
      );
      const treeResult = await client.query<{
        id: string;
        site_edition_id: string;
        version: number;
      }>(
        `SELECT tree.id,tree.site_edition_id,tree.version
           FROM documentation_schema.navigation_tree tree
           JOIN documentation_schema.site_edition edition
             ON edition.id=tree.site_edition_id
          WHERE tree.organization_id=$1 AND tree.project_id=$2
            AND edition.project_version_id=$3
            AND tree.documentation_site_id=$4
          FOR UPDATE OF tree`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const tree = treeResult.rows[0];
      if (!tree) throw new Error("Documentation Site was not found");
      if (tree.version !== input.expected_version) {
        const error = new Error("Navigation changed; reload and retry");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.navigation.replace",
        action: "documentation.navigation_replaced",
      });
      const pageIds = input.nodes
        .map((node) => node.page_id)
        .filter((id): id is string => Boolean(id));
      if (pageIds.length) {
        const pages = await client.query<{ id: string }>(
          `SELECT id FROM documentation_schema.documentation_page
            WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3
              AND id=ANY($4::varchar[])`,
          [
            tree.site_edition_id,
            input.organization_id,
            input.project_id,
            pageIds,
          ],
        );
        if (pages.rows.length !== pageIds.length) {
          const error = new Error("Navigation references an unknown Page");
          Object.assign(error, { code: "documentation_navigation_invalid" });
          throw error;
        }
      }
      await client.query(
        `DELETE FROM documentation_schema.navigation_node
          WHERE navigation_tree_id=$1 AND organization_id=$2 AND project_id=$3`,
        [tree.id, input.organization_id, input.project_id],
      );
      const remaining = new Map(input.nodes.map((node) => [node.id, node]));
      while (remaining.size) {
        const ready = [...remaining.values()].filter(
          (node) => !node.parent_id || !remaining.has(node.parent_id),
        );
        if (!ready.length) {
          const error = new Error("Navigation must be acyclic");
          Object.assign(error, { code: "documentation_navigation_invalid" });
          throw error;
        }
        for (const node of ready) {
          await client.query(
            `INSERT INTO documentation_schema.navigation_node
              (id,organization_id,project_id,site_edition_id,navigation_tree_id,
               parent_id,kind,label,documentation_page_id,position,
               created_by_id,updated_by_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
            [
              node.id,
              input.organization_id,
              input.project_id,
              tree.site_edition_id,
              tree.id,
              node.parent_id,
              node.kind,
              node.label,
              node.page_id,
              node.position,
              input.actor_org_user_id,
            ],
          );
          remaining.delete(node.id);
        }
      }
      await client.query(
        `UPDATE documentation_schema.navigation_tree
            SET version=version+1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP
          WHERE id=$2`,
        [input.actor_org_user_id, tree.id],
      );
      await bump_working_draft(client, {
        ...input,
        site_edition_id: tree.site_edition_id,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.navigation_replaced",
        entity_type: "navigation_tree",
        entity_id: tree.id,
        before_version: tree.version,
        after_version: tree.version + 1,
      });
      return { id: tree.id, version: tree.version + 1, nodes: input.nodes };
    }),

  replace_routing: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    expected_version: number;
    rules: Array<{
      id: string;
      source_path: string;
      outcome: "redirect" | "gone";
      target_page_id: string | null;
    }>;
  }) =>
    with_transaction(database, async (client) => {
      const setResult = await client.query<{
        id: string;
        site_edition_id: string;
        version: number;
      }>(
        `SELECT routing.id,routing.site_edition_id,routing.version
           FROM documentation_schema.routing_set routing
           JOIN documentation_schema.site_edition edition
             ON edition.id=routing.site_edition_id
          WHERE routing.organization_id=$1 AND routing.project_id=$2
            AND edition.project_version_id=$3
            AND routing.documentation_site_id=$4
          FOR UPDATE OF routing`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const routing = setResult.rows[0];
      if (!routing) throw new Error("Documentation Site was not found");
      await lock_documentation_path_namespace(client, routing.site_edition_id);
      if (routing.version !== input.expected_version) {
        const error = new Error("Routing changed; reload and retry");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      const pages = await client.query<{ id: string; canonical_path: string }>(
        `SELECT id,canonical_path
           FROM documentation_schema.documentation_page
          WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3`,
        [routing.site_edition_id, input.organization_id, input.project_id],
      );
      const paths = new Map(
        pages.rows.map((page) => [page.id, page.canonical_path]),
      );
      validate_documentation_routes(
        input.rules.map((rule) => ({
          source_path: rule.source_path,
          outcome: rule.outcome,
          target_path:
            rule.outcome === "redirect"
              ? (paths.get(rule.target_page_id ?? "") ?? null)
              : null,
        })),
      );
      if (
        input.rules.some(
          (rule) =>
            pages.rows.some(
              (page) => page.canonical_path === rule.source_path,
            ) ||
            (rule.target_page_id !== null && !paths.has(rule.target_page_id)),
        )
      ) {
        const error = new Error(
          "Routing references a conflicting path or Page",
        );
        Object.assign(error, { code: "documentation_path_conflict" });
        throw error;
      }
      const aliases = await client.query<{
        id: string;
        documentation_page_id: string;
        former_path: string;
      }>(
        `SELECT id,documentation_page_id,former_path
           FROM documentation_schema.page_slug_alias
          WHERE site_edition_id=$1 AND organization_id=$2 AND project_id=$3
          ORDER BY former_path`,
        [routing.site_edition_id, input.organization_id, input.project_id],
      );
      if (
        input.rules.some((rule) =>
          aliases.rows.some((alias) => alias.former_path === rule.source_path),
        )
      ) {
        const error = new Error("Documentation path is retired");
        Object.assign(error, { code: "documentation_path_retired" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.routing.replace",
        action: "documentation.routing_replaced",
      });
      await client.query(
        `DELETE FROM documentation_schema.documentation_redirect_rule
          WHERE routing_set_id=$1 AND organization_id=$2 AND project_id=$3`,
        [routing.id, input.organization_id, input.project_id],
      );
      for (const rule of input.rules) {
        await client.query(
          `INSERT INTO documentation_schema.documentation_redirect_rule
            (id,organization_id,project_id,site_edition_id,routing_set_id,
             source_path,outcome,target_page_id,created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
          [
            rule.id,
            input.organization_id,
            input.project_id,
            routing.site_edition_id,
            routing.id,
            rule.source_path,
            rule.outcome,
            rule.target_page_id,
            input.actor_org_user_id,
          ],
        );
      }
      await client.query(
        `UPDATE documentation_schema.routing_set
            SET version=version+1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP
          WHERE id=$2`,
        [input.actor_org_user_id, routing.id],
      );
      await bump_working_draft(client, {
        ...input,
        site_edition_id: routing.site_edition_id,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.routing_replaced",
        entity_type: "routing_set",
        entity_id: routing.id,
        before_version: routing.version,
        after_version: routing.version + 1,
      });
      return {
        id: routing.id,
        version: routing.version + 1,
        rules: input.rules,
        aliases: aliases.rows,
      };
    }),

  create_comment_thread: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    body: string;
    block_anchor_id: string | null;
    mentioned_project_membership_ids: string[];
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        site_id: input.site_id,
        page_id: input.page_id,
        body: input.body,
        block_anchor_id: input.block_anchor_id,
        mentioned_project_membership_ids:
          input.mentioned_project_membership_ids,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.comment.create",
        request_digest,
      });
      if (replay) return replay;
      const page = await client.query<{ site_edition_id: string }>(
        `SELECT page.site_edition_id
           FROM documentation_schema.documentation_page page
           JOIN documentation_schema.site_edition edition
             ON edition.id=page.site_edition_id
          WHERE page.id=$1 AND page.documentation_site_id=$2
            AND page.organization_id=$3 AND page.project_id=$4
            AND edition.project_version_id=$5
          FOR UPDATE OF page`,
        [
          input.page_id,
          input.site_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
        ],
      );
      if (!page.rows[0]) throw new Error("Documentation Page was not found");
      const thread_count = await client.query<{ thread_count: number }>(
        `SELECT COUNT(*)::integer thread_count
           FROM documentation_schema.comment_thread
          WHERE organization_id=$1 AND project_id=$2
            AND documentation_page_id=$3`,
        [input.organization_id, input.project_id, input.page_id],
      );
      if (
        (thread_count.rows[0]?.thread_count ?? 0) >=
        DOCUMENTATION_COMMENT_THREADS_PER_PAGE_MAX
      ) {
        const error = new Error("Documentation comment limit exceeded");
        Object.assign(error, { code: "documentation_comment_limit_exceeded" });
        throw error;
      }
      if (input.block_anchor_id) {
        const anchor = await client.query(
          `SELECT 1 FROM documentation_schema.documentation_page_block
            WHERE id=$1 AND documentation_page_id=$2
              AND site_edition_id=$3 AND organization_id=$4 AND project_id=$5`,
          [
            input.block_anchor_id,
            input.page_id,
            page.rows[0].site_edition_id,
            input.organization_id,
            input.project_id,
          ],
        );
        if (!anchor.rows[0]) {
          const error = new Error("Comment anchor was not found");
          Object.assign(error, {
            code: "documentation_comment_anchor_missing",
          });
          throw error;
        }
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.comment.thread_create",
        action: "documentation.comment_thread_created",
      });
      const thread = {
        id: ulid(),
        documentation_page_id: input.page_id,
        block_anchor_id: input.block_anchor_id,
        body: input.body,
        state: "open" as const,
        version: 1,
      };
      await client.query(
        `INSERT INTO documentation_schema.comment_thread
          (id,organization_id,project_id,site_edition_id,documentation_page_id,
           block_anchor_id,body,created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
        [
          thread.id,
          input.organization_id,
          input.project_id,
          page.rows[0].site_edition_id,
          input.page_id,
          input.block_anchor_id,
          input.body,
          input.actor_org_user_id,
        ],
      );
      await insert_comment_mentions(client, {
        organization_id: input.organization_id,
        project_id: input.project_id,
        site_edition_id: page.rows[0].site_edition_id,
        thread_id: thread.id,
        reply_id: null,
        actor_org_user_id: input.actor_org_user_id,
        project_membership_ids: input.mentioned_project_membership_ids,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.comment_thread_created",
        entity_type: "comment_thread",
        entity_id: thread.id,
        before_version: null,
        after_version: 1,
      });
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.comment.create",
        request_digest,
        response_status: 201,
        response_body: thread,
      });
      return { ...thread, idempotent_replay: false };
    }),

  create_comment_reply: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    thread_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    body: string;
    mentioned_project_membership_ids: string[];
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        site_id: input.site_id,
        thread_id: input.thread_id,
        body: input.body,
        mentioned_project_membership_ids:
          input.mentioned_project_membership_ids,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.comment.reply",
        request_digest,
      });
      if (replay) return replay;
      const thread = await client.query<{ site_edition_id: string }>(
        `SELECT thread.site_edition_id
           FROM documentation_schema.comment_thread thread
           JOIN documentation_schema.site_edition edition
             ON edition.id=thread.site_edition_id
          WHERE thread.id=$1 AND edition.documentation_site_id=$2
            AND thread.organization_id=$3 AND thread.project_id=$4
            AND edition.project_version_id=$5
          FOR UPDATE OF thread`,
        [
          input.thread_id,
          input.site_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
        ],
      );
      if (!thread.rows[0]) throw new Error("Comment thread was not found");
      const reply_count = await client.query<{ reply_count: number }>(
        `SELECT COUNT(*)::integer reply_count
           FROM documentation_schema.comment_reply
          WHERE organization_id=$1 AND project_id=$2
            AND comment_thread_id=$3`,
        [input.organization_id, input.project_id, input.thread_id],
      );
      if (
        (reply_count.rows[0]?.reply_count ?? 0) >=
        DOCUMENTATION_COMMENT_REPLIES_PER_THREAD_MAX
      ) {
        const error = new Error("Documentation comment limit exceeded");
        Object.assign(error, { code: "documentation_comment_limit_exceeded" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.comment.reply_create",
        action: "documentation.comment_reply_created",
      });
      const reply = {
        id: ulid(),
        comment_thread_id: input.thread_id,
        body: input.body,
        version: 1,
      };
      await client.query(
        `INSERT INTO documentation_schema.comment_reply
          (id,organization_id,project_id,site_edition_id,comment_thread_id,
           body,created_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          reply.id,
          input.organization_id,
          input.project_id,
          thread.rows[0].site_edition_id,
          input.thread_id,
          input.body,
          input.actor_org_user_id,
        ],
      );
      await insert_comment_mentions(client, {
        organization_id: input.organization_id,
        project_id: input.project_id,
        site_edition_id: thread.rows[0].site_edition_id,
        thread_id: input.thread_id,
        reply_id: reply.id,
        actor_org_user_id: input.actor_org_user_id,
        project_membership_ids: input.mentioned_project_membership_ids,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.comment_reply_created",
        entity_type: "comment_reply",
        entity_id: reply.id,
        before_version: null,
        after_version: 1,
      });
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.comment.reply",
        request_digest,
        response_status: 201,
        response_body: reply,
      });
      return { ...reply, idempotent_replay: false };
    }),

  transition_comment: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    thread_id: string;
    actor_org_user_id: string;
    expected_version: number;
    transition: "resolve" | "reopen";
  }) =>
    with_transaction(database, async (client) => {
      const result = await client.query<{
        id: string;
        state: "open" | "resolved";
        version: number;
      }>(
        `SELECT thread.id,thread.state,thread.version
           FROM documentation_schema.comment_thread thread
           JOIN documentation_schema.site_edition edition
             ON edition.id=thread.site_edition_id
          WHERE thread.id=$1 AND edition.documentation_site_id=$2
            AND thread.organization_id=$3 AND thread.project_id=$4
            AND edition.project_version_id=$5
          FOR UPDATE OF thread`,
        [
          input.thread_id,
          input.site_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
        ],
      );
      const thread = result.rows[0];
      if (!thread) throw new Error("Comment thread was not found");
      if (thread.version !== input.expected_version) {
        const error = new Error("Comment changed; reload and retry");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      const state = assert_documentation_comment_transition(
        thread.state,
        input.transition,
      );
      const transition_audit =
        input.transition === "resolve"
          ? {
              command: "documentation.comment.resolve",
              action: "documentation.comment_resolved",
            }
          : {
              command: "documentation.comment.reopen",
              action: "documentation.comment_reopened",
            };
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        ...transition_audit,
      });
      await client.query(
        `UPDATE documentation_schema.comment_thread
            SET state=$1,version=version+1,updated_by_id=$2,
                updated_at=CURRENT_TIMESTAMP
          WHERE id=$3`,
        [state, input.actor_org_user_id, input.thread_id],
      );
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: transition_audit.action,
        entity_type: "comment_thread",
        entity_id: input.thread_id,
        before_version: thread.version,
        after_version: thread.version + 1,
      });
      return { ...thread, state, version: thread.version + 1 };
    }),

  create_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    data: {
      title: string;
      description: string | null;
      canonical_path: string;
    };
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        project_version_id: input.project_version_id,
        site_id: input.site_id,
        data: input.data,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.page.create",
        request_digest,
      });
      if (replay) return replay;
      const parent = await client.query<{
        edition_id: string;
        working_draft_id: string;
      }>(
        `SELECT edition.id edition_id,draft.id working_draft_id
           FROM documentation_schema.site_edition edition
           JOIN documentation_schema.site_working_draft draft
             ON draft.site_edition_id=edition.id
          WHERE edition.organization_id=$1 AND edition.project_id=$2
            AND edition.project_version_id=$3
            AND edition.documentation_site_id=$4
          FOR UPDATE OF edition,draft`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const scope = parent.rows[0];
      if (!scope) throw new Error("Documentation Site was not found");
      await lock_documentation_path_namespace(client, scope.edition_id);
      const page_count = await client.query<{ page_count: number }>(
        `SELECT COUNT(*)::integer page_count
           FROM documentation_schema.documentation_page
          WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3`,
        [input.organization_id, input.project_id, scope.edition_id],
      );
      if (
        (page_count.rows[0]?.page_count ?? 0) >=
        DOCUMENTATION_PAGES_PER_EDITION_MAX
      ) {
        const error = new Error("Documentation Page limit exceeded");
        Object.assign(error, { code: "documentation_page_limit_exceeded" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.page.create",
        action: "documentation.page_created",
      });
      const id = ulid();
      await client.query(
        `INSERT INTO documentation_schema.documentation_page
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           site_working_draft_id,title,description,canonical_path,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        [
          id,
          input.organization_id,
          input.project_id,
          input.site_id,
          scope.edition_id,
          scope.working_draft_id,
          input.data.title,
          input.data.description,
          input.data.canonical_path,
          input.actor_org_user_id,
        ],
      );
      await insert_draft_search_document(client, {
        organization_id: input.organization_id,
        project_id: input.project_id,
        project_version_id: input.project_version_id,
        site_id: input.site_id,
        site_edition_id: scope.edition_id,
        page_id: id,
        title: input.data.title,
        description: input.data.description,
        canonical_path: input.data.canonical_path,
        search_text: search_text_for_blocks(
          input.data.title,
          input.data.description,
          [],
        ),
      });
      const result = {
        id,
        title: input.data.title,
        description: input.data.description,
        canonical_path: input.data.canonical_path,
        version: 1,
        blocks: [],
      };
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.page_created",
        entity_type: "documentation_page",
        entity_id: id,
        before_version: null,
        after_version: 1,
      });
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.page.create",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      await bump_working_draft(client, {
        ...input,
        site_edition_id: scope.edition_id,
      });
      return { ...result, idempotent_replay: false };
    }),

  get_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
  }) => {
    const page = await database.query<{
      id: string;
      title: string;
      description: string | null;
      canonical_path: string;
      version: number;
    }>(
      `SELECT page.id,page.title,page.description,page.canonical_path,page.version
         FROM documentation_schema.documentation_page page
         JOIN documentation_schema.site_edition edition
           ON edition.id=page.site_edition_id
        WHERE page.organization_id=$1 AND page.project_id=$2
          AND edition.project_version_id=$3
          AND page.documentation_site_id=$4 AND page.id=$5`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.page_id,
      ],
    );
    if (!page.rows[0]) return null;
    const blocks = await database.query<Record<string, unknown>>(
      `SELECT block.id,block.kind,block.position,block.heading_level,
              block.text_content,block.code_language,block.link_url,
              block.linked_page_id,block.linked_block_id,
              block.documentation_asset_id,block.capture_asset_id,
              block.openapi_source_id,block.operation_key,
              block.snippet_id,block.published_artifact_id,
              block.callout_tone,block.display_title,
              block.quote_attribution,block.table_caption,
              block.alt_text,block.image_caption,block.version,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',item.id,'text',item.text_content,'position',item.position,
                  'expected_version',item.version
                ) ORDER BY item.position,item.id)
                  FROM documentation_schema.documentation_list_item item
                 WHERE item.documentation_page_block_id=block.id
              ),'[]'::jsonb) list_items,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',tab.id,'label',tab.label,'body',tab.body,
                  'position',tab.position,'expected_version',tab.version
                ) ORDER BY tab.position,tab.id)
                  FROM documentation_schema.documentation_tab_item tab
                 WHERE tab.documentation_page_block_id=block.id
              ),'[]'::jsonb) tab_items,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',row.id,'position',row.position,
                  'expected_version',row.version,'cells',(
                    SELECT jsonb_agg(jsonb_build_object(
                      'id',cell.id,'column_position',cell.column_position,
                      'expected_version',cell.version,'is_header',cell.is_header,
                      'text',cell.text_content
                    ) ORDER BY cell.column_position,cell.id)
                    FROM documentation_schema.documentation_table_cell cell
                    WHERE cell.documentation_table_row_id=row.id
                  )
                ) ORDER BY row.position,row.id)
                FROM documentation_schema.documentation_table_row row
                WHERE row.documentation_page_block_id=block.id
              ),'[]'::jsonb) rows
         FROM documentation_schema.documentation_page_block block
        WHERE block.organization_id=$1 AND block.project_id=$2
          AND block.documentation_page_id=$3 ORDER BY block.position,block.id`,
      [input.organization_id, input.project_id, input.page_id],
    );
    return {
      ...page.rows[0],
      blocks: blocks.rows.map((row) =>
        to_documentation_block({
          ...row,
          items: row.kind === "tabs" ? row.tab_items : row.list_items,
        }),
      ),
    };
  },

  save_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
    actor_org_user_id: string;
    expected_page_version: number;
    blocks: Array<Record<string, unknown>>;
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        title: string;
        description: string | null;
        canonical_path: string;
        version: number;
      }>(
        `SELECT page.id,page.site_edition_id,page.title,page.description,
                page.canonical_path,page.version
           FROM documentation_schema.documentation_page page
           JOIN documentation_schema.site_edition edition
             ON edition.id=page.site_edition_id
          WHERE page.organization_id=$1 AND page.project_id=$2
            AND edition.project_version_id=$3
            AND page.documentation_site_id=$4 AND page.id=$5
          FOR UPDATE OF page`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.page_id,
        ],
      );
      const page = current.rows[0];
      if (!page) throw new Error("Documentation Page was not found");
      if (page.version !== input.expected_page_version) {
        throw new DocumentationRowVersionConflictError({
          ...page,
          blocks: [],
        });
      }
      await validate_mutable_content_references(client, {
        ...input,
        site_edition_id: page.site_edition_id,
        owner_id: input.page_id,
        owner_kind: "page",
      });
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.page.content_replace",
        action: "documentation.page_content_replaced",
      });
      await client.query(
        `DELETE FROM documentation_schema.documentation_table_cell
          WHERE documentation_page_id=$1`,
        [input.page_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_table_row
          WHERE documentation_page_id=$1`,
        [input.page_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_tab_item
          WHERE documentation_page_id=$1`,
        [input.page_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_list_item item
          USING documentation_schema.documentation_page_block block
         WHERE item.documentation_page_block_id=block.id
           AND block.organization_id=$1 AND block.project_id=$2
           AND block.documentation_page_id=$3`,
        [input.organization_id, input.project_id, input.page_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_page_block
          WHERE organization_id=$1 AND project_id=$2 AND documentation_page_id=$3`,
        [input.organization_id, input.project_id, input.page_id],
      );
      for (const block of input.blocks) {
        const source =
          typeof block.source === "object" && block.source
            ? (block.source as { kind: string; id: string })
            : block.asset_id
              ? { kind: "documentation_asset", id: String(block.asset_id) }
              : null;
        const publication_type =
          block.kind === "guide_publication"
            ? "guide"
            : block.kind === "interactive_demo_publication"
              ? "interactive_demo"
              : null;
        await client.query(
          `INSERT INTO documentation_schema.documentation_page_block
            (id,organization_id,project_id,site_edition_id,documentation_page_id,
             kind,position,heading_level,text_content,link_url,linked_page_id,
             linked_block_id,code_language,documentation_asset_id,
             capture_asset_id,openapi_source_id,operation_key,snippet_id,
             published_artifact_id,published_artifact_type,callout_tone,
             display_title,quote_attribution,table_caption,alt_text,image_caption,
             created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                   $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$27)`,
          [
            block.id,
            input.organization_id,
            input.project_id,
            page.site_edition_id,
            input.page_id,
            block.kind,
            block.position,
            block.level ?? null,
            block.text ?? block.code ?? block.label ?? null,
            block.url ?? null,
            block.page_id ?? null,
            block.target_block_id ?? null,
            block.language ?? null,
            source?.kind === "documentation_asset" ? source.id : null,
            source?.kind === "capture_asset" ? source.id : null,
            block.openapi_source_id ?? null,
            block.operation_key ?? null,
            block.snippet_id ?? null,
            block.published_artifact_id ?? null,
            publication_type,
            block.tone ?? null,
            block.title ?? null,
            block.attribution ?? null,
            block.caption ?? null,
            block.alt_text ?? null,
            block.caption ?? null,
            input.actor_org_user_id,
          ],
        );
        if (
          (block.kind === "ordered_list" || block.kind === "unordered_list") &&
          Array.isArray(block.items)
        ) {
          for (const item of block.items as Array<Record<string, unknown>>) {
            await client.query(
              `INSERT INTO documentation_schema.documentation_list_item
                (id,organization_id,project_id,site_edition_id,
                 documentation_page_id,documentation_page_block_id,
                 text_content,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [
                item.id,
                input.organization_id,
                input.project_id,
                page.site_edition_id,
                input.page_id,
                block.id,
                item.text,
                item.position,
              ],
            );
          }
        }
        if (block.kind === "tabs" && Array.isArray(block.items)) {
          for (const item of block.items as Array<Record<string, unknown>>) {
            await client.query(
              `INSERT INTO documentation_schema.documentation_tab_item
                (id,organization_id,project_id,site_edition_id,
                 documentation_page_id,documentation_page_block_id,
                 label,body,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
              [
                item.id,
                input.organization_id,
                input.project_id,
                page.site_edition_id,
                input.page_id,
                block.id,
                item.label,
                item.body,
                item.position,
              ],
            );
          }
        }
        if (block.kind === "table" && Array.isArray(block.rows)) {
          for (const row of block.rows as Array<Record<string, unknown>>) {
            await client.query(
              `INSERT INTO documentation_schema.documentation_table_row
                (id,organization_id,project_id,site_edition_id,
                 documentation_page_id,documentation_page_block_id,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                row.id,
                input.organization_id,
                input.project_id,
                page.site_edition_id,
                input.page_id,
                block.id,
                row.position,
              ],
            );
            for (const cell of row.cells as Array<Record<string, unknown>>) {
              await client.query(
                `INSERT INTO documentation_schema.documentation_table_cell
                  (id,organization_id,project_id,site_edition_id,
                   documentation_page_id,documentation_page_block_id,
                   documentation_table_row_id,column_position,is_header,
                   text_content)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                  cell.id,
                  input.organization_id,
                  input.project_id,
                  page.site_edition_id,
                  input.page_id,
                  block.id,
                  row.id,
                  cell.column_position,
                  cell.is_header,
                  cell.text,
                ],
              );
            }
          }
        }
      }
      await client.query(
        `UPDATE documentation_schema.documentation_page
            SET version=version+1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP
          WHERE id=$2 AND organization_id=$3 AND project_id=$4`,
        [
          input.actor_org_user_id,
          input.page_id,
          input.organization_id,
          input.project_id,
        ],
      );
      await bump_working_draft(client, {
        ...input,
        site_edition_id: page.site_edition_id,
      });
      const referencedSnippetIds = input.blocks
        .filter((block) => block.kind === "snippet_reference")
        .map((block) => block.snippet_id);
      const referencedSnippetSearch = referencedSnippetIds.length
        ? await client.query<{ search_text: string }>(
            `SELECT concat_ws(' ',block.text_content,block.display_title,
                     block.quote_attribution,block.table_caption,
                     block.alt_text,block.image_caption,
                     (SELECT string_agg(item.text_content,' ' ORDER BY item.position)
                        FROM documentation_schema.documentation_snippet_list_item item
                       WHERE item.documentation_snippet_block_id=block.id),
                     (SELECT string_agg(concat_ws(' ',tab.label,tab.body),' '
                                        ORDER BY tab.position)
                        FROM documentation_schema.documentation_snippet_tab_item tab
                       WHERE tab.documentation_snippet_block_id=block.id),
                     (SELECT string_agg(cell.text_content,' '
                                        ORDER BY row.position,cell.column_position)
                        FROM documentation_schema.documentation_snippet_table_row row
                        JOIN documentation_schema.documentation_snippet_table_cell cell
                          ON cell.documentation_snippet_table_row_id=row.id
                       WHERE row.documentation_snippet_block_id=block.id)
                   ) search_text
               FROM documentation_schema.documentation_snippet_block block
              WHERE block.documentation_snippet_id=ANY($1::varchar[])
              ORDER BY block.documentation_snippet_id,block.position`,
            [referencedSnippetIds],
          )
        : { rows: [] };
      await insert_draft_search_document(client, {
        organization_id: input.organization_id,
        project_id: input.project_id,
        project_version_id: input.project_version_id,
        site_id: input.site_id,
        site_edition_id: page.site_edition_id,
        page_id: input.page_id,
        title: page.title,
        description: page.description,
        canonical_path: page.canonical_path,
        search_text: search_text_for_blocks(page.title, page.description, [
          ...input.blocks,
          ...referencedSnippetSearch.rows.map(({ search_text }) => ({
            text: search_text,
          })),
        ]),
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.page_content_replaced",
        entity_type: "documentation_page",
        entity_id: input.page_id,
        before_version: page.version,
        after_version: page.version + 1,
      });
      return { ...page, version: page.version + 1, blocks: input.blocks };
    }),

  list_sites: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
  }) => {
    const result = await database.query<{
      id: string;
      name: string;
      description: string | null;
      version: number;
      edition_id: string;
      primary_language: string;
      edition_version: number;
      updated_at: Date;
    }>(
      `SELECT site.id,site.name,site.description,site.version,
              edition.id edition_id,edition.primary_language,
              edition.version edition_version,edition.updated_at
         FROM documentation_schema.documentation_site site
         JOIN documentation_schema.site_edition edition
           ON edition.documentation_site_id=site.id
          AND edition.project_id=site.project_id
          AND edition.organization_id=site.organization_id
        WHERE site.organization_id=$1 AND site.project_id=$2
          AND edition.project_version_id=$3
        ORDER BY edition.updated_at DESC,site.id`,
      [input.organization_id, input.project_id, input.project_version_id],
    );
    return result.rows.map((row) => ({
      ...row,
      updated_at: row.updated_at.toISOString(),
    }));
  },
  list_snippets: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    status: "active" | "archived" | "all";
    cursor?: string;
  }) => {
    const result = await database.query<{
      id: string;
      name: string;
      status: "active" | "archived";
      version: number;
      updated_at: Date;
    }>(
      `SELECT snippet.id,snippet.name,snippet.status,snippet.version,
              snippet.updated_at
         FROM documentation_schema.documentation_snippet snippet
         JOIN documentation_schema.site_edition edition
           ON edition.id=snippet.site_edition_id
        WHERE snippet.organization_id=$1 AND snippet.project_id=$2
          AND edition.project_version_id=$3
          AND snippet.documentation_site_id=$4
          AND ($5='all' OR snippet.status=$5)
          AND ($6::varchar IS NULL OR
            (lower(snippet.name),snippet.id) >
            (lower(split_part($6,':',1)),split_part($6,':',2)))
        ORDER BY lower(snippet.name),snippet.id LIMIT 100`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.status,
        input.cursor ?? null,
      ],
    );
    return result.rows.map((row) => ({
      ...row,
      updated_at: row.updated_at.toISOString(),
    }));
  },

  get_snippet: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    snippet_id: string;
  }) => {
    const snippet = await database.query<{
      id: string;
      name: string;
      status: "active" | "archived";
      version: number;
      updated_at: Date;
    }>(
      `SELECT snippet.id,snippet.name,snippet.status,snippet.version,
              snippet.updated_at
         FROM documentation_schema.documentation_snippet snippet
         JOIN documentation_schema.site_edition edition
           ON edition.id=snippet.site_edition_id
        WHERE snippet.organization_id=$1 AND snippet.project_id=$2
          AND edition.project_version_id=$3
          AND snippet.documentation_site_id=$4 AND snippet.id=$5`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.snippet_id,
      ],
    );
    if (!snippet.rows[0]) return null;
    const blocks = await database.query<Record<string, unknown>>(
      `SELECT block.id,block.kind,block.position,block.heading_level,
              block.text_content,block.code_language,block.link_url,
              block.linked_page_id,block.linked_block_id,
              block.documentation_asset_id,block.capture_asset_id,
              block.openapi_source_id,block.operation_key,
              block.published_artifact_id,block.callout_tone,
              block.display_title,block.quote_attribution,block.table_caption,
              block.alt_text,block.image_caption,block.version,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',item.id,'text',item.text_content,'position',item.position,
                  'expected_version',item.version
                ) ORDER BY item.position,item.id)
                  FROM documentation_schema.documentation_snippet_list_item item
                 WHERE item.documentation_snippet_block_id=block.id
              ),'[]'::jsonb) items,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',tab.id,'label',tab.label,'body',tab.body,
                  'position',tab.position,'expected_version',tab.version
                ) ORDER BY tab.position,tab.id)
                  FROM documentation_schema.documentation_snippet_tab_item tab
                 WHERE tab.documentation_snippet_block_id=block.id
              ),'[]'::jsonb) tabs,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',row.id,'position',row.position,
                  'expected_version',row.version,'cells',(
                    SELECT jsonb_agg(jsonb_build_object(
                      'id',cell.id,'column_position',cell.column_position,
                      'expected_version',cell.version,'is_header',cell.is_header,
                      'text',cell.text_content
                    ) ORDER BY cell.column_position,cell.id)
                    FROM documentation_schema.documentation_snippet_table_cell cell
                    WHERE cell.documentation_snippet_table_row_id=row.id
                  )
                ) ORDER BY row.position,row.id)
                FROM documentation_schema.documentation_snippet_table_row row
                WHERE row.documentation_snippet_block_id=block.id
              ),'[]'::jsonb) rows
         FROM documentation_schema.documentation_snippet_block block
        WHERE block.organization_id=$1 AND block.project_id=$2
          AND block.documentation_snippet_id=$3
        ORDER BY block.position,block.id`,
      [input.organization_id, input.project_id, input.snippet_id],
    );
    return {
      ...snippet.rows[0],
      updated_at: snippet.rows[0].updated_at.toISOString(),
      blocks: blocks.rows.map((row) =>
        to_documentation_block({
          ...row,
          items: row.kind === "tabs" ? row.tabs : row.items,
        }),
      ),
    };
  },

  create_snippet: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    data: { name: string };
  }) =>
    with_transaction(database, async (client) => {
      const name = normalize_documentation_snippet_name(input.data.name);
      const request_digest = command_digest({
        site_id: input.site_id,
        name,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.snippet.create",
        request_digest,
      });
      if (replay) return replay;
      const parent = await client.query<{
        edition_id: string;
        working_draft_id: string;
      }>(
        `SELECT edition.id edition_id,draft.id working_draft_id
           FROM documentation_schema.site_edition edition
           JOIN documentation_schema.site_working_draft draft
             ON draft.site_edition_id=edition.id
          WHERE edition.organization_id=$1 AND edition.project_id=$2
            AND edition.project_version_id=$3
            AND edition.documentation_site_id=$4
          FOR UPDATE OF draft`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const scope = parent.rows[0];
      if (!scope) throw new Error("Documentation Site was not found");
      const count = await client.query<{ count: number }>(
        `SELECT COUNT(*)::integer count
           FROM documentation_schema.documentation_snippet
          WHERE site_edition_id=$1`,
        [scope.edition_id],
      );
      if (
        (count.rows[0]?.count ?? 0) >= DOCUMENTATION_SNIPPETS_PER_EDITION_MAX
      ) {
        const error = new Error("Documentation Snippet limit exceeded");
        Object.assign(error, { code: "documentation_snippet_limit_exceeded" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.snippet.create",
        action: "documentation.snippet_created",
      });
      const id = ulid();
      try {
        await client.query(
          `INSERT INTO documentation_schema.documentation_snippet
            (id,organization_id,project_id,documentation_site_id,
             site_edition_id,site_working_draft_id,name,created_by_id,
             updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
          [
            id,
            input.organization_id,
            input.project_id,
            input.site_id,
            scope.edition_id,
            scope.working_draft_id,
            name,
            input.actor_org_user_id,
          ],
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "constraint" in error &&
          error.constraint === "uq_documentation_snippet_active_name"
        )
          Object.assign(error, { code: "documentation_snippet_name_conflict" });
        throw error;
      }
      await bump_working_draft(client, {
        ...input,
        site_edition_id: scope.edition_id,
      });
      const result = {
        id,
        name,
        status: "active",
        version: 1,
        blocks: [],
        updated_at: new Date().toISOString(),
      };
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.snippet_created",
        entity_type: "documentation_snippet",
        entity_id: id,
        before_version: null,
        after_version: 1,
      });
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.snippet.create",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  update_snippet: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    snippet_id: string;
    actor_org_user_id: string;
    data: { expected_version: number; name: string };
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        name: string;
        status: "active" | "archived";
        version: number;
      }>(
        `SELECT snippet.id,snippet.site_edition_id,snippet.name,
                snippet.status,snippet.version
           FROM documentation_schema.documentation_snippet snippet
           JOIN documentation_schema.site_edition edition
             ON edition.id=snippet.site_edition_id
          WHERE snippet.organization_id=$1 AND snippet.project_id=$2
            AND edition.project_version_id=$3
            AND snippet.documentation_site_id=$4 AND snippet.id=$5
          FOR UPDATE OF snippet`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.snippet_id,
        ],
      );
      const snippet = current.rows[0];
      if (!snippet) {
        const error = new Error("Documentation Snippet was not found");
        Object.assign(error, { code: "documentation_snippet_not_found" });
        throw error;
      }
      if (snippet.version !== input.data.expected_version) {
        const error = new Error("Documentation Snippet changed");
        Object.assign(error, { code: "documentation_snippet_conflict" });
        throw error;
      }
      const name = normalize_documentation_snippet_name(input.data.name);
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.snippet.update",
        action: "documentation.snippet_updated",
      });
      try {
        await client.query(
          `UPDATE documentation_schema.documentation_snippet
              SET name=$1,version=version+1,updated_by_id=$2,
                  updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
          [name, input.actor_org_user_id, input.snippet_id],
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "constraint" in error &&
          error.constraint === "uq_documentation_snippet_active_name"
        )
          Object.assign(error, { code: "documentation_snippet_name_conflict" });
        throw error;
      }
      await bump_working_draft(client, {
        ...input,
        site_edition_id: snippet.site_edition_id,
      });
      await client.query(
        `WITH affected AS (
           SELECT DISTINCT block.documentation_page_id
             FROM documentation_schema.documentation_page_block block
            WHERE block.site_edition_id=$1
              AND block.kind='snippet_reference'
              AND block.snippet_id=$2
         ),
         expanded AS (
           SELECT page.id,
                  concat_ws(' ',page.title,page.description,
                    string_agg(concat_ws(' ',block.text_content,
                      block.display_title,block.quote_attribution,
                      block.table_caption,block.alt_text,block.image_caption,
                      (SELECT string_agg(item.text_content,' ' ORDER BY item.position)
                         FROM documentation_schema.documentation_list_item item
                        WHERE item.documentation_page_block_id=block.id),
                      (SELECT string_agg(concat_ws(' ',tab.label,tab.body),' '
                                         ORDER BY tab.position)
                         FROM documentation_schema.documentation_tab_item tab
                        WHERE tab.documentation_page_block_id=block.id),
                      (SELECT string_agg(cell.text_content,' '
                                         ORDER BY row.position,cell.column_position)
                         FROM documentation_schema.documentation_table_row row
                         JOIN documentation_schema.documentation_table_cell cell
                           ON cell.documentation_table_row_id=row.id
                        WHERE row.documentation_page_block_id=block.id),
                      (SELECT string_agg(concat_ws(' ',snippet_block.text_content,
                                snippet_block.display_title,
                                snippet_block.quote_attribution,
                                snippet_block.table_caption,
                                snippet_block.alt_text,
                                snippet_block.image_caption),' '
                                ORDER BY snippet_block.position)
                         FROM documentation_schema.documentation_snippet_block snippet_block
                        WHERE snippet_block.documentation_snippet_id=block.snippet_id)
                    ),' ' ORDER BY block.position)
                  ) search_text
             FROM affected
             JOIN documentation_schema.documentation_page page
               ON page.id=affected.documentation_page_id
             LEFT JOIN documentation_schema.documentation_page_block block
               ON block.documentation_page_id=page.id
            GROUP BY page.id,page.title,page.description
         )
         UPDATE documentation_schema.documentation_draft_search_document document
            SET search_text=expanded.search_text,
                updated_at=CURRENT_TIMESTAMP
           FROM expanded
          WHERE document.documentation_page_id=expanded.id`,
        [snippet.site_edition_id, input.snippet_id],
      );
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.snippet_updated",
        entity_type: "documentation_snippet",
        entity_id: input.snippet_id,
        before_version: snippet.version,
        after_version: snippet.version + 1,
      });
      return {
        id: snippet.id,
        name,
        status: snippet.status,
        version: snippet.version + 1,
      };
    }),

  transition_snippet: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    snippet_id: string;
    actor_org_user_id: string;
    expected_version: number;
    transition: "archive" | "restore";
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        name: string;
        status: "active" | "archived";
        version: number;
      }>(
        `SELECT snippet.id,snippet.site_edition_id,snippet.name,
                snippet.status,snippet.version
           FROM documentation_schema.documentation_snippet snippet
           JOIN documentation_schema.site_edition edition
             ON edition.id=snippet.site_edition_id
          WHERE snippet.organization_id=$1 AND snippet.project_id=$2
            AND edition.project_version_id=$3
            AND snippet.documentation_site_id=$4 AND snippet.id=$5
          FOR UPDATE OF snippet`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.snippet_id,
        ],
      );
      const snippet = current.rows[0];
      if (!snippet) {
        const error = new Error("Documentation Snippet was not found");
        Object.assign(error, { code: "documentation_snippet_not_found" });
        throw error;
      }
      if (snippet.version !== input.expected_version) {
        const error = new Error("Documentation Snippet changed");
        Object.assign(error, { code: "documentation_snippet_conflict" });
        throw error;
      }
      const status = input.transition === "archive" ? "archived" : "active";
      const command =
        input.transition === "archive"
          ? "documentation.snippet.archive"
          : "documentation.snippet.restore";
      const action =
        input.transition === "archive"
          ? "documentation.snippet_archived"
          : "documentation.snippet_restored";
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command,
        action,
      });
      try {
        await client.query(
          `UPDATE documentation_schema.documentation_snippet
              SET status=$1,version=version+1,updated_by_id=$2,
                  updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
          [status, input.actor_org_user_id, input.snippet_id],
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "constraint" in error &&
          error.constraint === "uq_documentation_snippet_active_name"
        )
          Object.assign(error, { code: "documentation_snippet_name_conflict" });
        throw error;
      }
      await bump_working_draft(client, {
        ...input,
        site_edition_id: snippet.site_edition_id,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action,
        entity_type: "documentation_snippet",
        entity_id: input.snippet_id,
        before_version: snippet.version,
        after_version: snippet.version + 1,
      });
      return {
        id: snippet.id,
        name: snippet.name,
        status,
        version: snippet.version + 1,
      };
    }),

  save_snippet: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    snippet_id: string;
    actor_org_user_id: string;
    expected_snippet_version: number;
    blocks: Array<Record<string, unknown>>;
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        name: string;
        status: "active" | "archived";
        version: number;
      }>(
        `SELECT snippet.id,snippet.site_edition_id,snippet.name,
                snippet.status,snippet.version
           FROM documentation_schema.documentation_snippet snippet
           JOIN documentation_schema.site_edition edition
             ON edition.id=snippet.site_edition_id
          WHERE snippet.organization_id=$1 AND snippet.project_id=$2
            AND edition.project_version_id=$3
            AND snippet.documentation_site_id=$4 AND snippet.id=$5
          FOR UPDATE OF snippet`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.snippet_id,
        ],
      );
      const snippet = current.rows[0];
      if (!snippet) {
        const error = new Error("Documentation Snippet was not found");
        Object.assign(error, { code: "documentation_snippet_not_found" });
        throw error;
      }
      if (snippet.version !== input.expected_snippet_version) {
        const error = new Error("Documentation Snippet changed");
        Object.assign(error, { code: "documentation_snippet_conflict" });
        throw error;
      }
      if (snippet.status === "archived") {
        const error = new Error("Archived Documentation Snippet is read-only");
        Object.assign(error, { code: "documentation_snippet_archived" });
        throw error;
      }
      await validate_mutable_content_references(client, {
        ...input,
        site_edition_id: snippet.site_edition_id,
        owner_id: input.snippet_id,
        owner_kind: "snippet",
      });
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.snippet.content_replace",
        action: "documentation.snippet_content_replaced",
      });
      await client.query(
        `DELETE FROM documentation_schema.documentation_snippet_table_cell
          WHERE documentation_snippet_id=$1`,
        [input.snippet_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_snippet_table_row
          WHERE documentation_snippet_id=$1`,
        [input.snippet_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_snippet_tab_item
          WHERE documentation_snippet_id=$1`,
        [input.snippet_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_snippet_list_item
          WHERE documentation_snippet_id=$1`,
        [input.snippet_id],
      );
      await client.query(
        `DELETE FROM documentation_schema.documentation_snippet_block
          WHERE documentation_snippet_id=$1`,
        [input.snippet_id],
      );
      for (const block of input.blocks) {
        const source =
          typeof block.source === "object" && block.source
            ? (block.source as { kind: string; id: string })
            : null;
        const publication_type =
          block.kind === "guide_publication"
            ? "guide"
            : block.kind === "interactive_demo_publication"
              ? "interactive_demo"
              : null;
        await client.query(
          `INSERT INTO documentation_schema.documentation_snippet_block
            (id,organization_id,project_id,site_edition_id,
             documentation_snippet_id,kind,position,heading_level,
             text_content,link_url,linked_page_id,linked_block_id,
             code_language,documentation_asset_id,capture_asset_id,
             openapi_source_id,operation_key,published_artifact_id,
             published_artifact_type,callout_tone,display_title,
             quote_attribution,table_caption,alt_text,image_caption,
             created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                   $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$26)`,
          [
            block.id,
            input.organization_id,
            input.project_id,
            snippet.site_edition_id,
            input.snippet_id,
            block.kind,
            block.position,
            block.level ?? null,
            block.text ?? block.code ?? block.label ?? null,
            block.url ?? null,
            block.page_id ?? null,
            block.target_block_id ?? null,
            block.language ?? null,
            source?.kind === "documentation_asset" ? source.id : null,
            source?.kind === "capture_asset" ? source.id : null,
            block.openapi_source_id ?? null,
            block.operation_key ?? null,
            block.published_artifact_id ?? null,
            publication_type,
            block.tone ?? null,
            block.title ?? null,
            block.attribution ?? null,
            block.caption ?? null,
            block.alt_text ?? null,
            block.caption ?? null,
            input.actor_org_user_id,
          ],
        );
        if (
          (block.kind === "ordered_list" || block.kind === "unordered_list") &&
          Array.isArray(block.items)
        )
          for (const item of block.items as Array<Record<string, unknown>>)
            await client.query(
              `INSERT INTO documentation_schema.documentation_snippet_list_item
                (id,organization_id,project_id,site_edition_id,
                 documentation_snippet_id,documentation_snippet_block_id,
                 text_content,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [
                item.id,
                input.organization_id,
                input.project_id,
                snippet.site_edition_id,
                input.snippet_id,
                block.id,
                item.text,
                item.position,
              ],
            );
        if (block.kind === "tabs" && Array.isArray(block.items))
          for (const item of block.items as Array<Record<string, unknown>>)
            await client.query(
              `INSERT INTO documentation_schema.documentation_snippet_tab_item
                (id,organization_id,project_id,site_edition_id,
                 documentation_snippet_id,documentation_snippet_block_id,
                 label,body,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
              [
                item.id,
                input.organization_id,
                input.project_id,
                snippet.site_edition_id,
                input.snippet_id,
                block.id,
                item.label,
                item.body,
                item.position,
              ],
            );
        if (block.kind === "table" && Array.isArray(block.rows))
          for (const row of block.rows as Array<Record<string, unknown>>) {
            await client.query(
              `INSERT INTO documentation_schema.documentation_snippet_table_row
                (id,organization_id,project_id,site_edition_id,
                 documentation_snippet_id,documentation_snippet_block_id,
                 position)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                row.id,
                input.organization_id,
                input.project_id,
                snippet.site_edition_id,
                input.snippet_id,
                block.id,
                row.position,
              ],
            );
            for (const cell of row.cells as Array<Record<string, unknown>>)
              await client.query(
                `INSERT INTO documentation_schema.documentation_snippet_table_cell
                  (id,organization_id,project_id,site_edition_id,
                   documentation_snippet_id,documentation_snippet_block_id,
                   documentation_snippet_table_row_id,column_position,
                   is_header,text_content)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                  cell.id,
                  input.organization_id,
                  input.project_id,
                  snippet.site_edition_id,
                  input.snippet_id,
                  block.id,
                  row.id,
                  cell.column_position,
                  cell.is_header,
                  cell.text,
                ],
              );
          }
      }
      await client.query(
        `UPDATE documentation_schema.documentation_snippet
            SET version=version+1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP
          WHERE id=$2`,
        [input.actor_org_user_id, input.snippet_id],
      );
      await bump_working_draft(client, {
        ...input,
        site_edition_id: snippet.site_edition_id,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.snippet_content_replaced",
        entity_type: "documentation_snippet",
        entity_id: input.snippet_id,
        before_version: snippet.version,
        after_version: snippet.version + 1,
      });
      return {
        id: snippet.id,
        name: snippet.name,
        status: snippet.status,
        version: snippet.version + 1,
        blocks: input.blocks,
      };
    }),

  list_assets: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    source: "documentation" | "capture" | "all";
    status: "active" | "archived" | "all";
    include_archived_versions: boolean;
    include_in_use: boolean;
  }) => {
    const assets: Array<Record<string, unknown>> = [];
    if (input.source !== "capture") {
      const documentationAssets = await database.query<{
        id: string;
        name: string;
        status: "active" | "archived";
        version: number;
        mime_type: string;
        width: number;
        height: number;
      }>(
        `SELECT asset.id,asset.name,asset.status,asset.version,
                asset.mime_type,asset.width,asset.height
           FROM documentation_schema.documentation_asset asset
           JOIN documentation_schema.site_edition edition
             ON edition.id=asset.site_edition_id
          WHERE asset.organization_id=$1 AND asset.project_id=$2
            AND edition.project_version_id=$3
            AND asset.documentation_site_id=$4
            AND ($5='all' OR asset.status=$5)
          ORDER BY lower(asset.name),asset.id LIMIT 100`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.status,
        ],
      );
      assets.push(
        ...documentationAssets.rows.map((asset) => ({
          source: { kind: "documentation_asset", id: asset.id },
          ...asset,
          source_project_version: null,
        })),
      );
    }
    if (input.source !== "documentation") {
      const captureAssets = await database.query<{
        id: string;
        name: string;
        status: string;
        version: number;
        mime_type: string;
        width: number;
        height: number;
        project_version_id: string;
        project_version_name: string;
        project_version_slug: string;
      }>(
        `SELECT asset.id,COALESCE(file.original_name,'Capture image') name,
                asset.status,asset.version,file.mime_type,
                asset.width,asset.height,version.id project_version_id,
                version.name project_version_name,
                version.slug project_version_slug
           FROM capture_schema.capture_asset asset
           JOIN capture_schema.capture_session session
             ON session.id=asset.capture_session_id
           JOIN project_schema.project_version version
             ON version.id=session.project_version_id
           JOIN file_schema.file file ON file.id=asset.file_id
          WHERE asset.organization_id=$1 AND asset.project_id=$2
            AND asset.is_deleted=FALSE AND file.is_deleted=FALSE
            AND asset.asset_type IN ('screenshot','redacted_screenshot')
            AND file.mime_type IN ('image/png','image/jpeg','image/webp')
            AND NOT EXISTS (
              SELECT 1
                FROM capture_schema.capture_asset_purge_operation purge
               WHERE purge.capture_asset_id=asset.id
            )
            AND (
              (($4='active' OR $4='all') AND asset.status='active')
              OR (
                $5 AND asset.status='archived'
                AND EXISTS (
                  SELECT 1
                    FROM documentation_schema.site_edition edition
                   WHERE edition.documentation_site_id=$6
                     AND edition.project_version_id=$7
                     AND (
                       EXISTS (
                         SELECT 1
                           FROM documentation_schema.documentation_page page
                           JOIN documentation_schema.documentation_page_block block
                             ON block.documentation_page_id=page.id
                          WHERE page.site_edition_id=edition.id
                            AND block.capture_asset_id=asset.id
                       )
                       OR EXISTS (
                         SELECT 1
                           FROM documentation_schema.documentation_snippet snippet
                           JOIN documentation_schema.documentation_snippet_block block
                             ON block.documentation_snippet_id=snippet.id
                          WHERE snippet.site_edition_id=edition.id
                            AND block.capture_asset_id=asset.id
                       )
                     )
                )
              )
            )
            AND ($3 OR version.status='active')
          ORDER BY version.position,asset.created_at DESC,asset.id LIMIT 100`,
        [
          input.organization_id,
          input.project_id,
          input.include_archived_versions,
          input.status,
          input.include_in_use,
          input.site_id,
          input.project_version_id,
        ],
      );
      assets.push(
        ...captureAssets.rows.map((asset) => ({
          source: { kind: "capture_asset", id: asset.id },
          name: asset.name,
          status: asset.status,
          version: asset.version,
          mime_type: asset.mime_type,
          width: asset.width,
          height: asset.height,
          source_project_version: {
            id: asset.project_version_id,
            name: asset.project_version_name,
            slug: asset.project_version_slug,
          },
        })),
      );
    }
    return assets.slice(0, 100);
  },

  update_asset: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    asset_id: string;
    actor_org_user_id: string;
    expected_version: number;
    name: string;
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        name: string;
        status: "active" | "archived";
        version: number;
      }>(
        `SELECT asset.id,asset.site_edition_id,asset.name,asset.status,
                asset.version
           FROM documentation_schema.documentation_asset asset
           JOIN documentation_schema.site_edition edition
             ON edition.id=asset.site_edition_id
          WHERE asset.organization_id=$1 AND asset.project_id=$2
            AND edition.project_version_id=$3
            AND asset.documentation_site_id=$4 AND asset.id=$5
          FOR UPDATE OF asset`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.asset_id,
        ],
      );
      const asset = current.rows[0];
      if (!asset) throw new Error("Documentation Asset was not found");
      if (asset.version !== input.expected_version) {
        const error = new Error("Documentation Asset changed");
        Object.assign(error, { code: "documentation_asset_conflict" });
        throw error;
      }
      const name = normalize_documentation_asset_name(input.name);
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.asset.update",
        action: "documentation.asset_updated",
      });
      try {
        await client.query(
          `UPDATE documentation_schema.documentation_asset
              SET name=$1,version=version+1,updated_by_id=$2,
                  updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
          [name, input.actor_org_user_id, input.asset_id],
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "constraint" in error &&
          error.constraint === "uq_documentation_asset_active_name"
        )
          Object.assign(error, { code: "documentation_asset_name_conflict" });
        throw error;
      }
      await bump_working_draft(client, {
        ...input,
        site_edition_id: asset.site_edition_id,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action: "documentation.asset_updated",
        entity_type: "documentation_asset",
        entity_id: input.asset_id,
        before_version: asset.version,
        after_version: asset.version + 1,
      });
      return {
        source: { kind: "documentation_asset", id: asset.id },
        name,
        status: asset.status,
        version: asset.version + 1,
      };
    }),

  transition_asset: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    asset_id: string;
    actor_org_user_id: string;
    expected_version: number;
    transition: "archive" | "restore";
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        site_edition_id: string;
        name: string;
        status: "active" | "archived";
        version: number;
      }>(
        `SELECT asset.id,asset.site_edition_id,asset.name,asset.status,
                asset.version
           FROM documentation_schema.documentation_asset asset
           JOIN documentation_schema.site_edition edition
             ON edition.id=asset.site_edition_id
          WHERE asset.organization_id=$1 AND asset.project_id=$2
            AND edition.project_version_id=$3
            AND asset.documentation_site_id=$4 AND asset.id=$5
          FOR UPDATE OF asset`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.asset_id,
        ],
      );
      const asset = current.rows[0];
      if (!asset) throw new Error("Documentation Asset was not found");
      if (asset.version !== input.expected_version) {
        const error = new Error("Documentation Asset changed");
        Object.assign(error, { code: "documentation_asset_conflict" });
        throw error;
      }
      const status = input.transition === "archive" ? "archived" : "active";
      const command =
        input.transition === "archive"
          ? "documentation.asset.archive"
          : "documentation.asset.restore";
      const action =
        input.transition === "archive"
          ? "documentation.asset_archived"
          : "documentation.asset_restored";
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command,
        action,
      });
      try {
        await client.query(
          `UPDATE documentation_schema.documentation_asset
              SET status=$1,version=version+1,updated_by_id=$2,
                  updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
          [status, input.actor_org_user_id, input.asset_id],
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "constraint" in error &&
          error.constraint === "uq_documentation_asset_active_name"
        )
          Object.assign(error, { code: "documentation_asset_name_conflict" });
        throw error;
      }
      await bump_working_draft(client, {
        ...input,
        site_edition_id: asset.site_edition_id,
      });
      await write_documentation_audit_event(client, {
        audit,
        ...input,
        action,
        entity_type: "documentation_asset",
        entity_id: input.asset_id,
        before_version: asset.version,
        after_version: asset.version + 1,
      });
      return {
        source: { kind: "documentation_asset", id: asset.id },
        name: asset.name,
        status,
        version: asset.version + 1,
      };
    }),

  create_import_inspection: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    inspection_id: string;
    file_id: string;
    kind: "page_markdown" | "site_package";
    source_file: {
      storage_provider: string;
      storage_key: string;
      mime_type: string;
      size_bytes: number;
      checksum_sha256: string;
    };
    content_fingerprint: string;
    safe_report: unknown;
    expires_at: Date;
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        project_version_id: input.project_version_id,
        kind: input.kind,
        source_digest: input.source_file.checksum_sha256,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.import.inspect",
        request_digest,
      });
      if (replay) return replay;
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.import.inspect",
        action: "documentation.import.inspected",
      });
      await client.query(
        `SELECT id
           FROM project_schema.project_version
          WHERE id=$1 AND project_id=$2 AND organization_id=$3
          FOR SHARE`,
        [
          input.project_version_id,
          input.project_id,
          input.organization_id,
        ],
      );
      await client.query(
        `INSERT INTO file_schema.file
          (id,organization_id,storage_provider,storage_key,mime_type,size_bytes,
           original_name,checksum_sha256,metadata,created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10)`,
        [
          input.file_id,
          input.organization_id,
          input.source_file.storage_provider,
          input.source_file.storage_key,
          input.source_file.mime_type,
          input.source_file.size_bytes,
          input.kind === "page_markdown"
            ? "page-import.md"
            : "site-package.zip",
          input.source_file.checksum_sha256,
          JSON.stringify({ purpose: "documentation_import_inspection" }),
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.documentation_import_inspection
          (id,organization_id,project_id,project_version_id,created_by_id,kind,
           source_file_id,source_digest,source_size_bytes,format_version,
           content_fingerprint,safe_report,expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)`,
        [
          input.inspection_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.actor_org_user_id,
          input.kind,
          input.file_id,
          input.source_file.checksum_sha256,
          input.source_file.size_bytes,
          input.kind === "site_package" ? 1 : null,
          input.content_fingerprint,
          JSON.stringify(input.safe_report),
          input.expires_at,
        ],
      );
      const auditEvent = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "project_version",
        root_resource_id: input.project_version_id,
        action: "documentation.import.inspected",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: null,
        after_row_version: 1,
        changes: [
          {
            entity_type: "file",
            entity_id: input.file_id,
            parent_entity_type: "project_version",
            parent_entity_id: input.project_version_id,
            before: null,
            after: { version: 1 },
          },
          {
            entity_type: "documentation_import_inspection",
            entity_id: input.inspection_id,
            parent_entity_type: "project_version",
            parent_entity_id: input.project_version_id,
            before: null,
            after: { status: "ready", version: 1 },
          },
        ],
      });
      if (auditEvent) await write_audit_event(client, auditEvent);
      const result = {
        id: input.inspection_id,
        status: "ready" as const,
        kind: input.kind,
        created_by_id: input.actor_org_user_id,
        source_digest: input.source_file.checksum_sha256,
        content_fingerprint: input.content_fingerprint,
        expires_at: input.expires_at.toISOString(),
        safe_report: input.safe_report,
      };
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.import.inspect",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  get_import_inspection: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    inspection_id: string;
  }) => {
    const result = await database.query<{
      id: string;
      kind: "page_markdown" | "site_package";
      status: "ready" | "consumed" | "cancelled" | "expired";
      source_file_id: string;
      source_digest: string;
      source_size_bytes: number;
      format_version: number | null;
      content_fingerprint: string;
      safe_report: unknown | null;
      expires_at: Date;
      consumed_at: Date | null;
      cancelled_at: Date | null;
      version: number;
      storage_provider: string;
      storage_key: string;
    }>(
      `SELECT inspection.id,inspection.kind,inspection.status,
              inspection.source_file_id,inspection.source_digest,
              inspection.source_size_bytes,inspection.format_version,
              inspection.content_fingerprint,inspection.safe_report,
              inspection.expires_at,inspection.consumed_at,
              inspection.cancelled_at,inspection.version,
              file.storage_provider,file.storage_key
         FROM documentation_schema.documentation_import_inspection inspection
         JOIN file_schema.file file
           ON file.id=inspection.source_file_id
          AND file.organization_id=inspection.organization_id
        WHERE inspection.id=$1 AND inspection.organization_id=$2
          AND inspection.project_id=$3 AND inspection.project_version_id=$4
          AND inspection.created_by_id=$5`,
      [
        input.inspection_id,
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.actor_org_user_id,
      ],
    );
    const row = result.rows[0];
    return row
      ? {
          ...row,
          expires_at: row.expires_at.toISOString(),
          consumed_at: row.consumed_at?.toISOString() ?? null,
          cancelled_at: row.cancelled_at?.toISOString() ?? null,
        }
      : null;
  },

  cancel_import_inspection: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    inspection_id: string;
    idempotency_key: string;
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        project_version_id: input.project_version_id,
        inspection_id: input.inspection_id,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.import.cancel",
        request_digest,
      });
      if (replay) return replay;
      const selected = await client.query<{
        id: string;
        status: "ready" | "consumed" | "cancelled" | "expired";
        version: number;
        created_by_id: string;
        source_file_id: string;
        source_file_version: number;
      }>(
        `SELECT inspection.id,inspection.status,inspection.version,
                inspection.created_by_id,inspection.source_file_id,
                file.version source_file_version
           FROM documentation_schema.documentation_import_inspection inspection
           JOIN file_schema.file file
             ON file.id=inspection.source_file_id
            AND file.organization_id=inspection.organization_id
          WHERE inspection.id=$1 AND inspection.organization_id=$2
            AND inspection.project_id=$3
            AND inspection.project_version_id=$4
            AND inspection.created_by_id=$5
          FOR UPDATE OF inspection`,
        [
          input.inspection_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.actor_org_user_id,
        ],
      );
      const inspection = selected.rows[0];
      if (!inspection) {
        const error = new Error("Documentation import inspection was not found");
        Object.assign(error, { code: "documentation_import_not_found" });
        throw error;
      }
      if (inspection.status === "cancelled")
        return {
          id: inspection.id,
          status: "cancelled" as const,
          version: inspection.version,
        };
      if (inspection.status !== "ready") {
        const error = new Error(
          "Documentation import inspection is no longer ready",
        );
        Object.assign(error, { code: "documentation_import_not_ready" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.import.cancel",
        action: "documentation.import.cancelled",
      });
      await client.query(
        `UPDATE documentation_schema.documentation_import_inspection
            SET status='cancelled',cancelled_at=CURRENT_TIMESTAMP
          WHERE id=$1`,
        [inspection.id],
      );
      const result = {
        id: inspection.id,
        status: "cancelled" as const,
        version: inspection.version + 1,
      };
      const auditEvent = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "project_version",
        root_resource_id: input.project_version_id,
        action: "documentation.import.cancelled",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: inspection.version,
        after_row_version: result.version,
        changes: [
          {
            entity_type: "documentation_import_inspection",
            entity_id: inspection.id,
            parent_entity_type: "project_version",
            parent_entity_id: input.project_version_id,
            before: { status: "ready", version: inspection.version },
            after: { status: result.status, version: result.version },
            safe_fields: { version: "integer" },
          },
          {
            entity_type: "file",
            entity_id: inspection.source_file_id,
            parent_entity_type: "project_version",
            parent_entity_id: input.project_version_id,
            before: { version: inspection.source_file_version },
            after: null,
          },
        ],
      });
      if (auditEvent) await write_audit_event(client, auditEvent);
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.import.cancel",
        request_digest,
        response_status: 204,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  apply_markdown_import: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    inspection_id: string;
    content_fingerprint: string;
    site_id: string;
    expected_draft_version: number;
    title: string;
    canonical_path: string;
    set_as_home: boolean;
    blocks: Array<Record<string, unknown>>;
  }) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        inspection_id: input.inspection_id,
        content_fingerprint: input.content_fingerprint,
        site_id: input.site_id,
        expected_draft_version: input.expected_draft_version,
        title: input.title,
        canonical_path: input.canonical_path,
        set_as_home: input.set_as_home,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.page_markdown_import.apply",
        request_digest,
      });
      if (replay) return replay;
      const parent = await client.query<{
        edition_id: string;
        working_draft_id: string;
        draft_version: number;
        home_page_id: string | null;
      }>(
        `SELECT edition.id edition_id,draft.id working_draft_id,
                draft.version draft_version,draft.home_page_id
           FROM documentation_schema.site_edition edition
           JOIN documentation_schema.site_working_draft draft
             ON draft.site_edition_id=edition.id
           JOIN documentation_schema.documentation_site site
             ON site.id=edition.documentation_site_id
          WHERE edition.organization_id=$1 AND edition.project_id=$2
            AND edition.project_version_id=$3
            AND edition.documentation_site_id=$4
          FOR UPDATE OF edition,draft,site`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const target = parent.rows[0];
      if (!target) {
        const error = new Error("Documentation Site was not found");
        Object.assign(error, { code: "documentation_import_conflict" });
        throw error;
      }
      if (target.draft_version !== input.expected_draft_version) {
        const error = new Error("Working Draft changed");
        Object.assign(error, { code: "documentation_row_version_conflict" });
        throw error;
      }
      if (input.set_as_home && target.home_page_id !== null) {
        const error = new Error("Documentation Site already has a Home Page");
        Object.assign(error, { code: "documentation_import_conflict" });
        throw error;
      }
      await lock_documentation_path_namespace(client, target.edition_id);
      const inspectionResult = await client.query<{
        id: string;
        kind: "page_markdown" | "site_package";
        status: "ready" | "consumed" | "cancelled" | "expired";
        version: number;
        source_file_id: string;
        source_file_version: number;
        source_digest: string;
        content_fingerprint: string;
        expires_at: Date;
      }>(
        `SELECT inspection.id,inspection.kind,inspection.status,
                inspection.version,inspection.source_file_id,
                file.version source_file_version,inspection.source_digest,
                inspection.content_fingerprint,inspection.expires_at
           FROM documentation_schema.documentation_import_inspection inspection
           JOIN file_schema.file file
             ON file.id=inspection.source_file_id
            AND file.organization_id=inspection.organization_id
          WHERE inspection.id=$1 AND inspection.organization_id=$2
            AND inspection.project_id=$3
            AND inspection.project_version_id=$4
            AND inspection.created_by_id=$5
          FOR UPDATE OF inspection`,
        [
          input.inspection_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.actor_org_user_id,
        ],
      );
      const inspection = inspectionResult.rows[0];
      if (!inspection) {
        const error = new Error("Documentation import inspection was not found");
        Object.assign(error, { code: "documentation_import_not_found" });
        throw error;
      }
      if (inspection.status === "consumed") {
        const error = new Error("Documentation import was already consumed");
        Object.assign(error, { code: "documentation_import_consumed" });
        throw error;
      }
      if (
        inspection.status !== "ready" ||
        inspection.expires_at.getTime() <= Date.now()
      ) {
        const error = new Error("Documentation import has expired");
        Object.assign(error, { code: "documentation_import_expired" });
        throw error;
      }
      if (
        inspection.kind !== "page_markdown" ||
        inspection.content_fingerprint !== input.content_fingerprint
      ) {
        const error = new Error("Documentation import fingerprint changed");
        Object.assign(error, { code: "documentation_import_conflict" });
        throw error;
      }
      const conflict = await client.query<{ id: string }>(
        `SELECT id FROM documentation_schema.documentation_page
          WHERE organization_id=$1 AND project_id=$2 AND site_edition_id=$3
            AND canonical_path=$4
          FOR SHARE`,
        [
          input.organization_id,
          input.project_id,
          target.edition_id,
          input.canonical_path,
        ],
      );
      if (conflict.rows[0]) {
        const error = new Error("Documentation path already exists");
        Object.assign(error, { code: "documentation_path_conflict" });
        throw error;
      }
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.page_markdown_import.apply",
        action: "documentation.page_markdown_import_applied",
      });
      const page_id = ulid();
      const application_id = ulid();
      await client.query(
        `INSERT INTO documentation_schema.documentation_page
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           site_working_draft_id,title,description,canonical_path,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8,$9,$9)`,
        [
          page_id,
          input.organization_id,
          input.project_id,
          input.site_id,
          target.edition_id,
          target.working_draft_id,
          input.title,
          input.canonical_path,
          input.actor_org_user_id,
        ],
      );
      for (const block of input.blocks) {
        await client.query(
          `INSERT INTO documentation_schema.documentation_page_block
            (id,organization_id,project_id,site_edition_id,documentation_page_id,
             kind,position,heading_level,text_content,link_url,linked_page_id,
             linked_block_id,code_language,quote_attribution,
             created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
          [
            block.id,
            input.organization_id,
            input.project_id,
            target.edition_id,
            page_id,
            block.kind,
            block.position,
            block.level ?? null,
            block.text ?? block.code ?? block.label ?? null,
            block.url ?? null,
            block.page_id ?? null,
            block.target_block_id ?? null,
            block.language ?? null,
            block.attribution ?? null,
            input.actor_org_user_id,
          ],
        );
        if (
          (block.kind === "ordered_list" || block.kind === "unordered_list") &&
          Array.isArray(block.items)
        )
          for (const item of block.items as Array<Record<string, unknown>>)
            await client.query(
              `INSERT INTO documentation_schema.documentation_list_item
                (id,organization_id,project_id,site_edition_id,
                 documentation_page_id,documentation_page_block_id,
                 text_content,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [
                item.id,
                input.organization_id,
                input.project_id,
                target.edition_id,
                page_id,
                block.id,
                item.text,
                item.position,
              ],
            );
      }
      await insert_draft_search_document(client, {
        organization_id: input.organization_id,
        project_id: input.project_id,
        project_version_id: input.project_version_id,
        site_id: input.site_id,
        site_edition_id: target.edition_id,
        page_id,
        title: input.title,
        description: null,
        canonical_path: input.canonical_path,
        search_text: search_text_for_blocks(input.title, null, input.blocks),
      });
      await client.query(
        `UPDATE documentation_schema.site_working_draft
            SET home_page_id=CASE WHEN $1 THEN $2 ELSE home_page_id END,
                version=version+1,updated_by_id=$3,
                updated_at=CURRENT_TIMESTAMP
          WHERE id=$4`,
        [
          input.set_as_home,
          page_id,
          input.actor_org_user_id,
          target.working_draft_id,
        ],
      );
      const counts = {
        pages: 1,
        snippets: 0,
        assets: 0,
        openapi_sources: 0,
        external_bindings: 0,
        navigation_nodes: 0,
        aliases: 0,
        routes: 0,
        blocks: input.blocks.length,
      };
      await client.query(
        `INSERT INTO documentation_schema.documentation_import_application
          (id,organization_id,project_id,project_version_id,
           documentation_site_id,site_edition_id,inspection_id,kind,
           format_version,source_digest,content_fingerprint,pages_count,
           snippets_count,assets_count,openapi_sources_count,
           external_bindings_count,navigation_nodes_count,aliases_count,
           routes_count,blocks_count,created_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'page_markdown',NULL,$8,$9,
                 $10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          application_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          target.edition_id,
          inspection.id,
          inspection.source_digest,
          inspection.content_fingerprint,
          counts.pages,
          counts.snippets,
          counts.assets,
          counts.openapi_sources,
          counts.external_bindings,
          counts.navigation_nodes,
          counts.aliases,
          counts.routes,
          counts.blocks,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `UPDATE documentation_schema.documentation_import_inspection
            SET status='consumed',consumed_at=CURRENT_TIMESTAMP
          WHERE id=$1`,
        [inspection.id],
      );
      const result = {
        id: application_id,
        inspection_id: inspection.id,
        target_site_id: input.site_id,
        target_edition_id: target.edition_id,
        created_page_id: page_id,
        counts,
      };
      const auditEvent = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: input.site_id,
        action: "documentation.page_markdown_import_applied",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: target.draft_version,
        after_row_version: target.draft_version + 1,
        changes: [
          {
            entity_type: "documentation_page",
            entity_id: page_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: null,
            after: { version: 1 },
          },
          {
            entity_type: "documentation_import_application",
            entity_id: application_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: null,
            after: { id: application_id },
          },
          {
            entity_type: "documentation_import_inspection",
            entity_id: inspection.id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: { version: inspection.version },
            after: { version: inspection.version + 1 },
            safe_fields: { version: "integer" },
          },
          {
            entity_type: "file",
            entity_id: inspection.source_file_id,
            parent_entity_type: "documentation_site",
            parent_entity_id: input.site_id,
            before: { version: inspection.source_file_version },
            after: null,
          },
        ],
      });
      if (auditEvent) await write_audit_event(client, auditEvent);
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.page_markdown_import.apply",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),

  list_artifact_publications: async (input: {
    organization_id: string;
    project_id: string;
    site_id: string;
    artifact_type: "guide" | "interactive_demo";
  }) => {
    const result = await database.query<{
      published_artifact_id: string;
      artifact_type: "guide" | "interactive_demo";
      artifact_id: string;
      edition_id: string;
      project_version_id: string;
      project_version_name: string;
      project_version_slug: string;
      publication_sequence: number;
      revision_number: number;
      title: string;
      description: string | null;
      published_at: Date;
    }>(
      `SELECT publication.id published_artifact_id,
              publication.artifact_type,
              CASE WHEN publication.artifact_type='guide'
                THEN publication.guide_id
                ELSE publication.interactive_demo_id END artifact_id,
              CASE WHEN publication.artifact_type='guide'
                THEN publication.guide_edition_id
                ELSE publication.interactive_demo_edition_id END edition_id,
              publication.project_version_id,
              version.name project_version_name,
              version.slug project_version_slug,
              publication.publication_sequence,
              COALESCE(guide_revision.revision_number,
                       demo_revision.revision_number) revision_number,
              COALESCE(guide_revision.title,demo_revision.title) title,
              left(COALESCE(guide_revision.description,
                            demo_revision.description),1000) description,
              publication.published_at
         FROM publish_schema.published_artifact publication
         JOIN project_schema.project_version version
           ON version.id=publication.project_version_id
         LEFT JOIN guide_schema.guide_revision guide_revision
           ON guide_revision.id=publication.guide_revision_id
         LEFT JOIN interactive_demo_schema.interactive_demo_revision demo_revision
           ON demo_revision.id=publication.interactive_demo_revision_id
        WHERE publication.organization_id=$1 AND publication.project_id=$2
          AND publication.artifact_type=$3
        ORDER BY publication.published_at DESC,publication.id LIMIT 100`,
      [input.organization_id, input.project_id, input.artifact_type],
    );
    return result.rows.map((row) => ({
      ...row,
      published_at: row.published_at.toISOString(),
    }));
  },

  create_site: async (input: CreateSiteInput) =>
    with_transaction(database, async (client) => {
      const request_digest = command_digest({
        project_version_id: input.project_version_id,
        name: input.name,
        description: input.description,
        primary_language: input.primary_language,
        initial_home_page: input.initial_home_page,
      });
      const replay = await read_command_receipt(client, {
        ...input,
        operation: "documentation.site.create",
        request_digest,
      });
      if (replay) return replay;
      const audit = await begin_documentation_audit_context(client, {
        ...input,
        command: "documentation.site.create",
        action: "documentation.site_created",
      });
      const site_id = ulid();
      const edition_id = ulid();
      const working_draft_id = ulid();
      const navigation_tree_id = ulid();
      const routing_set_id = ulid();
      const home_page_id = input.initial_home_page ? ulid() : null;

      await client.query(
        `INSERT INTO documentation_schema.documentation_site
          (id,organization_id,project_id,name,description,created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [
          site_id,
          input.organization_id,
          input.project_id,
          input.name,
          input.description,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.site_edition
          (id,organization_id,project_id,documentation_site_id,project_version_id,
           primary_language,created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
        [
          edition_id,
          input.organization_id,
          input.project_id,
          site_id,
          input.project_version_id,
          input.primary_language,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.site_working_draft
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [
          working_draft_id,
          input.organization_id,
          input.project_id,
          site_id,
          edition_id,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.navigation_tree
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [
          navigation_tree_id,
          input.organization_id,
          input.project_id,
          site_id,
          edition_id,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.routing_set
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [
          routing_set_id,
          input.organization_id,
          input.project_id,
          site_id,
          edition_id,
          input.actor_org_user_id,
        ],
      );

      if (home_page_id && input.initial_home_page) {
        await client.query(
          `INSERT INTO documentation_schema.documentation_page
            (id,organization_id,project_id,documentation_site_id,site_edition_id,
             site_working_draft_id,title,canonical_path,created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
          [
            home_page_id,
            input.organization_id,
            input.project_id,
            site_id,
            edition_id,
            working_draft_id,
            input.initial_home_page.title,
            input.initial_home_page.path,
            input.actor_org_user_id,
          ],
        );
        await insert_draft_search_document(client, {
          organization_id: input.organization_id,
          project_id: input.project_id,
          project_version_id: input.project_version_id,
          site_id,
          site_edition_id: edition_id,
          page_id: home_page_id,
          title: input.initial_home_page.title,
          description: null,
          canonical_path: input.initial_home_page.path,
          search_text: search_text_for_blocks(
            input.initial_home_page.title,
            null,
            [],
          ),
        });
        await client.query(
          `UPDATE documentation_schema.site_working_draft
             SET home_page_id=$1,version=version+1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP
           WHERE id=$3 AND organization_id=$4 AND project_id=$5`,
          [
            home_page_id,
            input.actor_org_user_id,
            working_draft_id,
            input.organization_id,
            input.project_id,
          ],
        );
      }

      const result = {
        site: {
          id: site_id,
          organization_id: input.organization_id,
          project_id: input.project_id,
          name: input.name,
          description: input.description,
          version: 1,
        },
        edition: {
          id: edition_id,
          documentation_site_id: site_id,
          project_version_id: input.project_version_id,
          primary_language: input.primary_language,
          version: 1,
        },
        working_draft: {
          id: working_draft_id,
          site_edition_id: edition_id,
          home_page_id,
          version: home_page_id ? 2 : 1,
        },
        navigation: { id: navigation_tree_id, version: 1 },
        routing: { id: routing_set_id, version: 1 },
        home_page: home_page_id
          ? {
              id: home_page_id,
              title: input.initial_home_page?.title,
              canonical_path: input.initial_home_page?.path,
              version: 1,
            }
          : null,
      };
      const site_audit_event = build_entity_audit_event({
        id: audit.event_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        root_resource_type: "documentation_site",
        root_resource_id: site_id,
        action: "documentation.site_created",
        actor_org_user_id: input.actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: null,
        after_row_version: 1,
        changes: [
          {
            entity_type: "documentation_site",
            entity_id: site_id,
            parent_entity_type: null,
            parent_entity_id: null,
            before: null,
            after: { version: 1 },
          },
          ...(home_page_id
            ? [
                {
                  entity_type: "documentation_page",
                  entity_id: home_page_id,
                  parent_entity_type: "documentation_site",
                  parent_entity_id: site_id,
                  before: null,
                  after: { version: 1 },
                },
              ]
            : []),
        ],
      });
      if (site_audit_event) await write_audit_event(client, site_audit_event);
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.site.create",
        request_digest,
        response_status: 201,
        response_body: result,
      });
      return { ...result, idempotent_replay: false };
    }),
});
