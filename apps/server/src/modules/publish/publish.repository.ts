import { randomBytes } from "node:crypto";
import { ulid } from "ulid";
import {
  assert_same_edition_rollback,
  normalize_publish_link_manifest,
  PublicationRowVersionConflictError,
} from "@repo/publish-domain";
import type {
  PublishedArtifact,
  PublishLink,
  PublishLinkEntry,
  PublicPublishLinkResponse,
} from "@repo/types/publish";
import {
  create_or_reuse_demo_revision_for_publication,
  create_or_reuse_guide_revision_for_publication,
  build_artifact_revision_repository,
} from "../artifact-revision/artifact-revision.repository";
import type { ArtifactScope, PublishRepository } from "./publish.service";
import { PublishSlugConflictError } from "./publish.service";
import { hash_public_link_password } from "./public-link-password";

type Result<Row> = { rows: Row[] };
type Queryable = {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<Result<Row>>;
};
type Client = Queryable & { release(): void };
type Pool = Queryable & { connect(): Promise<Client> };

type PublicationRow = {
  id: string;
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  edition_id: string;
  project_version_id: string;
  revision_id: string;
  revision_number: number;
  publication_sequence: number;
  created_by_id: string;
  publisher_display_name: string;
  published_at: Date;
  created_at: Date;
};
type LinkRow = {
  id: string;
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  name: string;
  slug: string;
  visibility: "public" | "restricted";
  status: "active" | "revoked";
  expires_at: Date | null;
  password_hash: string | null;
  password_salt: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
};
type EntryRow = Omit<PublicationRow, "id"> & {
  id: string;
  published_artifact_id: string;
  publish_link_id: string;
  project_version_id: string;
  project_version_name: string;
  project_version_slug: string;
  project_version_status: "active" | "archived";
  position: number;
  is_default: boolean;
  version: number;
};

const artifact_columns = (
  scope: Pick<ArtifactScope, "artifact_type" | "artifact_id">,
) =>
  scope.artifact_type === "guide"
    ? {
        id_column: "guide_id",
        edition_column: "guide_edition_id",
        revision_column: "guide_revision_id",
        id: scope.artifact_id,
      }
    : {
        id_column: "interactive_demo_id",
        edition_column: "interactive_demo_edition_id",
        revision_column: "interactive_demo_revision_id",
        id: scope.artifact_id,
      };

const publication_select = `publication.id,publication.artifact_type,
  COALESCE(publication.guide_id,publication.interactive_demo_id) AS artifact_id,
  COALESCE(publication.guide_edition_id,publication.interactive_demo_edition_id) AS edition_id,
  publication.project_version_id,
  COALESCE(publication.guide_revision_id,publication.interactive_demo_revision_id) AS revision_id,
  COALESCE(guide_revision.revision_number,demo_revision.revision_number) AS revision_number,
  publication.publication_sequence,publication.created_by_id,
  app_user.display_name AS publisher_display_name,
  publication.published_at,publication.created_at`;
const publication_joins = `
  LEFT JOIN guide_schema.guide_revision guide_revision ON guide_revision.id=publication.guide_revision_id
  LEFT JOIN interactive_demo_schema.interactive_demo_revision demo_revision ON demo_revision.id=publication.interactive_demo_revision_id
  JOIN organization_schema.org_user org_user ON org_user.id=publication.created_by_id AND org_user.organization_id=publication.organization_id
  JOIN user_schema.user app_user ON app_user.id=org_user.user_id`;

const map_publication = (row: PublicationRow): PublishedArtifact => ({
  id: row.id,
  artifact_type: row.artifact_type,
  artifact_id: row.artifact_id,
  edition_id: row.edition_id,
  project_version_id: row.project_version_id,
  revision_id: row.revision_id,
  revision_number: Number(row.revision_number),
  publication_sequence: Number(row.publication_sequence),
  publisher: {
    id: row.created_by_id,
    display_name: row.publisher_display_name,
  },
  published_at: row.published_at.toISOString(),
  created_at: row.created_at.toISOString(),
});
const public_url = (type: string, slug: string) =>
  `${type === "guide" ? "/p/" : "/d/"}${slug}`;

