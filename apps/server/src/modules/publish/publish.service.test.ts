import { describe, expect, it, vi } from "vitest";
import { PublishLinkNotPublicError } from "@repo/publish-domain";
import {
  build_publish_service,
  type PublishRepository,
} from "./publish.service";

describe("revision-backed publication service", () => {
  it("publishes inside the repository transaction without an implicit link update", async () => {
    const response = {
      revision: {},
      revision_reused: false,
      published_artifact: {},
      updated_publish_links: [],
      created_publish_link: null,
    };
    const publish = vi.fn(async () => response);
    const transaction = vi.fn(
      async (work: (repo: PublishRepository) => Promise<unknown>) =>
        work(repository),
    );
    const repository = { transaction, publish } as unknown as PublishRepository;
    const service = build_publish_service(repository);
    const result = await service.publish({
      auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
      project_id: "project_1",
      project_version_id: "pv_1",
      artifact_type: "guide",
      artifact_id: "guide_1",
      expected_edition_version: 1,
      expected_working_draft_version: 1,
      update_publish_links: [],
    });
    expect(result).toBe(response);
    expect(transaction).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ update_publish_links: [] }),
    );
  });

  it("does not create a password session for a restricted Publish Link", async () => {
    const create_public_viewer_session = vi.fn();
    const repository = {
      resolve_public_publish_link: vi.fn(async () => ({
        publish_link: {
          visibility: "restricted",
          status: "active",
          expires_at: null,
        },
        password_hash: "hash",
        password_salt: "salt",
        access_context: { publish_link_id: "link_1" },
      })),
      create_public_viewer_session,
    } as unknown as PublishRepository;

    await expect(
      build_publish_service(repository).create_public_publish_viewer_session({
        slug: "public-link",
        artifact_type: "guide",
        password: "correct horse battery staple",
      }),
    ).rejects.toBeInstanceOf(PublishLinkNotPublicError);
    expect(create_public_viewer_session).not.toHaveBeenCalled();
  });
});
