import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  ApiClientError,
  listArtifactPublishLinks,
  listProjectGuides,
  type ProjectGuideListResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import type { PublishLink } from "@repo/types/publish";
import type { Guide } from "./types";
import styles from "./ProjectGuideListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; guides: Guide[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectGuideListPageProps = {
  projectId: string;
  projectVersionId: string;
  loadGuides?: (projectId: string) => Promise<ProjectGuideListResponse>;
  loadPublishLinks?: (
    projectId: string,
    guideId: string,
  ) => ReturnType<typeof listArtifactPublishLinks>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
};

type PublishStatusState =
  | { status: "checking" }
  | {
      status: "published";
      link: PublishLink;
      entry: PublishLink["entries"][number];
    }
  | { status: "unpublished" }
  | { status: "error" };

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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const isExpiredPublishLink = (expiresAt: string | null) => {
  if (!expiresAt) {
    return false;
  }

  const timestamp = new Date(expiresAt).getTime();
  return Number.isFinite(timestamp) && timestamp <= Date.now();
};

const canOpenPublicGuide = (status: PublishStatusState) => {
  const link = status.status === "published" ? status.link : null;
  return Boolean(
    link &&
    link.visibility === "public" &&
    !isExpiredPublishLink(link.expires_at),
  );
};

