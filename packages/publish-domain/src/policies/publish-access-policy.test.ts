import { describe, expect, it } from "vitest";
import {
  assert_public_publish_link_access,
  assert_public_viewer_session_access,
  validate_publish_access_input,
} from "./publish-access-policy";
import {
  InvalidPublishAccessSettingsError,
  PublishLinkExpiredError,
  PublishLinkNotPublicError,
  PublishLinkPasswordRequiredError,
} from "../errors/publish-domain-error";

const public_link = {
  slug: "abc123",
  artifact_type: "guide" as const,
  visibility: "public" as const,
  status: "active" as const,
  expires_at: null,
  password_protected: false,
  entries: [
    {
      project_version_name: "Main",
      project_version_slug: "main",
      position: 1,
      is_default: true,
      publication_sequence: 1,
      public_url: "/p/test/versions/main",
    },
  ],
};

describe("publish access policy", () => {
  it("validates publish access input", () => {
    expect(
      validate_publish_access_input({
        visibility: "public",
        expires_at: null,
      }),
    ).toEqual({
      visibility: "public",
      expires_at: null,
    });

    expect(() =>
      validate_publish_access_input({
        visibility: "private",
        expires_at: null,
      }),
    ).toThrow(InvalidPublishAccessSettingsError);

    expect(() =>
      validate_publish_access_input({
        visibility: "public",
        expires_at: "not-a-date",
      }),
    ).toThrow(InvalidPublishAccessSettingsError);
  });

  it("rejects restricted and expired public links", () => {
    expect(() =>
      assert_public_publish_link_access({
        publish_link: {
          ...public_link,
          visibility: "restricted",
        },
        now: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ).toThrow(PublishLinkNotPublicError);

    expect(() =>
      assert_public_publish_link_access({
        publish_link: {
          ...public_link,
          expires_at: "2026-07-07T00:00:00.000Z",
        },
        now: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ).toThrow(PublishLinkExpiredError);
  });

  it("enforces viewer session state for password protected links", () => {
    expect(
      assert_public_viewer_session_access({
        publish_link: public_link,
        session: null,
        now: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ).toEqual({ should_touch_session: false });

    expect(() =>
      assert_public_viewer_session_access({
        publish_link: {
          ...public_link,
          password_protected: true,
        },
        session: null,
        now: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ).toThrow(PublishLinkPasswordRequiredError);

    expect(() =>
      assert_public_viewer_session_access({
        publish_link: {
          ...public_link,
          password_protected: true,
        },
        session: {
          publish_link_id: "publish_link_1",
          expires_at: "2026-07-07T00:00:00.000Z",
          revoked_at: null,
        },
        now: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ).toThrow(PublishLinkPasswordRequiredError);

    expect(
      assert_public_viewer_session_access({
        publish_link: {
          ...public_link,
          password_protected: true,
        },
        session: {
          publish_link_id: "publish_link_1",
          expires_at: "2026-07-07T12:00:00.000Z",
          revoked_at: null,
        },
        now: new Date("2026-07-07T00:00:00.000Z"),
      }),
    ).toEqual({ should_touch_session: true });
  });
});
