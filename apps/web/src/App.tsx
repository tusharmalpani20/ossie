import { useEffect, useState } from "react";
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
import { ProjectInteractiveDemoListPage } from "./features/interactive-demo/ProjectInteractiveDemoListPage";
import { PublicInteractiveDemoViewerPage } from "./features/interactive-demo/PublicInteractiveDemoViewerPage";
import { InviteAcceptPage } from "./features/organization/InviteAcceptPage";
import { OrganizationMembersPage } from "./features/organization/OrganizationMembersPage";
import { ComplianceTimelinePage } from "./features/compliance/ComplianceTimelinePage";
import { ProjectListPage } from "./features/project/ProjectListPage";
import { ProjectSettingsPage } from "./features/project/ProjectSettingsPage";
import { ProjectWorkspacePage } from "./features/project/ProjectWorkspacePage";
import { FirstRunSetupPage } from "./features/setup/FirstRunSetupPage";
import { getPublicInstanceStatus } from "./lib/api";
import { parsePortalRoute, type PortalRoute } from "./lib/routes";
import styles from "./App.module.css";

type SetupGateState = "checking" | "ready" | "setup_required" | "error";

const setupGuardedRouteTypes = new Set<PortalRoute["type"]>([
  "project_list",
  "organization_members",
  "organization_compliance",
  "project_workspace",
  "project_settings",
  "capture_session_detail",
  "project_capture_session_list",
  "guide_detail",
  "guide_preview",
  "project_guide_list",
  "project_interactive_demo_list",
  "interactive_demo_detail",
]);

const shouldCheckSetup = (route: PortalRoute) => setupGuardedRouteTypes.has(route.type);
const shouldCheckSetupInBackground = (route: PortalRoute) => (
  route.type === "login" || shouldCheckSetup(route)
);

export default function App() {
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const route = parsePortalRoute(window.location.pathname);
  const setupCheckRequired = shouldCheckSetup(route);
  const backgroundSetupCheckRequired = shouldCheckSetupInBackground(route);
  const [setupGateState, setSetupGateState] = useState<SetupGateState>(
    setupCheckRequired ? "checking" : "ready"
  );

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
    return (
      <FirstRunSetupPage />
    );
  }

  if (route.type === "login") {
    return (
      <LoginPage
        nextPath={new URLSearchParams(window.location.search).get("next") ?? "/projects"}
      />
    );
  }

  if (route.type === "setup") {
    return (
      <FirstRunSetupPage />
    );
  }

  if (route.type === "public_guide_reader") {
    return (
      <PublicGuideReaderPage slug={route.slug} />
    );
  }

  if (route.type === "public_guide_embed") {
    return (
      <PublicGuideReaderPage slug={route.slug} mode="embed" />
    );
  }

  if (route.type === "public_interactive_demo_reader") {
    return (
      <PublicInteractiveDemoViewerPage slug={route.slug} />
    );
  }

  if (route.type === "public_interactive_demo_embed") {
    return (
      <PublicInteractiveDemoViewerPage slug={route.slug} mode="embed" />
    );
  }

  if (route.type === "organization_invite_accept") {
    return (
      <InviteAcceptPage token={route.token} />
    );
  }

  if (setupGateState === "checking") {
    return (
      <div className={styles.page}>
        <header className={styles.topbar}>
          <a className={styles.brand} href="/projects"><OssieBrand /></a>
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
          <a className={styles.brand} href="/projects"><OssieBrand /></a>
        </header>
        <main className={styles.main}>
          <Card className={styles.emptyState}>
            <CardHeader>
              <CardTitle className={styles.title}>Setup status unavailable</CardTitle>
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
    return (
      <ProjectListPage currentPath={currentPath} />
    );
  }

  if (route.type === "organization_members") {
    return (
      <OrganizationMembersPage currentPath={currentPath} />
    );
  }

  if (route.type === "organization_compliance") {
    return <ComplianceTimelinePage currentPath={currentPath} />;
  }

  if (route.type === "project_workspace") {
    return (
      <ProjectWorkspacePage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_settings") {
    return (
      <ProjectSettingsPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "capture_session_detail") {
    return (
      <CaptureSessionDetailPage
        projectId={route.projectId}
        captureSessionId={route.captureSessionId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_capture_session_list") {
    return (
      <ProjectCaptureSessionListPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "guide_detail") {
    return (
      <GuideEditorPage
        projectId={route.projectId}
        guideId={route.guideId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "guide_preview") {
    return (
      <GuidePreviewPage
        projectId={route.projectId}
        guideId={route.guideId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_guide_list") {
    return (
      <ProjectGuideListPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_interactive_demo_list") {
    return (
      <ProjectInteractiveDemoListPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "interactive_demo_detail") {
    return (
      <InteractiveDemoEditorPage
        projectId={route.projectId}
        interactiveDemoId={route.interactiveDemoId}
        currentPath={currentPath}
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/projects"><OssieBrand /></a>
      </header>
      <main className={styles.main}>
        <Card className={styles.emptyState}>
          <CardHeader>
            <CardTitle className={styles.title}>Ossie portal</CardTitle>
          </CardHeader>
          <CardContent>
          <p>Open the project list, a project workspace, capture session list, capture session, guide list, guide link, or interactive demo link to continue.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
