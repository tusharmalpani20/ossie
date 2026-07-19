export type GuideDomainErrorStatusHint =
  | "bad_request"
  | "not_found"
  | "conflict"
  | "not_implemented";

export class GuideDomainError extends Error {
  readonly code: string;
  readonly status_hint: GuideDomainErrorStatusHint;

  constructor(input: {
    code: string;
    message: string;
    status_hint: GuideDomainErrorStatusHint;
  }) {
    super(input.message);
    this.name = new.target.name;
    this.code = input.code;
    this.status_hint = input.status_hint;
  }
}

export class ProjectNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "project_not_found",
      message: "Project was not found",
      status_hint: "not_found",
    });
  }
}

export class CaptureSessionNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "capture_session_not_found",
      message: "Capture session was not found",
      status_hint: "not_found",
    });
  }
}

export class CaptureEventNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "capture_event_not_found",
      message: "Capture event was not found",
      status_hint: "not_found",
    });
  }
}

export class GuideNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_not_found",
      message: "Guide was not found",
      status_hint: "not_found",
    });
  }
}

export class GuideNotEditableError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_not_editable",
      message: "Guide is not editable",
      status_hint: "conflict",
    });
  }
}

export class GuideEditionConflictError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_edition_conflict",
      message: "Guide Edition changed; reload and retry",
      status_hint: "conflict",
    });
  }
}

export class GuideWorkingDraftConflictError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_working_draft_conflict",
      message: "Guide Working Draft changed; reload and retry",
      status_hint: "conflict",
    });
  }
}

export class GuideStepNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_step_not_found",
      message: "Guide step was not found",
      status_hint: "not_found",
    });
  }
}

export class GuideBlockNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_block_not_found",
      message: "Guide block was not found",
      status_hint: "not_found",
    });
  }
}

export class InvalidGuideInputError extends GuideDomainError {
  constructor() {
    super({
      code: "invalid_guide",
      message: "Guide input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidGuideStepInputError extends GuideDomainError {
  constructor() {
    super({
      code: "invalid_guide_step",
      message: "Guide step input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidGuideBlockOrderError extends GuideDomainError {
  constructor() {
    super({
      code: "invalid_guide_block_order",
      message: "Guide block order is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidGuideBlockContentError extends GuideDomainError {
  constructor() {
    super({
      code: "invalid_guide_block_content",
      message: "Guide block content is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidGuideBlockScreenshotError extends GuideDomainError {
  constructor() {
    super({
      code: "invalid_guide_block_screenshot",
      message: "Guide block screenshot is invalid",
      status_hint: "bad_request",
    });
  }
}

export class GuideExportFileNotFoundError extends GuideDomainError {
  constructor() {
    super({
      code: "guide_export_file_not_found",
      message: "Guide export file was not found",
      status_hint: "not_found",
    });
  }
}

export class UnsupportedGuideExportStorageProviderError extends GuideDomainError {
  constructor() {
    super({
      code: "unsupported_guide_export_storage_provider",
      message: "Guide export storage provider is not supported",
      status_hint: "not_implemented",
    });
  }
}
