/**
 * @fileoverview Ossie web app route entry point.
 */

import {
  lazy,
  Component,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { OssieBrand } from "./components/OssieBrand";
import { CaptureSessionDetailPage } from "./features/capture-session/CaptureSessionDetailPage";
import { ProjectCaptureSessionListPage } from "./features/capture-session/ProjectCaptureSessionListPage";
import { LoginPage } from "./features/auth/LoginPage";
import { GuideEditorPage } from "./features/guide/GuideEditorPage";
import { GuidePreviewPage } from "./features/guide/GuidePreviewPage";
import { PublicGuideReaderPage } from "./features/guide/PublicGuideReaderPage";
import { ProjectGuideListPage } from "./features/guide/ProjectGuideListPage";
import { InteractiveDemoEditorPage } from "./features/interactive-demo/InteractiveDemoEditorPage";
import { InteractiveDemoPreviewPage } from "./features/interactive-demo/InteractiveDemoPreviewPage";
import { ProjectInteractiveDemoListPage } from "./features/interactive-demo/ProjectInteractiveDemoListPage";
import { PublicInteractiveDemoViewerPage } from "./features/interactive-demo/PublicInteractiveDemoViewerPage";
import { InviteAcceptPage } from "./features/organization/InviteAcceptPage";
import { OrganizationMembersPage } from "./features/organization/OrganizationMembersPage";
import { BrowserExtensionPage } from "./features/extension/BrowserExtensionPage";
import { ComplianceTimelinePage } from "./features/compliance/ComplianceTimelinePage";
import { ProjectListPage } from "./features/project/ProjectListPage";
import { ProjectSettingsPage } from "./features/project/ProjectSettingsPage";
import { ProjectVersionRouteBoundary } from "./features/project-version/ProjectVersionRouteBoundary";
import { projectVersionWorkspaceUrl } from "./features/project-version/ProjectVersionContextBar";
import { ProjectActivityTimelinePage } from "./features/project-activity/ProjectActivityTimelinePage";
import { FirstRunSetupPage } from "./features/setup/FirstRunSetupPage";
import { ArtifactRevisionHistoryPage } from "./features/artifact-revision/ArtifactRevisionHistoryPage";
import { GuideRevisionPreviewPage } from "./features/artifact-revision/GuideRevisionPreviewPage";
import { InteractiveDemoRevisionPreviewPage } from "./features/artifact-revision/InteractiveDemoRevisionPreviewPage";
import { ProjectCarryForwardPage } from "./features/artifact-carry-forward/ProjectCarryForwardPage";
import { DesignSystemReviewPage } from "./features/design-system/DesignSystemReviewPage";
import { canPublishDocumentation } from "./features/documentation/documentationPermissions";
import {
  canCarryForwardDocumentation,
  canDecideDocumentationReview,
  canManageDocumentationEdition,
  canManageDocumentationReview,
  canRequestDocumentationReview,
} from "./features/documentation/documentationPermissions";
import { shouldRenderDesignSystemReview } from "./appRouteGuards";
import {
  getProject,
  getPublicInstanceStatus,
  listProjectScreenshotAssets,
} from "./lib/api";
import { portalDocumentTitle } from "./lib/portalRouteMetadata";
import { parsePortalRoute, type PortalRoute } from "./lib/routes";
import styles from "./App.module.css";

const LazyOrganizationDocumentationOperationsPage = lazy(() =>
  import("./features/documentation/OrganizationDocumentationOperationsPage").then(
    (module) => ({
      default: module.OrganizationDocumentationOperationsPage,
    }),
  ),
);
const LazyProjectDocumentationSiteListPage = lazy(() =>
  import("./features/documentation/ProjectDocumentationSiteListPage").then(
    (module) => ({ default: module.ProjectDocumentationSiteListPage }),
  ),
);
const LazyDocumentationPageEditor = lazy(() =>
  import("./features/documentation/DocumentationPageEditor").then((module) => ({
    default: module.DocumentationPageEditor,
  })),
);
const LazyDocumentationSiteEditorPage = lazy(() =>
  import("./features/documentation/DocumentationSiteEditorPage").then(
    (module) => ({ default: module.DocumentationSiteEditorPage }),
  ),
);
const LazyPublicDocumentationReaderPage = lazy(() =>
  import("./features/documentation/PublicDocumentationReaderPage").then(
    (module) => ({ default: module.PublicDocumentationReaderPage }),
  ),
);
const LazyDocumentationDraftPreviewPage = lazy(() =>
  import("./features/documentation/DocumentationDraftPreviewPage").then(
    (module) => ({ default: module.DocumentationDraftPreviewPage }),
  ),
);
const LazyDocumentationRevisionPreviewPage = lazy(() =>
  import("./features/documentation/DocumentationRevisionPreviewPage").then(
    (module) => ({ default: module.DocumentationRevisionPreviewPage }),
  ),
);
const LazyDocumentationPublicationPreviewPage = lazy(() =>
  import("./features/documentation/DocumentationPublicationPreviewPage").then(
    (module) => ({ default: module.DocumentationPublicationPreviewPage }),
  ),
);
const LazyDocumentationCarryForwardPage = lazy(() =>
  import("./features/documentation/DocumentationCarryForwardPage").then(
    (module) => ({ default: module.DocumentationCarryForwardPage }),
  ),
);
const LazyDocumentationReviewInboxPage = lazy(() =>
  import("./features/documentation/DocumentationReviewInboxPage").then(
    (module) => ({ default: module.DocumentationReviewInboxPage }),
  ),
);

const DocumentationSuspense = ({ children }: { children: ReactNode }) => (
  <DocumentationRouteErrorBoundary>
    <Suspense
      fallback={
        <main className={styles.main} aria-busy="true">
          Loading Documentation…
        </main>
      }
    >
      {children}
    </Suspense>
  </DocumentationRouteErrorBoundary>
);

class DocumentationRouteErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <main className={styles.main} role="alert">
          <p>The Documentation interface could not be loaded.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry Documentation
          </button>
        </main>
      );
    return this.props.children;
  }
}

