import type { AccessAuthorizationType, AccessSurface } from "@repo/constants";
import { AUDIT_COVERAGE_REGISTRY } from "../audit/audit-coverage-registry";

export type AccessRoutePolicy =
  | "meaningful_read"
  | "authentication_outcome"
  | "public_access"
  | "extension_conditional"
  | "denial_only"
  | "excluded_transport";

export type AccessRouteRegistration = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route_template: string;
  action: string;
  denied_action: string;
  root_resource_type: string;
  root_parameter: string | null;
  project_parameter: string | null;
  policy: AccessRoutePolicy;
  surface: AccessSurface;
  authorization_type: AccessAuthorizationType;
  atomic_commands: readonly string[];
};

const registration = (
  route: string,
  input: Omit<AccessRouteRegistration, "method" | "route_template">,
): AccessRouteRegistration => {
  const separator = route.indexOf(" ");
  return {
    ...input,
    method: route.slice(0, separator) as AccessRouteRegistration["method"],
    route_template: route.slice(separator + 1),
  };
};

const root_for_route = (route: string) => {
  if (route.includes("/documentation-import-inspections"))
    return { type: "project_version", parameter: "version_slug" };
  if (route.includes("/documentation-sites/:site_id/pages/:page_id"))
    return { type: "documentation_page", parameter: "page_id" };
  if (route.includes("/documentation-sites/:site_id/snippets/:snippet_id"))
    return { type: "documentation_snippet", parameter: "snippet_id" };
  if (route.includes("/documentation-sites/:site_id/assets/:asset_id"))
    return { type: "documentation_asset", parameter: "asset_id" };
  if (route.includes("/documentation-sites/:site_id/comments/:thread_id"))
    return { type: "documentation_comment", parameter: "thread_id" };
  if (
    route.includes(
      "/documentation-sites/:site_id/publish-links/:link_id/entries/:entry_id",
    )
  )
    return { type: "publish_link_entry", parameter: "entry_id" };
  if (route.includes("/documentation-sites/:site_id/publish-links/:link_id"))
    return { type: "publish_link", parameter: "link_id" };
  if (route.includes("/documentation-sites/:site_id"))
    return { type: "documentation_site", parameter: "site_id" };
  if (route.includes("/versions/:project_version_id"))
    return { type: "project_version", parameter: "project_version_id" };
  if (
    route.includes(
      "/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots",
    )
  )
    return { type: "demo_scene", parameter: "scene_id" };
  if (route.includes("/interactive-demos/:interactive_demo_id"))
    return { type: "interactive_demo", parameter: "interactive_demo_id" };
  if (route.includes("/guides/:guide_id"))
    return { type: "guide", parameter: "guide_id" };
  if (route.includes("/capture-sessions/:capture_session_id/assets/:id"))
    return { type: "capture_asset", parameter: "id" };
  if (route.includes("/capture-sessions/:capture_session_id/events/:id"))
    return { type: "capture_event", parameter: "id" };
  if (route.includes("/capture-sessions/:capture_session_id"))
    return { type: "capture_session", parameter: "capture_session_id" };
  if (route.includes("/capture-sessions/:id"))
    return { type: "capture_session", parameter: "id" };
  if (route.includes("/projects/:id"))
    return { type: "project", parameter: "id" };
  if (route.includes("/projects/:project_id"))
    return { type: "project", parameter: "project_id" };
  return { type: "organization", parameter: null };
};

const mutation_routes = new Map<
  string,
  { commands: string[]; action: string }
>();
for (const command of AUDIT_COVERAGE_REGISTRY) {
  for (const route of command.routes) {
    if (route.startsWith("GET ")) continue;
    const current = mutation_routes.get(route) ?? {
      commands: [],
      action: command.action,
    };
    current.commands.push(command.command);
    mutation_routes.set(route, current);
  }
}

const mutation_registrations = [...mutation_routes.entries()].map(
  ([route, command]) => {
    const root = root_for_route(route);
    return registration(route, {
      action: command.action,
      denied_action: `${root.type}.access_denied`,
      root_resource_type: root.type,
      root_parameter: root.parameter,
      project_parameter: route.includes(":project_id") ? "project_id" : null,
      policy: "extension_conditional",
      surface: "portal",
      authorization_type: route.includes("/api/v1/projects/:")
        ? "project_role"
        : "organization_role",
      atomic_commands: command.commands,
    });
  },
);

