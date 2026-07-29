import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ProjectVersion } from "@repo/types/project-version";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  ApiClientError,
  createCaptureSessionEvent,
  createGuideFromCaptureSession,
  createInteractiveDemoFromCaptureSession,
  getCaptureSessionDetail,
  reorderCaptureSessionEvents,
  reassignCaptureSessionProjectVersion,
  resolveApiAssetUrl,
  updateCaptureSessionEvent,
  uploadCaptureSessionAsset,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import type { GuideDetail } from "../guide/types";
import type { CreateInteractiveDemoFromCaptureResponse } from "../interactive-demo/types";
import {
  allowedScreenshotMimeTypes,
  draftFromEvent,
  eventCreationAfterUploadErrorMessage,
  inputFromDraft,
  nextEventIndex,
  optionalUploadField,
  reorderErrorMessage,
  updateEventErrorMessage,
  uploadErrorMessage,
  uploadStatusLabel,
  type EventEditDraft,
  type UploadQueueItem,
} from "./CaptureSessionDetailHelpers";
import {
  AssetPreview,
  CaptureSessionMetrics,
  EventRow,
} from "./CaptureSessionDetailSections";
import type {
  CaptureEvent,
  CaptureSessionDetail,
  CreateCaptureEventResponse,
  ReorderCaptureEventsInput,
  ReorderCaptureEventsResponse,
  UpdateCaptureEventInput,
  UpdateCaptureEventResponse,
  UploadCaptureAssetResponse,
} from "./types";
import { CaptureAssetLifecycleControls } from "./CaptureAssetLifecycleControls";
import { CaptureSessionDetailShell as PortalShell } from "./CaptureSessionDetailShell";
import styles from "./CaptureSessionDetailPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: CaptureSessionDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type CaptureSessionDetailPageProps = {
  projectId: string;
  captureSessionId: string;
  loadDetail?: (
    projectId: string,
    captureSessionId: string,
  ) => Promise<CaptureSessionDetail>;
  resolveAssetUrl?: (fileUrl: string) => string;
  createGuide?: (
    projectId: string,
    captureSessionId: string,
    data: {
      title: string;
      description?: string | null;
    },
  ) => Promise<GuideDetail>;
  createInteractiveDemo?: (
    projectId: string,
    captureSessionId: string,
    data: {
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
  ) => Promise<UploadCaptureAssetResponse>;
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
  ) => Promise<CreateCaptureEventResponse>;
  reorderEvents?: (
    projectId: string,
    captureSessionId: string,
    input: ReorderCaptureEventsInput,
  ) => Promise<ReorderCaptureEventsResponse>;
  updateEvent?: (
    projectId: string,
    captureSessionId: string,
    eventId: string,
    input: UpdateCaptureEventInput,
  ) => Promise<UpdateCaptureEventResponse>;
  redirectTo?: (path: string) => void;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  canWrite?: boolean;
  canPurge?: boolean;
  versionSlug?: string;
  isDefaultVersion?: boolean;
  renderShell?: boolean;
  projectVersions?: ProjectVersion[];
  reassignProjectVersion?: typeof reassignCaptureSessionProjectVersion;
};

const browserRedirect = (path: string) => window.location.assign(path);

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (error.kind === "not_found") {
      return { status: "not_found" };
    }
  }

  return { status: "error" };
};