type SetupGateState = "checking" | "ready" | "setup_required" | "error";

const setupGuardedRouteTypes = new Set<PortalRoute["type"]>([
  "project_list",
  "organization_members",
  "organization_compliance",
  "organization_documentation",
  "browser_extension",
  "project_workspace",
  "project_version_workspace",
  "project_settings",
  "project_compliance",
  "project_activity",
  "capture_session_detail",
  "project_capture_session_list",
  "guide_detail",
  "guide_preview",
  "project_guide_list",
  "project_interactive_demo_list",
  "interactive_demo_detail",
  "interactive_demo_preview",
  "project_carry_forward",
  "artifact_revision_history",
  "artifact_revision_preview",
  "documentation_site_list",
  "documentation_carry_forward",
  "documentation_review_inbox",
  "documentation_site_editor",
  "documentation_page_editor",
  "documentation_draft_preview",
  "documentation_revision_preview",
  "documentation_publication_preview",
]);

const shouldCheckSetup = (route: PortalRoute) =>
  setupGuardedRouteTypes.has(route.type);
const shouldCheckSetupInBackground = (route: PortalRoute) =>
  route.type === "login" || shouldCheckSetup(route);

const LegacyProjectRedirect = ({
  projectId,
  suffix = "",
  children,
}: {
  projectId: string;
  suffix?: string;
  children?: (
    project: import("@repo/types/project").Project,
  ) => React.ReactNode;
}) => {
  const [failed, setFailed] = useState(false);
  const [project, setProject] = useState<
    import("@repo/types/project").Project | null
  >(null);
  useEffect(() => {
    let active = true;
    getProject(projectId)
      .then(({ project }) => {
        if (!active) return;
        const path = `${projectVersionWorkspaceUrl(project.id, project.default_project_version.slug)}${suffix}${window.location.search}${window.location.hash}`;
        window.history.replaceState({}, "", path);
        setProject(project);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [projectId, suffix]);
  if (project)
    return children ? (
      children(project)
    ) : (
      <ProjectVersionRouteBoundary
        projectId={projectId}
        versionSlug={project.default_project_version.slug}
      />
    );
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {failed
          ? "Project was not found."
          : "Opening the Default Project Version..."}
      </main>
    </div>
  );
};

export default function App() {
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const route = parsePortalRoute(window.location.pathname);
  const setupCheckRequired = shouldCheckSetup(route);
  const backgroundSetupCheckRequired = shouldCheckSetupInBackground(route);
  const [setupGateState, setSetupGateState] = useState<SetupGateState>(
    setupCheckRequired ? "checking" : "ready",
  );
  const documentTitle = portalDocumentTitle(route);

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    if (!backgroundSetupCheckRequired) {
      setSetupGateState("ready");
      return;
    }

    let active = true;
    setSetupGateState(route.type === "login" ? "ready" : "checking");

    getPublicInstanceStatus()
      .then((status) => {
        if (!active) return;

        if (status.setup_required) {
          window.history.replaceState({}, "", "/setup");
          setSetupGateState("setup_required");
          return;
        }

        setSetupGateState("ready");
      })
      .catch(() => {
        if (active) {
          setSetupGateState(route.type === "login" ? "ready" : "error");
        }
      });

    return () => {
      active = false;
    };
  }, [backgroundSetupCheckRequired, currentPath, route.type]);

  if (setupGateState === "setup_required") {
    return <FirstRunSetupPage />;
  }

  if (route.type === "login") {
    return (
      <LoginPage
        nextPath={
          new URLSearchParams(window.location.search).get("next") ?? "/projects"
        }
      />
    );
  }

  if (route.type === "setup") {
    return <FirstRunSetupPage />;
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars -- DEV is a Vite built-in mode flag, not a user environment variable.
  if (shouldRenderDesignSystemReview(route, import.meta.env.DEV)) {
    return <DesignSystemReviewPage />;
  }

  if (route.type === "public_guide_reader") {
    return (
      <PublicGuideReaderPage
        slug={route.slug}
        versionSlug={route.versionSlug}
      />
    );
  }

  if (route.type === "public_guide_embed") {
    return (
      <PublicGuideReaderPage
        slug={route.slug}
        versionSlug={route.versionSlug}
        mode="embed"
      />
    );
  }

  if (route.type === "public_interactive_demo_reader") {
    return (
      <PublicInteractiveDemoViewerPage
        slug={route.slug}
        versionSlug={route.versionSlug}
      />
    );
  }

  if (route.type === "public_interactive_demo_embed") {
    return (
      <PublicInteractiveDemoViewerPage
        slug={route.slug}
        versionSlug={route.versionSlug}
        mode="embed"
      />
    );
  }

  if (route.type === "public_documentation_reader") {
    return (
      <DocumentationSuspense>
        <LazyPublicDocumentationReaderPage
          slug={route.slug}
          versionSlug={route.versionSlug}
          pagePath={route.pagePath}
        />
      </DocumentationSuspense>
    );
  }

  if (route.type === "organization_invite_accept") {
    return <InviteAcceptPage token={route.token} />;
  }

  if (setupGateState === "checking") {
    return (
      <div className={styles.page}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="/projects">
            <OssieBrand />
          </a>
        </header>
        <main className={styles.main}>
          <Card className={styles.emptyState}>
            <CardHeader>
              <CardTitle className={styles.title}>Loading portal...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Checking workspace readiness.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (setupGateState === "error") {
    return (
      <div className={styles.page}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="/projects">
            <OssieBrand />
          </a>
        </header>
        <main className={styles.main}>
          <Card className={styles.emptyState}>
            <CardHeader>
              <CardTitle className={styles.title}>
                Setup status unavailable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Could not load instance setup status.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (route.type === "project_list") {
    return <ProjectListPage currentPath={currentPath} />;
  }

  if (route.type === "organization_members") {
    return <OrganizationMembersPage currentPath={currentPath} />;
  }

  if (route.type === "browser_extension") {
    return <BrowserExtensionPage currentPath={currentPath} />;
  }

  if (route.type === "organization_compliance") {
    return <ComplianceTimelinePage currentPath={currentPath} />;
  }

  if (route.type === "organization_documentation") {
    return (
      <Suspense
        fallback={
          <main className={styles.main} aria-busy="true">
            Loading Documentation operations…
          </main>
        }
      >
        <LazyOrganizationDocumentationOperationsPage
          currentPath={currentPath}
        />
      </Suspense>
    );
  }

  if (route.type === "project_workspace") {
    return <LegacyProjectRedirect projectId={route.projectId} />;
  }

  if (route.type === "project_version_workspace") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
      />
    );
  }

  if (route.type === "project_carry_forward")
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
      >
        {({ project, selected, versions }) => (
          <ProjectCarryForwardPage
            projectId={route.projectId}
            target={selected}
            versions={versions}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
          />
        )}
      </ProjectVersionRouteBoundary>
    );

  if (route.type === "artifact_revision_history")
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection={
          route.artifactType === "guide" ? "guides" : "interactive_demos"
        }
        currentLabel={
          route.artifactType === "guide" ? "Guide revisions" : "Demo revisions"
        }
      >
        {({ project, selected }) => (
          <ArtifactRevisionHistoryPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            versionSlug={route.versionSlug}
            artifactType={route.artifactType}
            artifactId={route.artifactId}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
          />
        )}
      </ProjectVersionRouteBoundary>
    );

  if (route.type === "artifact_revision_preview")
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection={
          route.artifactType === "guide" ? "guides" : "interactive_demos"
        }
        currentLabel={
          route.artifactType === "guide" ? "Guide revision" : "Demo revision"
        }
      >
        {({ selected }) => {
          const base = `/projects/${encodeURIComponent(route.projectId)}/versions/${encodeURIComponent(route.versionSlug)}/${route.artifactType === "guide" ? "guides" : "interactive-demos"}/${encodeURIComponent(route.artifactId)}/revisions`;
          return route.artifactType === "guide" ? (
            <GuideRevisionPreviewPage
              projectId={route.projectId}
              projectVersionId={selected.id}
              artifactId={route.artifactId}
              revisionNumber={route.revisionNumber}
              historyHref={base}
            />
          ) : (
            <InteractiveDemoRevisionPreviewPage
              projectId={route.projectId}
              projectVersionId={selected.id}
              artifactId={route.artifactId}
              revisionNumber={route.revisionNumber}
              historyHref={base}
            />
          );
        }}
      </ProjectVersionRouteBoundary>
    );

  if (route.type === "project_settings") {
    return (
      <ProjectSettingsPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_compliance") {
    return (
      <ComplianceTimelinePage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_activity") {
    return (
      <ProjectActivityTimelinePage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "capture_session_detail") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix={`/capture-sessions/${encodeURIComponent(route.captureSessionId)}`}
        >
          {(project) => (
            <CaptureSessionDetailPage
              projectId={route.projectId}
              versionSlug={project.default_project_version.slug}
              captureSessionId={route.captureSessionId}
              currentPath={currentPath}
              canWrite={
                project.status === "active" &&
                project.default_project_version.status === "active" &&
                project.access.role !== "viewer"
              }
              canPurge={
                project.status === "active" &&
                project.default_project_version.status === "active" &&
                project.access.role === "project_admin"
              }
            />
          )}
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="capture_sessions"
        currentLabel="Capture session"
      >
        {({ project, selected, versions }) => (
          <CaptureSessionDetailPage
            projectId={route.projectId}
            captureSessionId={route.captureSessionId}
            versionSlug={route.versionSlug}
            projectVersions={versions}
            currentPath={currentPath}
            renderShell={false}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
            canPurge={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role === "project_admin"
            }
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "project_capture_session_list") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix="/capture-sessions"
        >
          {(project) => (
            <ProjectCaptureSessionListPage
              projectId={route.projectId}
              projectVersionId={project.default_project_version.id}
              versionSlug={project.default_project_version.slug}
              currentPath={currentPath}
              canWrite={
                project.status === "active" &&
                project.default_project_version.status === "active" &&
                project.access.role !== "viewer"
              }
            />
          )}
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="capture_sessions"
        currentLabel="Capture sessions"
      >
        {({ project, selected }) => (
          <ProjectCaptureSessionListPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            versionSlug={route.versionSlug}
            currentPath={currentPath}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
            renderShell={false}
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_site_list") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Documentation"
      >
        {({ project, selected }) => (
          <DocumentationSuspense>
            <LazyProjectDocumentationSiteListPage
              projectId={route.projectId}
              versionSlug={route.versionSlug}
              canManage={
                project.status === "active" &&
                selected.status === "active" &&
                project.access.role === "project_admin"
              }
              canCarry={
                project.status === "active" &&
                selected.status === "active" &&
                canCarryForwardDocumentation(project.access.role)
              }
              importUnavailableReason={
                selected.status !== "active"
                  ? "This Project Version is archived. Documentation import and Site creation are unavailable."
                  : project.status !== "active"
                    ? "This Project is archived. Documentation import and Site creation are unavailable."
                    : project.access.role !== "project_admin"
                      ? "Your Project role is read-only. Documentation import and Site creation require Project Admin access."
                      : undefined
              }
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_carry_forward") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Carry Forward Documentation"
      >
        {({ project, selected, versions }) => (
          <DocumentationSuspense>
            <LazyDocumentationCarryForwardPage
              projectId={route.projectId}
              target={selected}
              versions={versions}
              canCarry={
                project.status === "active" &&
                selected.status === "active" &&
                canCarryForwardDocumentation(project.access.role)
              }
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_page_editor") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Documentation Page"
      >
        {({ project, selected }) => (
          <DocumentationSuspense>
            <LazyDocumentationPageEditor
              projectId={route.projectId}
              versionSlug={route.versionSlug}
              siteId={route.siteId}
              pageId={route.pageId}
              canWrite={
                project.status === "active" &&
                selected.status === "active" &&
                project.access.role !== "viewer"
              }
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_site_editor") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Documentation Site"
      >
        {({ project, selected }) => (
          <DocumentationSuspense>
            <LazyDocumentationSiteEditorPage
              projectId={route.projectId}
              versionSlug={route.versionSlug}
              siteId={route.siteId}
              canWrite={
                project.status === "active" &&
                selected.status === "active" &&
                project.access.role !== "viewer"
              }
              canPublish={
                project.status === "active" &&
                selected.status === "active" &&
                canPublishDocumentation(project.access.role)
              }
              canManageEdition={canManageDocumentationEdition(
                project.access.role,
              )}
              canRequestReview={canRequestDocumentationReview(
                project.access.role,
              )}
              canManageReview={canManageDocumentationReview(
                project.access.role,
              )}
              canDecideReview={canDecideDocumentationReview(
                project.access.role,
              )}
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_review_inbox") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Review inbox"
      >
        {() => (
          <DocumentationSuspense>
            <LazyDocumentationReviewInboxPage
              projectId={route.projectId}
              versionSlug={route.versionSlug}
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_draft_preview") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Documentation preview"
      >
        {() => (
          <DocumentationSuspense>
            <LazyDocumentationDraftPreviewPage
              projectId={route.projectId}
              versionSlug={route.versionSlug}
              siteId={route.siteId}
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_revision_preview") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Documentation Revision"
      >
        {() => (
          <DocumentationSuspense>
            <LazyDocumentationRevisionPreviewPage
              projectId={route.projectId}
              versionSlug={route.versionSlug}
              siteId={route.siteId}
              revisionNumber={route.sequence!}
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "documentation_publication_preview") {
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="documentation"
        currentLabel="Documentation Publication"
      >
        {() => (
          <DocumentationSuspense>
            <LazyDocumentationPublicationPreviewPage
              projectId={route.projectId}
              versionSlug={route.versionSlug}
              siteId={route.siteId}
              publicationSequence={route.sequence!}
            />
          </DocumentationSuspense>
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "guide_detail") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix={`/guides/${encodeURIComponent(route.guideId)}`}
        >
          {(project) =>
            project.access.role !== "viewer" ? (
              <GuideEditorPage
                projectId={route.projectId}
                projectVersionId={project.default_project_version.id}
                versionSlug={project.default_project_version.slug}
                guideId={route.guideId}
                currentPath={currentPath}
              />
            ) : (
              <GuidePreviewPage
                projectId={route.projectId}
                projectVersionId={project.default_project_version.id}
                versionSlug={project.default_project_version.slug}
                guideId={route.guideId}
                currentPath={currentPath}
                canWrite={false}
              />
            )
          }
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="guides"
        currentLabel="Guides"
      >
        {({ project, selected }) =>
          project.status === "active" &&
          selected.status === "active" &&
          project.access.role !== "viewer" ? (
            <GuideEditorPage
              projectId={route.projectId}
              projectVersionId={selected.id}
              versionSlug={route.versionSlug}
              guideId={route.guideId}
              currentPath={currentPath}
            />
          ) : (
            <GuidePreviewPage
              projectId={route.projectId}
              projectVersionId={selected.id}
              guideId={route.guideId}
              versionSlug={route.versionSlug}
              currentPath={currentPath}
              canWrite={false}
            />
          )
        }
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "guide_preview") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix={`/guides/${encodeURIComponent(route.guideId)}/preview`}
        >
          {(project) => (
            <GuidePreviewPage
              projectId={route.projectId}
              projectVersionId={project.default_project_version.id}
              versionSlug={project.default_project_version.slug}
              guideId={route.guideId}
              currentPath={currentPath}
              canWrite={
                project.status === "active" && project.access.role !== "viewer"
              }
            />
          )}
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="guides"
        currentLabel="Guides"
      >
        {({ project, selected }) => (
          <GuidePreviewPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            guideId={route.guideId}
            versionSlug={route.versionSlug}
            currentPath={currentPath}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "project_guide_list") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect projectId={route.projectId} suffix="/guides">
          {(project) => (
            <ProjectGuideListPage
              projectId={route.projectId}
              projectVersionId={project.default_project_version.id}
              versionSlug={project.default_project_version.slug}
              currentPath={currentPath}
            />
          )}
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="guides"
        currentLabel="Guides"
      >
        {({ selected }) => (
          <ProjectGuideListPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            currentPath={currentPath}
            versionSlug={route.versionSlug}
            renderShell={false}
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "project_interactive_demo_list") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix="/interactive-demos"
        >
          {(project) => (
            <ProjectInteractiveDemoListPage
              projectId={route.projectId}
              projectVersionId={project.default_project_version.id}
              versionSlug={project.default_project_version.slug}
              currentPath={currentPath}
              canWrite={
                project.status === "active" && project.access.role !== "viewer"
              }
            />
          )}
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="interactive_demos"
        currentLabel="Interactive demos"
      >
        {({ project, selected }) => (
          <ProjectInteractiveDemoListPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            currentPath={currentPath}
            versionSlug={route.versionSlug}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
            renderShell={false}
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "interactive_demo_detail") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix={`/interactive-demos/${encodeURIComponent(route.interactiveDemoId)}`}
        >
          {(project) => (
            <InteractiveDemoEditorPage
              projectId={route.projectId}
              projectVersionId={project.default_project_version.id}
              versionSlug={project.default_project_version.slug}
              interactiveDemoId={route.interactiveDemoId}
              currentPath={currentPath}
              loadBackgroundAssets={listProjectScreenshotAssets}
              renderShell
              canWrite={
                project.status === "active" && project.access.role !== "viewer"
              }
            />
          )}
        </LegacyProjectRedirect>
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
      >
        {({ project, selected }) => (
          <InteractiveDemoEditorPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            interactiveDemoId={route.interactiveDemoId}
            versionSlug={route.versionSlug}
            currentPath={currentPath}
            loadBackgroundAssets={listProjectScreenshotAssets}
            renderShell={false}
            canWrite={
              project.status === "active" &&
              selected.status === "active" &&
              project.access.role !== "viewer"
            }
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  if (route.type === "interactive_demo_preview") {
    if (!route.versionSlug)
      return (
        <LegacyProjectRedirect
          projectId={route.projectId}
          suffix={`/interactive-demos/${encodeURIComponent(route.interactiveDemoId)}/preview`}
        />
      );
    return (
      <ProjectVersionRouteBoundary
        projectId={route.projectId}
        versionSlug={route.versionSlug}
        allowVersionOwnedContent
        activeSection="interactive_demos"
        currentLabel="Interactive demos"
      >
        {({ selected }) => (
          <InteractiveDemoPreviewPage
            projectId={route.projectId}
            projectVersionId={selected.id}
            interactiveDemoId={route.interactiveDemoId}
          />
        )}
      </ProjectVersionRouteBoundary>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/projects">
          <OssieBrand />
        </a>
      </header>
      <main aria-label="Page not found workspace" className={styles.main}>
        <Card className={styles.emptyState}>
          <CardHeader>
            <h1 className={styles.title}>Page not found</h1>
          </CardHeader>
          <CardContent>
            <p>The route you opened is not part of the Ossie portal.</p>
            <div className={styles.recoveryActions}>
              <a className={styles.recoveryPrimary} href="/projects">
                Open Projects
              </a>
              <a className={styles.recoverySecondary} href="/login">
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
