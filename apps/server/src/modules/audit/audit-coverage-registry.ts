import {
  AuditDomainError,
  validate_audit_coverage,
  type AuditActorType,
  type AuditCommandCoverage,
  type AuditCoveredWrite,
  type AuditOperation,
  type AuditSourceType,
} from "@repo/audit-domain";

const normal_sources = ["web", "api", "extension"] as const;
const org_actor = ["org_user"] as const;

const write = (
  table: AuditCoveredWrite["table"],
  sql_operation: AuditCoveredWrite["sql_operation"],
  entity_type: string,
  evidence_operations: readonly AuditOperation[] = sql_operation === "INSERT"
    ? ["create"]
    : ["update"],
): AuditCoveredWrite => ({
  table,
  sql_operation,
  entity_type,
  evidence_operations,
});

const command = (
  name: string,
  action: string,
  routes: readonly string[],
  writes: readonly AuditCoveredWrite[],
  options: {
    source_types?: readonly AuditSourceType[];
    actor_types?: readonly AuditActorType[];
  } = {},
): AuditCommandCoverage => ({
  command: name,
  action,
  routes,
  writes,
  source_types: options.source_types ?? normal_sources,
  actor_types: options.actor_types ?? org_actor,
});

const U = {
  user: () => write("user_schema.user", "INSERT", "user"),
  organization: () =>
    write("organization_schema.organization", "INSERT", "organization"),
  org_user: () => write("organization_schema.org_user", "INSERT", "org_user"),
  invite_insert: () =>
    write("organization_schema.org_invite", "INSERT", "org_invite"),
  invite_update: (operation: AuditOperation = "update") =>
    write("organization_schema.org_invite", "UPDATE", "org_invite", [
      operation,
    ]),
  session_insert: () =>
    write("auth_schema.auth_session", "INSERT", "auth_session"),
  session_update: (operation: AuditOperation = "update") =>
    write("auth_schema.auth_session", "UPDATE", "auth_session", [operation]),
  project_insert: () => write("project_schema.project", "INSERT", "project"),
  project_version_insert: () =>
    write("project_schema.project_version", "INSERT", "project_version"),
  project_version_update: () =>
    write("project_schema.project_version", "UPDATE", "project_version"),
  project_version_alias_insert: () =>
    write(
      "project_schema.project_version_alias",
      "INSERT",
      "project_version_alias",
    ),
  project_membership_insert: () =>
    write("project_schema.project_membership", "INSERT", "project_membership"),
  project_membership_update: () =>
    write("project_schema.project_membership", "UPDATE", "project_membership"),
  project_update: (operation: AuditOperation = "update") =>
    write("project_schema.project", "UPDATE", "project", [operation]),
  capture_session_insert: () =>
    write("capture_schema.capture_session", "INSERT", "capture_session"),
  capture_session_update: (operation: AuditOperation = "update") =>
    write("capture_schema.capture_session", "UPDATE", "capture_session", [
      operation,
    ]),
  file_insert: () => write("file_schema.file", "INSERT", "file"),
  file_update: (operation: AuditOperation = "update") =>
    write("file_schema.file", "UPDATE", "file", [operation]),
  documentation_asset_insert: () =>
    write(
      "documentation_schema.documentation_asset",
      "INSERT",
      "documentation_asset",
    ),
  documentation_asset_update: () =>
    write(
      "documentation_schema.documentation_asset",
      "UPDATE",
      "documentation_asset",
    ),
  documentation_snippet_insert: () =>
    write(
      "documentation_schema.documentation_snippet",
      "INSERT",
      "documentation_snippet",
    ),
  documentation_snippet_update: () =>
    write(
      "documentation_schema.documentation_snippet",
      "UPDATE",
      "documentation_snippet",
    ),
  documentation_site_insert: () =>
    write(
      "documentation_schema.documentation_site",
      "INSERT",
      "documentation_site",
    ),
  documentation_edition_update: () =>
    write("documentation_schema.site_edition", "UPDATE", "site_edition"),
  documentation_carry_forward_insert: () =>
    write(
      "documentation_schema.documentation_carry_forward",
      "INSERT",
      "documentation_carry_forward",
    ),
  documentation_carry_forward_item_insert: () =>
    write(
      "documentation_schema.documentation_carry_forward_item",
      "INSERT",
      "documentation_carry_forward_item",
    ),
  documentation_page_insert: () =>
    write(
      "documentation_schema.documentation_page",
      "INSERT",
      "documentation_page",
    ),
  documentation_page_delete: () =>
    write(
      "documentation_schema.documentation_page",
      "DELETE",
      "documentation_page",
      ["delete"],
    ),
  documentation_page_update: () =>
    write(
      "documentation_schema.documentation_page",
      "UPDATE",
      "documentation_page",
    ),
  documentation_navigation_update: () =>
    write("documentation_schema.navigation_tree", "UPDATE", "navigation_tree"),
  documentation_routing_update: () =>
    write("documentation_schema.routing_set", "UPDATE", "routing_set"),
  documentation_comment_insert: () =>
    write("documentation_schema.comment_thread", "INSERT", "comment_thread"),
  documentation_comment_update: () =>
    write("documentation_schema.comment_thread", "UPDATE", "comment_thread"),
  documentation_reply_insert: () =>
    write("documentation_schema.comment_reply", "INSERT", "comment_reply"),
  documentation_openapi_insert: () =>
    write("documentation_schema.openapi_source", "INSERT", "openapi_source"),
  documentation_openapi_update: () =>
    write("documentation_schema.openapi_source", "UPDATE", "openapi_source"),
  documentation_openapi_try_it_policy_insert: () =>
    write(
      "documentation_schema.openapi_try_it_policy",
      "INSERT",
      "openapi_try_it_policy",
    ),
  documentation_openapi_try_it_policy_update: () =>
    write(
      "documentation_schema.openapi_try_it_policy",
      "UPDATE",
      "openapi_try_it_policy",
    ),
  documentation_link_try_it_policy_insert: () =>
    write(
      "publish_schema.documentation_try_it_policy",
      "INSERT",
      "documentation_try_it_policy",
    ),
  documentation_link_try_it_policy_update: () =>
    write(
      "publish_schema.documentation_try_it_policy",
      "UPDATE",
      "documentation_try_it_policy",
    ),
  documentation_revision_insert: () =>
    write("documentation_schema.site_revision", "INSERT", "site_revision"),
  documentation_review_policy_insert: () =>
    write(
      "documentation_schema.documentation_review_policy",
      "INSERT",
      "documentation_review_policy",
    ),
  documentation_review_policy_update: () =>
    write(
      "documentation_schema.documentation_review_policy",
      "UPDATE",
      "documentation_review_policy",
    ),
  documentation_review_maintainer_insert: () =>
    write(
      "documentation_schema.documentation_review_maintainer",
      "INSERT",
      "documentation_review_maintainer",
    ),
  documentation_review_maintainer_delete: () =>
    write(
      "documentation_schema.documentation_review_maintainer",
      "DELETE",
      "documentation_review_maintainer",
      ["delete"],
    ),
  documentation_review_request_insert: () =>
    write(
      "documentation_schema.documentation_review_request",
      "INSERT",
      "documentation_review_request",
    ),
  documentation_review_request_update: () =>
    write(
      "documentation_schema.documentation_review_request",
      "UPDATE",
      "documentation_review_request",
    ),
  documentation_review_assignment_insert: () =>
    write(
      "documentation_schema.documentation_review_assignment",
      "INSERT",
      "documentation_review_assignment",
    ),
  documentation_review_decision_insert: () =>
    write(
      "documentation_schema.documentation_review_decision",
      "INSERT",
      "documentation_review_decision",
    ),
  documentation_review_notification_insert: () =>
    write(
      "documentation_schema.documentation_review_notification",
      "INSERT",
      "documentation_review_notification",
    ),
  documentation_review_notification_update: () =>
    write(
      "documentation_schema.documentation_review_notification",
      "UPDATE",
      "documentation_review_notification",
    ),
  documentation_publication_review_evidence_insert: () =>
    write(
      "publish_schema.documentation_publication_review_evidence",
      "INSERT",
      "documentation_publication_review_evidence",
    ),
  documentation_import_inspection_insert: () =>
    write(
      "documentation_schema.documentation_import_inspection",
      "INSERT",
      "documentation_import_inspection",
    ),
  documentation_import_inspection_update: () =>
    write(
      "documentation_schema.documentation_import_inspection",
      "UPDATE",
      "documentation_import_inspection",
    ),
  documentation_import_application_insert: () =>
    write(
      "documentation_schema.documentation_import_application",
      "INSERT",
      "documentation_import_application",
    ),
  asset_insert: () =>
    write("capture_schema.capture_asset", "INSERT", "capture_asset"),
  asset_update: (operation: AuditOperation = "update") =>
    write("capture_schema.capture_asset", "UPDATE", "capture_asset", [
      operation,
    ]),
  event_insert: () =>
    write("capture_schema.capture_event", "INSERT", "capture_event"),
  event_update: (operation: AuditOperation = "update") =>
    write("capture_schema.capture_event", "UPDATE", "capture_event", [
      operation,
    ]),
  guide_insert: () => write("guide_schema.guide", "INSERT", "guide"),
  guide_edition_insert: () =>
    write("guide_schema.guide_edition", "INSERT", "guide_edition"),
  guide_update: () =>
    write("guide_schema.guide_edition", "UPDATE", "guide_edition"),
  guide_draft_insert: () =>
    write("guide_schema.guide_working_draft", "INSERT", "guide_working_draft"),
  guide_draft_update: () =>
    write("guide_schema.guide_working_draft", "UPDATE", "guide_working_draft"),
  block_insert: () =>
    write("guide_schema.guide_block", "INSERT", "guide_block"),
  block_update: (operation: AuditOperation = "update") =>
    write("guide_schema.guide_block", "UPDATE", "guide_block", [operation]),
  step_insert: () => write("guide_schema.guide_step", "INSERT", "guide_step"),
  step_update: (operation: AuditOperation = "update") =>
    write("guide_schema.guide_step", "UPDATE", "guide_step", [operation]),
  annotation_insert: () =>
    write("guide_schema.guide_annotation", "INSERT", "guide_annotation"),
  annotation_update: (operation: AuditOperation = "update") =>
    write("guide_schema.guide_annotation", "UPDATE", "guide_annotation", [
      operation,
    ]),
  guide_revision_insert: () =>
    write("guide_schema.guide_revision", "INSERT", "guide_revision"),
  guide_revision_block_insert: () =>
    write(
      "guide_schema.guide_revision_block",
      "INSERT",
      "guide_revision_block",
    ),
  guide_revision_step_insert: () =>
    write("guide_schema.guide_revision_step", "INSERT", "guide_revision_step"),
  guide_revision_annotation_insert: () =>
    write(
      "guide_schema.guide_revision_annotation",
      "INSERT",
      "guide_revision_annotation",
    ),
  guide_carry_item_insert: () =>
    write(
      "guide_schema.guide_carry_forward_item",
      "INSERT",
      "guide_carry_forward_item",
    ),
  demo_insert: () =>
    write(
      "interactive_demo_schema.interactive_demo",
      "INSERT",
      "interactive_demo",
    ),
  demo_edition_insert: () =>
    write(
      "interactive_demo_schema.interactive_demo_edition",
      "INSERT",
      "interactive_demo_edition",
    ),
  demo_update: (operation: AuditOperation = "update") =>
    write(
      "interactive_demo_schema.interactive_demo_edition",
      "UPDATE",
      "interactive_demo_edition",
      [operation],
    ),
  demo_draft_insert: () =>
    write(
      "interactive_demo_schema.interactive_demo_working_draft",
      "INSERT",
      "interactive_demo_working_draft",
    ),
  demo_draft_update: () =>
    write(
      "interactive_demo_schema.interactive_demo_working_draft",
      "UPDATE",
      "interactive_demo_working_draft",
    ),
  scene_insert: () =>
    write("interactive_demo_schema.demo_scene", "INSERT", "demo_scene"),
  scene_update: (operation: AuditOperation = "update") =>
    write("interactive_demo_schema.demo_scene", "UPDATE", "demo_scene", [
      operation,
    ]),
  hotspot_insert: () =>
    write("interactive_demo_schema.demo_hotspot", "INSERT", "demo_hotspot"),
  hotspot_update: (operation: AuditOperation = "update") =>
    write("interactive_demo_schema.demo_hotspot", "UPDATE", "demo_hotspot", [
      operation,
    ]),
  transition_insert: () =>
    write(
      "interactive_demo_schema.demo_transition",
      "INSERT",
      "demo_transition",
    ),
  transition_update: (operation: AuditOperation = "update") =>
    write(
      "interactive_demo_schema.demo_transition",
      "UPDATE",
      "demo_transition",
      [operation],
    ),
  demo_revision_insert: () =>
    write(
      "interactive_demo_schema.interactive_demo_revision",
      "INSERT",
      "interactive_demo_revision",
    ),
  demo_revision_scene_insert: () =>
    write(
      "interactive_demo_schema.demo_revision_scene",
      "INSERT",
      "demo_revision_scene",
    ),
  demo_revision_hotspot_insert: () =>
    write(
      "interactive_demo_schema.demo_revision_hotspot",
      "INSERT",
      "demo_revision_hotspot",
    ),
  demo_revision_transition_insert: () =>
    write(
      "interactive_demo_schema.demo_revision_transition",
      "INSERT",
      "demo_revision_transition",
    ),
  demo_carry_item_insert: () =>
    write(
      "interactive_demo_schema.interactive_demo_carry_forward_item",
      "INSERT",
      "interactive_demo_carry_forward_item",
    ),
  carry_insert: () =>
    write(
      "project_schema.artifact_carry_forward",
      "INSERT",
      "artifact_carry_forward",
    ),
  carry_item_insert: () =>
    write(
      "project_schema.artifact_carry_forward_item",
      "INSERT",
      "artifact_carry_forward_item",
    ),
  purge_operation_insert: () =>
    write(
      "capture_schema.capture_asset_purge_operation",
      "INSERT",
      "capture_asset_purge_operation",
    ),
  purge_operation_update: () =>
    write(
      "capture_schema.capture_asset_purge_operation",
      "UPDATE",
      "capture_asset_purge_operation",
    ),
  publication_insert: () =>
    write("publish_schema.published_artifact", "INSERT", "published_artifact"),
  link_insert: () =>
    write("publish_schema.publish_link", "INSERT", "publish_link"),
  link_update: (operation: AuditOperation = "update") =>
    write("publish_schema.publish_link", "UPDATE", "publish_link", [operation]),
  link_entry_insert: () =>
    write("publish_schema.publish_link_entry", "INSERT", "publish_link_entry"),
  link_entry_update: () =>
    write("publish_schema.publish_link_entry", "UPDATE", "publish_link_entry"),
  link_entry_delete: () =>
    write("publish_schema.publish_link_entry", "DELETE", "publish_link_entry", [
      "delete",
    ]),
  viewer_insert: () =>
    write(
      "publish_schema.public_publish_viewer_session",
      "INSERT",
      "public_publish_viewer_session",
    ),
  viewer_update: (operation: AuditOperation = "update") =>
    write(
      "publish_schema.public_publish_viewer_session",
      "UPDATE",
      "public_publish_viewer_session",
      [operation],
    ),
};

