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
  guide_edition_insert: () => write("guide_schema.guide_edition", "INSERT", "guide_edition"),
  guide_update: () => write("guide_schema.guide_edition", "UPDATE", "guide_edition"),
  guide_draft_insert: () => write("guide_schema.guide_working_draft", "INSERT", "guide_working_draft"),
  guide_draft_update: () => write("guide_schema.guide_working_draft", "UPDATE", "guide_working_draft"),
  block_insert: () =>
    write("guide_schema.guide_block", "INSERT", "guide_block"),
  block_update: (operation: AuditOperation = "update") =>
    write("guide_schema.guide_block", "UPDATE", "guide_block", [operation]),
  step_insert: () => write("guide_schema.guide_step", "INSERT", "guide_step"),
  step_update: (operation: AuditOperation = "update") =>
    write("guide_schema.guide_step", "UPDATE", "guide_step", [operation]),
  annotation_insert: () => write("guide_schema.guide_annotation", "INSERT", "guide_annotation"),
  annotation_update: (operation: AuditOperation = "update") => write("guide_schema.guide_annotation", "UPDATE", "guide_annotation", [operation]),
  demo_insert: () =>
    write(
      "interactive_demo_schema.interactive_demo",
      "INSERT",
      "interactive_demo",
    ),
  demo_edition_insert: () => write("interactive_demo_schema.interactive_demo_edition", "INSERT", "interactive_demo_edition"),
  demo_update: (operation: AuditOperation = "update") =>
    write(
      "interactive_demo_schema.interactive_demo_edition",
      "UPDATE",
      "interactive_demo_edition",
      [operation],
    ),
  demo_draft_insert: () => write("interactive_demo_schema.interactive_demo_working_draft", "INSERT", "interactive_demo_working_draft"),
  demo_draft_update: () => write("interactive_demo_schema.interactive_demo_working_draft", "UPDATE", "interactive_demo_working_draft"),
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
  transition_insert: () => write("interactive_demo_schema.demo_transition", "INSERT", "demo_transition"),
  transition_update: (operation: AuditOperation = "update") => write("interactive_demo_schema.demo_transition", "UPDATE", "demo_transition", [operation]),
  publication_insert: () =>
    write("publish_schema.published_artifact", "INSERT", "published_artifact"),
  link_insert: () =>
    write("publish_schema.publish_link", "INSERT", "publish_link"),
  link_update: (operation: AuditOperation = "update") =>
    write("publish_schema.publish_link", "UPDATE", "publish_link", [operation]),
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
    "capture_asset.delete",
    "capture_asset.deleted",
    [
      "DELETE /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id",
    ],
    [U.asset_update("delete"), U.file_update("delete")],
    { source_types: ["web", "api", "extension", "import"] },
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
    [U.guide_insert(), U.guide_edition_insert(), U.guide_draft_insert(), U.block_insert(), U.step_insert()],
  ),
  command(
    "guide.update",
    "guide.edition.updated",
    ["PATCH /api/v1/projects/:project_id/guides/:guide_id"],
    [U.guide_update()],
  ),
  command("guide.archive", "guide.edition.archived", ["POST /api/v1/projects/:project_id/guides/:guide_id/archive"], [U.guide_update()]),
  command("guide.restore", "guide.edition.restored", ["POST /api/v1/projects/:project_id/guides/:guide_id/restore"], [U.guide_update()]),
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
    [U.block_update(), U.block_insert(), U.step_insert(), U.guide_draft_update()],
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
    [U.file_insert(), U.asset_insert(), U.step_update(), U.guide_draft_update()],
    { source_types: ["web", "api", "extension", "import"] },
  ),
  command(
    "guide.block.delete",
    "guide.block.deleted",
    [
      "DELETE /api/v1/projects/:project_id/guides/:guide_id/blocks/:guide_block_id",
    ],
    [U.block_update("delete"), U.step_update("delete"), U.annotation_update("delete"), U.guide_draft_update()],
  ),
  command(
    "interactive_demo.create_from_capture",
    "interactive_demo.created",
    [
      "POST /api/v1/projects/:project_id/capture-sessions/:capture_session_id/interactive-demos",
    ],
    [U.demo_insert(), U.demo_edition_insert(), U.demo_draft_insert(), U.scene_insert()],
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
  command("interactive_demo.archive", "interactive_demo.edition.archived", ["POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/archive"], [U.demo_update()]),
  command("interactive_demo.restore", "interactive_demo.edition.restored", ["POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/restore"], [U.demo_update()]),
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
    [U.scene_update("delete"), U.hotspot_update("delete"), U.transition_update("delete"), U.demo_draft_update()],
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
    [U.hotspot_update(), U.transition_insert(), U.transition_update(), U.demo_draft_update()],
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
    [U.hotspot_update("delete"), U.transition_update("delete"), U.demo_draft_update()],
  ),
  command(
    "publish.guide",
    "guide.published",
    ["POST /api/v1/projects/:project_id/guides/:guide_id/publish"],
    [U.publication_insert(), U.link_insert(), U.link_update()],
  ),
  command(
    "publish.interactive_demo",
    "interactive_demo.published",
    [
      "POST /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish",
    ],
    [U.publication_insert(), U.link_insert(), U.link_update()],
  ),
  command(
    "publish.guide_link.revoke",
    "guide.publish_link.revoked",
    ["DELETE /api/v1/projects/:project_id/guides/:guide_id/publish"],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.interactive_demo_link.revoke",
    "interactive_demo.publish_link.revoked",
    [
      "DELETE /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish",
    ],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.guide_link.access_update",
    "guide.publish_link.access_updated",
    ["PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/access"],
    [U.link_update()],
  ),
  command(
    "publish.interactive_demo_link.access_update",
    "interactive_demo.publish_link.access_updated",
    [
      "PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access",
    ],
    [U.link_update()],
  ),
  command(
    "publish.guide_link.password_update",
    "guide.publish_link.password_updated",
    ["PATCH /api/v1/projects/:project_id/guides/:guide_id/publish/password"],
    [U.link_update(), U.viewer_update()],
  ),
  command(
    "publish.interactive_demo_link.password_update",
    "interactive_demo.publish_link.password_updated",
    [
      "PATCH /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password",
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
      "GET /api/v1/public/publish-links/:slug/assets/:capture_asset_id/file",
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