const guideUrl = (projectId: string, guideId: string, versionSlug?: string) =>
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/guides/${encodeURIComponent(guideId)}`;

const guidePreviewUrl = (
  projectId: string,
  guideId: string,
  versionSlug?: string,
) => `${guideUrl(projectId, guideId, versionSlug)}/preview`;

export const ProjectGuideListPage = ({
  projectId,
  projectVersionId,
  loadGuides = (id) => listProjectGuides(id, projectVersionId),
  loadPublishLinks = (id, guideId) =>
    listArtifactPublishLinks(id, "guide", guideId, projectVersionId),
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  versionSlug,
}: ProjectGuideListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [publishStatuses, setPublishStatuses] = useState<
    Record<string, PublishStatusState>
  >({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadGuides(projectId)
      .then((response) => {
        if (active) {
          setState({
            status: "loaded",
            guides: response.guide_editions.map((item) => ({
              ...item.edition,
              id: item.artifact.id,
            })),
          });
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
    // Route identity and reloadKey intentionally control refetching; the injected loader may be an inline adapter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectVersionId, reloadKey]);

  useEffect(() => {
    if (state.status !== "loaded" || state.guides.length === 0) {
      setPublishStatuses({});
      return;
    }

    let active = true;
    const guideIds = state.guides.map((guide) => guide.id);
    setPublishStatuses(
      Object.fromEntries(
        guideIds.map((guideId) => [guideId, { status: "checking" as const }]),
      ),
    );

    guideIds.forEach((guideId) => {
      loadPublishLinks(projectId, guideId)
        .then((response) => {
          if (!active) {
            return;
          }

          const matchingLinks = response.publish_links.filter(
            (link) =>
              link.status === "active" &&
              link.entries.some(
                (entry) => entry.project_version.id === projectVersionId,
              ),
          );
          const link =
            matchingLinks.find(
              (candidate) =>
                candidate.visibility === "public" &&
                !isExpiredPublishLink(candidate.expires_at),
            ) ?? matchingLinks[0];
          const entry = link?.entries.find(
            (candidate) => candidate.project_version.id === projectVersionId,
          );
          setPublishStatuses((current) => ({
            ...current,
            [guideId]:
              link && entry
                ? { status: "published", link, entry }
                : { status: "unpublished" },
          }));
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setPublishStatuses((current) => ({
            ...current,
            [guideId]: { status: "error" },
          }));
        });
    });

    return () => {
      active = false;
    };
    // Loaded list identity intentionally controls status checks; the injected loader may be an inline adapter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectVersionId, state]);

  if (state.status === "loading") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
      >
        <div className={styles.state}>Loading guides...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
      >
        <div className={styles.state}>
          <div>Sign in to view guides.</div>
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
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
      >
        <div className={styles.state}>Project was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
      >
        <div className={styles.state}>
          <div>Could not load guides.</div>
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
    <PortalShell
      projectId={projectId}
      performLogout={performLogout}
      navigate={navigate}
      versionSlug={versionSlug}
    >
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project</div>
          <h1 className={styles.title}>Guides</h1>
          <p className={styles.description}>{projectId}</p>
        </div>
      </section>

      <section className={styles.content} aria-labelledby="guides-heading">
        <h2 className={styles.sectionTitle} id="guides-heading">
          Project guides
        </h2>
        {state.guides.length === 0 ? (
          <Card className={styles.empty}>No guides yet.</Card>
        ) : (
          <div className={styles.list}>
            {state.guides.map((guide) => (
              <GuideRow
                key={guide.id}
                guide={guide}
                projectId={projectId}
                versionSlug={versionSlug}
                publishStatus={
                  publishStatuses[guide.id] ?? { status: "checking" }
                }
              />
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  projectId,
  performLogout,
  navigate,
  versionSlug,
}: {
  children: React.ReactNode;
  projectId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
}) => (
  <PortalAppShell
    activeSection="guides"
    currentLabel="Guides"
    project={{ id: projectId }}
    projectVersion={versionSlug ? { slug: versionSlug } : undefined}
    performLogout={performLogout}
    navigate={navigate}
  >
    {children}
  </PortalAppShell>
);

const GuideRow = ({
  guide,
  projectId,
  publishStatus,
  versionSlug,
}: {
  guide: Guide;
  projectId: string;
  publishStatus: PublishStatusState;
  versionSlug?: string;
}) => (
  <article className={styles.guide}>
    <div className={styles.guideBody}>
      <div className={styles.guideHeader}>
        <h3 className={styles.guideTitle}>{guide.title}</h3>
        <Badge variant={guide.status === "draft" ? "success" : "default"}>
          {guide.status}
        </Badge>
      </div>
      {guide.description ? (
        <p className={styles.guideDescription}>{guide.description}</p>
      ) : null}
      <div className={styles.meta}>
        <span>
          {guide.source_capture_session_id
            ? `Source capture: ${guide.source_capture_session_id}`
            : "No source capture"}
        </span>
        <span>Updated {formatDateTime(guide.updated_at)}</span>
        <span>Created {formatDateTime(guide.created_at)}</span>
      </div>
      <GuidePublishStatus status={publishStatus} />
    </div>
    <div className={styles.guideActions}>
      {canOpenPublicGuide(publishStatus) &&
      publishStatus.status === "published" ? (
        <a
          className={styles.openLink}
          href={`${publishStatus.link.public_url}/versions/${encodeURIComponent(publishStatus.entry.project_version.slug)}`}
        >
          Open public guide {guide.title}
        </a>
      ) : null}
      <a
        className={styles.openLink}
        href={guidePreviewUrl(projectId, guide.id, versionSlug)}
      >
        Preview guide {guide.title}
      </a>
      <a
        className={styles.openLink}
        href={guideUrl(projectId, guide.id, versionSlug)}
      >
        Open guide {guide.title}
      </a>
    </div>
  </article>
);

const GuidePublishStatus = ({ status }: { status: PublishStatusState }) => {
  if (status.status === "checking") {
    return <div className={styles.publishStatus}>Checking...</div>;
  }

  if (status.status === "published") {
    const link = status.link;

    if (link?.visibility === "restricted") {
      return <div className={styles.publishStatus}>Published - access off</div>;
    }

    if (isExpiredPublishLink(link.expires_at)) {
      return <div className={styles.publishStatus}>Published - expired</div>;
    }

    return <div className={styles.publishStatus}>Published</div>;
  }

  if (status.status === "error") {
    return <div className={styles.publishStatus}>Could not check</div>;
  }

  return <div className={styles.publishStatus}>Not published</div>;
};
