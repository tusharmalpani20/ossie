export type CaptureDomainErrorStatusHint =
  | "bad_request"
  | "not_found"
  | "conflict"
  | "payload_too_large";

export class CaptureDomainError extends Error {
  readonly code: string;
  readonly status_hint: CaptureDomainErrorStatusHint;

  constructor(input: {
    code: string;
    message: string;
    status_hint: CaptureDomainErrorStatusHint;
  }) {
    super(input.message);
    this.name = new.target.name;
    this.code = input.code;
    this.status_hint = input.status_hint;
  }
}

export class CaptureSessionNotFoundError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_session_not_found",
      message: "Capture session was not found",
      status_hint: "not_found",
    });
  }
}

export class CaptureSessionNotCompletableError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_session_not_completable",
      message: "Capture session cannot be completed from its current status",
      status_hint: "bad_request",
    });
  }
}

export class InvalidCaptureSessionCompletionError extends CaptureDomainError {
  constructor() {
    super({
      code: "invalid_capture_session_completion",
      message: "Capture session completion input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class EmptyCaptureSessionUpdateError extends CaptureDomainError {
  constructor() {
    super({
      code: "empty_capture_session_update",
      message: "At least one capture session field must be provided",
      status_hint: "bad_request",
    });
  }
}

export class InvalidCaptureSessionInputError extends CaptureDomainError {
  constructor() {
    super({
      code: "invalid_capture_session",
      message: "Capture session input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class CaptureSessionProjectVersionLockedError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_session_project_version_locked",
      message: "Capture Session Project Version is locked",
      status_hint: "conflict",
    });
  }
}

export class CaptureSessionProjectVersionUnchangedError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_session_project_version_unchanged",
      message: "Capture Session already belongs to that Project Version",
      status_hint: "bad_request",
    });
  }
}

export class CaptureSessionConflictError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_session_conflict",
      message: "Capture Session changed; reload and retry",
      status_hint: "conflict",
    });
  }
}

export class CaptureProjectVersionConflictError extends CaptureDomainError {
  constructor() {
    super({
      code: "project_version_conflict",
      message: "Archived Project Versions are read-only",
      status_hint: "conflict",
    });
  }
}

export class CaptureProjectVersionNotFoundError extends CaptureDomainError {
  constructor() {
    super({
      code: "project_version_not_found",
      message: "Project Version was not found",
      status_hint: "not_found",
    });
  }
}

export class CaptureArtifactVersionNotReadyError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_artifact_version_not_ready",
      message:
        "Guide and Interactive Demo creation for this Project Version is not available yet",
      status_hint: "conflict",
    });
  }
}

export class CaptureAssetNotFoundError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_asset_not_found",
      message: "Capture asset was not found",
      status_hint: "not_found",
    });
  }
}

export class CaptureAssetLifecycleConflictError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_asset_lifecycle_conflict",
      message: "Capture Asset lifecycle changed; reload and retry",
      status_hint: "conflict",
    });
  }
}

export class CaptureAssetProtectedError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_asset_protected",
      message: "Capture Asset is protected by existing references",
      status_hint: "conflict",
    });
  }
}

export class InvalidCaptureAssetInputError extends CaptureDomainError {
  constructor() {
    super({
      code: "invalid_capture_asset",
      message: "Capture asset input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidCaptureAssetUploadError extends CaptureDomainError {
  constructor() {
    super({
      code: "invalid_capture_asset_upload",
      message: "Capture asset upload input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class UnsupportedCaptureAssetTypeError extends CaptureDomainError {
  constructor() {
    super({
      code: "unsupported_capture_asset_type",
      message: "Capture asset type is not supported yet",
      status_hint: "bad_request",
    });
  }
}

export class UnsupportedCaptureAssetUploadTypeError extends CaptureDomainError {
  constructor() {
    super({
      code: "unsupported_capture_asset_upload_type",
      message: "Capture asset upload type is not supported",
      status_hint: "bad_request",
    });
  }
}

export class UploadTooLargeError extends CaptureDomainError {
  constructor() {
    super({
      code: "upload_too_large",
      message: "Capture asset upload is too large",
      status_hint: "payload_too_large",
    });
  }
}

export class CaptureEventNotFoundError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_event_not_found",
      message: "Capture event was not found",
      status_hint: "not_found",
    });
  }
}

export class InvalidCaptureEventInputError extends CaptureDomainError {
  constructor() {
    super({
      code: "invalid_capture_event",
      message: "Capture event input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class CaptureEventIndexConflictError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_event_index_conflict",
      message: "A capture event with this index already exists",
      status_hint: "conflict",
    });
  }
}

export class InvalidCaptureEventOrderError extends CaptureDomainError {
  constructor() {
    super({
      code: "invalid_capture_event_order",
      message: "Capture event order is invalid",
      status_hint: "bad_request",
    });
  }
}

export class CaptureEventReorderNotAllowedError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_event_reorder_not_allowed",
      message: "Only manual capture sessions can be reordered",
      status_hint: "conflict",
    });
  }
}

export class CaptureEventUpdateNotAllowedError extends CaptureDomainError {
  constructor() {
    super({
      code: "capture_event_update_not_allowed",
      message: "Only active manual capture sessions can be edited",
      status_hint: "conflict",
    });
  }
}