const overrides = new Map<
  string,
  Partial<Omit<AccessRouteRegistration, "method" | "route_template">>
>([
  [
    "POST /api/v1/setup/first-run",
    {
      action: "setup.first_run_completed",
      denied_action: "setup.first_run_denied",
      root_resource_type: "organization",
      policy: "authentication_outcome",
      surface: "authentication",
      authorization_type: "authentication",
    },
  ],
  [
    "POST /api/v1/authentication/login",
    {
      action: "authentication.login_succeeded",
      denied_action: "authentication.login_denied",
      root_resource_type: "organization",
      policy: "authentication_outcome",
      surface: "authentication",
      authorization_type: "authentication",
    },
  ],
  [
    "POST /api/v1/authentication/logout",
    {
      action: "authentication.logout_succeeded",
      denied_action: "authentication.logout_denied",
      root_resource_type: "auth_session",
      policy: "authentication_outcome",
      surface: "authentication",
      authorization_type: "authentication",
    },
  ],
  [
    "POST /api/v1/public/invites/:token/accept",
    {
      action: "organization.invite_accepted",
      denied_action: "organization.invite_accept_denied",
      root_resource_type: "org_invite",
      root_parameter: null,
      policy: "authentication_outcome",
      surface: "authentication",
      authorization_type: "public_secret",
    },
  ],
  [
    "POST /api/v1/public/publish-links/:slug/viewer-sessions",
    {
      action: "publish_link.password_access_succeeded",
      denied_action: "publish_link.password_access_denied",
      root_resource_type: "publish_link",
      root_parameter: null,
      policy: "authentication_outcome",
      surface: "authentication",
      authorization_type: "public_link_password",
    },
  ],
]);

const mutations = mutation_registrations.map((item) => {
  const override = overrides.get(`${item.method} ${item.route_template}`);
  const membership = item.route_template.includes("/memberships");
  return {
    ...item,
    ...(membership
      ? { denied_action: "project.membership_access_denied" }
      : {}),
    ...(override ?? {}),
  };
});

const read = (
  route: string,
  action: string,
  root_resource_type: string,
  root_parameter: string | null,
  surface: AccessSurface = "portal",
  project_parameter: string | null = route.includes(":project_id")
    ? "project_id"
    : null,
) =>
  registration(route, {
    action,
    denied_action: `${root_resource_type}.access_denied`,
    root_resource_type,
    root_parameter,
    project_parameter,
    policy: "meaningful_read",
    surface,
    authorization_type: route.includes("/api/v1/projects/:")
      ? "project_role"
      : "organization_role",
    atomic_commands: [],
  });

