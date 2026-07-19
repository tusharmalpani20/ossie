import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";

const setup = async () => {
  const app = build({ logger: false });
  const owner = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "owner@example.test",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: { name: "Synthetic" },
    },
  });
  const token =
    owner.cookies.find(({ name }) => name === "ossie_session")?.value ?? "";
  const createdProject = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { ossie_session: token },
    payload: { name: "Revision Project" },
  });
  expect(createdProject.statusCode).toBe(201);
  return { app, token, project: createdProject.json().project };
};

describe("DB-backed Artifact Revisions and Carry-Forward", () => {
  beforeEach(async () => reset_test_database());
  afterAll(async () => pool.end());

  it("checkpoints immutable Guide state and idempotently carries its Edition forward", async () => {
    const { app, token, project } = await setup();
    const sourceVersionId = project.default_project_version.id as string;
    const targetResponse = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/versions`,
      cookies: { ossie_session: token },
      payload: { name: "Next" },
    });
    expect(targetResponse.statusCode).toBe(201);
    const targetVersionId = targetResponse.json().project_version.id as string;

    const captureResponse = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/capture-sessions`,
      cookies: { ossie_session: token },
      payload: {
        name: "Empty synthetic source",
        project_version_id: sourceVersionId,
        source_type: "manual",
      },
    });
    expect(captureResponse.statusCode).toBe(201);
    const captureSessionId = captureResponse.json().capture_session
      .id as string;

    const guideResponse = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/guides/from-capture-session/${captureSessionId}`,
      cookies: { ossie_session: token },
      payload: { title: "Account setup" },
    });
    expect(guideResponse.statusCode).toBe(201);
    const guideId = guideResponse.json().artifact.id as string;
    const writeVersions = {
      expected_edition_version: guideResponse.json().edition.version as number,
      expected_working_draft_version: guideResponse.json().working_draft
        .version as number,
    };

    const checkpoint = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/guides/${guideId}/revisions/checkpoint?project_version_id=${sourceVersionId}`,
      cookies: { ossie_session: token },
      payload: writeVersions,
    });
    expect(checkpoint.statusCode).toBe(201);
    expect(checkpoint.json()).toMatchObject({
      revision: { revision_number: 1, trigger: "manual_checkpoint" },
      reused: false,
    });

    const repeatedCheckpoint = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/guides/${guideId}/revisions/checkpoint?project_version_id=${sourceVersionId}`,
      cookies: { ossie_session: token },
      payload: writeVersions,
    });
    expect(repeatedCheckpoint.statusCode).toBe(200);
    expect(repeatedCheckpoint.json()).toMatchObject({
      revision: { id: checkpoint.json().revision.id },
      reused: true,
    });

    const carryPayload = {
      source_project_version_id: sourceVersionId,
      target_project_version_id: targetVersionId,
      artifacts: [{ artifact_type: "guide", artifact_id: guideId }],
    };
    const carry = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/artifact-editions/carry-forward`,
      cookies: { ossie_session: token },
      headers: { "idempotency-key": "carry-forward-test-key-0001" },
      payload: carryPayload,
    });
    expect(carry.statusCode).toBe(201);
    expect(carry.json()).toMatchObject({
      replayed: false,
      items: [
        {
          artifact_type: "guide",
          artifact_id: guideId,
          source_revision_id: checkpoint.json().revision.id,
        },
      ],
    });

    const replay = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/artifact-editions/carry-forward`,
      cookies: { ossie_session: token },
      headers: { "idempotency-key": "carry-forward-test-key-0001" },
      payload: carryPayload,
    });
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toMatchObject({
      replayed: true,
      carry_forward: { id: carry.json().carry_forward.id },
    });

    const lineage = await pool.query<{
      source_guide_revision_id: string;
      project_version_id: string;
    }>(
      `SELECT source_guide_revision_id,project_version_id
       FROM guide_schema.guide_edition
       WHERE id=$1`,
      [carry.json().items[0].target_edition_id],
    );
    expect(lineage.rows[0]).toEqual({
      source_guide_revision_id: checkpoint.json().revision.id,
      project_version_id: targetVersionId,
    });

    await expect(
      pool.query(
        `UPDATE guide_schema.guide_revision SET title='changed' WHERE id=$1`,
        [checkpoint.json().revision.id],
      ),
    ).rejects.toMatchObject({ constraint: "immutable_revision_guard" });

    await app.close();
  });
});