const load_entries = async (db: Queryable, link_ids: string[]) => {
  if (!link_ids.length) return new Map<string, PublishLinkEntry[]>();
  const result = await db.query<EntryRow>(
    `SELECT entry.id,entry.publish_link_id,entry.position,entry.is_default,entry.version,
    version.id AS project_version_id,version.name AS project_version_name,version.slug AS project_version_slug,version.status AS project_version_status,
    publication.id AS published_artifact_id,publication.artifact_type,
    COALESCE(publication.guide_id,publication.interactive_demo_id) AS artifact_id,
    COALESCE(publication.guide_edition_id,publication.interactive_demo_edition_id) AS edition_id,
    publication.project_version_id,
    COALESCE(publication.guide_revision_id,publication.interactive_demo_revision_id) AS revision_id,
    COALESCE(guide_revision.revision_number,demo_revision.revision_number) AS revision_number,
    publication.publication_sequence,publication.created_by_id,
    app_user.display_name AS publisher_display_name,
    publication.published_at,publication.created_at
    FROM publish_schema.publish_link_entry entry
    JOIN project_schema.project_version version ON version.id=entry.project_version_id
    JOIN publish_schema.published_artifact publication ON publication.id=entry.published_artifact_id
    ${publication_joins}
    WHERE entry.publish_link_id=ANY($1::varchar[]) ORDER BY entry.publish_link_id,entry.position`,
    [link_ids],
  );
  const grouped = new Map<string, PublishLinkEntry[]>();
  for (const row of result.rows) {
    const entries = grouped.get(row.publish_link_id) ?? [];
    entries.push({
      id: row.id,
      project_version: {
        id: row.project_version_id,
        name: row.project_version_name,
        slug: row.project_version_slug,
        status: row.project_version_status,
      },
      position: Number(row.position),
      is_default: row.is_default,
      version: Number(row.version),
      published_artifact: map_publication({
        ...row,
        id: row.published_artifact_id,
      }),
    });
    grouped.set(row.publish_link_id, entries);
  }
  return grouped;
};

const map_link = (row: LinkRow, entries: PublishLinkEntry[]): PublishLink => ({
  id: row.id,
  artifact_type: row.artifact_type,
  artifact_id: row.artifact_id,
  name: row.name,
  slug: row.slug,
  visibility: row.visibility,
  status: row.status,
  expires_at: row.expires_at?.toISOString() ?? null,
  password_protected: Boolean(row.password_hash),
  version: Number(row.version),
  entries,
  public_url: public_url(row.artifact_type, row.slug),
  default_public_url: `${public_url(row.artifact_type, row.slug)}/versions/${entries.find((entry) => entry.is_default)?.project_version.slug ?? ""}`,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
  revoked_at: row.revoked_at?.toISOString() ?? null,
});
const link_select = `link.id,link.artifact_type,COALESCE(link.guide_id,link.interactive_demo_id) AS artifact_id,
  link.name,link.slug,link.visibility,link.status,link.expires_at,link.password_hash,link.password_salt,
  link.version,link.created_at,link.updated_at,link.revoked_at`;
const load_link = async (
  db: Queryable,
  scope: ArtifactScope,
  link_id: string,
  lock = false,
) => {
  const family = artifact_columns(scope);
  const row = (
    await db.query<LinkRow>(
      `SELECT ${link_select} FROM publish_schema.publish_link link
    WHERE link.id=$1 AND link.organization_id=$2 AND link.project_id=$3 AND link.artifact_type=$4 AND link.${family.id_column}=$5 ${lock ? "FOR UPDATE" : ""}`,
      [
        link_id,
        scope.auth.organization_id,
        scope.project_id,
        scope.artifact_type,
        scope.artifact_id,
      ],
    )
  ).rows[0];
  if (!row) return null;
  return map_link(row, (await load_entries(db, [row.id])).get(row.id) ?? []);
};