export const CaptureSessionDetailPage = ({
  projectId,
  captureSessionId,
  loadDetail = getCaptureSessionDetail,
  resolveAssetUrl = resolveApiAssetUrl,
  createGuide = createGuideFromCaptureSession,
  createInteractiveDemo = createInteractiveDemoFromCaptureSession,
  uploadAsset = uploadCaptureSessionAsset,
  createCaptureEvent: createCaptureEventAction = createCaptureSessionEvent,
  reorderEvents = reorderCaptureSessionEvents,
  updateEvent = updateCaptureSessionEvent,
  redirectTo = browserRedirect,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  canWrite = true,
  canPurge = false,
  versionSlug,
  renderShell = true,
  projectVersions = [],
  reassignProjectVersion = reassignCaptureSessionProjectVersion,
}: CaptureSessionDetailPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDetail(projectId, captureSessionId)
      .then((detail) => {
        if (active) {
          if (
            versionSlug &&
            detail.capture_session.project_version.slug !== versionSlug
          ) {
            redirectTo(
              `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(detail.capture_session.project_version.slug)}/capture-sessions/${encodeURIComponent(captureSessionId)}`,
            );
          }
          setState({ status: "loaded", detail });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(loadStateFromError(error));
        }
      });

    return () => {
      active = false;
    };
  }, [
    projectId,
    captureSessionId,
    loadDetail,
    reloadKey,
    versionSlug,
    redirectTo,
  ]);

  if (state.status === "loading") {
    return (
      <PortalShell
        projectId={projectId}
        captureSessionId={captureSessionId}
        performLogout={performLogout}
        navigate={navigate}
        renderShell={renderShell}
      >
        <div className={styles.state}>Loading capture session...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        projectId={projectId}
        captureSessionId={captureSessionId}
        performLogout={performLogout}
        navigate={navigate}
        renderShell={renderShell}
      >
        <div className={styles.state}>
          <div>Sign in to view this capture session.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell
        projectId={projectId}
        captureSessionId={captureSessionId}
        performLogout={performLogout}
        navigate={navigate}
        renderShell={renderShell}
      >
        <div className={styles.state}>Capture session was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        projectId={projectId}
        captureSessionId={captureSessionId}
        performLogout={performLogout}
        navigate={navigate}
        renderShell={renderShell}
      >
        <div className={styles.state}>
          <div>Could not load capture session.</div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <CaptureSessionDetailView
      detail={state.detail}
      projectId={projectId}
      captureSessionId={captureSessionId}
      resolveAssetUrl={resolveAssetUrl}
      createGuide={createGuide}
      createInteractiveDemo={createInteractiveDemo}
      uploadAsset={uploadAsset}
      createCaptureEvent={createCaptureEventAction}
      reorderEvents={reorderEvents}
      updateEvent={updateEvent}
      reloadDetail={() => setReloadKey((key) => key + 1)}
      redirectTo={redirectTo}
      performLogout={performLogout}
      navigate={navigate}
      canWrite={canWrite}
      canPurge={canPurge}
      renderShell={renderShell}
      projectVersions={projectVersions}
      reassignProjectVersion={reassignProjectVersion}
    />
  );
};