const reads: AccessRouteRegistration[] = [
  read(
    "GET /api/v1/authentication/me",
    "authentication.session.viewed",
    "auth_session",
    null,
    "authentication",
  ),
  read("GET /api/v1/projects", "project.list_viewed", "organization", null),
  read("GET /api/v1/projects/:id", "project.viewed", "project", "id"),
  read(
    "GET /api/v1/projects/:project_id/versions",
    "project_version.list_viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/resolve/:slug",
    "project_version.viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:project_version_id",
    "project_version.viewed",
    "project_version",
    "project_version_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/memberships",
    "project.membership_list_viewed",
    "project",
    "project_id",
  ),
  registration("GET /api/v1/projects/:project_id/activity", {
    action: "project.activity_viewed",
    denied_action: "project.activity_access_denied",
    root_resource_type: "project",
    root_parameter: "project_id",
    project_parameter: "project_id",
    policy: "meaningful_read",
    surface: "portal",
    authorization_type: "project_role",
    atomic_commands: [],
  }),
  read(
    "GET /api/v1/organization/members",
    "organization.members_viewed",
    "organization",
    null,
  ),
  read(
    "GET /api/v1/organization/invites",
    "organization.invites_viewed",
    "organization",
    null,
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions",
    "capture_session.list_viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:id",
    "capture_session.viewed",
    "capture_session",
    "id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:id/detail",
    "capture_session.detail_viewed",
    "capture_session",
    "id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-assets",
    "capture_asset.project_list_viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets",
    "capture_asset.list_viewed",
    "capture_session",
    "capture_session_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id",
    "capture_asset.viewed",
    "capture_asset",
    "id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/file",
    "capture_asset.downloaded",
    "capture_asset",
    "id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/assets/:id/protection",
    "capture_asset.protection_viewed",
    "capture_asset",
    "id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events",
    "capture_event.list_viewed",
    "capture_session",
    "capture_session_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/capture-sessions/:capture_session_id/events/:id",
    "capture_event.viewed",
    "capture_event",
    "id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides",
    "guide.list_viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id",
    "guide.viewed",
    "guide",
    "guide_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id/revisions",
    "guide.revision_history_viewed",
    "guide",
    "guide_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id/revisions/:revision_number",
    "guide.revision_viewed",
    "guide",
    "guide_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id/export/markdown",
    "guide.markdown_exported",
    "guide",
    "guide_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id/export/html.zip",
    "guide.html_exported",
    "guide",
    "guide_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos",
    "interactive_demo.list_viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id",
    "interactive_demo.viewed",
    "interactive_demo",
    "interactive_demo_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/revisions",
    "interactive_demo.revision_history_viewed",
    "interactive_demo",
    "interactive_demo_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/revisions/:revision_number",
    "interactive_demo.revision_viewed",
    "interactive_demo",
    "interactive_demo_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes",
    "demo_scene.list_viewed",
    "interactive_demo",
    "interactive_demo_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots",
    "demo_hotspot.list_viewed",
    "demo_scene",
    "scene_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id/publications",
    "guide.publication_history_viewed",
    "guide",
    "guide_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/guides/:guide_id/publish-links",
    "guide.publish_links_viewed",
    "guide",
    "guide_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publications",
    "interactive_demo.publication_history_viewed",
    "interactive_demo",
    "interactive_demo_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/interactive-demos/:interactive_demo_id/publish-links",
    "interactive_demo.publish_links_viewed",
    "interactive_demo",
    "interactive_demo_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
    "documentation_site.list_viewed",
    "project",
    "project_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id",
    "documentation_import_inspection.viewed",
    "project_version",
    "version_slug",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/export/package.zip",
    "documentation_package.exported",
    "documentation_site",
    "site_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/export/markdown",
    "documentation_page.markdown_exported",
    "documentation_page",
    "page_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/export",
    "documentation_openapi.exported",
    "documentation_site",
    "site_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source",
    "documentation_openapi.viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id/file",
    "documentation_asset.downloaded",
    "documentation_asset",
    "asset_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets",
    "documentation_asset.list_viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/capture/:asset_id/file",
    "documentation_capture_asset.downloaded",
    "documentation_site",
    "site_id",
    "download",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets",
    "documentation_snippet.list_viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id",
    "documentation_snippet.viewed",
    "documentation_snippet",
    "snippet_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/artifact-publications",
    "documentation_artifact_publication.list_viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
    "documentation_page.viewed",
    "documentation_page",
    "page_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments",
    "documentation_comment.list_viewed",
    "documentation_page",
    "page_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/preview",
    "documentation_preview.viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions",
    "documentation_revision.list_viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions/:revision_number",
    "documentation_revision.viewed",
    "documentation_revision",
    "revision_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications",
    "documentation_publication.list_viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links",
    "documentation_publish_link.list_viewed",
    "documentation_site",
    "site_id",
  ),
  read(
    "GET /api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/search",
    "documentation_search.viewed",
    "documentation_site",
    "site_id",
  ),
];

const public_documentation_read = (route: string, action: string) =>
  registration(route, {
    action,
    denied_action: "publish_link.view_denied",
    root_resource_type: "publish_link",
    root_parameter: null,
    project_parameter: null,
    policy: "public_access",
    surface: "api",
    authorization_type: "public_link",
    atomic_commands: [],
  });

