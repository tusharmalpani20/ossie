import { PUBLISH_VISIBILITIES, type PublishVisibility } from "@repo/constants";
import type { PublicPublishLink } from "@repo/types/publish";
import {
  InvalidPublishAccessSettingsError,
  PublishLinkExpiredError,
  PublishLinkNotPublicError,
  PublishLinkPasswordRequiredError,
} from "../errors/publish-domain-error";
import type { PublishViewerSessionRecord } from "../types/publish-domain";

export type NormalizedPublishAccessInput = {
  visibility: PublishVisibility;
  expires_at: string | null;
};

export const validate_publish_access_input = (input: {
  visibility: unknown;
  expires_at: unknown;
}): NormalizedPublishAccessInput => {
  if (!PUBLISH_VISIBILITIES.includes(input.visibility as PublishVisibility)) {
    throw new InvalidPublishAccessSettingsError();
  }

  if (
    input.expires_at !== null
    && (
      typeof input.expires_at !== "string"
      || !Number.isFinite(new Date(input.expires_at).getTime())
    )
  ) {
    throw new InvalidPublishAccessSettingsError();
  }

  return {
    visibility: input.visibility as PublishVisibility,
    expires_at: input.expires_at,
  };
};

export const assert_public_publish_link_access = (input: {
  publish_link: Pick<PublicPublishLink, "visibility" | "expires_at">;
  now: Date;
}) => {
  if (input.publish_link.visibility !== "public") {
    throw new PublishLinkNotPublicError();
  }

  if (
    input.publish_link.expires_at
    && new Date(input.publish_link.expires_at).getTime() <= input.now.getTime()
  ) {
    throw new PublishLinkExpiredError();
  }
};

export const assert_public_viewer_session_access = (input: {
  publish_link: Pick<PublicPublishLink, "password_protected">;
  session: PublishViewerSessionRecord | null;
  now: Date;
}) => {
  if (!input.publish_link.password_protected) {
    return { should_touch_session: false };
  }

  if (
    !input.session
    || input.session.revoked_at
    || new Date(input.session.expires_at).getTime() <= input.now.getTime()
  ) {
    throw new PublishLinkPasswordRequiredError();
  }

  return { should_touch_session: true };
};

export const should_touch_public_viewer_session = (input: {
  publish_link: Pick<PublicPublishLink, "password_protected">;
  session: PublishViewerSessionRecord | null;
  now: Date;
}) => assert_public_viewer_session_access(input).should_touch_session;
