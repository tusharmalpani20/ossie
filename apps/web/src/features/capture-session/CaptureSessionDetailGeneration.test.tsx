/**
 * @fileoverview Capture Session artifact generation route tests.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GuideDetail } from "../guide/types";
import type { CreateInteractiveDemoFromCaptureResponse } from "../interactive-demo/types";
import { CaptureSessionDetailPage } from "./CaptureSessionDetailPage";
import type { CaptureEvent, CaptureSessionDetail } from "./types";

const event: CaptureEvent = {
  id: "event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: null,
  event_type: "note",
  event_index: 1,
  occurred_at: "2026-06-05T10:01:00.000Z",
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
  note: "Start from department list",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:01:00.000Z",
  updated_at: "2026-06-05T10:01:00.000Z",
};

const namedVersionDetail: CaptureSessionDetail = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    project_version_id: "version_named",
    project_version: {
      id: "version_named",
      name: "Summer release",
      slug: "summer-release",
      status: "active",
      position: 2,
    },
    name: "Create department workflow",
    description: "Source capture for the department setup guide",
    status: "completed",
    source_type: "manual",
    started_at: "2026-06-05T10:00:00.000Z",
    completed_at: "2026-06-05T10:05:00.000Z",
    canceled_at: null,
    start_url: null,
    browser_name: null,
    browser_version: null,
    operating_system: null,
    viewport_width: null,
    viewport_height: null,
    device_pixel_ratio: null,
    user_agent: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
  capture_events: [event],
  capture_assets: [],
};

const guideDetail: GuideDetail = {
  artifact: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: "2026-06-05T10:00:00.000Z",
  },
  edition: {
    id: "guide_edition_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_id: "guide_1",
    project_version_id: "version_named",
    source_capture_session_id: "capture_session_1",
    title: "Create department workflow",
    description: "Source capture for the department setup guide",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  working_draft: {
    id: "guide_draft_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_edition_id: "guide_edition_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  authored_updated_at: "2026-06-05T10:00:00.000Z",
  guide_blocks: [],
  source_capture_assets: [],
};

const interactiveDemoDetail: CreateInteractiveDemoFromCaptureResponse = {
  artifact: {
    id: "interactive_demo_1",
    organization_id: "organization_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: "2026-06-05T10:00:00.000Z",
  },
  edition: {
    id: "demo_edition_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    project_version_id: "version_named",
    source_capture_session_id: "capture_session_1",
    title: "Create department workflow",
    description: "Source capture for the department setup guide",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  working_draft: {
    id: "demo_draft_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_edition_id: "demo_edition_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  authored_updated_at: "2026-06-05T10:00:00.000Z",
  demo_scenes: [],
  redirect_path:
    "/projects/project_1/versions/summer-release/interactive-demos/interactive_demo_1",
};

describe("CaptureSessionDetailPage generation", () => {
  it("creates Guide and Interactive Demo from named Project Versions", async () => {
    const createGuide = vi.fn(async () => guideDetail);
    const createInteractiveDemo = vi.fn(async () => interactiveDemoDetail);
    const redirectTo = vi.fn();
    render(
      <CaptureSessionDetailPage
        projectId="project_1"
        captureSessionId="capture_session_1"
        versionSlug="summer-release"
        isDefaultVersion={false}
        loadDetail={async () => namedVersionDetail}
        resolveAssetUrl={(fileUrl) => fileUrl}
        createGuide={createGuide}
        createInteractiveDemo={createInteractiveDemo}
        redirectTo={redirectTo}
      />,
    );

    await screen.findByRole("heading", {
      name: "Create department workflow",
    });

    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));
    await waitFor(() => expect(createGuide).toHaveBeenCalledOnce());
    expect(redirectTo).toHaveBeenCalledWith(
      "/projects/project_1/versions/summer-release/guides/guide_1",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Create interactive demo" }),
    );
    await waitFor(() => expect(createInteractiveDemo).toHaveBeenCalledOnce());
    expect(redirectTo).toHaveBeenCalledWith(
      "/projects/project_1/versions/summer-release/interactive-demos/interactive_demo_1",
    );
  });
});
