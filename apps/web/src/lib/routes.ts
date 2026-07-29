/**
 * @fileoverview Portal route parser for Ossie web routes.
 */

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
      type: "project_version_workspace";
      projectId: string;
      versionSlug: string;
    }
  | { type: "project_carry_forward"; projectId: string; versionSlug: string }
  | {
      type: "artifact_revision_history";
      projectId: string;
      versionSlug: string;
      artifactType: "guide" | "interactive_demo";
      artifactId: string;
    }
  | {
      type: "artifact_revision_preview";
      projectId: string;
      versionSlug: string;
      artifactType: "guide" | "interactive_demo";
      artifactId: string;
      revisionNumber: number;
    }
  | {
      type: "project_settings";
      projectId: string;
    }
  | { type: "project_compliance"; projectId: string }
  | { type: "project_activity"; projectId: string }
  | {
      type: "capture_session_detail";
      projectId: string;
      captureSessionId: string;
      versionSlug?: string;
    }
  | {
      type: "project_capture_session_list";
      projectId: string;
      versionSlug?: string;
    }
  | {
      type: "guide_detail";
      projectId: string;
      guideId: string;
      versionSlug?: string;
    }
  | {
      type: "guide_preview";
      projectId: string;
      guideId: string;
      versionSlug?: string;
    }
  | {
      type: "project_guide_list";
      projectId: string;
      versionSlug?: string;
    }
  | {
      type: "project_interactive_demo_list";
      projectId: string;
      versionSlug?: string;
    }
  | {
      type: "interactive_demo_detail";
      projectId: string;
      interactiveDemoId: string;
      versionSlug?: string;
    }
  | {
      type: "interactive_demo_preview";
      projectId: string;
      interactiveDemoId: string;
      versionSlug?: string;
    }
  | {
      type: "public_guide_reader";
      slug: string;
      versionSlug?: string;
    }
  | {
      type: "public_guide_embed";
      slug: string;
      versionSlug?: string;
    }
  | {
      type: "public_interactive_demo_reader";
      slug: string;
      versionSlug?: string;
    }
  | {
      type: "public_interactive_demo_embed";
      slug: string;
      versionSlug?: string;
    }
  | {
      type: "design_system_review";
    }
  | {
      type: "unsupported";
    };

