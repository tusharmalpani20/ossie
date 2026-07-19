import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";

const multipart_payload = (
  parts: Array<{
    name: string;
    value: string | Buffer;
    filename?: string;
    content_type?: string;
  }>,
) => {
  const boundary = "----ossie-publication-test-boundary";
  const chunks: Buffer[] = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${part.name}"${part.filename ? `; filename="${part.filename}"` : ""}\r\n`,
      ),
    );
    if (part.content_type) {
      chunks.push(Buffer.from(`Content-Type: ${part.content_type}\r\n`));
    }
    chunks.push(Buffer.from("\r\n"));
    chunks.push(
      Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value),
    );
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat(chunks),
  };
};

const setup_owner = async () => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: { name: "Acme" },
    },
  });
  await app.close();
  expect(response.statusCode).toBe(201);
  return (
    response.cookies.find((cookie) => cookie.name === "ossie_session")?.value ??
    ""
  );
};

const create_project = async (session_token: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { ossie_session: session_token },
    payload: { name: "Publication integration" },
  });
  await app.close();
  expect(response.statusCode).toBe(201);
  const project = response.json().project;
  return {
    project_id: project.id as string,
    project_version_id: project.default_project_version.id as string,
    project_version_slug: project.default_project_version.slug as string,
  };
};

describe("DB-backed relational Publication API", () => {
  let storage_root: string;
  let previous_storage_root: string | undefined;

  beforeEach(async () => {
    storage_root = await mkdtemp(
      path.join(tmpdir(), "ossie-publication-test-"),
    );
    previous_storage_root = process.env.OSSIE_LOCAL_STORAGE_ROOT;
    process.env.OSSIE_LOCAL_STORAGE_ROOT = storage_root;
    await reset_test_database();
  });

  afterEach(async () => {
    if (previous_storage_root === undefined) {
      delete process.env.OSSIE_LOCAL_STORAGE_ROOT;
    } else {
      process.env.OSSIE_LOCAL_STORAGE_ROOT = previous_storage_root;
    }
    await rm(storage_root, { recursive: true, force: true });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("publishes immutable Revisions, manages independent links, resolves exact versions, streams protected media, rolls back, and revokes", async () => {
    const bytes = Buffer.from("synthetic publication image");
    const session_token = await setup_owner();
    const { project_id, project_version_id, project_version_slug } =
      await create_project(session_token);
    const app = build({ logger: false });

    const capture = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions`,
      cookies: { ossie_session: session_token },
      payload: {
        name: "Create department workflow",
        project_version_id,
        source_type: "manual",
      },
    });
    expect(capture.statusCode).toBe(201);
    const capture_session_id = capture.json().capture_session.id as string;

    const upload = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/upload`,
      cookies: { ossie_session: session_token },
      ...multipart_payload([
        {
          name: "file",
          filename: "department.png",
          content_type: "image/png",
          value: bytes,
        },
        { name: "width", value: "1440" },
        { name: "height", value: "900" },
      ]),
    });
    expect(upload.statusCode).toBe(201);
    const capture_asset_id = upload.json().capture_asset.id as string;

    const event = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "capture",
        event_index: 1,
        capture_asset_id,
        page_title: "Department List",
        page_url: "https://example.test/departments",
        metadata: { private_note: "must never be public" },
      },
    });
    expect(event.statusCode).toBe(201);

    const create_guide = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: { title: "Department setup guide" },
    });
    expect(create_guide.statusCode).toBe(201);
    const created = create_guide.json();
    const guide_id = created.artifact.id as string;

    const first_publish = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publications?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_edition_version: created.edition.version,
        expected_working_draft_version: created.working_draft.version,
        update_publish_links: [],
        create_publish_link: {
          name: "Documentation",
          visibility: "public",
          expires_at: null,
          password: null,
        },
      },
    });
    expect(first_publish.statusCode).toBe(201);
    const first = first_publish.json();
    expect(first.published_artifact).toMatchObject({
      artifact_type: "guide",
      publication_sequence: 1,
      project_version_id,
    });
    expect(first.created_publish_link.entries).toHaveLength(1);
    const first_publication_id = first.published_artifact.id as string;
    const primary_link_id = first.created_publish_link.id as string;
    const slug = first.created_publish_link.slug as string;

    const second_link = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish-links?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        name: "Pinned audience",
        visibility: "public",
        expires_at: null,
        password: null,
        published_artifact_ids: [first_publication_id],
        default_published_artifact_id: first_publication_id,
      },
    });
    expect(second_link.statusCode).toBe(201);

    const public_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}/versions/${project_version_slug}?artifact_type=guide`,
    });
    expect(public_response.statusCode).toBe(200);
    expect(public_response.json()).toMatchObject({
      selected_entry: { project_version_slug },
      published_artifact: {
        artifact_type: "guide",
        publication_sequence: 1,
      },
    });
    expect(JSON.stringify(public_response.json())).not.toContain("storage_key");
    expect(JSON.stringify(public_response.json())).not.toContain(
      "private_note",
    );

    const asset = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}/versions/${project_version_slug}/assets/${capture_asset_id}/file?artifact_type=guide`,
    });
    expect(asset.statusCode).toBe(200);
    expect(asset.body).toBe(bytes.toString());

    const update = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Updated department setup guide",
        expected_edition_version: created.edition.version,
      },
    });
    expect(update.statusCode).toBe(200);

    const second_publish = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publications?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_edition_version: update.json().edition.version,
        expected_working_draft_version: created.working_draft.version,
        update_publish_links: [
          {
            publish_link_id: primary_link_id,
            expected_link_version: first.created_publish_link.version,
          },
        ],
      },
    });
    expect(second_publish.statusCode).toBe(201);
    const second = second_publish.json();
    expect(second.published_artifact.publication_sequence).toBe(2);

    const links = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish-links?project_version_id=${project_version_id}&status=active`,
      cookies: { ossie_session: session_token },
    });
    expect(links.statusCode).toBe(200);
    expect(links.json().publish_links).toHaveLength(2);
    expect(
      links
        .json()
        .publish_links.find((link: { name: string }) =>
          link.name.startsWith("Pinned"),
        ).entries[0].published_artifact.id,
    ).toBe(first_publication_id);

    const updated_link = second.updated_publish_links[0];
    const rollback = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish-links/${primary_link_id}/entries/${updated_link.entries[0].id}/rollback?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_link_version: updated_link.version,
        target_published_artifact_id: first_publication_id,
        reason: "Restore the previously approved Publication",
      },
    });
    expect(rollback.statusCode).toBe(200);
    expect(rollback.json().entry.published_artifact.publication_sequence).toBe(
      1,
    );

    const revoke = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish-links/${primary_link_id}/revoke?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: { expected_link_version: rollback.json().publish_link.version },
    });
    expect(revoke.statusCode).toBe(200);
    const revoked = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}?artifact_type=guide`,
    });
    expect(revoked.statusCode).toBe(404);

    await app.close();
  }, 30_000);
});
