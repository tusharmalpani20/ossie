import { createHash } from "node:crypto";
import { ulid } from "ulid";
import {
  assert_documentation_comment_transition,
  validate_documentation_navigation,
  validate_documentation_routes,
} from "@repo/documentation-domain";
import {
  DocumentationIdempotencyConflictError,
  DocumentationRowVersionConflictError,
} from "./documentation.service";

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
      };
    case "image":
      return {
        ...base,
        asset_id: row.documentation_asset_id,
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
    default:
      return base;
  }
};

export const build_documentation_repository = (database: Database) => ({
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
      if (page.version !== input.data.expected_version)
        throw new DocumentationRowVersionConflictError({
          ...page,
          blocks: [],
        });

      const canonical_path =
        input.data.canonical_path ?? page.canonical_path;
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
        "description" in input.data ? input.data.description ?? null : page.description;
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
      return {
        ...page,
        title,
        description,
        canonical_path,
        version: page.version + 1,
        keywords: input.data.keywords ?? [],
      };
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
      const paths = new Map(pages.rows.map((page) => [page.id, page.canonical_path]));
      validate_documentation_routes(
        input.rules.map((rule) => ({
          source_path: rule.source_path,
          outcome: rule.outcome,
          target_path:
            rule.outcome === "redirect"
              ? paths.get(rule.target_page_id ?? "") ?? null
              : null,
        })),
      );
      if (
        input.rules.some(
          (rule) =>
            pages.rows.some((page) => page.canonical_path === rule.source_path) ||
            (rule.target_page_id !== null && !paths.has(rule.target_page_id)),
        )
      ) {
        const error = new Error("Routing references a conflicting path or Page");
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
            AND edition.project_version_id=$5`,
        [
          input.page_id,
          input.site_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
        ],
      );
      if (!page.rows[0]) throw new Error("Documentation Page was not found");
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
          Object.assign(error, { code: "documentation_comment_anchor_missing" });
          throw error;
        }
      }
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
            AND edition.project_version_id=$5`,
        [
          input.thread_id,
          input.site_id,
          input.organization_id,
          input.project_id,
          input.project_version_id,
        ],
      );
      if (!thread.rows[0]) throw new Error("Comment thread was not found");
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
      await client.query(
        `UPDATE documentation_schema.comment_thread
            SET state=$1,version=version+1,updated_by_id=$2,
                updated_at=CURRENT_TIMESTAMP
          WHERE id=$3`,
        [state, input.actor_org_user_id, input.thread_id],
      );
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
      const result = {
        id,
        title: input.data.title,
        description: input.data.description,
        canonical_path: input.data.canonical_path,
        version: 1,
        blocks: [],
      };
      await write_command_receipt(client, {
        ...input,
        operation: "documentation.page.create",
        request_digest,
        response_status: 201,
        response_body: result,
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
              block.linked_page_id,block.documentation_asset_id,
              block.openapi_source_id,block.operation_key,block.alt_text,
              block.image_caption,block.version,
              COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id',item.id,'text',item.text_content,'position',item.position,
                  'expected_version',item.version
                ) ORDER BY item.position,item.id)
                  FROM documentation_schema.documentation_list_item item
                 WHERE item.documentation_page_block_id=block.id
              ),'[]'::jsonb) items
         FROM documentation_schema.documentation_page_block block
        WHERE block.organization_id=$1 AND block.project_id=$2
          AND block.documentation_page_id=$3 ORDER BY block.position,block.id`,
      [input.organization_id, input.project_id, input.page_id],
    );
    return {
      ...page.rows[0],
      blocks: blocks.rows.map(to_documentation_block),
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
        await client.query(
          `INSERT INTO documentation_schema.documentation_page_block
            (id,organization_id,project_id,site_edition_id,documentation_page_id,
             kind,position,heading_level,text_content,link_url,linked_page_id,
             code_language,documentation_asset_id,openapi_source_id,operation_key,
             alt_text,image_caption,
             created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)`,
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
            block.language ?? null,
            block.asset_id ?? null,
            block.openapi_source_id ?? null,
            block.operation_key ?? null,
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
