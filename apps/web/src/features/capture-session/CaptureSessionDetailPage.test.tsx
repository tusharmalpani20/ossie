import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ProjectVersion } from "@repo/types/project-version";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import type { GuideDetail } from "../guide/types";
import type { CreateInteractiveDemoFromCaptureResponse } from "../interactive-demo/types";
import type {
  CaptureAsset,
  CaptureEvent,
  CaptureSessionDetail,
  CreateCaptureEventInput,
  CreateCaptureEventResponse,
  UpdateCaptureEventInput,
  UpdateCaptureEventResponse,
  UploadCaptureAssetInput,
  UploadCaptureAssetResponse,
} from "./types";
import { CaptureSessionDetailPage } from "./CaptureSessionDetailPage";

const detail: CaptureSessionDetail = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    project_version_id: "version_1",
    project_version: {
      id: "version_1",
      name: "Current",
      slug: "current",
      status: "active",
      position: 1,
    },
    name: "Create department workflow",
    description: "Source capture for the department setup guide",
    status: "completed",
    source_type: "extension",
    started_at: "2026-06-05T10:00:00.000Z",
    completed_at: "2026-06-05T10:05:00.000Z",
    canceled_at: null,
    start_url: "https://example.internal/app/department",
    browser_name: "Chrome",
    browser_version: "126",
    operating_system: "Linux",
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 1,
    user_agent: "Mozilla/5.0",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
  capture_events: [
    {
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
      target_selector: "#private-selector",
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
    },
    {
      id: "event_2",
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      capture_asset_id: "asset_1",
      event_type: "click",
      event_index: 2,
      occurred_at: "2026-06-05T10:02:00.000Z",
      page_url: "https://example.internal/app/department",
      page_title: "Department",
      target_label: "Add Department",
      target_selector: null,
      target_role: "button",
      target_test_id: null,
      target_text: null,
      client_x: 1200,
      client_y: 88,
      viewport_width: 1440,
      viewport_height: 900,
      device_pixel_ratio: 1,
      input_intent: null,
      input_value_redacted: true,
      note: null,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:02:00.000Z",
      updated_at: "2026-06-05T10:02:00.000Z",
    },
  ],
  capture_assets: [
    {
      id: "asset_1",
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      file: {
        id: "file_1",
        storage_provider: "local",
        mime_type: "image/png",
        size_bytes: 123456,
        original_name: "department-list.png",
        checksum_sha256: "checksum",
      },
      asset_type: "screenshot",
      status: "active",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.internal/app/department",
      page_title: "Department",
      captured_at: "2026-06-05T10:02:00.000Z",
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:02:00.000Z",
      updated_at: "2026-06-05T10:02:00.000Z",
      file_url:
        "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    },
  ],
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
    project_version_id: "version_1",
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

const interactiveDemoFromCapture: CreateInteractiveDemoFromCaptureResponse = {
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
    project_version_id: "version_1",
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
    "/projects/project_1/versions/version_1/interactive-demos/interactive_demo_1",
};

const uploadedAsset: CaptureAsset = {
  id: "asset_uploaded",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_uploaded",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 456,
    original_name: "uploaded-department.png",
    checksum_sha256: "uploaded_checksum",
  },
  asset_type: "screenshot",
  status: "active",
  width: null,
  height: null,
  device_pixel_ratio: null,
  page_url: "https://example.internal/app/department",
  page_title: "Department Upload",
  captured_at: "2026-06-12T00:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-12T00:00:00.000Z",
  updated_at: "2026-06-12T00:00:00.000Z",
  file_url:
    "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded/file",
};

const uploadedEvent: CaptureEvent = {
  id: "event_uploaded",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "asset_uploaded",
  event_type: "capture",
  event_index: 3,
  occurred_at: "2026-06-12T00:00:00.000Z",
  page_url: "https://example.internal/app/department",
  page_title: "Department Upload",
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
  note: "Uploaded screenshot: uploaded-department.png",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-12T00:00:00.000Z",
  updated_at: "2026-06-12T00:00:00.000Z",
};

const secondUploadedAsset: CaptureAsset = {
  ...uploadedAsset,
  id: "asset_uploaded_second",
  file: {
    ...uploadedAsset.file,
    id: "file_uploaded_second",
    original_name: "uploaded-review.png",
    checksum_sha256: "uploaded_second_checksum",
  },
  file_url:
    "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded_second/file",
};

const secondUploadedEvent: CaptureEvent = {
  ...uploadedEvent,
  id: "event_uploaded_second",
  capture_asset_id: "asset_uploaded_second",
  event_index: 4,
  note: "Uploaded screenshot: uploaded-review.png",
};

const manualDetail = (): CaptureSessionDetail => ({
  ...detail,
  capture_session: {
    ...detail.capture_session,
    status: "draft",
    source_type: "manual",
    completed_at: null,
    browser_name: null,
    browser_version: null,
    operating_system: null,
    viewport_width: null,
    viewport_height: null,
    device_pixel_ratio: null,
  },
});