const assert_updated = <Row>(rows: Row[]) => {
  if (!rows[0]) throw new PublicationRowVersionConflictError();
  return rows[0];
};
const insert_manifest = async (
  db: Queryable,
  scope: ArtifactScope,
  link_id: string,
  ids: string[],
  default_id: string,
) => {
  const normalized = normalize_publish_link_manifest({
    published_artifact_ids: ids,
    default_published_artifact_id: default_id,
  });
  const family = artifact_columns(scope);
  const publications = await db.query<{
    id: string;
    project_version_id: string;
    edition_id: string;
  }>(
    `SELECT id,project_version_id,${family.edition_column} AS edition_id
    FROM publish_schema.published_artifact WHERE organization_id=$1 AND project_id=$2 AND artifact_type=$3 AND ${family.id_column}=$4 AND id=ANY($5::varchar[])`,
    [
      scope.auth.organization_id,
      scope.project_id,
      scope.artifact_type,
      scope.artifact_id,
      ids,
    ],
  );
  if (
    publications.rows.length !== ids.length ||
    new Set(publications.rows.map((row) => row.project_version_id)).size !==
      ids.length
  )
    throw new PublicationRowVersionConflictError();
  const by_id = new Map(publications.rows.map((row) => [row.id, row]));
  for (const item of normalized) {
    const publication = by_id.get(item.published_artifact_id)!;
    await db.query(
      `INSERT INTO publish_schema.publish_link_entry
      (id,organization_id,project_id,publish_link_id,published_artifact_id,project_version_id,${family.id_column},${family.edition_column},position,is_default,created_by_id,updated_by_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
      [
        ulid(),
        scope.auth.organization_id,
        scope.project_id,
        link_id,
        publication.id,
        publication.project_version_id,
        scope.artifact_id,
        publication.edition_id,
        item.position,
        item.is_default,
        scope.auth.actor_org_user_id,
      ],
    );
  }
};

export const build_publish_transactional_repository = (
  db: Queryable,
): PublishRepository => ({
  transaction: async (work) => work(build_publish_transactional_repository(db)),
  async publish(input) {
    const revision_result =
      input.artifact_type === "guide"
        ? await create_or_reuse_guide_revision_for_publication(db, {
            ...input,
            guide_id: input.artifact_id,
          })
        : await create_or_reuse_demo_revision_for_publication(db, {
            ...input,
            interactive_demo_id: input.artifact_id,
          });
    const family = artifact_columns(input);
    const sequence = Number(
      (
        await db.query<{ sequence: number }>(
          `SELECT COALESCE(MAX(publication_sequence),0)+1 AS sequence FROM publish_schema.published_artifact WHERE ${family.edition_column}=$1`,
          [revision_result.locked.edition_id],
        )
      ).rows[0]!.sequence,
    );
    const publication_id = ulid();
    const row = (
      await db.query<PublicationRow>(
        `INSERT INTO publish_schema.published_artifact
      (id,organization_id,project_id,artifact_type,project_version_id,publication_sequence,${family.id_column},${family.edition_column},${family.revision_column},created_by_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,artifact_type,${family.id_column} AS artifact_id,${family.edition_column} AS edition_id,project_version_id,${family.revision_column} AS revision_id,publication_sequence,created_by_id,published_at,created_at`,
        [
          publication_id,
          input.auth.organization_id,
          input.project_id,
          input.artifact_type,
          input.project_version_id,
          sequence,
          input.artifact_id,
          revision_result.locked.edition_id,
          revision_result.revision.id,
          input.auth.actor_org_user_id,
        ],
      )
    ).rows[0]!;
    const publisher = (
      await db.query<{ display_name: string }>(
        `SELECT app_user.display_name FROM organization_schema.org_user org_user JOIN user_schema.user app_user ON app_user.id=org_user.user_id WHERE org_user.id=$1 AND org_user.organization_id=$2`,
        [input.auth.actor_org_user_id, input.auth.organization_id],
      )
    ).rows[0]!;
    const published_artifact = map_publication({
      ...row,
      revision_number: revision_result.revision.revision_number,
      publisher_display_name: publisher.display_name,
    });
    const updated_publish_links: PublishLink[] = [];
    for (const selection of input.update_publish_links) {
      const link = await load_link(db, input, selection.publish_link_id, true);
      if (
        !link ||
        link.status !== "active" ||
        link.version !== selection.expected_link_version
      )
        throw new PublicationRowVersionConflictError();
      const current = link.entries.find(
        (entry) => entry.project_version.id === input.project_version_id,
      );
      if (current)
        await db.query(
          `UPDATE publish_schema.publish_link_entry SET published_artifact_id=$1,${family.edition_column}=$2,version=version+1,updated_by_id=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4`,
          [
            publication_id,
            revision_result.locked.edition_id,
            input.auth.actor_org_user_id,
            current.id,
          ],
        );
      else
        await db.query(
          `INSERT INTO publish_schema.publish_link_entry
        (id,organization_id,project_id,publish_link_id,published_artifact_id,project_version_id,${family.id_column},${family.edition_column},position,is_default,created_by_id,updated_by_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,$10,$10)`,
          [
            ulid(),
            input.auth.organization_id,
            input.project_id,
            link.id,
            publication_id,
            input.project_version_id,
            input.artifact_id,
            revision_result.locked.edition_id,
            link.entries.length + 1,
            input.auth.actor_org_user_id,
          ],
        );
      await db.query(
        `UPDATE publish_schema.publish_link SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
        [link.id],
      );
      updated_publish_links.push((await load_link(db, input, link.id))!);
    }
    let created_publish_link: PublishLink | null = null;
    if (input.create_publish_link) {
      const password =
        input.create_publish_link.password === null
          ? { hash: null, salt: null }
          : await hash_public_link_password(input.create_publish_link.password);
      created_publish_link = await this.create_publish_link({
        ...input,
        ...input.create_publish_link,
        published_artifact_ids: [publication_id],
        default_published_artifact_id: publication_id,
        password_hash: password.hash,
        password_salt: password.salt,
      });
    }
    return {
      revision: revision_result.revision,
      revision_reused: revision_result.reused,
      published_artifact,
      updated_publish_links,
      created_publish_link,
    };
  },
  async list_publications(input) {
    const family = artifact_columns(input);
    const result = await db.query<PublicationRow>(
      `SELECT ${publication_select} FROM publish_schema.published_artifact publication ${publication_joins}
      WHERE publication.organization_id=$1 AND publication.project_id=$2 AND publication.artifact_type=$3 AND publication.${family.id_column}=$4 AND publication.project_version_id=$5 AND publication.publication_sequence<$6
      ORDER BY publication.publication_sequence DESC LIMIT $7`,
      [
        input.auth.organization_id,
        input.project_id,
        input.artifact_type,
        input.artifact_id,
        input.project_version_id,
        input.before_publication_sequence ?? 2147483647,
        input.limit + 1,
      ],
    );
    const more = result.rows.length > input.limit;
    const visible = result.rows.slice(0, input.limit).map(map_publication);
    return {
      publications: visible,
      next_before_publication_sequence: more
        ? visible.at(-1)!.publication_sequence
        : null,
    };
  },
  async list_publish_links(input) {
    const family = artifact_columns(input);
    const values: unknown[] = [
      input.auth.organization_id,
      input.project_id,
      input.artifact_type,
      input.artifact_id,
      input.status,
      input.cursor?.created_at ?? null,
      input.cursor?.id ?? null,
      input.limit + 1,
    ];
    const result = await db.query<LinkRow>(
      `SELECT ${link_select} FROM publish_schema.publish_link link WHERE link.organization_id=$1 AND link.project_id=$2 AND link.artifact_type=$3 AND link.${family.id_column}=$4
      AND ($5='all' OR link.status=$5) AND ($6::timestamptz IS NULL OR (link.created_at,link.id)<($6::timestamptz,$7)) ORDER BY link.created_at DESC,link.id DESC LIMIT $8`,
      values,
    );
    const more = result.rows.length > input.limit;
    const rows = result.rows.slice(0, input.limit);
    const entries = await load_entries(
      db,
      rows.map((r) => r.id),
    );
    const links = rows.map((r) => map_link(r, entries.get(r.id) ?? []));
    return {
      publish_links: links,
      next_cursor: more
        ? { created_at: links.at(-1)!.created_at, id: links.at(-1)!.id }
        : null,
    };
  },
  async create_publish_link(input) {
    const family = artifact_columns(input);
    const id = ulid();
    let inserted = false;
    for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
      const slug = randomBytes(16).toString("base64url");
      const result = await db.query(
        `INSERT INTO publish_schema.publish_link(id,organization_id,project_id,artifact_type,${family.id_column},name,slug,visibility,expires_at,password_hash,password_salt,password_set_at,password_updated_at,created_by_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $10::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,CASE WHEN $10::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,$12)
      ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [
          id,
          input.auth.organization_id,
          input.project_id,
          input.artifact_type,
          input.artifact_id,
          input.name,
          slug,
          input.visibility,
          input.expires_at,
          input.password_hash,
          input.password_salt,
          input.auth.actor_org_user_id,
        ],
      );
      inserted = result.rows.length === 1;
    }
    if (!inserted) throw new PublishSlugConflictError();
    await insert_manifest(
      db,
      input,
      id,
      input.published_artifact_ids,
      input.default_published_artifact_id,
    );
    return (await load_link(db, input, id))!;
  },
  async update_publish_link(input) {
    const current = await load_link(db, input, input.link_id, true);
    if (!current || current.status !== "active") return null;
    const result = await db.query(
      `UPDATE publish_schema.publish_link SET name=COALESCE($1,name),visibility=COALESCE($2,visibility),expires_at=CASE WHEN $3::boolean THEN $4::timestamptz ELSE expires_at END,
      password_hash=CASE WHEN $5::boolean THEN $6 ELSE password_hash END,password_salt=CASE WHEN $5::boolean THEN $7 ELSE password_salt END,password_set_at=CASE WHEN $5::boolean THEN CASE WHEN $6::text IS NULL THEN NULL ELSE COALESCE(password_set_at,CURRENT_TIMESTAMP) END ELSE password_set_at END,password_updated_at=CASE WHEN $5::boolean THEN CASE WHEN $6::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END ELSE password_updated_at END,
      version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$8 AND version=$9 RETURNING id`,
      [
        input.settings.name ?? null,
        input.settings.visibility ?? null,
        input.settings.expires_at !== undefined,
        input.settings.expires_at ?? null,
        input.password_hash !== undefined,
        input.password_hash ?? null,
        input.password_salt ?? null,
        input.link_id,
        input.settings.expected_link_version,
      ],
    );
    if (!result.rows[0]) throw new PublicationRowVersionConflictError();
    if (
      input.settings.visibility !== undefined ||
      input.settings.expires_at !== undefined ||
      input.settings.password !== undefined
    )
      await db.query(
        `UPDATE publish_schema.public_publish_viewer_session SET revoked_at=CURRENT_TIMESTAMP WHERE publish_link_id=$1 AND revoked_at IS NULL`,
        [input.link_id],
      );
    return load_link(db, input, input.link_id);
  },
  async replace_publish_link_manifest(input) {
    const current = await load_link(db, input, input.link_id, true);
    if (!current || current.status !== "active") return null;
    if (current.version !== input.manifest.expected_link_version)
      throw new PublicationRowVersionConflictError();
    await db.query(
      `DELETE FROM publish_schema.publish_link_entry WHERE publish_link_id=$1`,
      [input.link_id],
    );
    await insert_manifest(
      db,
      input,
      input.link_id,
      input.manifest.published_artifact_ids,
      input.manifest.default_published_artifact_id,
    );
    assert_updated(
      (
        await db.query(
          `UPDATE publish_schema.publish_link SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND version=$2 RETURNING id`,
          [input.link_id, input.manifest.expected_link_version],
        )
      ).rows,
    );
    return load_link(db, input, input.link_id);
  },
  async rollback_publish_link_entry(input) {
    const current = await load_link(db, input, input.link_id, true);
    if (!current || current.status !== "active") return null;
    if (current.version !== input.rollback.expected_link_version)
      throw new PublicationRowVersionConflictError();
    const entry = current.entries.find((e) => e.id === input.entry_id);
    if (!entry) return null;
    const family = artifact_columns(input);
    const target = (
      await db.query<{
        id: string;
        edition_id: string;
        publication_sequence: number;
      }>(
        `SELECT id,${family.edition_column} AS edition_id,publication_sequence FROM publish_schema.published_artifact WHERE id=$1 AND project_version_id=$2 AND ${family.edition_column}=$3`,
        [
          input.rollback.target_published_artifact_id,
          entry.project_version.id,
          entry.published_artifact.edition_id,
        ],
      )
    ).rows[0];
    if (!target) return null;
    assert_same_edition_rollback({
      current_edition_id: entry.published_artifact.edition_id,
      target_edition_id: target.edition_id,
      current_published_artifact_id: entry.published_artifact.id,
      target_published_artifact_id: target.id,
      current_publication_sequence:
        entry.published_artifact.publication_sequence,
      target_publication_sequence: Number(target.publication_sequence),
    });
    await db.query(
      `UPDATE publish_schema.publish_link_entry SET published_artifact_id=$1,version=version+1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
      [target.id, input.auth.actor_org_user_id, entry.id],
    );
    await db.query(
      `UPDATE publish_schema.publish_link SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [input.link_id],
    );
    const link = (await load_link(db, input, input.link_id))!;
    return {
      publish_link: link,
      entry: link.entries.find((e) => e.id === entry.id)!,
      previous_published_artifact: entry.published_artifact,
    };
  },
  async revoke_publish_link(input) {
    const current = await load_link(db, input, input.link_id, true);
    if (!current || current.status !== "active") return null;
    const rows = (
      await db.query(
        `UPDATE publish_schema.publish_link SET status='revoked',version=version+1,revoked_by_id=$1,revoked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND version=$3 RETURNING id`,
        [
          input.auth.actor_org_user_id,
          input.link_id,
          input.expected_link_version,
        ],
      )
    ).rows;
    assert_updated(rows);
    await db.query(
      `UPDATE publish_schema.public_publish_viewer_session SET revoked_at=CURRENT_TIMESTAMP WHERE publish_link_id=$1 AND revoked_at IS NULL`,
      [input.link_id],
    );
    return load_link(db, input, input.link_id);
  },
  async resolve_public_publish_link(input) {
    const row = (
      await db.query<LinkRow & { organization_id: string; project_id: string }>(
        `SELECT ${link_select},link.organization_id,link.project_id FROM publish_schema.publish_link link WHERE link.slug=$1 AND link.artifact_type=$2 AND link.status='active'`,
        [input.slug, input.artifact_type],
      )
    ).rows[0];
    if (!row) return null;
    const link = map_link(
      row,
      (await load_entries(db, [row.id])).get(row.id) ?? [],
    );
    let entry =
      input.version_slug === null
        ? link.entries.find((e) => e.is_default)
        : link.entries.find(
            (e) => e.project_version.slug === input.version_slug,
          );
    if (!entry && input.version_slug) {
      const alias = (
        await db.query<{ project_version_id: string }>(
          `SELECT alias.project_version_id FROM project_schema.project_version_alias alias WHERE alias.organization_id=$1 AND alias.project_id=$2 AND lower(alias.slug)=lower($3)`,
          [row.organization_id, row.project_id, input.version_slug],
        )
      ).rows[0];
      entry = alias
        ? link.entries.find(
            (e) => e.project_version.id === alias.project_version_id,
          )
        : undefined;
    }
    if (!entry) return null;
    const revisions = build_artifact_revision_repository(db);
    const detail =
      input.artifact_type === "guide"
        ? await revisions.get_guide_revision({
            auth: {
              organization_id: row.organization_id,
              actor_org_user_id: "public",
            },
            project_id: row.project_id,
            project_version_id: entry.project_version.id,
            guide_id: row.artifact_id,
            revision_number: entry.published_artifact.revision_number,
          })
        : await revisions.get_interactive_demo_revision({
            auth: {
              organization_id: row.organization_id,
              actor_org_user_id: "public",
            },
            project_id: row.project_id,
            project_version_id: entry.project_version.id,
            interactive_demo_id: row.artifact_id,
            revision_number: entry.published_artifact.revision_number,
          });
    if (!detail) return null;
    const entries = link.entries.map((item) => ({
      project_version_name: item.project_version.name,
      project_version_slug: item.project_version.slug,
      position: item.position,
      is_default: item.is_default,
      publication_sequence: item.published_artifact.publication_sequence,
      public_url: `${public_url(input.artifact_type, input.slug)}/versions/${item.project_version.slug}`,
    }));
    const capture_assets = detail.capture_assets.map((asset) => ({
      ...asset,
      file_url: `/api/v1/public/publish-links/${input.slug}/versions/${entry!.project_version.slug}/assets/${asset.id}/file?artifact_type=${input.artifact_type}`,
    }));
    const response = {
      publish_link: {
        slug: row.slug,
        artifact_type: row.artifact_type,
        visibility: row.visibility,
        status: "active" as const,
        expires_at: row.expires_at?.toISOString() ?? null,
        password_protected: Boolean(row.password_hash),
        entries,
      },
      selected_entry: entries.find(
        (e) => e.project_version_slug === entry.project_version.slug,
      )!,
      published_artifact: {
        artifact_type: input.artifact_type,
        publication_sequence: entry.published_artifact.publication_sequence,
        ...detail,
        capture_assets,
      },
      canonical_public_url: `${public_url(input.artifact_type, input.slug)}/versions/${entry.project_version.slug}`,
    } as PublicPublishLinkResponse;
    return {
      ...response,
      access_context: {
        organization_id: row.organization_id,
        project_id: row.project_id,
        publish_link_id: row.id,
      },
      password_hash: row.password_hash,
      password_salt: row.password_salt,
    };
  },
  async find_public_viewer_session(input) {
    const row = (
      await db.query<{ expires_at: Date; revoked_at: Date | null }>(
        `SELECT expires_at,revoked_at FROM publish_schema.public_publish_viewer_session WHERE publish_link_id=$1 AND token_hash=$2`,
        [input.publish_link_id, input.token_hash],
      )
    ).rows[0];
    return row
      ? {
          publish_link_id: input.publish_link_id,
          expires_at: row.expires_at.toISOString(),
          revoked_at: row.revoked_at?.toISOString() ?? null,
        }
      : null;
  },
  async touch_public_viewer_session(input) {
    await db.query(
      `UPDATE publish_schema.public_publish_viewer_session SET last_used_at=CURRENT_TIMESTAMP WHERE publish_link_id=$1 AND token_hash=$2 AND revoked_at IS NULL`,
      [input.publish_link_id, input.token_hash],
    );
  },
  async create_public_viewer_session(input) {
    await db.query(
      `INSERT INTO publish_schema.public_publish_viewer_session(id,publish_link_id,token_hash,expires_at) VALUES($1,$2,$3,$4)`,
      [ulid(), input.publish_link_id, input.token_hash, input.expires_at],
    );
    return { token: input.token, expires_at: input.expires_at };
  },
  async get_public_asset(input) {
    const result = await db.query<{
      storage_provider: "local" | "external";
      storage_key: string;
      mime_type: string;
      size_bytes: number;
    }>(
      `SELECT file.storage_provider,file.storage_key,file.mime_type,file.size_bytes FROM publish_schema.publish_link link JOIN publish_schema.publish_link_entry entry ON entry.publish_link_id=link.id JOIN project_schema.project_version version ON version.id=entry.project_version_id JOIN publish_schema.published_artifact publication ON publication.id=entry.published_artifact_id JOIN capture_schema.capture_asset asset ON asset.id=$4 JOIN file_schema.file file ON file.id=asset.file_id WHERE link.slug=$1 AND link.artifact_type=$2 AND version.slug=$3 AND link.status='active' AND ((publication.guide_revision_id IS NOT NULL AND EXISTS(SELECT 1 FROM guide_schema.guide_revision_step step WHERE step.guide_revision_id=publication.guide_revision_id AND $4 IN(step.source_capture_asset_id,step.selected_capture_asset_id))) OR (publication.interactive_demo_revision_id IS NOT NULL AND EXISTS(SELECT 1 FROM interactive_demo_schema.demo_revision_scene scene WHERE scene.interactive_demo_revision_id=publication.interactive_demo_revision_id AND $4 IN(scene.source_capture_asset_id,scene.background_capture_asset_id))))`,
      [
        input.slug,
        input.artifact_type,
        input.version_slug,
        input.capture_asset_id,
      ],
    );
    return result.rows[0] ? { file: result.rows[0] } : null;
  },
});

export const build_publish_repository = (pool: Pool): PublishRepository => ({
  ...build_publish_transactional_repository(pool),
  async transaction(work) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(build_publish_transactional_repository(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
});