/** Parses a browser pathname into the portal route union. */
export const parsePortalRoute = (pathname: string): PortalRoute => {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1 && segments[0] === "__design-system") {
    return { type: "design_system_review" };
  }

  if (
    segments[0] === "projects" &&
    segments[2] === "versions" &&
    segments[1] &&
    segments[3]
  ) {
    const projectId = decodeURIComponent(segments[1]);
    const versionSlug = decodeURIComponent(segments[3]);
    const rest = segments.slice(4);
    if (rest.length === 0)
      return { type: "project_version_workspace", projectId, versionSlug };
    if (rest.length === 1 && rest[0] === "carry-forward")
      return { type: "project_carry_forward", projectId, versionSlug };
    if (rest[0] === "capture-sessions") {
      if (rest.length === 1)
        return { type: "project_capture_session_list", projectId, versionSlug };
      if (rest.length === 2 && rest[1])
        return {
          type: "capture_session_detail",
          projectId,
          versionSlug,
          captureSessionId: decodeURIComponent(rest[1]),
        };
    }
    if (rest[0] === "guides") {
      if (rest.length === 1)
        return { type: "project_guide_list", projectId, versionSlug };
      if (rest.length === 2 && rest[1])
        return {
          type: "guide_detail",
          projectId,
          versionSlug,
          guideId: decodeURIComponent(rest[1]),
        };
      if (rest.length === 3 && rest[1] && rest[2] === "preview")
        return {
          type: "guide_preview",
          projectId,
          versionSlug,
          guideId: decodeURIComponent(rest[1]),
        };
      if (rest.length === 3 && rest[1] && rest[2] === "revisions")
        return {
          type: "artifact_revision_history",
          projectId,
          versionSlug,
          artifactType: "guide",
          artifactId: decodeURIComponent(rest[1]),
        };
      if (
        rest.length === 4 &&
        rest[1] &&
        rest[2] === "revisions" &&
        /^\d+$/u.test(rest[3] ?? "")
      )
        return {
          type: "artifact_revision_preview",
          projectId,
          versionSlug,
          artifactType: "guide",
          artifactId: decodeURIComponent(rest[1]),
          revisionNumber: Number(rest[3]),
        };
    }
    if (rest[0] === "interactive-demos") {
      if (rest.length === 1)
        return {
          type: "project_interactive_demo_list",
          projectId,
          versionSlug,
        };
      if (rest.length === 2 && rest[1])
        return {
          type: "interactive_demo_detail",
          projectId,
          versionSlug,
          interactiveDemoId: decodeURIComponent(rest[1]),
        };
      if (rest.length === 3 && rest[1] && rest[2] === "preview")
        return {
          type: "interactive_demo_preview",
          projectId,
          versionSlug,
          interactiveDemoId: decodeURIComponent(rest[1]),
        };
      if (rest.length === 3 && rest[1] && rest[2] === "revisions")
        return {
          type: "artifact_revision_history",
          projectId,
          versionSlug,
          artifactType: "interactive_demo",
          artifactId: decodeURIComponent(rest[1]),
        };
      if (
        rest.length === 4 &&
        rest[1] &&
        rest[2] === "revisions" &&
        /^\d+$/u.test(rest[3] ?? "")
      )
        return {
          type: "artifact_revision_preview",
          projectId,
          versionSlug,
          artifactType: "interactive_demo",
          artifactId: decodeURIComponent(rest[1]),
          revisionNumber: Number(rest[3]),
        };
    }
    return { type: "unsupported" };
  }

  if (segments.length === 1 && segments[0] === "login") {
    return { type: "login" };
  }

  if (segments.length === 1 && segments[0] === "setup") {
    return { type: "setup" };
  }

  if (
    segments.length === 0 ||
    (segments.length === 1 && segments[0] === "projects")
  ) {
    return { type: "project_list" };
  }

  if (
    segments.length === 2 &&
    segments[0] === "organization" &&
    segments[1] === "members"
  ) {
    return { type: "organization_members" };
  }

  if (
    segments.length === 2 &&
    segments[0] === "organization" &&
    segments[1] === "compliance"
  ) {
    return { type: "organization_compliance" };
  }

  if (segments.length === 2 && segments[0] === "invites") {
    const token = segments[1];

    if (!token) {
      return { type: "unsupported" };
    }

    return {
      type: "organization_invite_accept",
      token: decodeURIComponent(token),
    };
  }

  if (segments.length === 2 && segments[0] === "p") {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_guide_reader",
      slug: decodeURIComponent(slug),
    };
  }

  if (segments.length === 2 && segments[0] === "d") {
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
    segments.length >= 4 &&
    segments[2] === "versions" &&
    (segments[0] === "p" || segments[0] === "d")
  ) {
    const slug = segments[1],
      versionSlug = segments[3],
      embed = segments.length === 5 && segments[4] === "embed";
    if (!slug || !versionSlug || (segments.length !== 4 && !embed))
      return { type: "unsupported" };
    if (segments[0] === "p")
      return {
        type: embed ? "public_guide_embed" : "public_guide_reader",
        slug: decodeURIComponent(slug),
        versionSlug: decodeURIComponent(versionSlug),
      };
    return {
      type: embed
        ? "public_interactive_demo_embed"
        : "public_interactive_demo_reader",
      slug: decodeURIComponent(slug),
      versionSlug: decodeURIComponent(versionSlug),
    };
  }

  if (segments.length === 3 && segments[0] === "p" && segments[2] === "embed") {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_guide_embed",
      slug: decodeURIComponent(slug),
    };
  }

  if (segments.length === 3 && segments[0] === "d" && segments[2] === "embed") {
    const slug = segments[1];

    if (!slug) {
      return { type: "unsupported" };
    }

    return {
      type: "public_interactive_demo_embed",
      slug: decodeURIComponent(slug),
    };
  }

  if (segments.length === 2 && segments[0] === "projects") {
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
    segments.length === 3 &&
    segments[0] === "projects" &&
    segments[2] === "settings"
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
    segments.length === 3 &&
    segments[0] === "projects" &&
    (segments[2] === "compliance" || segments[2] === "activity")
  ) {
    const projectId = segments[1];
    if (!projectId) return { type: "unsupported" };
    return {
      type:
        segments[2] === "compliance"
          ? "project_compliance"
          : "project_activity",
      projectId: decodeURIComponent(projectId),
    };
  }

  if (
    segments.length === 5 &&
    segments[0] === "projects" &&
    segments[2] === "interactive-demos" &&
    segments[4] === "preview"
  ) {
    const projectId = segments[1];
    const interactiveDemoId = segments[3];

    if (!projectId || !interactiveDemoId) {
      return { type: "unsupported" };
    }

    return {
      type: "interactive_demo_preview",
      projectId: decodeURIComponent(projectId),
      interactiveDemoId: decodeURIComponent(interactiveDemoId),
    };
  }

  if (
    segments.length === 4 &&
    segments[0] === "projects" &&
    segments[2] === "capture-sessions"
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
    segments.length === 3 &&
    segments[0] === "projects" &&
    segments[2] === "capture-sessions"
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
    segments.length === 5 &&
    segments[0] === "projects" &&
    segments[2] === "guides" &&
    segments[4] === "preview"
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
    segments.length === 4 &&
    segments[0] === "projects" &&
    segments[2] === "guides"
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
    segments.length === 4 &&
    segments[0] === "projects" &&
    segments[2] === "interactive-demos"
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
    segments.length === 3 &&
    segments[0] === "projects" &&
    segments[2] === "interactive-demos"
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
    segments.length === 3 &&
    segments[0] === "projects" &&
    segments[2] === "guides"
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
