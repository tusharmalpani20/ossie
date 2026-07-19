export type DemoDomainErrorStatusHint =
  | "bad_request"
  | "not_found"
  | "conflict";

export class DemoDomainError extends Error {
  readonly code: string;
  readonly status_hint: DemoDomainErrorStatusHint;

  constructor(input: {
    code: string;
    message: string;
    status_hint: DemoDomainErrorStatusHint;
  }) {
    super(input.message);
    this.name = new.target.name;
    this.code = input.code;
    this.status_hint = input.status_hint;
  }
}

export class ProjectNotFoundError extends DemoDomainError {
  constructor() {
    super({
      code: "project_not_found",
      message: "Project was not found",
      status_hint: "not_found",
    });
  }
}

export class InteractiveDemoNotFoundError extends DemoDomainError {
  constructor() {
    super({
      code: "interactive_demo_not_found",
      message: "Interactive demo was not found",
      status_hint: "not_found",
    });
  }
}

export class InteractiveDemoNotEditableError extends DemoDomainError {
  constructor() {
    super({
      code: "interactive_demo_not_editable",
      message: "Archived Interactive Demo Editions are read-only",
      status_hint: "conflict",
    });
  }
}

export class InteractiveDemoEditionConflictError extends DemoDomainError {
  constructor() {
    super({ code: "interactive_demo_edition_conflict", message: "Interactive Demo Edition changed; reload and retry", status_hint: "conflict" });
  }
}

export class InteractiveDemoWorkingDraftConflictError extends DemoDomainError {
  constructor() {
    super({ code: "interactive_demo_working_draft_conflict", message: "Interactive Demo Working Draft changed; reload and retry", status_hint: "conflict" });
  }
}

export class CaptureSessionNotFoundError extends DemoDomainError {
  constructor() {
    super({
      code: "capture_session_not_found",
      message: "Capture session was not found",
      status_hint: "not_found",
    });
  }
}

export class NoUsableCaptureEventsError extends DemoDomainError {
  constructor() {
    super({
      code: "no_usable_capture_events",
      message: "Capture session has no screenshot-backed events",
      status_hint: "bad_request",
    });
  }
}

export class DemoSceneNotFoundError extends DemoDomainError {
  constructor() {
    super({
      code: "demo_scene_not_found",
      message: "Demo scene was not found",
      status_hint: "not_found",
    });
  }
}

export class DemoHotspotNotFoundError extends DemoDomainError {
  constructor() {
    super({
      code: "demo_hotspot_not_found",
      message: "Demo hotspot was not found",
      status_hint: "not_found",
    });
  }
}

export class EmptyInteractiveDemoUpdateError extends DemoDomainError {
  constructor() {
    super({
      code: "empty_interactive_demo_update",
      message: "At least one interactive demo field must be provided",
      status_hint: "bad_request",
    });
  }
}

export class EmptyDemoSceneUpdateError extends DemoDomainError {
  constructor() {
    super({
      code: "empty_demo_scene_update",
      message: "At least one demo scene field must be provided",
      status_hint: "bad_request",
    });
  }
}

export class EmptyDemoSceneOrderError extends DemoDomainError {
  constructor() {
    super({
      code: "empty_demo_scene_order",
      message: "At least one demo scene id must be provided",
      status_hint: "bad_request",
    });
  }
}

export class InvalidDemoSceneOrderError extends DemoDomainError {
  constructor() {
    super({
      code: "invalid_demo_scene_order",
      message: "Demo scene order is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidDemoSceneReferenceError extends DemoDomainError {
  constructor() {
    super({
      code: "invalid_demo_scene_reference",
      message: "Demo scene references are invalid",
      status_hint: "bad_request",
    });
  }
}

export class EmptyDemoHotspotUpdateError extends DemoDomainError {
  constructor() {
    super({
      code: "empty_demo_hotspot_update",
      message: "At least one demo hotspot field must be provided",
      status_hint: "bad_request",
    });
  }
}

export class EmptyDemoHotspotOrderError extends DemoDomainError {
  constructor() {
    super({
      code: "empty_demo_hotspot_order",
      message: "At least one demo hotspot id must be provided",
      status_hint: "bad_request",
    });
  }
}

export class InvalidDemoHotspotOrderError extends DemoDomainError {
  constructor() {
    super({
      code: "invalid_demo_hotspot_order",
      message: "Demo hotspot order is invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidDemoHotspotCoordinatesError extends DemoDomainError {
  constructor() {
    super({
      code: "invalid_demo_hotspot_coordinates",
      message: "Demo hotspot coordinates are invalid",
      status_hint: "bad_request",
    });
  }
}

export class InvalidDemoHotspotTargetError extends DemoDomainError {
  constructor() {
    super({
      code: "invalid_demo_hotspot_target",
      message: "Demo hotspot target is invalid",
      status_hint: "bad_request",
    });
  }
}