const public_routes: AccessRouteRegistration[] = [
  registration("GET /api/v1/public/invites/:token", {
    action: "organization.invite_viewed",
    denied_action: "organization.invite_view_denied",
    root_resource_type: "org_invite",
    root_parameter: null,
    project_parameter: null,
    policy: "public_access",
    surface: "api",
    authorization_type: "public_secret",
    atomic_commands: [],
  }),
  registration("GET /api/v1/public/publish-links/:slug", {
    action: "publish_link.viewed",
    denied_action: "publish_link.view_denied",
    root_resource_type: "publish_link",
    root_parameter: null,
    project_parameter: null,
    policy: "public_access",
    surface: "api",
    authorization_type: "public_link",
    atomic_commands: [],
  }),
  registration(
    "GET /api/v1/public/publish-links/:slug/versions/:version_slug",
    {
      action: "publish_link.version_viewed",
      denied_action: "publish_link.version_view_denied",
      root_resource_type: "publish_link",
      root_parameter: null,
      project_parameter: null,
      policy: "public_access",
      surface: "api",
      authorization_type: "public_link",
      atomic_commands: [],
    },
  ),
  registration(
    "GET /api/v1/public/publish-links/:slug/versions/:version_slug/assets/:capture_asset_id/file",
    {
      action: "published_asset.downloaded",
      denied_action: "published_asset.download_denied",
      root_resource_type: "publish_link",
      root_parameter: null,
      project_parameter: null,
      policy: "public_access",
      surface: "download",
      authorization_type: "public_link",
      atomic_commands: [],
    },
  ),
  registration("GET /api/v1/public/instance", {
    action: "public_instance.probed",
    denied_action: "public_instance.probe_failed",
    root_resource_type: "instance",
    root_parameter: null,
    project_parameter: null,
    policy: "excluded_transport",
    surface: "api",
    authorization_type: "system",
    atomic_commands: [],
  }),
  ...["", "/versions/:version_slug"].flatMap((version_prefix) => [
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation`,
      "documentation_publication.viewed",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/pages/:*`,
      "documentation_publication.page_viewed",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/search`,
      "documentation_publication.search_viewed",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/operations/:operation_key`,
      "documentation_publication.operation_viewed",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/sitemap.xml`,
      "documentation_publication.sitemap_viewed",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/robots.txt`,
      "documentation_publication.robots_viewed",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/assets/:asset_id/file`,
      "documentation_asset.public_downloaded",
    ),
    public_documentation_read(
      `GET /api/v1/public/publish-links/:slug${version_prefix}/documentation/assets/capture/:asset_id/file`,
      "documentation_capture_asset.public_downloaded",
    ),
  ]),
];

const compliance_routes: AccessRouteRegistration[] = [
  read(
    "GET /api/v1/organization/compliance/events",
    "compliance.timeline_viewed",
    "organization",
    null,
    "compliance",
    null,
  ),
  read(
    "GET /api/v1/organization/compliance/audit-events/:audit_event_id",
    "compliance.audit_event_viewed",
    "audit_event",
    "audit_event_id",
    "compliance",
    null,
  ),
  registration("GET /api/v1/projects/:project_id/compliance/events", {
    action: "compliance.timeline_viewed",
    denied_action: "compliance.timeline_access_denied",
    root_resource_type: "project",
    root_parameter: "project_id",
    project_parameter: "project_id",
    policy: "meaningful_read",
    surface: "compliance",
    authorization_type: "project_role",
    atomic_commands: [],
  }),
  registration(
    "GET /api/v1/projects/:project_id/compliance/audit-events/:audit_event_id",
    {
      action: "compliance.audit_event_viewed",
      denied_action: "compliance.audit_event_access_denied",
      root_resource_type: "audit_event",
      root_parameter: "audit_event_id",
      project_parameter: "project_id",
      policy: "meaningful_read",
      surface: "compliance",
      authorization_type: "project_role",
      atomic_commands: [],
    },
  ),
];

export const ACCESS_ROUTE_COVERAGE_REGISTRY = [
  ...mutations,
  ...reads,
  ...public_routes,
  ...compliance_routes,
] as const;

const allowed_actions = new Set(
  ACCESS_ROUTE_COVERAGE_REGISTRY.flatMap((route) => [
    route.action,
    route.denied_action,
  ]),
);

export const is_registered_access_action = (action: string) =>
  allowed_actions.has(action);

const coverage = new Map(
  ACCESS_ROUTE_COVERAGE_REGISTRY.map((item) => [
    `${item.method} ${item.route_template}`,
    item,
  ]),
);

export const access_route_registration = (
  method: string,
  route_template: string,
) => coverage.get(`${method.toUpperCase()} ${route_template}`) ?? null;