const summerReleaseVersion: ProjectVersion = {
  id: "version_2",
  organization_id: "organization_1",
  project_id: "project_1",
  name: "Summer release",
  description: null,
  slug: "summer-release",
  release_date: null,
  position: 2,
  status: "active",
  is_default: false,
  version: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:00:00.000Z",
};

const emptyDraftDetail = (): CaptureSessionDetail => ({
  ...manualDetail(),
  capture_session: {
    ...manualDetail().capture_session,
    started_at: null,
  },
  capture_events: [],
  capture_assets: [],
});

const renderPage = (
  overrides: {
    loadDetail?: () => Promise<CaptureSessionDetail>;
    resolveAssetUrl?: (fileUrl: string) => string;
    createGuide?: () => Promise<GuideDetail>;
    createInteractiveDemo?: (
      projectId: string,
      captureSessionId: string,
      input: {
        title?: string;
        description?: string | null;
      },
    ) => Promise<CreateInteractiveDemoFromCaptureResponse>;
    uploadAsset?: (
      projectId: string,
      captureSessionId: string,
      input: {
        file: File;
        page_url?: string | null;
        page_title?: string | null;
        captured_at?: string;
      },
    ) => Promise<{ capture_asset: CaptureAsset }>;
    createCaptureEvent?: (
      projectId: string,
      captureSessionId: string,
      input: {
        event_type: "capture";
        event_index: number;
        capture_asset_id?: string | null;
        occurred_at?: string | null;
        page_url?: string | null;
        page_title?: string | null;
        target_label?: string | null;
        note?: string | null;
      },
    ) => Promise<{ capture_event: CaptureEvent }>;
    reorderEvents?: (
      projectId: string,
      captureSessionId: string,
      input: {
        event_ids: string[];
      },
    ) => Promise<{ capture_events: CaptureEvent[] }>;
    updateEvent?: (
      projectId: string,
      captureSessionId: string,
      eventId: string,
      input: UpdateCaptureEventInput,
    ) => Promise<UpdateCaptureEventResponse>;
    redirectTo?: (path: string) => void;
    projectVersions?: ProjectVersion[];
    reassignProjectVersion?: ComponentProps<
      typeof CaptureSessionDetailPage
    >["reassignProjectVersion"];
    canWrite?: boolean;
  } = {},
) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => detail);
  const resolveAssetUrl =
    overrides.resolveAssetUrl ??
    ((fileUrl: string) => `https://api.example.com${fileUrl}`);
  const createGuide = overrides.createGuide ?? vi.fn(async () => guideDetail);
  const createInteractiveDemo =
    overrides.createInteractiveDemo ??
    vi.fn(async () => interactiveDemoFromCapture);
  const uploadAsset =
    overrides.uploadAsset ??
    vi.fn(async () => ({ capture_asset: uploadedAsset }));
  const createCaptureEvent =
    overrides.createCaptureEvent ??
    vi.fn(async () => ({ capture_event: uploadedEvent }));
  const reorderEvents =
    overrides.reorderEvents ??
    vi.fn(async () => ({ capture_events: manualDetail().capture_events }));
  const updateEvent =
    overrides.updateEvent ??
    vi.fn(async () => ({
      capture_event: manualDetail().capture_events[0] as CaptureEvent,
    }));
  const redirectTo = overrides.redirectTo ?? vi.fn();

  render(
    <CaptureSessionDetailPage
      projectId="project_1"
      captureSessionId="capture_session_1"
      loadDetail={loadDetail}
      resolveAssetUrl={resolveAssetUrl}
      createGuide={createGuide}
      createInteractiveDemo={createInteractiveDemo}
      uploadAsset={uploadAsset}
      createCaptureEvent={createCaptureEvent}
      reorderEvents={reorderEvents}
      updateEvent={updateEvent}
      redirectTo={redirectTo}
      projectVersions={overrides.projectVersions}
      reassignProjectVersion={overrides.reassignProjectVersion}
      canWrite={overrides.canWrite}
    />,
  );

  return {
    loadDetail,
    createGuide,
    createInteractiveDemo,
    uploadAsset,
    createCaptureEvent,
    reorderEvents,
    updateEvent,
    redirectTo,
  };
};

