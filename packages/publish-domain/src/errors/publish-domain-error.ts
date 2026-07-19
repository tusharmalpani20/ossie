export type PublishDomainErrorStatusHint =
  | "bad_request"
  | "conflict"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "gone";

export class PublishDomainError extends Error {
  readonly code: string;
  readonly status_hint: PublishDomainErrorStatusHint;

  constructor(input: {
    code: string;
    message: string;
    status_hint: PublishDomainErrorStatusHint;
  }) {
    super(input.message);
    this.name = new.target.name;
    this.code = input.code;
    this.status_hint = input.status_hint;
  }
}

export class InvalidPublishAccessSettingsError extends PublishDomainError {
  constructor() {
    super({
      code: "invalid_publish_access_settings",
      message: "Invalid publish access settings",
      status_hint: "bad_request",
    });
  }
}

export class InvalidPublishPasswordSettingsError extends PublishDomainError {
  constructor() {
    super({
      code: "invalid_publish_password_settings",
      message: "Invalid publish password settings",
      status_hint: "bad_request",
    });
  }
}

export class PublishLinkNotPublicError extends PublishDomainError {
  constructor() {
    super({
      code: "publish_link_not_public",
      message: "Publish link is not public",
      status_hint: "forbidden",
    });
  }
}

export class PublishLinkExpiredError extends PublishDomainError {
  constructor() {
    super({
      code: "publish_link_expired",
      message: "Publish link has expired",
      status_hint: "gone",
    });
  }
}

export class PublishLinkPasswordRequiredError extends PublishDomainError {
  constructor() {
    super({
      code: "publish_link_password_required",
      message: "Publish link password is required",
      status_hint: "unauthorized",
    });
  }
}

export class InvalidPublicViewerPasswordError extends PublishDomainError {
  constructor() {
    super({
      code: "invalid_public_viewer_password",
      message: "Invalid public viewer password",
      status_hint: "bad_request",
    });
  }
}

export class GuideNotPublishableError extends PublishDomainError {
  constructor() {
    super({
      code: "guide_not_publishable",
      message: "Guide is not publishable",
      status_hint: "conflict",
    });
  }
}

export class PublicationVersionNotReadyError extends PublishDomainError {
  constructor() {
    super({
      code: "publication_version_not_ready",
      message: "Publishing from this Project Version is not available yet",
      status_hint: "conflict",
    });
  }
}

export class InteractiveDemoNotPublishableError extends PublishDomainError {
  constructor() {
    super({
      code: "interactive_demo_not_publishable",
      message: "Interactive demo is not publishable",
      status_hint: "conflict",
    });
  }
}

export class GuideHasNoPublishableBlocksError extends PublishDomainError {
  constructor() {
    super({
      code: "guide_has_no_publishable_blocks",
      message: "Guide has no publishable blocks",
      status_hint: "bad_request",
    });
  }
}

export class InteractiveDemoHasNoPublishableScenesError extends PublishDomainError {
  constructor() {
    super({
      code: "interactive_demo_has_no_publishable_scenes",
      message: "Interactive demo has no publishable scenes",
      status_hint: "bad_request",
    });
  }
}
