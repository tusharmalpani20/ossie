export type PortalRoute =
  | {
    type: "login";
  }
  | {
    type: "setup";
  }
  | {
    type: "project_list";
  }
  | {
    type: "organization_members";
  }
  | {
    type: "organization_compliance";
  }
  | {
    type: "organization_invite_accept";
    token: string;
  }
  | {
    type: "project_workspace";
    projectId: string;
  }
  | {
    type: "project_settings";
    projectId: string;
  }
  | {
    type: "capture_session_detail";
    projectId: string;
    captureSessionId: string;
  }
  | {
    type: "project_capture_session_list";
    projectId: string;
  }
  | {
    type: "guide_detail";
    projectId: string;
    guideId: string;
  }
  | {
    type: "guide_preview";
    projectId: string;
    guideId: string;
  }
  | {
    type: "project_guide_list";
    projectId: string;
  }
  | {
    type: "project_interactive_demo_list";
    projectId: string;
  }
  | {
    type: "interactive_demo_detail";
    projectId: string;
    interactiveDemoId: string;
  }
  | {
    type: "public_guide_reader";
    slug: string;
  }
  | {
    type: "public_guide_embed";
    slug: string;
  }
  | {
    type: "public_interactive_demo_reader";
    slug: string;
  }
  | {
    type: "public_interactive_demo_embed";
    slug: string;
  }
  | {
    type: "unsupported";
  };

export const parsePortalRoute = (pathname: string): PortalRoute => {
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments.length === 1
    && segments[0] === "login"
  ) {
    return { type: "login" };
  }

  if (
    segments.length === 1
    && segments[0] === "setup"
  ) {
    return { type: "setup" };
  }

  if (
    segments.length === 0
    || (
      segments.length === 1
      && segments[0] === "projects"
    )
  ) {
    return { type: "project_list" };
  }

  if (
    segments.length === 2
    && segments[0] === "organization"
    && segments[1] === "members"
  ) {
    return { type: "organization_members" };
  }

  if (
    segments.length === 2
    && segments[0] === "organization"
    && segments[1] === "compliance"
  ) {
    return { type: "organization_compliance" };
  }

  if (
    segments.length === 2
    && segments[0] === "invites"
  ) {
    const token = segments[1];

    if (!token) {
      return { type: "unsupported" };
    }

    return {
      type: "organization_invite_accept",
      token: decodeURIComponent(token),
    };
  }

  if (
    segments.length === 2
    && segments[0] === "p"
  ) {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_guide_reader",
      slug: decodeURIComponent(slug),
    };
  }

  if (
    segments.length === 2
    && segments[0] === "d"
  ) {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_interactive_demo_reader",
      slug: decodeURIComponent(slug),
    };
  }

  if (
    segments.length === 3
    && segments[0] === "p"
    && segments[2] === "embed"
  ) {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_guide_embed",
      slug: decodeURIComponent(slug),
    };
  }

  if (
    segments.length === 3
    && segments[0] === "d"
    && segments[2] === "embed"
  ) {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_interactive_demo_embed",
      slug: decodeURIComponent(slug),
    };
  }

  if (
    segments.length === 2
    && segments[0] === "projects"
  ) {
    const projectId = segments[1];

    if (!projectId) {
      return { type: "unsupported" };
    }

    return {
      type: "project_workspace",
      projectId: decodeURIComponent(projectId),
    };
  }

  if (
    segments.length === 3
    && segments[0] === "projects"
    && segments[2] === "settings"
  ) {
    const projectId = segments[1];

    if (!projectId) {
      return { type: "unsupported" };
    }

    return {
      type: "project_settings",
      projectId: decodeURIComponent(projectId),
    };
  }

  if (
    segments.length === 4
    && segments[0] === "projects"
    && segments[2] === "capture-sessions"
  ) {
    const projectId = segments[1];
    const captureSessionId = segments[3];

    if (!projectId || !captureSessionId) {
      return { type: "unsupported" };
    }

    return {
      type: "capture_session_detail",
      projectId: decodeURIComponent(projectId),
      captureSessionId: decodeURIComponent(captureSessionId),
    };
  }

  if (
    segments.length === 3
    && segments[0] === "projects"
    && segments[2] === "capture-sessions"
  ) {
    const projectId = segments[1];

    if (!projectId) {
      return { type: "unsupported" };
    }

    return {
      type: "project_capture_session_list",
      projectId: decodeURIComponent(projectId),
    };
  }

  if (
    segments.length === 5
    && segments[0] === "projects"
    && segments[2] === "guides"
    && segments[4] === "preview"
  ) {
    const projectId = segments[1];
    const guideId = segments[3];

    if (!projectId || !guideId) {
      return { type: "unsupported" };
    }

    return {
      type: "guide_preview",
      projectId: decodeURIComponent(projectId),
      guideId: decodeURIComponent(guideId),
    };
  }

  if (
    segments.length === 4
    && segments[0] === "projects"
    && segments[2] === "guides"
  ) {
    const projectId = segments[1];
    const guideId = segments[3];

    if (!projectId || !guideId) {
      return { type: "unsupported" };
    }

    return {
      type: "guide_detail",
      projectId: decodeURIComponent(projectId),
      guideId: decodeURIComponent(guideId),
    };
  }

  if (
    segments.length === 4
    && segments[0] === "projects"
    && segments[2] === "interactive-demos"
  ) {
    const projectId = segments[1];
    const interactiveDemoId = segments[3];

    if (!projectId || !interactiveDemoId) {
      return { type: "unsupported" };
    }

    return {
      type: "interactive_demo_detail",
      projectId: decodeURIComponent(projectId),
      interactiveDemoId: decodeURIComponent(interactiveDemoId),
    };
  }

  if (
    segments.length === 3
    && segments[0] === "projects"
    && segments[2] === "interactive-demos"
  ) {
    const projectId = segments[1];

    if (!projectId) {
      return { type: "unsupported" };
    }

    return {
      type: "project_interactive_demo_list",
      projectId: decodeURIComponent(projectId),
    };
  }

  if (
    segments.length === 3
    && segments[0] === "projects"
    && segments[2] === "guides"
  ) {
    const projectId = segments[1];

    if (!projectId) {
      return { type: "unsupported" };
    }

    return {
      type: "project_guide_list",
      projectId: decodeURIComponent(projectId),
    };
  }

  return { type: "unsupported" };
};