describe("CaptureSessionDetailPage", () => {
  it("keeps capture evidence readable without exposing authoring controls", async () => {
    renderPage({ canWrite: false });

    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create guide" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create interactive demo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Save event/ }),
    ).not.toBeInTheDocument();
  });

  it("renders session metadata events and asset previews", async () => {
    const { loadDetail } = renderPage();

    expect(screen.getByText("Loading capture session...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("extension")).toBeInTheDocument();
    expect(screen.getByText("2 events")).toBeInTheDocument();
    expect(screen.getByText("1 asset")).toBeInTheDocument();
    expect(screen.getByText("Start from department list")).toBeInTheDocument();
    expect(screen.getByText("Add Department")).toBeInTheDocument();
    expect(screen.getByText("Linked screenshot")).toBeInTheDocument();
    expect(screen.getByText("department-list.png")).toBeInTheDocument();

    const preview = screen.getByRole("img", { name: "Department screenshot" });
    expect(preview).toHaveAttribute(
      "src",
      "https://api.example.com/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    );
    expect(loadDetail).toHaveBeenCalledWith("project_1", "capture_session_1");
    expect(screen.queryByText("#private-selector")).not.toBeInTheDocument();
    expect(screen.queryByText("storage_key")).not.toBeInTheDocument();
    expect(screen.queryByText("metadata")).not.toBeInTheDocument();
  });

  it("renders empty states", async () => {
    const { createGuide, createInteractiveDemo } = renderPage({
      loadDetail: async () => ({
        ...detail,
        capture_events: [],
        capture_assets: [],
      }),
    });

    expect(
      await screen.findByText("No capture events yet."),
    ).toBeInTheDocument();
    expect(screen.getByText("No capture assets yet.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add at least one capture event before creating guide or demo artifacts.",
      ),
    ).toBeInTheDocument();

    const createGuideButton = screen.getByRole("button", {
      name: "Create guide",
    });
    const createDemoButton = screen.getByRole("button", {
      name: "Create interactive demo",
    });
    expect(createGuideButton).toBeDisabled();
    expect(createDemoButton).toBeDisabled();
    expect(createGuideButton).toHaveAccessibleDescription(
      "Add at least one capture event before creating guide or demo artifacts.",
    );
    expect(createDemoButton).toHaveAccessibleDescription(
      "Add at least one capture event before creating guide or demo artifacts.",
    );

    fireEvent.click(createGuideButton);
    fireEvent.click(createDemoButton);

    expect(createGuide).not.toHaveBeenCalled();
    expect(createInteractiveDemo).not.toHaveBeenCalled();
  });

  it("renders screenshot upload controls for manual capture sessions only", async () => {
    renderPage({ loadDetail: async () => manualDetail() });

    expect(
      await screen.findByRole("heading", { name: "Upload screenshot" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Screenshot file")).toHaveAttribute(
      "multiple",
    );
    expect(screen.getByLabelText("Page title")).toBeInTheDocument();
    expect(screen.getByLabelText("Page URL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload Screenshot" }),
    ).toBeInTheDocument();
  });

  it("moves an empty draft to an active Project Version with optimistic concurrency", async () => {
    const movedSession = {
      ...emptyDraftDetail().capture_session,
      project_version_id: summerReleaseVersion.id,
      project_version: {
        id: summerReleaseVersion.id,
        name: summerReleaseVersion.name,
        slug: summerReleaseVersion.slug,
        status: summerReleaseVersion.status,
        position: summerReleaseVersion.position,
      },
      version: 3,
    };
    const reassignProjectVersion = vi.fn(async () => ({
      capture_session: movedSession,
    }));
    const { redirectTo } = renderPage({
      loadDetail: async () => emptyDraftDetail(),
      projectVersions: [summerReleaseVersion],
      reassignProjectVersion,
    });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(
      screen.getByLabelText("Move empty draft to Project Version"),
      { target: { value: summerReleaseVersion.id } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Move draft" }));

    await waitFor(() =>
      expect(reassignProjectVersion).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        {
          project_version_id: summerReleaseVersion.id,
          expected_version: 2,
        },
      ),
    );
    expect(redirectTo).toHaveBeenCalledWith(
      "/projects/project_1/versions/summer-release/capture-sessions/capture_session_1",
    );
  });

  it("reloads an empty draft and explains a failed stale reassignment", async () => {
    const loadDetail = vi.fn(async () => emptyDraftDetail());
    const reassignProjectVersion = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 409,
        type: "capture_session_version_conflict",
        message: "Capture Session version conflict",
      });
    });
    renderPage({
      loadDetail,
      projectVersions: [summerReleaseVersion],
      reassignProjectVersion,
    });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(
      screen.getByLabelText("Move empty draft to Project Version"),
      { target: { value: summerReleaseVersion.id } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Move draft" }));

    expect(
      await screen.findByText(
        "The draft changed or can no longer be moved. Current data was reloaded.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
  });

  it("hides screenshot upload controls for extension capture sessions", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Upload screenshot" }),
    ).not.toBeInTheDocument();
  });

  it("validates screenshot upload input before submitting", async () => {
    const { uploadAsset, createCaptureEvent } = renderPage({
      loadDetail: async () => manualDetail(),
    });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    expect(
      screen.getByText("Choose a screenshot to upload."),
    ).toBeInTheDocument();
    expect(uploadAsset).not.toHaveBeenCalled();

    const textFile = new File(["text"], "notes.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [textFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    expect(
      screen.getByText("Only PNG, JPEG, and WebP screenshots can be uploaded."),
    ).toBeInTheDocument();
    expect(uploadAsset).not.toHaveBeenCalled();
    expect(createCaptureEvent).not.toHaveBeenCalled();
  });

  it("clears screenshot upload validation errors when users edit the form", async () => {
    renderPage({ loadDetail: async () => manualDetail() });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    expect(
      screen.getByText("Choose a screenshot to upload."),
    ).toBeInTheDocument();

    const file = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [file] },
    });

    expect(
      screen.queryByText("Choose a screenshot to upload."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    await waitFor(() =>
      expect(
        screen.queryByText("Choose a screenshot to upload."),
      ).not.toBeInTheDocument(),
    );
  });

  it("announces the screenshot upload region and selected-file queue", async () => {
    renderPage({ loadDetail: async () => manualDetail() });

    expect(
      await screen.findByRole("region", { name: "Upload screenshot" }),
    ).toBeInTheDocument();

    const file = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [file] },
    });

    const queue = screen.getByRole("status", {
      name: "Selected screenshots",
    });
    expect(queue).toHaveAttribute("aria-live", "polite");
    expect(queue).toHaveTextContent("uploaded-department.png");
    expect(queue).toHaveTextContent("Queued");
  });

  it("uploads screenshots creates linked capture events and reloads detail", async () => {
    const firstDetail = manualDetail();
    const secondDetail: CaptureSessionDetail = {
      ...firstDetail,
      capture_events: [...firstDetail.capture_events, uploadedEvent],
      capture_assets: [...firstDetail.capture_assets, uploadedAsset],
    };
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(secondDetail);
    const uploadAsset = vi.fn(async () => ({ capture_asset: uploadedAsset }));
    const createCaptureEvent = vi.fn(async () => ({
      capture_event: uploadedEvent,
    }));
    const file = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });

    renderPage({ loadDetail, uploadAsset, createCaptureEvent });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByLabelText("Page title"), {
      target: { value: " Department Upload " },
    });
    fireEvent.change(screen.getByLabelText("Page URL"), {
      target: { value: " https://example.internal/app/department " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    await waitFor(() =>
      expect(uploadAsset).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        {
          file,
          page_title: "Department Upload",
          page_url: "https://example.internal/app/department",
          captured_at: expect.any(String),
        },
      ),
    );
    const uploadCall = uploadAsset.mock.calls[0] as unknown as [
      string,
      string,
      { captured_at?: string },
    ];
    const capturedAt = uploadCall[2].captured_at;
    expect(createCaptureEvent).toHaveBeenCalledWith(
      "project_1",
      "capture_session_1",
      {
        event_type: "capture",
        event_index: 3,
        capture_asset_id: "asset_uploaded",
        occurred_at: capturedAt,
        page_title: "Department Upload",
        page_url: "https://example.internal/app/department",
        target_label: "Uploaded screenshot",
        note: "Uploaded screenshot: uploaded-department.png",
      },
    );
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("uploaded-department.png"),
    ).toBeInTheDocument();
  });

  it("uploads multiple screenshots sequentially and creates linked capture events in selected order", async () => {
    const firstDetail = manualDetail();
    const secondDetail: CaptureSessionDetail = {
      ...firstDetail,
      capture_events: [
        ...firstDetail.capture_events,
        uploadedEvent,
        secondUploadedEvent,
      ],
      capture_assets: [
        ...firstDetail.capture_assets,
        uploadedAsset,
        secondUploadedAsset,
      ],
    };
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(secondDetail);
    const uploadAsset = vi
      .fn<
        (
          projectId: string,
          captureSessionId: string,
          input: UploadCaptureAssetInput,
        ) => Promise<UploadCaptureAssetResponse>
      >()
      .mockResolvedValueOnce({ capture_asset: uploadedAsset })
      .mockResolvedValueOnce({ capture_asset: secondUploadedAsset });
    const createCaptureEvent = vi
      .fn<
        (
          projectId: string,
          captureSessionId: string,
          input: CreateCaptureEventInput,
        ) => Promise<CreateCaptureEventResponse>
      >()
      .mockResolvedValueOnce({ capture_event: uploadedEvent })
      .mockResolvedValueOnce({ capture_event: secondUploadedEvent });
    const firstFile = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });
    const secondFile = new File(["png"], "uploaded-review.png", {
      type: "image/png",
    });

    renderPage({ loadDetail, uploadAsset, createCaptureEvent });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [firstFile, secondFile] },
    });
    fireEvent.change(screen.getByLabelText("Page title"), {
      target: { value: " Department Upload " },
    });
    fireEvent.change(screen.getByLabelText("Page URL"), {
      target: { value: " https://example.internal/app/department " },
    });
    expect(screen.getByText("uploaded-department.png")).toBeInTheDocument();
    expect(screen.getByText("uploaded-review.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshots" }));

    await waitFor(() => expect(uploadAsset).toHaveBeenCalledTimes(2));
    const firstUploadInput = uploadAsset.mock.calls[0]![2];
    const secondUploadInput = uploadAsset.mock.calls[1]![2];
    expect(firstUploadInput).toMatchObject({
      file: firstFile,
      page_title: "Department Upload",
      page_url: "https://example.internal/app/department",
      captured_at: expect.any(String),
    });
    expect(secondUploadInput).toMatchObject({
      file: secondFile,
      page_title: "Department Upload",
      page_url: "https://example.internal/app/department",
      captured_at: expect.any(String),
    });
    expect(createCaptureEvent).toHaveBeenNthCalledWith(
      1,
      "project_1",
      "capture_session_1",
      {
        event_type: "capture",
        event_index: 3,
        capture_asset_id: "asset_uploaded",
        occurred_at: firstUploadInput.captured_at,
        page_title: "Department Upload",
        page_url: "https://example.internal/app/department",
        target_label: "Uploaded screenshot",
        note: "Uploaded screenshot: uploaded-department.png",
      },
    );
    expect(createCaptureEvent).toHaveBeenNthCalledWith(
      2,
      "project_1",
      "capture_session_1",
      {
        event_type: "capture",
        event_index: 4,
        capture_asset_id: "asset_uploaded_second",
        occurred_at: secondUploadInput.captured_at,
        page_title: "Department Upload",
        page_url: "https://example.internal/app/department",
        target_label: "Uploaded screenshot",
        note: "Uploaded screenshot: uploaded-review.png",
      },
    );
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
  });

  it("rejects the whole screenshot batch before uploading when any selected file is invalid", async () => {
    const { uploadAsset, createCaptureEvent } = renderPage({
      loadDetail: async () => manualDetail(),
    });
    const imageFile = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });
    const textFile = new File(["text"], "notes.txt", { type: "text/plain" });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [imageFile, textFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshots" }));

    expect(
      screen.getByText("Only PNG, JPEG, and WebP screenshots can be uploaded."),
    ).toBeInTheDocument();
    expect(uploadAsset).not.toHaveBeenCalled();
    expect(createCaptureEvent).not.toHaveBeenCalled();
  });

  it("replaces queued screenshot statuses when users select different files", async () => {
    renderPage({ loadDetail: async () => manualDetail() });
    const firstFile = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });
    const secondFile = new File(["png"], "uploaded-review.png", {
      type: "image/png",
    });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [firstFile] },
    });

    expect(screen.getByText("uploaded-department.png")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [secondFile] },
    });

    expect(
      screen.queryByText("uploaded-department.png"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("uploaded-review.png")).toBeInTheDocument();
  });

  it("disables screenshot upload while pending", async () => {
    let resolveUpload: (value: { capture_asset: CaptureAsset }) => void = () =>
      undefined;
    const uploadAsset = vi.fn(
      () =>
        new Promise<{ capture_asset: CaptureAsset }>((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const createCaptureEvent = vi.fn(async () => ({
      capture_event: uploadedEvent,
    }));
    const file = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });

    renderPage({
      loadDetail: async () => manualDetail(),
      uploadAsset,
      createCaptureEvent,
    });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    expect(
      screen.getByRole("button", { name: "Uploading Screenshots..." }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Uploading Screenshots..." }),
    );
    expect(uploadAsset).toHaveBeenCalledTimes(1);

    resolveUpload({ capture_asset: uploadedAsset });
    await waitFor(() => expect(createCaptureEvent).toHaveBeenCalledTimes(1));
  });

  it("keeps screenshot upload form values when upload fails", async () => {
    const uploadAsset = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "invalid_capture_asset_upload",
        message: "Upload input is invalid",
      });
    });
    const file = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });

    renderPage({ loadDetail: async () => manualDetail(), uploadAsset });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByLabelText("Page title"), {
      target: { value: "Department Upload" },
    });
    fireEvent.change(screen.getByLabelText("Page URL"), {
      target: { value: "https://example.internal/app/department" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    expect(
      await screen.findByText("Screenshot input is invalid."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Page title")).toHaveValue(
      "Department Upload",
    );
    expect(screen.getByLabelText("Page URL")).toHaveValue(
      "https://example.internal/app/department",
    );
  });

  it("stops a screenshot batch on upload failure after prior success and reloads partial results", async () => {
    const firstDetail = manualDetail();
    const secondDetail: CaptureSessionDetail = {
      ...firstDetail,
      capture_events: [...firstDetail.capture_events, uploadedEvent],
      capture_assets: [...firstDetail.capture_assets, uploadedAsset],
    };
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(secondDetail);
    const uploadAsset = vi
      .fn<() => Promise<{ capture_asset: CaptureAsset }>>()
      .mockResolvedValueOnce({ capture_asset: uploadedAsset })
      .mockRejectedValueOnce(
        new ApiClientError({
          kind: "validation",
          status: 413,
          type: "upload_too_large",
          message: "Upload is too large",
        }),
      );
    const createCaptureEvent = vi.fn(async () => ({
      capture_event: uploadedEvent,
    }));
    const firstFile = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });
    const secondFile = new File(["png"], "uploaded-review.png", {
      type: "image/png",
    });

    renderPage({ loadDetail, uploadAsset, createCaptureEvent });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [firstFile, secondFile] },
    });
    fireEvent.change(screen.getByLabelText("Page title"), {
      target: { value: "Department Upload" },
    });
    fireEvent.change(screen.getByLabelText("Page URL"), {
      target: { value: "https://example.internal/app/department" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshots" }));

    expect(
      await screen.findByText("Screenshot is too large."),
    ).toBeInTheDocument();
    expect(uploadAsset).toHaveBeenCalledTimes(2);
    expect(createCaptureEvent).toHaveBeenCalledTimes(1);
    expect(screen.getByText("uploaded-review.png")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByLabelText("Page title")).toHaveValue(
      "Department Upload",
    );
    expect(screen.getByLabelText("Page URL")).toHaveValue(
      "https://example.internal/app/department",
    );
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
  });

  it("shows a partial-success error when event creation fails after upload", async () => {
    const firstDetail = manualDetail();
    const secondDetail: CaptureSessionDetail = {
      ...firstDetail,
      capture_assets: [...firstDetail.capture_assets, uploadedAsset],
    };
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(secondDetail);
    const createCaptureEvent = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 409,
        type: "capture_event_index_conflict",
        message: "A capture event with this index already exists",
      });
    });
    const file = new File(["png"], "uploaded-department.png", {
      type: "image/png",
    });

    renderPage({ loadDetail, createCaptureEvent });

    await screen.findByRole("heading", { name: "Upload screenshot" });
    fireEvent.change(screen.getByLabelText("Screenshot file"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Screenshot" }));

    expect(
      await screen.findByText(
        "Screenshot uploaded, but another event used that order. Reload and try again.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByText("2 assets")).toBeInTheDocument(),
    );
    expect(screen.getAllByText("uploaded-department.png")).toHaveLength(2);
  });

  it("maps screenshot upload authentication not-found and size errors", async () => {
    const cases = [
      {
        error: new ApiClientError({
          kind: "unauthenticated",
          status: 401,
          type: "unauthenticated",
          message: "Authentication is required",
        }),
        message: "Sign in to upload screenshots.",
      },
      {
        error: new ApiClientError({
          kind: "not_found",
          status: 404,
          type: "capture_session_not_found",
          message: "Capture session was not found",
        }),
        message: "Capture session was not found.",
      },
      {
        error: new ApiClientError({
          kind: "validation",
          status: 413,
          type: "upload_too_large",
          message: "Upload is too large",
        }),
        message: "Screenshot is too large.",
      },
    ];

    for (const { error, message } of cases) {
      const file = new File(["png"], "uploaded-department.png", {
        type: "image/png",
      });
      renderPage({
        loadDetail: async () => manualDetail(),
        uploadAsset: async () => {
          throw error;
        },
      });

      await screen.findByRole("heading", { name: "Upload screenshot" });
      fireEvent.change(screen.getByLabelText("Screenshot file"), {
        target: { files: [file] },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Upload Screenshot" }),
      );

      expect(await screen.findByText(message)).toBeInTheDocument();
      cleanup();
    }
  });

  it("shows manual event ordering controls with disabled boundaries", async () => {
    renderPage({ loadDetail: async () => manualDetail() });

    expect(
      await screen.findByRole("button", { name: "Move event 1 up" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move event 1 down" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Move event 2 up" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Move event 2 down" }),
    ).toBeDisabled();
  });

  it("hides event ordering controls for non-manual or single-event sessions", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Move event/i }),
    ).not.toBeInTheDocument();
    cleanup();

    renderPage({
      loadDetail: async () => ({
        ...manualDetail(),
        capture_events: [manualDetail().capture_events[0] as CaptureEvent],
      }),
    });

    expect(
      await screen.findByText("Start from department list"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Move event/i }),
    ).not.toBeInTheDocument();
  });

  it("moves manual capture events by sending the swapped full event order and reloading detail", async () => {
    const firstDetail = manualDetail();
    const secondDetail: CaptureSessionDetail = {
      ...firstDetail,
      capture_events: [
        firstDetail.capture_events[1] as CaptureEvent,
        firstDetail.capture_events[0] as CaptureEvent,
      ],
    };
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(secondDetail);
    const reorderEvents = vi.fn(async () => ({
      capture_events: secondDetail.capture_events,
    }));

    renderPage({ loadDetail, reorderEvents });

    fireEvent.click(
      await screen.findByRole("button", { name: "Move event 2 up" }),
    );

    await waitFor(() =>
      expect(reorderEvents).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        {
          event_ids: ["event_2", "event_1"],
        },
      ),
    );
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
  });

  it("shows reorder failures and keeps the current event list visible", async () => {
    const reorderEvents = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "invalid_capture_event_order",
        message: "Capture event order is invalid",
      });
    });

    renderPage({ loadDetail: async () => manualDetail(), reorderEvents });

    fireEvent.click(
      await screen.findByRole("button", { name: "Move event 2 up" }),
    );

    expect(
      await screen.findByText("Capture event order is invalid."),
    ).toBeInTheDocument();
    expect(screen.getByText("Start from department list")).toBeInTheDocument();
    expect(screen.getByText("Add Department")).toBeInTheDocument();
  });

  it("disables event ordering controls while a reorder request is pending", async () => {
    let resolveReorder: (value: {
      capture_events: CaptureEvent[];
    }) => void = () => undefined;
    const reorderEvents = vi.fn(
      () =>
        new Promise<{ capture_events: CaptureEvent[] }>((resolve) => {
          resolveReorder = resolve;
        }),
    );

    renderPage({ loadDetail: async () => manualDetail(), reorderEvents });

    fireEvent.click(
      await screen.findByRole("button", { name: "Move event 2 up" }),
    );

    expect(
      screen.getByRole("button", { name: "Move event 1 down" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move event 2 up" }),
    ).toBeDisabled();

    resolveReorder({ capture_events: manualDetail().capture_events });
    await waitFor(() => expect(reorderEvents).toHaveBeenCalledTimes(1));
  });

  it("edits manual capture event text inline and reloads detail after save", async () => {
    const firstDetail = manualDetail();
    const updatedEvent = {
      ...(firstDetail.capture_events[0] as CaptureEvent),
      page_title: "Department list",
      page_url: "https://example.internal/app/departments",
      target_label: "Add Department",
      target_text: null,
      input_intent: null,
      note: "Open the corrected department list.",
      version: 2,
    };
    const secondDetail: CaptureSessionDetail = {
      ...firstDetail,
      capture_events: [
        updatedEvent,
        firstDetail.capture_events[1] as CaptureEvent,
      ],
    };
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockResolvedValueOnce(firstDetail)
      .mockResolvedValueOnce(secondDetail);
    const updateEvent = vi.fn(async () => ({ capture_event: updatedEvent }));

    renderPage({ loadDetail, updateEvent });

    fireEvent.click(
      await screen.findByRole("button", { name: "Edit event 1" }),
    );
    expect(screen.getByLabelText("Event page title")).toHaveValue("");
    expect(screen.getByLabelText("Event note")).toHaveValue(
      "Start from department list",
    );

    fireEvent.change(screen.getByLabelText("Event page title"), {
      target: { value: "Department list" },
    });
    fireEvent.change(screen.getByLabelText("Event page URL"), {
      target: { value: "https://example.internal/app/departments" },
    });
    fireEvent.change(screen.getByLabelText("Event target label"), {
      target: { value: "Add Department" },
    });
    fireEvent.change(screen.getByLabelText("Event note"), {
      target: { value: "Open the corrected department list." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save event 1" }));

    await waitFor(() =>
      expect(updateEvent).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        "event_1",
        {
          page_title: "Department list",
          page_url: "https://example.internal/app/departments",
          target_label: "Add Department",
          target_text: null,
          input_intent: null,
          note: "Open the corrected department list.",
        },
      ),
    );
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("Open the corrected department list."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save event 1" }),
    ).not.toBeInTheDocument();
  });

  it("hides manual event edit controls for non-manual sessions", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Edit event/i }),
    ).not.toBeInTheDocument();
  });

  it.each(["archived", "canceled"] as const)(
    "hides manual event edit controls for %s manual sessions",
    async (status) => {
      renderPage({
        loadDetail: async () => ({
          ...manualDetail(),
          capture_session: {
            ...manualDetail().capture_session,
            status,
          },
        }),
      });

      expect(
        await screen.findByRole("heading", {
          name: "Create department workflow",
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Edit event/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("cancels manual capture event editing without saving", async () => {
    const { updateEvent } = renderPage({
      loadDetail: async () => manualDetail(),
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Edit event 1" }),
    );
    fireEvent.change(screen.getByLabelText("Event note"), {
      target: { value: "Changed locally" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel event 1 edit" }),
    );

    expect(updateEvent).not.toHaveBeenCalled();
    expect(screen.getByText("Start from department list")).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("Changed locally"),
    ).not.toBeInTheDocument();
  });

  it("keeps manual capture event edit form open when save fails", async () => {
    const updateEvent = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 409,
        type: "capture_event_update_not_allowed",
        message: "Only active manual capture sessions can be edited",
      });
    });

    renderPage({ loadDetail: async () => manualDetail(), updateEvent });

    fireEvent.click(
      await screen.findByRole("button", { name: "Edit event 1" }),
    );
    fireEvent.change(screen.getByLabelText("Event note"), {
      target: { value: "Changed note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save event 1" }));

    expect(
      await screen.findByText(
        "Only active manual capture sessions can be edited.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Event note")).toHaveValue("Changed note");
  });

  it("disables manual capture event edit controls while save is pending", async () => {
    let resolveUpdate: (value: UpdateCaptureEventResponse) => void = () =>
      undefined;
    const updateEvent = vi.fn(
      () =>
        new Promise<UpdateCaptureEventResponse>((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    renderPage({ loadDetail: async () => manualDetail(), updateEvent });

    fireEvent.click(
      await screen.findByRole("button", { name: "Edit event 1" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save event 1" }));

    expect(
      screen.getByRole("button", { name: "Saving event 1" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancel event 1 edit" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit event 2" })).toBeDisabled();

    resolveUpdate({
      capture_event: manualDetail().capture_events[0] as CaptureEvent,
    });
    await waitFor(() => expect(updateEvent).toHaveBeenCalledTimes(1));
  });

  it("creates a guide from the loaded capture session and redirects to the editor", async () => {
    const { createGuide, redirectTo } = renderPage();

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    await waitFor(() =>
      expect(createGuide).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        {
          title: "Create department workflow",
          description: "Source capture for the department setup guide",
        },
      ),
    );
    expect(redirectTo).toHaveBeenCalledWith(
      "/projects/project_1/versions/current/guides/guide_1",
    );
  });

  it("creates an interactive demo from the loaded capture session and redirects to the editor", async () => {
    const { createInteractiveDemo, redirectTo } = renderPage();

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(
      screen.getByRole("button", { name: "Create interactive demo" }),
    );

    await waitFor(() =>
      expect(createInteractiveDemo).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        {
          title: "Create department workflow",
          description: "Source capture for the department setup guide",
        },
      ),
    );
    expect(redirectTo).toHaveBeenCalledWith(
      "/projects/project_1/versions/current/interactive-demos/interactive_demo_1",
    );
  });

  it("trims guide titles and sends null when the capture session has no description", async () => {
    const createGuide = vi.fn(async () => guideDetail);
    renderPage({
      createGuide,
      loadDetail: async () => ({
        ...detail,
        capture_session: {
          ...detail.capture_session,
          name: "  Create department workflow  ",
          description: null,
        },
      }),
    });

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    await waitFor(() =>
      expect(createGuide).toHaveBeenCalledWith(
        "project_1",
        "capture_session_1",
        {
          title: "Create department workflow",
          description: null,
        },
      ),
    );
  });

  it("prevents duplicate guide creation while a request is pending", async () => {
    let resolveCreate: (detail: GuideDetail) => void = () => undefined;
    const createGuide = vi.fn(
      () =>
        new Promise<GuideDetail>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const redirectTo = vi.fn();

    renderPage({ createGuide, redirectTo });

    await screen.findByRole("heading", { name: "Create department workflow" });
    const button = screen.getByRole("button", { name: "Create guide" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: "Creating guide..." }),
    ).toBeDisabled();
    expect(createGuide).toHaveBeenCalledTimes(1);

    resolveCreate(guideDetail);
    await waitFor(() =>
      expect(redirectTo).toHaveBeenCalledWith(
        "/projects/project_1/versions/current/guides/guide_1",
      ),
    );
  });

  it("shows guide creation failures without clearing loaded capture detail", async () => {
    const createGuide = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "invalid_guide",
        message: "Guide input is invalid",
      });
    });
    const redirectTo = vi.fn();

    renderPage({ createGuide, redirectTo });

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    expect(
      await screen.findByText("Could not create guide."),
    ).toBeInTheDocument();
    expect(screen.getByText("Start from department list")).toBeInTheDocument();
    expect(screen.getByText("department-list.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create guide" })).toBeEnabled();
    expect(redirectTo).not.toHaveBeenCalled();
  });

  it("clears a previous guide creation error when retrying", async () => {
    let resolveCreate: (detail: GuideDetail) => void = () => undefined;
    const createGuide = vi
      .fn<() => Promise<GuideDetail>>()
      .mockRejectedValueOnce(new Error("Create failed"))
      .mockImplementationOnce(
        () =>
          new Promise<GuideDetail>((resolve) => {
            resolveCreate = resolve;
          }),
      );
    const redirectTo = vi.fn();

    renderPage({ createGuide, redirectTo });

    await screen.findByRole("heading", { name: "Create department workflow" });
    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    expect(
      await screen.findByText("Could not create guide."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create guide" }));

    expect(
      screen.queryByText("Could not create guide."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Creating guide..." }),
    ).toBeDisabled();

    resolveCreate(guideDetail);
    await waitFor(() =>
      expect(redirectTo).toHaveBeenCalledWith(
        "/projects/project_1/versions/current/guides/guide_1",
      ),
    );
  });

  it("disables guide creation when the loaded capture session has an empty name", async () => {
    renderPage({
      loadDetail: async () => ({
        ...detail,
        capture_session: {
          ...detail.capture_session,
          name: "   ",
        },
      }),
    });

    expect(
      await screen.findByText(
        "Capture session needs a name before creating guide or demo artifacts.",
      ),
    ).toBeInTheDocument();

    const createGuideButton = screen.getByRole("button", {
      name: "Create guide",
    });
    const createDemoButton = screen.getByRole("button", {
      name: "Create interactive demo",
    });
    expect(createGuideButton).toBeDisabled();
    expect(createDemoButton).toBeDisabled();
    expect(createGuideButton).toHaveAccessibleDescription(
      "Capture session needs a name before creating guide or demo artifacts.",
    );
    expect(createDemoButton).toHaveAccessibleDescription(
      "Capture session needs a name before creating guide or demo artifacts.",
    );
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <CaptureSessionDetailPage
        projectId="project_1"
        captureSessionId="capture_session_1"
        currentPath="/projects/project_1/capture-sessions/capture_session_1"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            message: "Authentication is required",
          });
        }}
        resolveAssetUrl={(fileUrl) => fileUrl}
      />,
    );

    expect(
      await screen.findByText("Sign in to view this capture session."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fcapture-sessions%2Fcapture_session_1",
    );

    rerender(
      <CaptureSessionDetailPage
        projectId="project_1"
        captureSessionId="missing"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            message: "Capture session was not found",
          });
        }}
        resolveAssetUrl={(fileUrl) => fileUrl}
      />,
    );

    expect(
      await screen.findByText("Capture session was not found."),
    ).toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadDetail = vi
      .fn<() => Promise<CaptureSessionDetail>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce(detail);

    renderPage({ loadDetail });

    expect(
      await screen.findByText("Could not load capture session."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
  });
});
