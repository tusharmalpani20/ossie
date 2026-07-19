import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  acceptPublicOrganizationInvite,
  createProject,
  createProjectCaptureSession,
  createCaptureSessionEvent,
  createGuideBlock,
  createGuideFromCaptureSession,
  createInteractiveDemoFromCaptureSession,
  createInteractiveDemoHotspot,
  createOrganizationInvite,
  completeFirstRunSetup,
  deleteGuideBlock,
  deleteInteractiveDemoHotspot,
  exportGuideHtmlZip,
  exportGuideMarkdown,
  getCurrentAuth,
  getCaptureSessionDetail,
  getGuideDetail,
  getGuidePublishStatus,
  getInteractiveDemo,
  getInteractiveDemoPublishStatus,
  getProject,
  getPublicInstanceStatus,
  getPublicPublishLink,
  getComplianceAuditEvent,
  getPublicOrganizationInvite,
  createPublicPublishViewerSession,
  login,
  listOrganizationInvites,
  listOrganizationMembers,
  listComplianceEvents,
  listProjectComplianceEvents,
  listProjectActivity,
  listProjectMemberships,
  assignProjectMembership,
  listProjectScreenshotAssets,
  listProjects,
  listProjectCaptureSessions,
  listProjectGuides,
  listProjectInteractiveDemos,
  listProjectVersions,
  resolveProjectVersion,
  updateProjectVersion,
  listInteractiveDemoScenes,
  listInteractiveDemoHotspots,
  logout,
  publishGuide,
  publishInteractiveDemo,
  reorderCaptureSessionEvents,
  reorderInteractiveDemoHotspots,
  reorderInteractiveDemoScenes,
  reorderGuideBlocks,
  resolveApiAssetUrl,
  revokeGuidePublishLink,
  revokeInteractiveDemoPublishLink,
  revokeOrganizationInvite,
  archiveInteractiveDemo,
  deleteInteractiveDemoScene,
  updateGuidePublishAccess,
  updateGuidePublishPassword,
  updateInteractiveDemoPublishAccess,
  updateInteractiveDemoPublishPassword,
  updateGuide,
  updateGuideBlock,
  updateGuideBlockAnnotations,
  updateGuideBlockScreenshot,
  updateCaptureSessionEvent,
  updateInteractiveDemo,
  updateInteractiveDemoHotspot,
  updateInteractiveDemoScene,
  updateProject,
  uploadCaptureSessionAsset,
  uploadGuideBlockScreenshot,
  updateGuideStep,
} from "./api";

const detail_response = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    name: "Create department workflow",
    description: null,
    status: "draft",
    source_type: "extension",
    started_at: null,
    completed_at: null,
    canceled_at: null,
    start_url: "https://example.internal/app",
    browser_name: "Chrome",
    browser_version: "126",
    operating_system: "Linux",
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 1,
    user_agent: "Mozilla/5.0",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  capture_events: [],
  capture_assets: [],
};

const guide_response = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  guide_blocks: [],
  source_capture_assets: [],
};

