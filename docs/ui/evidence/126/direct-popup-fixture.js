(() => {
  const fixture = () =>
    new URL(globalThis.location.href).searchParams.get("fixture");
  const version = {
    id: "version_next",
    project_id: "project_1",
    name: "A deliberately long named Project Version for reflow validation",
    slug: "next",
    status: "active",
    position: 2,
    is_default: false,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    created_at: "2026-07-29T09:00:00.000Z",
    updated_at: "2026-07-29T09:00:00.000Z",
  };
  const project = {
    id: "project_1",
    organization_id: "organization_1",
    name: "A deliberately long Project name for narrow popup validation",
    description: null,
    slug: null,
    color: null,
    icon: null,
    status: "active",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-29T09:00:00.000Z",
    updated_at: "2026-07-29T09:00:00.000Z",
    access: { role: "editor", source: "project_membership" },
    default_project_version: {
      id: "version_main",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  };
  const settings = () => ({
    instanceUrl: "https://api.synthetic.test/base",
    portalUrl: "https://portal.synthetic.test/base",
    sessionToken: fixture() === "signedout" ? null : "synthetic-token",
    selectedProjectId: fixture() === "signedout" ? null : "project_1",
    selectedProjectVersionId: fixture() === "signedout" ? null : version.id,
    selectedProjectVersionSlug: fixture() === "signedout" ? null : version.slug,
    selectedProjectVersionName: fixture() === "signedout" ? null : version.name,
    activeCaptureSessionId: fixture() === "active" ? "capture_session_1" : null,
    activeCaptureProjectId: fixture() === "active" ? "project_1" : null,
    activeCaptureProjectVersionId: fixture() === "active" ? version.id : null,
    activeCaptureProjectVersionSlug:
      fixture() === "active" ? version.slug : null,
    activeCaptureProjectVersionName:
      fixture() === "active" ? version.name : null,
    activeCaptureEventIndex: fixture() === "active" ? 7 : null,
    activeCaptureMode: fixture() === "active" ? "automatic" : null,
    activeCapturePaused: fixture() === "active",
    automaticCaptureDiagnostic:
      fixture() === "active"
        ? {
            status: "success",
            message: null,
            eventIndex: 7,
            occurredAt: "2026-07-29T09:00:00.000Z",
          }
        : null,
    manualCaptureDiagnostic: null,
  });
  const local = {
    get: async () => settings(),
    set: async () => {},
    remove: async () => {},
  };
  globalThis.chrome = {
    storage: {
      local,
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
    },
    runtime: {
      sendMessage: async () => ({ ok: true }),
    },
    tabs: {
      query: async () => [
        {
          id: 1,
          windowId: 1,
          active: true,
          url: "https://target.synthetic.test/workflow",
          title: "Synthetic workflow",
        },
      ],
      create: async () => {},
    },
  };

  const json = (body) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/authentication/me")) {
      return json({
        auth: {
          user: {
            id: "user_1",
            email: "synthetic.owner@example.test",
            display_name: "Synthetic Owner",
          },
          organization: {
            id: "organization_1",
            name: "Synthetic Organization With A Long Name",
          },
          org_user: { id: "org_user_1", role: "owner" },
          session: {
            id: "session_1",
            session_type: "extension",
            expires_at: "2026-08-29T09:00:00.000Z",
          },
        },
      });
    }
    if (url.includes("/versions?")) {
      return json({ project_versions: [version] });
    }
    if (url.endsWith("/events")) {
      return json({
        capture_events: [{ event_index: 7 }],
      });
    }
    if (url.includes("/capture-sessions/capture_session_1")) {
      return json({
        capture_session: {
          id: "capture_session_1",
          project_id: "project_1",
          status: "capturing",
          project_version: version,
        },
      });
    }
    if (url.includes("/projects?")) {
      return json({ projects: [project] });
    }
    return json({});
  };
})();