const CaptureSessionDetailView = ({
  detail,
  projectId,
  captureSessionId,
  resolveAssetUrl,
  createGuide,
  createInteractiveDemo,
  uploadAsset,
  createCaptureEvent,
  reorderEvents,
  updateEvent,
  reloadDetail,
  redirectTo,
  performLogout,
  navigate,
  canWrite,
  canPurge,
  renderShell,
  projectVersions,
  reassignProjectVersion,
}: {
  detail: CaptureSessionDetail;
  projectId: string;
  captureSessionId: string;
  resolveAssetUrl: (fileUrl: string) => string;
  createGuide: NonNullable<CaptureSessionDetailPageProps["createGuide"]>;
  createInteractiveDemo: NonNullable<
    CaptureSessionDetailPageProps["createInteractiveDemo"]
  >;
  uploadAsset: NonNullable<CaptureSessionDetailPageProps["uploadAsset"]>;
  createCaptureEvent: NonNullable<
    CaptureSessionDetailPageProps["createCaptureEvent"]
  >;
  reorderEvents: NonNullable<CaptureSessionDetailPageProps["reorderEvents"]>;
  updateEvent: NonNullable<CaptureSessionDetailPageProps["updateEvent"]>;
  reloadDetail: () => void;
  redirectTo: NonNullable<CaptureSessionDetailPageProps["redirectTo"]>;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  canWrite: boolean;
  canPurge: boolean;
  renderShell: boolean;
  projectVersions: ProjectVersion[];
  reassignProjectVersion: typeof reassignCaptureSessionProjectVersion;
}) => {
  const [createState, setCreateState] = useState<"idle" | "creating" | "error">(
    "idle",
  );
  const [createDemoState, setCreateDemoState] = useState<
    "idle" | "creating" | "error"
  >("idle");
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [reorderState, setReorderState] = useState<"idle" | "reordering">(
    "idle",
  );
  const [reassignState, setReassignState] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [reassignTarget, setReassignTarget] = useState("");
  const [eventEditState, setEventEditState] = useState<"idle" | "saving">(
    "idle",
  );
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventEditDraft, setEventEditDraft] = useState<EventEditDraft | null>(
    null,
  );
  const [eventEditError, setEventEditError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadPageTitle, setUploadPageTitle] = useState("");
  const [uploadPageUrl, setUploadPageUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadFileInputRef = useRef<HTMLInputElement | null>(null);
  const assetById = useMemo(
    () => new Map(detail.capture_assets.map((asset) => [asset.id, asset])),
    [detail.capture_assets],
  );

  const session = detail.capture_session;
  const guideTitle = session.name.trim();
  const hasCaptureEvents = detail.capture_events.length > 0;
  const canCreateGuide =
    guideTitle.length > 0 && hasCaptureEvents && createState !== "creating";
  const canCreateInteractiveDemo =
    guideTitle.length > 0 && hasCaptureEvents && createDemoState !== "creating";
  const missingTitleMessageId = "capture-session-artifact-title-message";
  const emptyCaptureMessageId = "capture-session-artifact-action-message";
  const artifactActionDescription =
    [
      guideTitle.length === 0 ? missingTitleMessageId : null,
      !hasCaptureEvents ? emptyCaptureMessageId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const canUploadScreenshot = canWrite && session.source_type === "manual";
  const isUploading = uploadState === "uploading";
  const uploadButtonText = isUploading
    ? "Uploading Screenshots..."
    : uploadFiles.length > 1
      ? "Upload Screenshots"
      : "Upload Screenshot";
  const canReorderEvents =
    canWrite &&
    session.source_type === "manual" &&
    detail.capture_events.length > 1;
  const isReordering = reorderState === "reordering";
  const canReassignVersion =
    canWrite &&
    session.status === "draft" &&
    session.started_at === null &&
    detail.capture_events.length === 0 &&
    detail.capture_assets.length === 0;
  const versionTargets = projectVersions.filter(
    (version) =>
      version.status === "active" && version.id !== session.project_version_id,
  );
  const canEditEvents =
    canWrite &&
    session.source_type === "manual" &&
    session.status !== "archived" &&
    session.status !== "canceled";
  const isSavingEvent = eventEditState === "saving";

  const handleCreateGuide = async () => {
    if (!canCreateGuide) {
      return;
    }

    setCreateState("creating");

    try {
      const guideDetail = await createGuide(projectId, captureSessionId, {
        title: guideTitle,
        description: session.description ?? null,
      });
      redirectTo(
        `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(session.project_version.slug)}/guides/${encodeURIComponent(guideDetail.artifact.id)}`,
      );
    } catch {
      setCreateState("error");
    }
  };

  const handleCreateInteractiveDemo = async () => {
    if (!canCreateInteractiveDemo) {
      return;
    }

    setCreateDemoState("creating");

    try {
      const response = await createInteractiveDemo(
        projectId,
        captureSessionId,
        {
          title: guideTitle,
          description: session.description ?? null,
        },
      );
      redirectTo(
        `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(session.project_version.slug)}/interactive-demos/${encodeURIComponent(response.artifact.id)}`,
      );
    } catch {
      setCreateDemoState("error");
    }
  };

  const clearUploadForm = () => {
    setUploadFiles([]);
    setUploadQueue([]);
    setUploadPageTitle("");
    setUploadPageUrl("");
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = "";
    }
  };

  const updateUploadFiles = (files: File[]) => {
    setUploadFiles(files);
    setUploadQueue(
      files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        status: "queued",
      })),
    );
    setUploadError(null);
  };

  const updateUploadPageTitle = (value: string) => {
    setUploadPageTitle(value);
    setUploadError(null);
  };

  const updateUploadPageUrl = (value: string) => {
    setUploadPageUrl(value);
    setUploadError(null);
  };

  const handleUploadScreenshot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    if (uploadFiles.length === 0) {
      setUploadError("Choose a screenshot to upload.");
      return;
    }

    if (
      uploadFiles.some((file) => !allowedScreenshotMimeTypes.has(file.type))
    ) {
      setUploadError("Only PNG, JPEG, and WebP screenshots can be uploaded.");
      return;
    }

    const pageTitle = optionalUploadField(uploadPageTitle);
    const pageUrl = optionalUploadField(uploadPageUrl);
    const baseEventIndex = nextEventIndex(detail.capture_events);
    let createdEventCount = 0;

    setUploadState("uploading");
    setUploadError(null);
    setUploadQueue(
      uploadFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        status: "queued",
      })),
    );

    try {
      for (const [index, uploadFile] of uploadFiles.entries()) {
        const capturedAt = new Date().toISOString();

        setUploadQueue((items) =>
          items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, status: "uploading" } : item,
          ),
        );

        const uploadResponse = await uploadAsset(projectId, captureSessionId, {
          file: uploadFile,
          page_title: pageTitle,
          page_url: pageUrl,
          captured_at: capturedAt,
        });

        try {
          await createCaptureEvent(projectId, captureSessionId, {
            event_type: "capture",
            event_index: baseEventIndex + index,
            capture_asset_id: uploadResponse.capture_asset.id,
            occurred_at: capturedAt,
            page_title: pageTitle,
            page_url: pageUrl,
            target_label: "Uploaded screenshot",
            note: `Uploaded screenshot: ${uploadFile.name}`,
          });
        } catch (error: unknown) {
          setUploadQueue((items) =>
            items.map((item, itemIndex) =>
              itemIndex === index ? { ...item, status: "failed" } : item,
            ),
          );
          setUploadError(eventCreationAfterUploadErrorMessage(error));
          reloadDetail();
          return;
        }

        createdEventCount += 1;
        setUploadQueue((items) =>
          items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, status: "event_created" } : item,
          ),
        );
      }

      clearUploadForm();
      reloadDetail();
    } catch (error: unknown) {
      const failedIndex = createdEventCount;
      setUploadQueue((items) =>
        items.map((item, itemIndex) =>
          itemIndex === failedIndex ? { ...item, status: "failed" } : item,
        ),
      );
      setUploadError(uploadErrorMessage(error));
      if (createdEventCount > 0) {
        reloadDetail();
      }
    } finally {
      setUploadState("idle");
    }
  };

  const handleReassign = async () => {
    if (!reassignTarget || reassignState === "saving") return;
    setReassignState("saving");
    try {
      const response = await reassignProjectVersion(
        projectId,
        captureSessionId,
        {
          project_version_id: reassignTarget,
          expected_version: session.version,
        },
      );
      redirectTo(
        `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(response.capture_session.project_version.slug)}/capture-sessions/${encodeURIComponent(captureSessionId)}`,
      );
    } catch {
      setReassignState("error");
      reloadDetail();
    }
  };

  const moveEvent = async (fromIndex: number, direction: -1 | 1) => {
    if (!canReorderEvents || isReordering) {
      return;
    }

    const toIndex = fromIndex + direction;

    if (toIndex < 0 || toIndex >= detail.capture_events.length) {
      return;
    }

    const eventIds = detail.capture_events.map((event) => event.id);
    const movingEventId = eventIds[fromIndex];
    const targetEventId = eventIds[toIndex];

    if (!movingEventId || !targetEventId) {
      return;
    }

    eventIds[fromIndex] = targetEventId;
    eventIds[toIndex] = movingEventId;

    setReorderState("reordering");
    setReorderError(null);

    try {
      await reorderEvents(projectId, captureSessionId, { event_ids: eventIds });
      reloadDetail();
    } catch (error: unknown) {
      setReorderError(reorderErrorMessage(error));
    } finally {
      setReorderState("idle");
    }
  };

  const startEditingEvent = (event: CaptureEvent) => {
    if (!canEditEvents || isSavingEvent) {
      return;
    }

    setEditingEventId(event.id);
    setEventEditDraft(draftFromEvent(event));
    setEventEditError(null);
  };

  const cancelEditingEvent = () => {
    if (isSavingEvent) {
      return;
    }

    setEditingEventId(null);
    setEventEditDraft(null);
    setEventEditError(null);
  };

  const updateEventDraft = (field: keyof EventEditDraft, value: string) => {
    setEventEditDraft((draft) =>
      draft ? { ...draft, [field]: value } : draft,
    );
    setEventEditError(null);
  };

  const saveEvent = async (event: CaptureEvent) => {
    if (!eventEditDraft || isSavingEvent) {
      return;
    }

    setEventEditState("saving");
    setEventEditError(null);

    try {
      await updateEvent(
        projectId,
        captureSessionId,
        event.id,
        inputFromDraft(eventEditDraft),
      );
      setEditingEventId(null);
      setEventEditDraft(null);
      reloadDetail();
    } catch (error: unknown) {
      setEventEditError(updateEventErrorMessage(error));
    } finally {
      setEventEditState("idle");
    }
  };

  return (
    <PortalShell
      projectId={projectId}
      captureSessionId={captureSessionId}
      performLogout={performLogout}
      navigate={navigate}
      renderShell={renderShell}
    >
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Capture session</div>
            <h1 className={styles.title}>{session.name}</h1>
            {session.description ? (
              <p className={styles.description}>{session.description}</p>
            ) : null}
          </div>
          <div className={styles.badges}>
            <Badge
              variant={session.status === "completed" ? "success" : "default"}
            >
              {session.status}
            </Badge>
            <Badge>{session.source_type}</Badge>
            <Badge>{session.project_version.name}</Badge>
          </div>
        </div>
        {canWrite ? (
          <div className={styles.actionRow}>
            {canReassignVersion && versionTargets.length > 0 ? (
              <>
                <Label>
                  <span>Move empty draft to Project Version</span>
                  <select
                    value={reassignTarget}
                    onChange={(event) => setReassignTarget(event.target.value)}
                  >
                    <option value="">Select Version</option>
                    {versionTargets.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name}
                      </option>
                    ))}
                  </select>
                </Label>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!reassignTarget || reassignState === "saving"}
                  onClick={handleReassign}
                >
                  {reassignState === "saving" ? "Moving..." : "Move draft"}
                </Button>
                {reassignState === "error" ? (
                  <div className={styles.actionMessage}>
                    The draft changed or can no longer be moved. Current data
                    was reloaded.
                  </div>
                ) : null}
              </>
            ) : null}
            <Button
              type="button"
              disabled={!canCreateGuide}
              aria-describedby={artifactActionDescription}
              onClick={handleCreateGuide}
            >
              {createState === "creating"
                ? "Creating guide..."
                : "Create guide"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              disabled={!canCreateInteractiveDemo}
              aria-describedby={artifactActionDescription}
              onClick={handleCreateInteractiveDemo}
            >
              {createDemoState === "creating"
                ? "Creating interactive demo..."
                : "Create interactive demo"}
            </Button>
            {guideTitle.length === 0 ? (
              <div className={styles.actionMessage} id={missingTitleMessageId}>
                Capture session needs a name before creating guide or demo
                artifacts.
              </div>
            ) : null}
            {!hasCaptureEvents ? (
              <div className={styles.actionMessage} id={emptyCaptureMessageId}>
                Add at least one capture event before creating guide or demo
                artifacts.
              </div>
            ) : null}
            {createState === "error" ? (
              <div className={styles.actionMessage}>
                Could not create guide.
              </div>
            ) : null}
            {createDemoState === "error" ? (
              <div className={styles.actionMessage}>
                Could not create interactive demo.
              </div>
            ) : null}
          </div>
        ) : (
          <Badge>Read only</Badge>
        )}

        <CaptureSessionMetrics detail={detail} />
      </section>

      {canUploadScreenshot ? (
        <Card
          className={styles.uploadPanel}
          role="region"
          aria-labelledby="upload-screenshot-heading"
        >
          <CardHeader>
            <h2 className={styles.uploadTitle} id="upload-screenshot-heading">
              Upload screenshot
            </h2>
          </CardHeader>
          <CardContent>
            <form
              className={styles.uploadForm}
              onSubmit={handleUploadScreenshot}
            >
              {uploadError ? (
                <Alert variant="destructive">{uploadError}</Alert>
              ) : null}
              <Label className={styles.field}>
                <span>Screenshot file</span>
                <input
                  ref={uploadFileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isUploading}
                  onChange={(event) =>
                    updateUploadFiles(Array.from(event.target.files ?? []))
                  }
                />
              </Label>
              {uploadQueue.length > 0 ? (
                <div
                  className={styles.uploadQueue}
                  role="status"
                  aria-live="polite"
                  aria-label="Selected screenshots"
                >
                  {uploadQueue.map((item) => (
                    <div className={styles.uploadQueueItem} key={item.id}>
                      <span className={styles.uploadQueueName}>
                        {item.name}
                      </span>
                      <span className={styles.uploadQueueStatus}>
                        {uploadStatusLabel(item.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <Label className={styles.field}>
                <span>Page title</span>
                <Input
                  value={uploadPageTitle}
                  disabled={isUploading}
                  onChange={(event) =>
                    updateUploadPageTitle(event.target.value)
                  }
                />
              </Label>
              <Label className={styles.field}>
                <span>Page URL</span>
                <Input
                  value={uploadPageUrl}
                  disabled={isUploading}
                  onChange={(event) => updateUploadPageUrl(event.target.value)}
                />
              </Label>
              <div className={styles.uploadActions}>
                <Button type="submit" disabled={isUploading}>
                  {uploadButtonText}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="events-heading">
          <h2 className={styles.sectionTitle} id="events-heading">
            Events
          </h2>
          {reorderError ? (
            <Alert className={styles.sectionAlert} variant="destructive">
              {reorderError}
            </Alert>
          ) : null}
          {detail.capture_events.length === 0 ? (
            <div className={styles.empty}>No capture events yet.</div>
          ) : (
            <div className={styles.timeline}>
              {detail.capture_events.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                  stepNumber={index + 1}
                  linkedAsset={
                    event.capture_asset_id
                      ? assetById.get(event.capture_asset_id)
                      : undefined
                  }
                  canReorder={canReorderEvents}
                  disableReorder={isReordering}
                  canEdit={canEditEvents}
                  disableEdit={isSavingEvent}
                  isEditing={editingEventId === event.id}
                  editDraft={
                    editingEventId === event.id ? eventEditDraft : null
                  }
                  editError={
                    editingEventId === event.id ? eventEditError : null
                  }
                  isSaving={editingEventId === event.id && isSavingEvent}
                  isFirst={index === 0}
                  isLast={index === detail.capture_events.length - 1}
                  onMoveUp={() => moveEvent(index, -1)}
                  onMoveDown={() => moveEvent(index, 1)}
                  onEdit={() => startEditingEvent(event)}
                  onCancelEdit={cancelEditingEvent}
                  onChangeDraft={updateEventDraft}
                  onSave={() => saveEvent(event)}
                />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="assets-heading">
          <h2 className={styles.sectionTitle} id="assets-heading">
            Assets
          </h2>
          {detail.capture_assets.length === 0 ? (
            <div className={styles.empty}>No capture assets yet.</div>
          ) : (
            <div className={styles.assets}>
              {detail.capture_assets.map((asset, index) => (
                <AssetPreview
                  key={asset.id}
                  asset={asset}
                  imageUrl={resolveAssetUrl(asset.file_url)}
                  eager={index === 0}
                  controls={
                    <CaptureAssetLifecycleControls
                      asset={asset}
                      projectId={projectId}
                      captureSessionId={captureSessionId}
                      canWrite={canWrite}
                      canPurge={canPurge}
                      onChanged={reloadDetail}
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
};