export const AUDIT_COVERAGE_REGISTRY = validate_audit_coverage([
  command(
    "setup.complete_first_run",
    "setup.owner_bootstrapped",
    ["POST /api/v1/setup/first-run"],
    [U.user(), U.organization(), U.org_user(), U.session_insert()],
    { source_types: ["web"] },
  ),
  command(
    "authentication.session.create",
    "authentication.session.created",
    ["POST /api/v1/authentication/login"],
    [U.session_insert()],
  ),
  command(
    "authentication.session.touch",
    "authentication.session.activity_recorded",
    [],
    [U.session_update()],
  ),
  command(
    "authentication.session.revoke",
    "authentication.session.revoked",
    ["POST /api/v1/authentication/logout"],
    [U.session_update()],
  ),
  command(
    "organization.invite.create",
    "organization.invite.created",
    ["POST /api/v1/organization/invites"],
    [U.invite_insert()],
  ),
  command(
    "organization.invite.revoke",
    "organization.invite.revoked",
    ["DELETE /api/v1/organization/invites/:invite_id"],
    [U.invite_update()],
  ),
  command(
    "organization.invite.accept",
    "organization.invite.accepted",
    ["POST /api/v1/public/invites/:token/accept"],
    [U.user(), U.org_user(), U.session_insert(), U.invite_update()],
    { source_types: ["web"] },
  ),
  command(
    "project.create",
    "project.created",
    ["POST /api/v1/projects"],
    [
      U.project_insert(),
      U.project_version_insert(),
      U.project_membership_insert(),
    ],
  ),
  command(
    "project_version.create",
    "project_version.created",
    ["POST /api/v1/projects/:project_id/versions"],
    [U.project_version_insert()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project_version.update",
    "project_version.updated",
    ["PATCH /api/v1/projects/:project_id/versions/:project_version_id"],
    [U.project_version_update(), U.project_version_alias_insert()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project_version.reorder",
    "project_version.reordered",
    ["PUT /api/v1/projects/:project_id/versions/order"],
    [U.project_version_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project_version.archive",
    "project_version.archived",
    ["POST /api/v1/projects/:project_id/versions/:project_version_id/archive"],
    [U.project_version_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project_version.restore",
    "project_version.restored",
    ["POST /api/v1/projects/:project_id/versions/:project_version_id/restore"],
    [U.project_version_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project_version.set_default",
    "project_version.default_set",
    [
      "POST /api/v1/projects/:project_id/versions/:project_version_id/set-default",
    ],
    [U.project_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project.membership.assign",
    "project.membership.assigned",
    ["POST /api/v1/projects/:project_id/memberships"],
    [U.project_membership_insert(), U.project_membership_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project.membership.role_change",
    "project.membership.role_changed",
    ["PATCH /api/v1/projects/:project_id/memberships/:membership_id"],
    [U.project_membership_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project.membership.remove",
    "project.membership.removed",
    ["DELETE /api/v1/projects/:project_id/memberships/:membership_id"],
    [U.project_membership_update()],
    { source_types: ["web", "api"] },
  ),
  command(
    "project.update",
    "project.updated",
    ["PATCH /api/v1/projects/:id"],
    [U.project_update()],
  ),
  command(
    "project.delete",
    "project.deleted",
    ["DELETE /api/v1/projects/:id"],
    [U.project_update("delete")],
  ),
  command(
    "capture_session.create",
    "capture_session.created",
    ["POST /api/v1/projects/:project_id/capture-sessions"],
    [U.capture_session_insert()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_session.update",
    "capture_session.updated",
    ["PATCH /api/v1/projects/:project_id/capture-sessions/:id"],
    [U.capture_session_update()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_session.complete",
    "capture_session.completed",
    ["POST /api/v1/projects/:project_id/capture-sessions/:id/complete"],
    [U.capture_session_update()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_session.delete",
    "capture_session.deleted",
    ["DELETE /api/v1/projects/:project_id/capture-sessions/:id"],
    [U.capture_session_update("delete")],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_session.reassign_project_version",
    "capture_session.project_version_reassigned",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:id/reassign-project-version",
    ],
    [U.capture_session_update()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_asset.create",
    "capture_asset.created",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets",
    ],
    [U.file_insert(), U.asset_insert()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_asset.upload",
    "capture_asset.uploaded",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/upload",
    ],
    [U.file_insert(), U.asset_insert()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_asset.archive",
    "capture_asset.archived",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/archive",
    ],
    [U.asset_update()],
  ),
  command(
    "capture_asset.restore",
    "capture_asset.restored",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/restore",
    ],
    [U.asset_update()],
  ),
  command(
    "capture_asset.purge.request",
    "capture_asset.purge_requested",
    [
      "DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id",
    ],
    [U.purge_operation_insert()],
  ),
  command(
    "capture_asset.purge.fail",
    "capture_asset.purge_failed",
    [],
    [U.purge_operation_update()],
  ),
  command(
    "capture_asset.purge.complete",
    "capture_asset.purged",
    [],
    [
      U.purge_operation_update(),
      U.asset_update("delete"),
      U.file_update("delete"),
    ],
  ),
  command(
    "capture_event.create",
    "capture_event.created",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events",
    ],
    [U.event_insert()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_event.update",
    "capture_event.updated",
    [
      "PATCH /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id",
    ],
    [U.event_update()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_event.reorder",
    "capture_event.reordered",
    [
      "PUT /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/order",
    ],
    [U.event_update()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "capture_event.delete",
    "capture_event.deleted",
    [
      "DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id",
    ],
    [U.event_update("delete")],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "guide.create_from_capture",
    "guide.created",
    [
      "POST /api/v1/projects/:project_id/guides/from-capture-session/:capture_session_id",
    ],
    [
      U.guide_insert(),
      U.guide_edition_insert(),
      U.guide_draft_insert(),
      U.block_insert(),
      U.step_insert(),
    ],
  ),
  command(
    "guide.update",
    "guide.edition.updated",
    ["PATCH /api/v1/projects/:project_id/guides/:guide_id"],
    [U.guide_update()],
  ),
  command(
    "guide.archive",
    "guide.edition.archived",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/archive"],
    [U.guide_update()],
  ),
  command(
    "guide.restore",
    "guide.edition.restored",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/restore"],
    [U.guide_update()],
  ),
  command(
    "guide.revision.checkpoint",
    "guide.revision.created",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/revisions/checkpoint"],
    [
      U.guide_revision_insert(),
      U.guide_revision_block_insert(),
      U.guide_revision_step_insert(),
      U.guide_revision_annotation_insert(),
    ],
  ),
  command(
    "guide.revision.restore",
    "guide.revision.restored",
    [
      "POST /api/v1/projects/:project_id/guides/:guide_id/revisions/:revision_number/restore",
    ],
    [
      U.guide_update(),
      U.guide_draft_update(),
      U.block_update("delete"),
      U.step_update("delete"),
      U.annotation_update("delete"),
      U.block_insert(),
      U.step_insert(),
      U.annotation_insert(),
    ],
  ),
  command(
    "guide.step.update",
    "guide.step.updated",
    [
      "PATCH /api/v1/projects/:project_id/guides/:guide_id/steps/:guide_step_id",
    ],
    [U.step_update(), U.guide_draft_update()],
  ),
  command(
    "guide.blocks.reorder",
    "guide.blocks.reordered",
    ["PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/reorder"],
    [U.block_update(), U.guide_draft_update()],
  ),
  command(
    "guide.block.create",
    "guide.block.created",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/blocks"],
    [
      U.block_update(),
      U.block_insert(),
      U.step_insert(),
      U.guide_draft_update(),
    ],
  ),
  command(
    "guide.block.update",
    "guide.block.updated",
    [
      "PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id",
    ],
    [U.block_update(), U.guide_draft_update()],
  ),
  command(
    "guide.block.screenshot.update",
    "guide.block.screenshot_updated",
    [
      "PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot",
    ],
    [U.step_update(), U.annotation_update(), U.guide_draft_update()],
  ),
  command(
    "guide.block.annotations.update",
    "guide.block.annotations_updated",
    [
      "PATCH /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/annotations",
    ],
    [U.annotation_update(), U.annotation_insert(), U.guide_draft_update()],
  ),
  command(
    "guide.block.screenshot_upload",
    "guide.block.screenshot_uploaded",
    [
      "POST /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id/screenshot-upload",
    ],
    [
      U.file_insert(),
      U.asset_insert(),
      U.step_update(),
      U.guide_draft_update(),
    ],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "guide.block.delete",
    "guide.block.deleted",
    [
      "DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id",
    ],
    [
      U.block_update("delete"),
      U.step_update("delete"),
      U.annotation_update("delete"),
      U.guide_draft_update(),
    ],
  ),
  command(
    "interactive_demo.create_from_capture",
    "interactive_demo.created",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos",
    ],
    [
      U.demo_insert(),
      U.demo_edition_insert(),
      U.demo_draft_insert(),
      U.scene_insert(),
    ],
  ),
  command(
    "interactive_demo.create",
    "interactive_demo.created",
    ["POST /api/v1/projects/:project_id/interactive-demos"],
    [U.demo_insert(), U.demo_edition_insert(), U.demo_draft_insert()],
  ),
  command(
    "interactive_demo.update",
    "interactive_demo.edition.updated",
    [
      "PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id",
    ],
    [U.demo_update()],
  ),
  command(
    "interactive_demo.archive",
    "interactive_demo.edition.archived",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/archive",
    ],
    [U.demo_update()],
  ),
  command(
    "interactive_demo.restore",
    "interactive_demo.edition.restored",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/restore",
    ],
    [U.demo_update()],
  ),
  command(
    "interactive_demo.revision.checkpoint",
    "interactive_demo.revision.created",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/revisions/checkpoint",
    ],
    [
      U.demo_revision_insert(),
      U.demo_revision_scene_insert(),
      U.demo_revision_hotspot_insert(),
      U.demo_revision_transition_insert(),
    ],
  ),
  command(
    "interactive_demo.revision.restore",
    "interactive_demo.revision.restored",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/revisions/:revision_number/restore",
    ],
    [
      U.demo_update(),
      U.demo_draft_update(),
      U.scene_update("delete"),
      U.hotspot_update("delete"),
      U.transition_update("delete"),
      U.scene_insert(),
      U.hotspot_insert(),
      U.transition_insert(),
    ],
  ),
  command(
    "interactive_demo.scene.create",
    "interactive_demo.scene.created",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes",
    ],
    [U.scene_insert(), U.demo_draft_update()],
  ),
  command(
    "interactive_demo.scene.update",
    "interactive_demo.scene.updated",
    [
      "PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id",
    ],
    [U.scene_update(), U.demo_draft_update()],
  ),
  command(
    "interactive_demo.scenes.reorder",
    "interactive_demo.scenes.reordered",
    [
      "PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/order",
    ],
    [U.scene_update(), U.demo_draft_update()],
  ),
  command(
    "interactive_demo.scene.delete",
    "interactive_demo.scene.deleted",
    [
      "DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id",
    ],
    [
      U.scene_update("delete"),
      U.hotspot_update("delete"),
      U.transition_update("delete"),
      U.demo_draft_update(),
    ],
  ),
  command(
    "interactive_demo.hotspot.create",
    "interactive_demo.hotspot.created",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots",
    ],
    [U.hotspot_insert(), U.transition_insert(), U.demo_draft_update()],
  ),
  command(
    "interactive_demo.hotspot.update",
    "interactive_demo.hotspot.updated",
    [
      "PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id",
    ],
    [
      U.hotspot_update(),
      U.transition_insert(),
      U.transition_update(),
      U.demo_draft_update(),
    ],
  ),
  command(
    "interactive_demo.hotspots.reorder",
    "interactive_demo.hotspots.reordered",
    [
      "PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order",
    ],
    [U.hotspot_update(), U.demo_draft_update()],
  ),
  command(
    "interactive_demo.hotspot.delete",
    "interactive_demo.hotspot.deleted",
    [
      "DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id",
    ],
    [
      U.hotspot_update("delete"),
      U.transition_update("delete"),
      U.demo_draft_update(),
    ],
  ),
  command(
    "artifact.carry_forward",
    "artifact.editions.carried_forward",
    ["POST /api/v1/projects/:project_id/artifact-editions/carry-forward"],
    [
      U.carry_insert(),
      U.carry_item_insert(),
      U.guide_carry_item_insert(),
      U.demo_carry_item_insert(),
      U.guide_revision_insert(),
      U.guide_revision_block_insert(),
      U.guide_revision_step_insert(),
      U.guide_revision_annotation_insert(),
      U.demo_revision_insert(),
      U.demo_revision_scene_insert(),
      U.demo_revision_hotspot_insert(),
      U.demo_revision_transition_insert(),
      U.guide_edition_insert(),
      U.guide_draft_insert(),
      U.block_insert(),
      U.step_insert(),
      U.annotation_insert(),
      U.demo_edition_insert(),
      U.demo_draft_insert(),
      U.scene_insert(),
      U.hotspot_insert(),
      U.transition_insert(),
    ],
  ),
  command(
    "publish.guide",
    "guide.published",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/publications"],
    [
      U.guide_revision_insert(),
      U.guide_revision_block_insert(),
      U.guide_revision_step_insert(),
      U.guide_revision_annotation_insert(),
      U.publication_insert(),
      U.link_insert(),
      U.link_update(),
      U.link_entry_insert(),
      U.link_entry_update(),
    ],
  ),
  command(
    "documentation.openapi.inspect",
    "documentation.openapi.inspected",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/inspections",
    ],
    [U.file_insert()],
  ),
  command(
    "documentation.asset.upload",
    "documentation.asset.uploaded",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets",
    ],
    [U.file_insert(), U.documentation_asset_insert()],
  ),
  command(
    "documentation.asset.update",
    "documentation.asset_updated",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id",
    ],
    [U.documentation_asset_update()],
  ),
  command(
    "documentation.asset.archive",
    "documentation.asset_archived",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id/lifecycle",
    ],
    [U.documentation_asset_update()],
  ),
  command(
    "documentation.asset.restore",
    "documentation.asset_restored",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id/lifecycle",
    ],
    [U.documentation_asset_update()],
  ),
  command(
    "documentation.import.inspect",
    "documentation.import.inspected",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections",
    ],
    [U.file_insert(), U.documentation_import_inspection_insert()],
  ),
  command(
    "documentation.page_markdown_import.apply",
    "documentation.page_markdown_import_applied",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id/apply",
    ],
    [
      U.documentation_page_insert(),
      U.documentation_navigation_update(),
      U.documentation_routing_update(),
      U.documentation_import_inspection_update(),
      U.documentation_import_application_insert(),
      U.file_update("delete"),
    ],
  ),
  command(
    "documentation.site_package_import.apply",
    "documentation.site_package_import_applied",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id/apply",
    ],
    [
      U.file_insert(),
      U.documentation_site_insert(),
      U.documentation_page_insert(),
      U.documentation_page_delete(),
      U.documentation_snippet_insert(),
      U.documentation_asset_insert(),
      U.documentation_openapi_insert(),
      U.documentation_navigation_update(),
      U.documentation_routing_update(),
      U.documentation_import_inspection_update(),
      U.documentation_import_application_insert(),
      U.documentation_review_policy_insert(),
      U.file_update("delete"),
    ],
  ),
  command(
    "documentation.import.cancel",
    "documentation.import.cancelled",
    [
      "DELETE /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id",
    ],
    [U.documentation_import_inspection_update(), U.file_update("delete")],
  ),
  command(
    "documentation.import.expire",
    "documentation.import.expired",
    [],
    [U.documentation_import_inspection_update(), U.file_update("delete")],
    { source_types: ["system"], actor_types: ["system"] },
  ),
  command(
    "documentation.snippet.create",
    "documentation.snippet_created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets",
    ],
    [U.documentation_snippet_insert()],
  ),
  command(
    "documentation.snippet.update",
    "documentation.snippet_updated",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id",
    ],
    [U.documentation_snippet_update()],
  ),
  command(
    "documentation.snippet.content_replace",
    "documentation.snippet_content_replaced",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id/content",
    ],
    [U.documentation_snippet_update()],
  ),
  command(
    "documentation.snippet.archive",
    "documentation.snippet_archived",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id/lifecycle",
    ],
    [U.documentation_snippet_update()],
  ),
  command(
    "documentation.snippet.restore",
    "documentation.snippet_restored",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id/lifecycle",
    ],
    [U.documentation_snippet_update()],
  ),
  command(
    "documentation.site.create",
    "documentation.site_created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
    ],
    [
      U.documentation_site_insert(),
      U.documentation_page_insert(),
      U.documentation_review_policy_insert(),
    ],
  ),
  command(
    "documentation.carry_forward",
    "documentation.editions_carried_forward",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/carry-forward",
    ],
    [
      U.documentation_carry_forward_insert(),
      U.documentation_carry_forward_item_insert(),
      U.documentation_revision_insert(),
      U.documentation_page_insert(),
      U.documentation_snippet_insert(),
      U.documentation_asset_insert(),
      U.documentation_openapi_insert(),
      U.documentation_review_policy_insert(),
    ],
  ),
  command(
    "documentation.edition.update",
    "documentation.edition_updated",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/edition",
    ],
    [U.documentation_edition_update()],
  ),
  command(
    "documentation.edition.archive",
    "documentation.edition.archived",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/edition/lifecycle",
    ],
    [U.documentation_edition_update()],
  ),
  command(
    "documentation.edition.restore",
    "documentation.edition.restored",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/edition/lifecycle",
    ],
    [U.documentation_edition_update()],
  ),
  command(
    "documentation.page.create",
    "documentation.page_created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages",
    ],
    [U.documentation_page_insert()],
  ),
  command(
    "documentation.page.update",
    "documentation.page_updated",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
    ],
    [U.documentation_page_update()],
  ),
  command(
    "documentation.page.path_change",
    "documentation.page_path_changed",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
    ],
    [U.documentation_page_update()],
  ),
  command(
    "documentation.page.content_replace",
    "documentation.page_content_replaced",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/content",
    ],
    [U.documentation_page_update()],
  ),
  command(
    "documentation.page.archive",
    "documentation.page.archived",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/lifecycle",
    ],
    [
      U.documentation_page_update(),
      U.documentation_navigation_update(),
      U.documentation_routing_update(),
    ],
  ),
  command(
    "documentation.page.restore",
    "documentation.page.restored",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/lifecycle",
    ],
    [U.documentation_page_update()],
  ),
  command(
    "documentation.navigation.replace",
    "documentation.navigation_replaced",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/navigation",
    ],
    [U.documentation_navigation_update()],
  ),
  command(
    "documentation.routing.replace",
    "documentation.routing_replaced",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/routing",
    ],
    [U.documentation_routing_update()],
  ),
  command(
    "documentation.comment.thread_create",
    "documentation.comment_thread_created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments",
    ],
    [U.documentation_comment_insert()],
  ),
  command(
    "documentation.comment.reply_create",
    "documentation.comment_reply_created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id/replies",
    ],
    [U.documentation_reply_insert()],
  ),
  command(
    "documentation.comment.resolve",
    "documentation.comment_resolved",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id",
    ],
    [U.documentation_comment_update()],
  ),
  command(
    "documentation.comment.reopen",
    "documentation.comment_reopened",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id",
    ],
    [U.documentation_comment_update()],
  ),
  command(
    "documentation.openapi.apply",
    "documentation.openapi_inspection_applied",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/sources",
    ],
    [U.documentation_openapi_insert(), U.documentation_openapi_update()],
  ),
  command(
    "documentation.openapi_try_it_policy.create",
    "documentation.openapi_try_it_policy.created",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/try-it-policy",
    ],
    [U.documentation_openapi_try_it_policy_insert()],
  ),
  command(
    "documentation.openapi_try_it_policy.update",
    "documentation.openapi_try_it_policy.updated",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/try-it-policy",
    ],
    [U.documentation_openapi_try_it_policy_update()],
  ),
  command(
    "documentation.openapi_try_it_policy.disable",
    "documentation.openapi_try_it_policy.disabled",
    [
      "PUT /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/try-it-policy",
    ],
    [U.documentation_openapi_try_it_policy_update()],
  ),
  command(
    "documentation.publish_link_try_it_policy.enable",
    "documentation.publish_link_try_it_policy.enabled",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/try-it-policy",
    ],
    [
      U.documentation_link_try_it_policy_insert(),
      U.documentation_link_try_it_policy_update(),
    ],
  ),
  command(
    "documentation.publish_link_try_it_policy.disable",
    "documentation.publish_link_try_it_policy.disabled",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/try-it-policy",
    ],
    [
      U.documentation_link_try_it_policy_insert(),
      U.documentation_link_try_it_policy_update(),
    ],
  ),
  command(
    "documentation.openapi.archive",
    "documentation.openapi.archived",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/lifecycle",
    ],
    [U.documentation_openapi_update()],
  ),
  command(
    "documentation.openapi.restore",
    "documentation.openapi.restored",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/lifecycle",
    ],
    [U.documentation_openapi_update()],
  ),
  command(
    "documentation.revision.create",
    "documentation.revision_created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions",
    ],
    [
      U.documentation_revision_insert(),
      U.documentation_review_request_update(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "documentation.review_policy.update",
    "documentation.review_policy_updated",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/review-policy",
    ],
    [
      U.documentation_review_policy_update(),
      U.documentation_review_maintainer_delete(),
      U.documentation_review_maintainer_insert(),
    ],
  ),
  command(
    "documentation.review_request.create",
    "documentation.review_requested",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews",
    ],
    [
      U.documentation_review_request_insert(),
      U.documentation_review_assignment_insert(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "documentation.review_request.cancel",
    "documentation.review_canceled",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/cancel",
    ],
    [
      U.documentation_review_request_update(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "documentation.review_decision.approve",
    "documentation.review_approved",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/decisions",
    ],
    [
      U.documentation_review_decision_insert(),
      U.documentation_review_request_update(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "documentation.review_decision.reject",
    "documentation.review_rejected",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/reviews/:review_request_id/decisions",
    ],
    [
      U.documentation_review_decision_insert(),
      U.documentation_review_request_update(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "documentation.review_notification.read",
    "documentation.review_notification_read",
    [
      "PATCH /api/v1/projects/:project_id/versions/:version_slug/documentation-review-inbox/:notification_id/read",
    ],
    [U.documentation_review_notification_update()],
  ),
  command(
    "publish.interactive_demo",
    "interactive_demo.published",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publications",
    ],
    [
      U.demo_revision_insert(),
      U.demo_revision_scene_insert(),
      U.demo_revision_hotspot_insert(),
      U.demo_revision_transition_insert(),
      U.publication_insert(),
      U.link_insert(),
      U.link_update(),
      U.link_entry_insert(),
      U.link_entry_update(),
    ],
  ),
  command(
    "publish.guide_link.create",
    "guide.publish_link.created",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/publish-links"],
    [U.link_insert(), U.link_entry_insert()],
  ),
  command(
    "publish.interactive_demo_link.create",
    "interactive_demo.publish_link.created",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-links",
    ],
    [U.link_insert(), U.link_entry_insert()],
  ),
  command(
    "publish.guide_link.settings_update",
    "guide.publish_link.settings_updated",
    [
      "PATCH /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id",
    ],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.interactive_demo_link.settings_update",
    "interactive_demo.publish_link.settings_updated",
    [
      "PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-links/:link_id",
    ],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.guide_link.manifest_update",
    "guide.publish_link.manifest_updated",
    [
      "PUT /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/entries",
    ],
    [U.link_update(), U.link_entry_insert(), U.link_entry_delete()],
  ),
  command(
    "publish.interactive_demo_link.manifest_update",
    "interactive_demo.publish_link.manifest_updated",
    [
      "PUT /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-links/:link_id/entries",
    ],
    [U.link_update(), U.link_entry_insert(), U.link_entry_delete()],
  ),
  command(
    "publish.guide_link.entry_rollback",
    "guide.publish_link.entry_rolled_back",
    [
      "POST /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/entries/:entry_id/rollback",
    ],
    [U.link_update(), U.link_entry_update()],
  ),
  command(
    "publish.interactive_demo_link.entry_rollback",
    "interactive_demo.publish_link.entry_rolled_back",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-links/:link_id/entries/:entry_id/rollback",
    ],
    [U.link_update(), U.link_entry_update()],
  ),
  command(
    "publish.documentation_link.create",
    "documentation.publish_link.created",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications",
    ],
    [
      U.link_insert(),
      U.link_entry_insert(),
      U.documentation_publication_review_evidence_insert(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "publish.documentation_link.manifest_update",
    "documentation.publish_link.manifest_updated",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications",
    ],
    [
      U.link_entry_update(),
      U.documentation_publication_review_evidence_insert(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "publish.documentation_link.entry_rollback",
    "documentation.publish_link.entry_rolled_back",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/entries/:entry_id/rollback",
    ],
    [
      U.link_entry_update(),
      U.documentation_publication_review_evidence_insert(),
      U.documentation_review_notification_insert(),
    ],
  ),
  command(
    "publish.documentation_link.revoke",
    "documentation.publish_link.revoked",
    [
      "POST /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/revoke",
    ],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.guide_link.revoke",
    "guide.publish_link.revoked",
    [
      "POST /api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id/revoke",
    ],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.interactive_demo_link.revoke",
    "interactive_demo.publish_link.revoked",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-links/:link_id/revoke",
    ],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.viewer_session.create",
    "publish.viewer_session.created",
    ["POST /api/v1/public/publish-links/:slug/viewer-sessions"],
    [U.viewer_insert()],
    { source_types: ["system"], actor_types: ["system"] },
  ),
  command(
    "publish.viewer_session.touch",
    "publish.viewer_session.activity_recorded",
    [
      "GET /api/v1/public/publish-links/:slug",
      "GET /api/v1/public/publish-links/:slug/versions/:version_slug",
      "GET /api/v1/public/publish-links/:slug/versions/:version_slug/assets/:capture_asset_id/file",
    ],
    [U.viewer_update()],
    { source_types: ["system"], actor_types: ["system"] },
  ),
]);

export type AuditCommandName =
  (typeof AUDIT_COVERAGE_REGISTRY)[number]["command"];
export const AUDIT_COMMANDS = AUDIT_COVERAGE_REGISTRY.map(
  ({ command }) => command,
);

export const find_audit_command = (name: string): AuditCommandCoverage => {
  const found = AUDIT_COVERAGE_REGISTRY.find(
    ({ command: current }) => current === name,
  );
  if (!found) throw new AuditDomainError("unknown_audit_command", "internal");
  return found;
};