const interactive_demo_from_capture_response = {
  interactive_demo: {
    id: "interactive_demo_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department setup demo",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  demo_scenes: [{
    id: "demo_scene_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "capture_event_1",
    source_capture_asset_id: "capture_asset_1",
    scene_index: 1,
    title: "Click Add Department",
    description: null,
    background_capture_asset_id: "capture_asset_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  }],
  redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
};

const interactive_demo_response = {
  interactive_demo: interactive_demo_from_capture_response.interactive_demo,
};

const interactive_demo_list_response = {
  interactive_demos: [interactive_demo_from_capture_response.interactive_demo],
};

const demo_scene_response = {
  demo_scene: interactive_demo_from_capture_response.demo_scenes[0],
};

const demo_scene_list_response = {
  demo_scenes: interactive_demo_from_capture_response.demo_scenes,
};

const demo_hotspot_response = {
  demo_hotspot: {
    id: "demo_hotspot_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    demo_scene_id: "demo_scene_1",
    hotspot_type: "click",
    label: "Continue",
    content: null,
    x: 0.1,
    y: 0.2,
    width: 0.3,
    height: 0.12,
    target_scene_id: "demo_scene_2",
    hotspot_index: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
};

const demo_hotspot_list_response = {
  demo_hotspots: [demo_hotspot_response.demo_hotspot],
};

const public_publish_response = {
  publish_link: {
    slug: "abc123",
    artifact_type: "guide",
    visibility: "public",
    expires_at: null,
    status: "active",
    password_protected: false,
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: 1,
    title: "Department guide",
    published_at: "2026-06-10T00:00:00.000Z",
    snapshot: {
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Department guide",
        description: "Set up departments.",
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      blocks: [],
    },
  },
};

const guide_publish_response = {
  publish_link: {
    id: "publish_link_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    published_artifact_id: "published_artifact_1",
    slug: "abc123",
    visibility: "public",
    expires_at: null,
    status: "active",
    published_at: "2026-06-11T00:00:00.000Z",
    revoked_at: null,
    public_url: "/p/abc123",
    password_protected: false,
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: 1,
    title: "Department guide",
    published_at: "2026-06-11T00:00:00.000Z",
  },
};

const project_response = {
  project: {
    id: "project_1",
    organization_id: "organization_1",
    name: "Internal onboarding demos",
    description: "Reusable captures and guides for internal teams.",
    slug: "internal-onboarding-demos",
    color: "#2563eb",
    icon: "folder",
    status: "active",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
};

const auth_response = {
  auth: {
    user: {
      id: "user_1",
      email: "person@example.com",
      display_name: "Person Example",
    },
    organization: {
      id: "organization_1",
      name: "Example Org",
    },
    org_user: {
      id: "org_user_1",
      role: "owner",
    },
    session: {
      id: "session_1",
      session_type: "web",
      expires_at: "2026-06-06T10:00:00.000Z",
    },
  },
};

const organization_member_response = {
  members: [{
    id: "org_user_1",
    user_id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
    role: "owner",
    status: "active",
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  }],
};

const organization_invite_response = {
  invites: [{
    id: "org_invite_1",
    organization_id: "organization_1",
    email: "teammate@example.com",
    role: "member",
    status: "pending",
    expires_at: "2026-06-22T10:00:00.000Z",
    accepted_at: null,
    accepted_user_id: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    created_at: "2026-06-15T10:00:00.000Z",
    updated_at: "2026-06-15T10:00:00.000Z",
  }],
};

const organization_invite_create_response = {
  invite: organization_invite_response.invites[0],
  invite_token: "plain-token",
  invite_url: "http://localhost:5173/invites/plain-token",
};

const public_organization_invite_response = {
  invite: {
    id: "org_invite_1",
    organization_name: "Example Org",
    email: "teammate@example.com",
    role: "member",
    status: "pending",
    expires_at: "2026-06-22T10:00:00.000Z",
    requires_login: false,
  },
};

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches project detail with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(project_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getProject("project_1")).resolves.toEqual(project_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("fetches public instance status", async () => {
    const response = {
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getPublicInstanceStatus()).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/instance",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("completes first-run setup with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(auth_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    const input = {
      owner: {
        email: " owner@example.com ",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: {
        name: "Acme",
      },
    };

    await expect(completeFirstRunSetup(input)).resolves.toEqual(auth_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/setup/first-run",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );
  });

  it("fetches the current auth context with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(auth_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getCurrentAuth()).resolves.toEqual(auth_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/authentication/me",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("logs in with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(auth_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(login({
      email: "person@example.com",
      password: "secret",
    })).resolves.toEqual(auth_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/authentication/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "person@example.com",
          password: "secret",
        }),
      }
    );
  });

  it("logs out with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(logout()).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/authentication/logout",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists organization members with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(organization_member_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listOrganizationMembers()).resolves.toEqual(organization_member_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/organization/members",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists organization invites with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(organization_invite_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listOrganizationInvites()).resolves.toEqual(organization_invite_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/organization/invites",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("creates organization invites with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(organization_invite_create_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createOrganizationInvite({
      email: " teammate@example.com ",
      role: "member",
    })).resolves.toEqual(organization_invite_create_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/organization/invites",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: " teammate@example.com ",
          role: "member",
        }),
      }
    );
  });

  it("revokes organization invites with session cookies", async () => {
    const response = {
      invite: {
        ...organization_invite_response.invites[0],
        status: "revoked",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(revokeOrganizationInvite("org invite/1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/organization/invites/org%20invite%2F1",
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("loads public organization invite details", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(public_organization_invite_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getPublicOrganizationInvite("token / 1")).resolves.toEqual(public_organization_invite_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/invites/token%20%2F%201",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("accepts public organization invites with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(auth_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(acceptPublicOrganizationInvite("token / 1", {
      password: "safe password",
      display_name: "New Member",
    })).resolves.toEqual(auth_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/invites/token%20%2F%201/accept",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          password: "safe password",
          display_name: "New Member",
        }),
      }
    );
  });

  it("URL-encodes project IDs while fetching project detail", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(project_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await getProject("project / 1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists projects with session cookies", async () => {
    const response = {
      projects: [project_response.project],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjects()).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists projects filtered by status", async () => {
    const response = {
      projects: [project_response.project],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjects({ status: "archived" })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects?status=archived",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("creates projects with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(project_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createProject({
      name: " Internal onboarding demos ",
      description: "Reusable captures and guides.",
      slug: "internal-onboarding",
    })).resolves.toEqual(project_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: " Internal onboarding demos ",
          description: "Reusable captures and guides.",
          slug: "internal-onboarding",
        }),
      }
    );
  });

  it("updates projects with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      project: {
        ...project_response.project,
        name: "Internal training demos",
        description: null,
        slug: null,
        status: "archived",
        version: 2,
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(updateProject("project / 1", {
      name: "Internal training demos",
      description: null,
      slug: null,
      status: "archived",
    })).resolves.toMatchObject({
      project: {
        name: "Internal training demos",
        description: null,
        slug: null,
        status: "archived",
        version: 2,
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Internal training demos",
          description: null,
          slug: null,
          status: "archived",
        }),
      }
    );
  });

  it("fetches capture session detail with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(detail_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getCaptureSessionDetail("project_1", "capture_session_1")).resolves.toEqual(detail_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/detail",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists project capture sessions with session cookies", async () => {
    const response = {
      capture_sessions: [detail_response.capture_session],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectCaptureSessions("project_1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/capture-sessions",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("lists project capture sessions filtered by status", async () => {
    const response = {
      capture_sessions: [detail_response.capture_session],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectCaptureSessions("project_1", { status: "completed" })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/capture-sessions?status=completed",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("creates capture sessions with session cookies", async () => {
    const response = {
      capture_session: detail_response.capture_session,
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createProjectCaptureSession("project / 1", {
      name: " Manual capture ",
      description: "Portal source material",
      source_type: "manual",
      start_url: "https://example.internal/app",
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/capture-sessions",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: " Manual capture ",
          description: "Portal source material",
          source_type: "manual",
          start_url: "https://example.internal/app",
        }),
      }
    );
  });

  it("uploads capture session screenshot assets with session cookies", async () => {
    const response = {
      capture_asset: {
        id: "asset_uploaded",
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          id: "file_1",
          storage_provider: "local",
          mime_type: "image/png",
          size_bytes: 123,
          original_name: "department.png",
          checksum_sha256: "checksum",
        },
        asset_type: "screenshot",
        width: null,
        height: null,
        device_pixel_ratio: null,
        page_url: "https://example.internal/app",
        page_title: "Department",
        captured_at: "2026-06-12T00:00:00.000Z",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-12T00:00:00.000Z",
        updated_at: "2026-06-12T00:00:00.000Z",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded/file",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);
    const file = new File(["png"], "department.png", { type: "image/png" });

    await expect(uploadCaptureSessionAsset("project / 1", "capture / 1", {
      file,
      page_url: "https://example.internal/app",
      page_title: "Department",
      captured_at: "2026-06-12T00:00:00.000Z",
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/capture-sessions/capture%20%2F%201/assets/upload",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
        body: expect.any(FormData),
      }
    );

    const fetchCall = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const body = fetchCall[1].body as FormData;
    expect(body.get("file")).toBe(file);
    expect(body.get("page_url")).toBe("https://example.internal/app");
    expect(body.get("page_title")).toBe("Department");
    expect(body.get("captured_at")).toBe("2026-06-12T00:00:00.000Z");
    expect(body.has("asset_type")).toBe(false);
  });

  it("creates capture session events with session cookies", async () => {
    const response = {
      capture_event: {
        id: "event_uploaded",
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "asset_uploaded",
        event_type: "capture",
        event_index: 3,
        occurred_at: "2026-06-12T00:00:00.000Z",
        page_url: "https://example.internal/app",
        page_title: "Department",
        target_label: "Uploaded screenshot",
        target_selector: null,
        target_role: null,
        target_test_id: null,
        target_text: null,
        client_x: null,
        client_y: null,
        viewport_width: null,
        viewport_height: null,
        device_pixel_ratio: null,
        input_intent: null,
        input_value_redacted: true,
        note: "Uploaded screenshot: department.png",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-12T00:00:00.000Z",
        updated_at: "2026-06-12T00:00:00.000Z",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createCaptureSessionEvent("project / 1", "capture / 1", {
      event_type: "capture",
      event_index: 3,
      capture_asset_id: "asset_uploaded",
      occurred_at: "2026-06-12T00:00:00.000Z",
      page_url: "https://example.internal/app",
      page_title: "Department",
      target_label: "Uploaded screenshot",
      note: "Uploaded screenshot: department.png",
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/capture-sessions/capture%20%2F%201/events",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event_type: "capture",
          event_index: 3,
          capture_asset_id: "asset_uploaded",
          occurred_at: "2026-06-12T00:00:00.000Z",
          page_url: "https://example.internal/app",
          page_title: "Department",
          target_label: "Uploaded screenshot",
          note: "Uploaded screenshot: department.png",
        }),
      }
    );
  });

  it("reorders capture session events with session cookies", async () => {
    const response = {
      capture_events: [
        {
          id: "event_2",
          organization_id: "organization_1",
          project_id: "project_1",
          capture_session_id: "capture_session_1",
          capture_asset_id: null,
          event_type: "note",
          event_index: 1,
          occurred_at: "2026-06-12T00:00:00.000Z",
          page_url: null,
          page_title: null,
          target_label: null,
          target_selector: null,
          target_role: null,
          target_test_id: null,
          target_text: null,
          client_x: null,
          client_y: null,
          viewport_width: null,
          viewport_height: null,
          device_pixel_ratio: null,
          input_intent: null,
          input_value_redacted: true,
          note: "Second step",
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 2,
          created_at: "2026-06-12T00:00:00.000Z",
          updated_at: "2026-06-12T00:01:00.000Z",
        },
      ],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(reorderCaptureSessionEvents("project / 1", "capture / 1", {
      event_ids: ["event_2", "event_1"],
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/capture-sessions/capture%20%2F%201/events/order",
      {
        method: "PUT",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event_ids: ["event_2", "event_1"],
        }),
      }
    );
  });

  it("updates capture session events with session cookies", async () => {
    const response = {
      capture_event: {
        id: "event_1",
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: null,
        event_type: "note",
        event_index: 1,
        occurred_at: "2026-06-12T00:00:00.000Z",
        page_url: "https://example.internal/app",
        page_title: "Department list",
        target_label: "Add Department",
        target_selector: null,
        target_role: null,
        target_test_id: null,
        target_text: null,
        client_x: null,
        client_y: null,
        viewport_width: null,
        viewport_height: null,
        device_pixel_ratio: null,
        input_intent: null,
        input_value_redacted: true,
        note: "Open the department list.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 2,
        created_at: "2026-06-12T00:00:00.000Z",
        updated_at: "2026-06-12T00:01:00.000Z",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(updateCaptureSessionEvent("project / 1", "capture / 1", "event / 1", {
      page_title: "Department list",
      page_url: "https://example.internal/app",
      target_label: "Add Department",
      note: "Open the department list.",
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/capture-sessions/capture%20%2F%201/events/event%20%2F%201",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          page_title: "Department list",
          page_url: "https://example.internal/app",
          target_label: "Add Department",
          note: "Open the department list.",
        }),
      }
    );
  });

  it("fetches guide detail with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(guide_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getGuideDetail("project_1", "guide_1")).resolves.toEqual(guide_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("exports guide markdown with session cookies", async () => {
    const response = {
      filename: "department-guide.md",
      markdown: "# Department guide\n",
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(exportGuideMarkdown("project 1", "guide/1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%201/guides/guide%2F1/export/markdown",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("exports guide HTML ZIP with session cookies and content-disposition filename", async () => {
    const fetch = vi.fn(async () => new Response("zip-bytes", {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": "attachment; filename=\"department-guide-html-export.zip\"",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    const response = await exportGuideHtmlZip("project 1", "guide/1");

    await expect(response.blob.text()).resolves.toBe("zip-bytes");
    expect(response.filename).toBe("department-guide-html-export.zip");
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%201/guides/guide%2F1/export/html.zip",
      {
        credentials: "include",
        headers: {
          accept: "application/zip",
        },
      }
    );
  });

  it("fetches public publish links by slug", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(public_publish_response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getPublicPublishLink("abc 123")).resolves.toEqual(public_publish_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/publish-links/abc%20123",
      {
        credentials: "include",
        headers: {
          "X-Ossie-Access-Surface": "public_reader",
          accept: "application/json",
        },
      }
    );
  });

  it("fetches guide publish status with session cookies", async () => {
    const response = {
      publish_link: null,
      published_artifact: null,
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(getGuidePublishStatus("project / 1", "guide / 1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/guides/guide%20%2F%201/publish",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("publishes guides with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(guide_publish_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(publishGuide("project_1", "guide_1")).resolves.toEqual(guide_publish_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/publish",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("revokes guide publish links with session cookies", async () => {
    const response = {
      publish_link: {
        id: "publish_link_1",
        status: "revoked",
        revoked_at: "2026-06-11T01:00:00.000Z",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(revokeGuidePublishLink("project_1", "guide_1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/publish",
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("updates guide publish access settings with session cookies", async () => {
    const response = {
      ...guide_publish_response,
      publish_link: {
        ...guide_publish_response.publish_link,
        visibility: "restricted",
        expires_at: null,
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(updateGuidePublishAccess("project_1", "guide_1", {
      visibility: "restricted",
      expires_at: null,
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/publish/access",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          visibility: "restricted",
          expires_at: null,
        }),
      }
    );
  });

  it("updates guide publish password settings with session cookies", async () => {
    const response = {
      ...guide_publish_response,
      publish_link: {
        ...guide_publish_response.publish_link,
        password_protected: true,
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(updateGuidePublishPassword("project_1", "guide_1", {
      password: "shared password",
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/publish/password",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          password: "shared password",
        }),
      }
    );
  });

  it("manages interactive demo publish controls with session cookies", async () => {
    const response = {
      ...guide_publish_response,
      publish_link: {
        ...guide_publish_response.publish_link,
        artifact_type: "interactive_demo",
        artifact_id: "demo / 1",
        public_url: "/d/demo123",
      },
      published_artifact: {
        ...guide_publish_response.published_artifact,
        artifact_type: "interactive_demo",
        artifact_id: "demo / 1",
        title: "Department demo",
      },
    };
    const revoke_response = {
      publish_link: {
        id: "publish_link_1",
        status: "revoked",
        revoked_at: "2026-06-11T01:00:00.000Z",
      },
    };
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(response), {
        status: 201,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...response,
        publish_link: { ...response.publish_link, visibility: "restricted", expires_at: null },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...response,
        publish_link: { ...response.publish_link, password_protected: true },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(revoke_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetch);

    await expect(getInteractiveDemoPublishStatus("project / 1", "demo / 1")).resolves.toEqual(response);
    await expect(publishInteractiveDemo("project / 1", "demo / 1")).resolves.toEqual(response);
    await expect(updateInteractiveDemoPublishAccess("project / 1", "demo / 1", {
      visibility: "restricted",
      expires_at: null,
    })).resolves.toMatchObject({ publish_link: { visibility: "restricted" } });
    await expect(updateInteractiveDemoPublishPassword("project / 1", "demo / 1", {
      password: "shared password",
    })).resolves.toMatchObject({ publish_link: { password_protected: true } });
    await expect(revokeInteractiveDemoPublishLink("project / 1", "demo / 1")).resolves.toEqual(revoke_response);

    const base = "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/publish";
    expect(fetch).toHaveBeenNthCalledWith(1, base, {
      credentials: "include",
      headers: { accept: "application/json" },
    });
    expect(fetch).toHaveBeenNthCalledWith(2, base, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    expect(fetch).toHaveBeenNthCalledWith(3, `${base}/access`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        visibility: "restricted",
        expires_at: null,
      }),
    });
    expect(fetch).toHaveBeenNthCalledWith(4, `${base}/password`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        password: "shared password",
      }),
    });
    expect(fetch).toHaveBeenNthCalledWith(5, base, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });
  });

  it("creates public publish viewer sessions with credentials", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(createPublicPublishViewerSession("abc 123", {
      password: "shared password",
    })).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/publish-links/abc%20123/viewer-sessions",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Ossie-Access-Surface": "public_reader",
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          password: "shared password",
        }),
      }
    );
  });

  it("maps guide publish validation errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "guide_has_no_publishable_blocks",
        message: "Guide has no publishable blocks",
      },
    }), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(publishGuide("project_1", "guide_1")).rejects.toMatchObject({
      kind: "validation",
      type: "guide_has_no_publishable_blocks",
      message: "Guide has no publishable blocks",
    });

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "guide_not_publishable",
        message: "Guide is not publishable",
      },
    }), {
      status: 409,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(publishGuide("project_1", "guide_1")).rejects.toMatchObject({
      kind: "validation",
      type: "guide_not_publishable",
      message: "Guide is not publishable",
    });
  });

  it("maps missing or revoked public publish links to not found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "publish_link_not_found",
        message: "Publish link was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getPublicPublishLink("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "publish_link_not_found",
      message: "Publish link was not found",
    });
  });

  it("lists project guides with session cookies", async () => {
    const response = {
      guides: [guide_response.guide],
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectGuides("project_1")).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("creates a guide from a capture session with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(guide_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createGuideFromCaptureSession("project_1", "capture_session_1", {
      title: "Create department workflow",
      description: null,
    })).resolves.toEqual(guide_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/from-capture-session/capture_session_1",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Create department workflow",
          description: null,
        }),
      }
    );
  });

  it("creates an interactive demo from a capture session with session cookies", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(interactive_demo_from_capture_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(createInteractiveDemoFromCaptureSession("project / 1", "capture / 1")).resolves.toEqual(interactive_demo_from_capture_response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project%20%2F%201/capture-sessions/capture%20%2F%201/interactive-demos",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );
  });

  it("manages interactive demos and scenes with session cookies", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(interactive_demo_list_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(interactive_demo_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(interactive_demo_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_scene_list_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_scene_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_scene_list_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectInteractiveDemos("project / 1")).resolves.toEqual(interactive_demo_list_response);
    await expect(getInteractiveDemo("project / 1", "demo / 1")).resolves.toEqual(interactive_demo_response);
    await expect(updateInteractiveDemo("project / 1", "demo / 1", {
      title: "Updated demo",
      description: null,
      status: "draft",
    })).resolves.toEqual(interactive_demo_response);
    await expect(listInteractiveDemoScenes("project / 1", "demo / 1")).resolves.toEqual(demo_scene_list_response);
    await expect(updateInteractiveDemoScene("project / 1", "demo / 1", "scene / 1", {
      title: "Updated scene",
      description: null,
    })).resolves.toEqual(demo_scene_response);
    await expect(reorderInteractiveDemoScenes("project / 1", "demo / 1", ["scene / 2", "scene / 1"])).resolves.toEqual(demo_scene_list_response);
    await expect(archiveInteractiveDemo("project / 1", "demo / 1")).resolves.toBeUndefined();
    await expect(deleteInteractiveDemoScene("project / 1", "demo / 1", "scene / 1")).resolves.toBeUndefined();

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project%20%2F%201/interactive-demos",
      {
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201",
      {
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Updated demo",
          description: null,
          status: "draft",
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes",
      {
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      5,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Updated scene",
          description: null,
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      6,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/order",
      {
        method: "PUT",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scene_ids: ["scene / 2", "scene / 1"],
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      7,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201",
      {
        method: "DELETE",
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      8,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201",
      {
        method: "DELETE",
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
  });

  it("manages interactive demo hotspots with session cookies", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_hotspot_response), {
        status: 201,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_hotspot_list_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_hotspot_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(demo_hotspot_list_response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);

    await expect(createInteractiveDemoHotspot("project / 1", "demo / 1", "scene / 1", {
      hotspot_type: "click",
      label: "Continue",
      content: null,
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.12,
      target_scene_id: "scene / 2",
    })).resolves.toEqual(demo_hotspot_response);
    await expect(listInteractiveDemoHotspots("project / 1", "demo / 1", "scene / 1")).resolves.toEqual(demo_hotspot_list_response);
    await expect(updateInteractiveDemoHotspot("project / 1", "demo / 1", "scene / 1", "hotspot / 1", {
      label: "Updated",
      target_scene_id: null,
    })).resolves.toEqual(demo_hotspot_response);
    await expect(reorderInteractiveDemoHotspots("project / 1", "demo / 1", "scene / 1", ["hotspot / 2", "hotspot / 1"])).resolves.toEqual(demo_hotspot_list_response);
    await expect(deleteInteractiveDemoHotspot("project / 1", "demo / 1", "scene / 1", "hotspot / 1")).resolves.toBeUndefined();

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201/hotspots",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          hotspot_type: "click",
          label: "Continue",
          content: null,
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.12,
          target_scene_id: "scene / 2",
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201/hotspots",
      {
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201/hotspots/hotspot%20%2F%201",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          label: "Updated",
          target_scene_id: null,
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201/hotspots/order",
      {
        method: "PUT",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          hotspot_ids: ["hotspot / 2", "hotspot / 1"],
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      5,
      "/api/v1/projects/project%20%2F%201/interactive-demos/demo%20%2F%201/scenes/scene%20%2F%201/hotspots/hotspot%20%2F%201",
      {
        method: "DELETE",
        credentials: "include",
        headers: { accept: "application/json" },
      }
    );
  });

  it("updates guide metadata and guide steps", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      guide: guide_response.guide,
      guide_step: {
        id: "step_1",
        title: "Updated step",
        body: "Details",
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await updateGuide("project_1", "guide_1", {
      title: "Updated",
      description: null,
    });
    await updateGuideStep("project_1", "guide_1", "step_1", {
      title: "Updated step",
      body: "Details",
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project_1/guides/guide_1",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Updated",
          description: null,
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project_1/guides/guide_1/steps/step_1",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Updated step",
          body: "Details",
        }),
      }
    );
  });

  it("creates updates reorders and deletes guide blocks", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      guide_blocks: [],
      guide_block: {
        id: "block_1",
        content: {
          title: "Updated tip",
          body: "Details",
        },
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await createGuideBlock("project_1", "guide_1", {
      block_type: "tip",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        title: "Helpful tip",
        body: "Details",
      },
    });
    await updateGuideBlock("project_1", "guide_1", "block_1", {
      content: {
        title: "Updated tip",
        body: "Details",
      },
    });
    await reorderGuideBlocks("project_1", "guide_1", ["block_2", "block_1"]);
    await deleteGuideBlock("project_1", "guide_1", "block_1");

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project_1/guides/guide_1/blocks",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          block_type: "tip",
          position: {
            placement: "after",
            guide_block_id: "block_1",
          },
          content: {
            title: "Helpful tip",
            body: "Details",
          },
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project_1/guides/guide_1/blocks/block_1",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          content: {
            title: "Updated tip",
            body: "Details",
          },
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "/api/v1/projects/project_1/guides/guide_1/blocks/reorder",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          block_ids: ["block_2", "block_1"],
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      "/api/v1/projects/project_1/guides/guide_1/blocks/block_1",
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
  });

  it("creates paragraph and divider guide blocks", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      guide_blocks: [],
    }), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await createGuideBlock("project_1", "guide_1", {
      block_type: "paragraph",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        body: "Add supporting context.",
      },
    });
    await createGuideBlock("project_1", "guide_1", {
      block_type: "divider",
      position: {
        placement: "after",
        guide_block_id: "block_paragraph",
      },
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project_1/guides/guide_1/blocks",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          block_type: "paragraph",
          position: {
            placement: "after",
            guide_block_id: "block_1",
          },
          content: {
            body: "Add supporting context.",
          },
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project_1/guides/guide_1/blocks",
      {
        method: "POST",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          block_type: "divider",
          position: {
            placement: "after",
            guide_block_id: "block_paragraph",
          },
        }),
      }
    );
  });

  it("lists project screenshots and updates guide block screenshots", async () => {
    const screenshot_response = {
      capture_assets: [{
        id: "asset_1",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
      }],
    };
    const screenshot_update_response = {
      guide_block: {
        id: "block_1",
        selected_capture_asset_id: "asset_1",
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
      },
    };
    const fetch = vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes("/capture-assets") ? screenshot_response : screenshot_update_response
    ), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(listProjectScreenshotAssets("project_1")).resolves.toEqual(screenshot_response);
    await expect(updateGuideBlockScreenshot("project_1", "guide_1", "block_1", {
      capture_asset_id: "asset_1",
    })).resolves.toEqual(screenshot_update_response);
    await updateGuideBlockScreenshot("project_1", "guide_1", "block_1", {
      capture_asset_id: null,
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/projects/project_1/capture-assets?asset_type=screenshot",
      {
        credentials: "include",
        headers: {
          accept: "application/json",
        },
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          capture_asset_id: "asset_1",
        }),
      }
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          capture_asset_id: null,
        }),
      }
    );
  });

  it("updates guide block annotations", async () => {
    const response = {
      guide_block: {
        id: "block_1",
        content: {
          annotations: [{
            id: "ann_saved",
            type: "highlight",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
          }],
        },
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    await expect(updateGuideBlockAnnotations("project_1", "guide_1", "block_1", {
      annotations: [{
        id: "ann_existing",
        type: "highlight",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
      }],
    })).resolves.toEqual(response);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/projects/project_1/guides/guide_1/blocks/block_1/annotations",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          annotations: [{
            id: "ann_existing",
            type: "highlight",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
          }],
        }),
      }
    );
  });

  it("uploads a guide block screenshot as multipart form data", async () => {
    const upload_response = {
      guide_block: {
        id: "block_1",
        selected_capture_asset_id: "asset_uploaded",
        screenshot_hidden: false,
        display_capture_asset_id: "asset_uploaded",
      },
      capture_asset: {
        id: "asset_uploaded",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded/file",
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(upload_response), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);
    const file = new File(["fake png bytes"], "replacement.png", { type: "image/png" });

    await expect(uploadGuideBlockScreenshot("project_1", "guide_1", "block_1", {
      file,
      width: 1440,
      height: 900,
      devicePixelRatio: 2,
      pageUrl: "https://example.test/replacement",
      pageTitle: "Replacement",
      capturedAt: "2026-06-05T10:00:00.000Z",
      metadata: { source: "editor" },
    })).resolves.toEqual(upload_response);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/projects/project_1/guides/guide_1/blocks/block_1/screenshot-upload");
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
      },
    });
    expect(init.headers).not.toHaveProperty("content-type");
    expect(init.body).toBeInstanceOf(FormData);
    const body = init.body as FormData;
    expect(body.get("file")).toBe(file);
    expect(body.get("width")).toBe("1440");
    expect(body.get("height")).toBe("900");
    expect(body.get("device_pixel_ratio")).toBe("2");
    expect(body.get("page_url")).toBe("https://example.test/replacement");
    expect(body.get("page_title")).toBe("Replacement");
    expect(body.get("captured_at")).toBe("2026-06-05T10:00:00.000Z");
    expect(body.get("metadata")).toBe(JSON.stringify({ source: "editor" }));
  });

  it("maps known backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getCaptureSessionDetail("project_1", "capture_session_1")).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("maps invalid credentials while logging in", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "invalid_credentials",
        message: "Email or password is incorrect",
      },
    }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(login({
      email: "person@example.com",
      password: "wrong",
    })).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "invalid_credentials",
      message: "Email or password is incorrect",
    });
  });

  it("preserves backend error type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "guide_not_editable",
        message: "Guide is not editable",
      },
    }), {
      status: 409,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(updateGuideStep("project_1", "guide_1", "step_1", {
      title: "Blocked",
    })).rejects.toMatchObject({
      kind: "validation",
      type: "guide_not_editable",
      message: "Guide is not editable",
    });
  });

  it("maps not found errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "capture_session_not_found",
        message: "Capture session was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getCaptureSessionDetail("project_1", "missing")).rejects.toBeInstanceOf(ApiClientError);
    await expect(getCaptureSessionDetail("project_1", "missing")).rejects.toMatchObject({
      kind: "not_found",
    });
  });

  it("maps project not found errors while listing guides", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(listProjectGuides("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "project_not_found",
      message: "Project was not found",
    });
  });

  it("maps project not found errors while fetching project detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getProject("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "project_not_found",
      message: "Project was not found",
    });
  });

  it("maps unauthenticated errors while fetching project detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(getProject("project_1")).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("maps unauthenticated errors while listing projects", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(listProjects()).rejects.toMatchObject({
      kind: "unauthenticated",
      type: "unauthenticated",
      message: "Authentication is required",
    });
  });

  it("maps project not found errors while listing capture sessions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })));

    await expect(listProjectCaptureSessions("missing")).rejects.toMatchObject({
      kind: "not_found",
      type: "project_not_found",
      message: "Project was not found",
    });
  });

  it("queries compliance pages and Audit detail with encoded inputs", async () => {
    const response = {
      events: [],
      page: { next_cursor: null, has_more: false },
      totals: {
        audit_events: 0,
        audit_change_items: 0,
        access_events: 0,
        oldest_occurred_at: null,
        newest_occurred_at: null,
      },
    };
    const fetch = vi.fn(async () => new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetch);

    await listComplianceEvents({ kind: "access", cursor: "next page", limit: 10 });
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/v1/organization/compliance/events?kind=access&cursor=next+page&limit=10",
      expect.objectContaining({ credentials: "include" }),
    );
    await getComplianceAuditEvent("audit/id");
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/v1/organization/compliance/audit-events/audit%2Fid",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("uses only path-scoped Project membership, compliance, and Activity endpoints", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ members: [], events: [], page: { next_cursor: null, has_more: false }, totals: { audit_events: 0, audit_change_items: 0, access_events: 0, oldest_occurred_at: null, newest_occurred_at: null } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);
    await listProjectMemberships("project/id");
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/memberships", expect.anything());
    await assignProjectMembership("project/id", { org_user_id: "member-1", role: "viewer" });
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/memberships", expect.objectContaining({ method: "POST" }));
    await listProjectComplianceEvents("project/id", { kind: "audit" });
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/compliance/events?kind=audit", expect.anything());
    await listProjectActivity("project/id", { limit: 10 });
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/activity?limit=10", expect.anything());
  });

  it("encodes Project Version routes and sends optimistic mutation input", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ project_versions: [], project_version: {}, resolution: "canonical" }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);
    await listProjectVersions("project/id", { status: "archived" });
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/versions?status=archived", expect.anything());
    await resolveProjectVersion("project/id", "Q3 / old");
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/versions/resolve/Q3%20%2F%20old", expect.anything());
    await updateProjectVersion("project/id", "version/id", { expected_version: 2, name: "Q3" });
    expect(fetch).toHaveBeenLastCalledWith("/api/v1/projects/project%2Fid/versions/version%2Fid", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ expected_version: 2, name: "Q3" }) }));
  });

  it("maps compliance permission denials separately from authentication", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: { type: "compliance_permission_denied", message: "Owner required" },
    }), { status: 403, headers: { "content-type": "application/json" } })));

    await expect(listComplianceEvents()).rejects.toMatchObject({
      kind: "forbidden",
      type: "compliance_permission_denied",
    });
  });

  it("resolves relative asset URLs against optional API base URLs", () => {
    expect(resolveApiAssetUrl("/api/v1/projects/project_1/file")).toBe("/api/v1/projects/project_1/file");
    expect(resolveApiAssetUrl(
      "/api/v1/projects/project_1/file",
      "https://demo.example.com"
    )).toBe("https://demo.example.com/api/v1/projects/project_1/file");
  });
});
