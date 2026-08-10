import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  DocumentationCanonicalRedirect,
  DocumentationApiError,
  createPublicDocumentationViewerSession,
  getPublicDocumentationPage,
  searchPublicDocumentation,
  type PublicDocumentationSnapshot,
} from "../../lib/documentationApi";
import {
  getPublicDocumentationTryItConfiguration,
  reportPublicDocumentationTryItAttempt,
} from "../../lib/documentationTryItApi";
import { StatusPanel } from "@repo/ui/status-panel";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";
import { LazyDocumentationApiOperationExperience } from "./LazyDocumentationApiOperationExperience";
import { LazyDocumentationRequestExamples } from "./LazyDocumentationRequestExamples";
import { LazyDocumentationPublicationReaderChrome } from "./LazyDocumentationPublicationReaderChrome";
import { readDocumentationInitialDocument } from "../../lib/documentationInitialDocument";
import styles from "./PublicDocumentationReaderPage.module.css";
import {
  buildDocumentationReaderNavigationTree,
  buildDocumentationReaderProjection,
  buildFumadocsPageTree,
  getDocumentationReaderAdjacentPages,
} from "./adapters/documentationReaderAdapter";

type SearchResult = Awaited<
  ReturnType<typeof searchPublicDocumentation>
>["results"][number];

type Props = {
  slug: string;
  versionSlug?: string;
  pagePath?: string;
  loadPage?: typeof getPublicDocumentationPage;
  search?: typeof searchPublicDocumentation;
  createViewerSession?: typeof createPublicDocumentationViewerSession;
};

type ReaderNavigationTree = ReturnType<
  typeof buildDocumentationReaderNavigationTree
>;

const renderNativeNavigation = (
  nodes: ReaderNavigationTree["children"],
  selectedPagePath: string,
): ReactNode => (
  <ul>
    {nodes.map((node) => {
      if (node.type === "page")
        return (
          <li key={node.$id ?? node.url}>
            <a
              aria-current={node.url === selectedPagePath ? "page" : undefined}
              href={node.url}
            >
              {node.name}
            </a>
          </li>
        );
      if (node.type === "folder")
        return (
          <li key={node.$id ?? String(node.name)}>
            <span>{node.name}</span>
            {renderNativeNavigation(node.children, selectedPagePath)}
          </li>
        );
      return null;
    })}
  </ul>
);

const renderAdjacentNavigation = (
  adjacent: ReturnType<typeof getDocumentationReaderAdjacentPages>,
): ReactNode =>
  adjacent.previous || adjacent.next ? (
    <nav className={styles.adjacent} aria-label="Documentation page navigation">
      <ul className={styles.adjacentList}>
        {adjacent.previous ? (
          <li>
            <a
              aria-label={`Previous: ${adjacent.previous.title}`}
              className={styles.adjacentLink}
              href={adjacent.previous.url}
              rel="prev"
            >
              <span>Previous</span>
              <strong>{adjacent.previous.title}</strong>
            </a>
          </li>
        ) : null}
        {adjacent.next ? (
          <li>
            <a
              aria-label={`Next: ${adjacent.next.title}`}
              className={styles.adjacentLink}
              href={adjacent.next.url}
              rel="next"
            >
              <span>Next</span>
              <strong>{adjacent.next.title}</strong>
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  ) : null;

const isUnavailablePublicationError = (error: unknown) =>
  error instanceof DocumentationApiError &&
  [
    "publish_link_not_found",
    "publish_link_not_public",
    "publish_link_expired",
    "documentation_artifact_publication_not_found",
  ].includes(error.type);

export const PublicDocumentationReaderPage = ({
  slug,
  versionSlug,
  pagePath,
  loadPage = getPublicDocumentationPage,
  search = searchPublicDocumentation,
  createViewerSession = createPublicDocumentationViewerSession,
}: Props) => {
  const initialSnapshot =
    loadPage === getPublicDocumentationPage
      ? readDocumentationInitialDocument({ slug, versionSlug, pagePath })
      : null;
  const [snapshot, setSnapshot] = useState<PublicDocumentationSnapshot | null>(
    initialSnapshot,
  );
  const skipInitialLoad = useRef(initialSnapshot !== null);
  const [unavailable, setUnavailable] = useState(false);
  const [transientError, setTransientError] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequestRef = useRef(0);
  const pageBase = useMemo(
    () =>
      versionSlug
        ? `/docs/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionSlug)}`
        : `/docs/${encodeURIComponent(slug)}`,
    [slug, versionSlug],
  );

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    let active = true;
    loadPage(slug, versionSlug, pagePath)
      .then((loaded) => {
        if (active) {
          setPasswordRequired(false);
          setUnavailable(false);
          setTransientError(false);
          setSnapshot(loaded);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof DocumentationCanonicalRedirect) {
          window.location.replace(error.location);
          return;
        }
        if (
          error instanceof DocumentationApiError &&
          error.type === "publish_link_password_required"
        ) {
          setPasswordRequired(true);
          return;
        }
        setPasswordRequired(false);
        if (isUnavailablePublicationError(error)) {
          setUnavailable(true);
          setTransientError(false);
        } else {
          setUnavailable(false);
          setTransientError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [loadPage, pagePath, retry, slug, versionSlug]);

  useEffect(() => {
    if (!snapshot) return;
    document.title = `${snapshot.page.title} · ${snapshot.site.name}`;
    document.documentElement.lang = snapshot.revision.primary_language;
    const existingCanonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    const canonical = existingCanonical ?? document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = new URL(
      `${pageBase}/${snapshot.page.canonical_path}`,
      window.location.origin,
    ).toString();
    if (!existingCanonical) {
      canonical.dataset.documentationMetadata = "true";
      document.head.append(canonical);
    }
    const existingDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const description = existingDescription ?? document.createElement("meta");
    description.name = "description";
    description.content =
      snapshot.page.description ?? snapshot.site.description ?? "";
    if (!existingDescription) {
      description.dataset.documentationMetadata = "true";
      document.head.append(description);
    }
    return () => {
      if (!existingCanonical) canonical.remove();
      if (!existingDescription) description.remove();
    };
  }, [pageBase, snapshot]);

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSearchError(null);
    setSearching(true);
    try {
      const response = await search(slug, versionSlug, query.trim());
      if (searchRequestRef.current === requestId) setResults(response.results);
    } catch {
      if (searchRequestRef.current === requestId)
        setSearchError("Search is unavailable. Try again.");
    } finally {
      if (searchRequestRef.current === requestId) setSearching(false);
    }
  };

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createViewerSession(slug, { password });
      setPasswordError(null);
      setRetry((value) => value + 1);
    } catch {
      setPasswordError("Password is invalid.");
    }
  };

  if (passwordRequired)
    return (
      <main className={styles.gate} id="main-content">
        <StatusPanel
          className={styles.gatePanel}
          tone="forbidden"
          title="Password required"
          description="Enter the Publish Link password to continue reading."
          titleAs="h1"
        />
        <form
          className={styles.gateCard}
          onSubmit={(event) => void unlock(event)}
        >
          <p className={styles.eyebrow}>Protected Publication</p>
          <label>
            Publish Link password
            <input
              id="documentation-publish-link-password"
              aria-label="Publish Link password"
              aria-invalid={passwordError ? "true" : undefined}
              aria-describedby={
                passwordError ? "documentation-password-error" : undefined
              }
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
              }}
            />
          </label>
          {passwordError ? (
            <p id="documentation-password-error" role="alert">
              {passwordError}
            </p>
          ) : null}
          <button type="submit">Continue</button>
        </form>
      </main>
    );
  if (unavailable || transientError)
    return (
      <main className={styles.gate} id="main-content">
        <StatusPanel
          className={styles.gatePanel}
          tone={transientError ? "error" : "not-found"}
          title={
            transientError
              ? "Could not load Documentation"
              : "Documentation unavailable"
          }
          description={
            transientError
              ? "The published page could not be loaded. Try again."
              : "This link is unavailable or you do not have access."
          }
          action={
            transientError ? (
              <button
                type="button"
                onClick={() => {
                  setTransientError(false);
                  setSnapshot(null);
                  setRetry((value) => value + 1);
                }}
              >
                Try again
              </button>
            ) : null
          }
          titleAs="h1"
        />
      </main>
    );
  if (!snapshot)
    return (
      <main className={styles.loading} id="main-content">
        <StatusPanel
          className={styles.gatePanel}
          tone="loading"
          title="Loading Documentation"
          description="Preparing the published page and its navigation."
          titleAs="h1"
        />
      </main>
    );
  const operationBase = `${pageBase}/operations`;
  const assetBase = versionSlug
    ? `/api/v1/public/publish-links/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionSlug)}/documentation/assets`
    : `/api/v1/public/publish-links/${encodeURIComponent(slug)}/documentation/assets`;
  const pageUrl = (path: string) => `${pageBase}/${path.replace(/^\/+/, "")}`;
  const readerSource = {
    resourceClass: "publication" as const,
    selectedPageId: snapshot.page.id,
    selectedPagePath: pageUrl(snapshot.page.canonical_path),
    pages: snapshot.pages.map((page) => ({
      id: page.id,
      title: page.title,
      canonicalPath: page.canonical_path,
      url: pageUrl(page.canonical_path),
      blocks: page.blocks ?? [],
    })),
    navigation: snapshot.navigation.map((node) => ({
      id: node.id,
      kind: node.kind,
      pageId: node.page_id,
      label: node.label,
      parentId: node.parent_id,
      position: node.position,
    })),
  };
  const readerProjection = buildDocumentationReaderProjection(readerSource);
  const readerNavigationTree =
    buildDocumentationReaderNavigationTree(readerProjection);
  const authorizedReaderTree = (() => {
    try {
      return buildFumadocsPageTree(readerProjection);
    } catch {
      return null;
    }
  })();
  const adjacent = authorizedReaderTree
    ? getDocumentationReaderAdjacentPages(
        readerProjection,
        authorizedReaderTree,
      )
    : { previous: null, next: null };
  const readerContent = (
    <article className={styles.article}>
      <p className={styles.articleMeta}>
        {snapshot.site.name} · {snapshot.revision.primary_language}
      </p>
      <h1>{snapshot.page.title}</h1>
      {snapshot.page.description ? (
        <p className={styles.lede}>{snapshot.page.description}</p>
      ) : null}
      <DocumentationBlockRenderer
        assetUrl={(source) =>
          `${assetBase}/${source.kind === "capture_asset" ? "capture/" : ""}${encodeURIComponent(source.id)}/file`
        }
        blocks={snapshot.page.blocks}
        operationLabel={(operationKey) => {
          const operation = snapshot.openapi_operations.find(
            (candidate) => candidate.destination_key === operationKey,
          );
          return operation
            ? {
                method: operation.method,
                label: operation.summary ?? operation.path,
                path: operation.path,
              }
            : undefined;
        }}
        operationUrl={(operationKey) =>
          `${operationBase}/${encodeURIComponent(operationKey)}`
        }
        pageUrl={(pageId, targetBlockId) => {
          const page = snapshot.pages.find(
            (candidate) => candidate.id === pageId,
          );
          return page
            ? `${pageBase}/${page.canonical_path}${targetBlockId ? `#documentation-block-${targetBlockId}` : ""}`
            : undefined;
        }}
        snippets={snapshot.snippets ?? []}
      />
      {snapshot.current_operation?.descriptor_version === 1 &&
      snapshot.current_operation.request_descriptor ? (
        <>
          <LazyDocumentationRequestExamples
            descriptor={snapshot.current_operation.request_descriptor}
            operationName={snapshot.current_operation.destination_key}
          />
          <LazyDocumentationApiOperationExperience
            descriptor={snapshot.current_operation.request_descriptor}
            loadConfiguration={() =>
              getPublicDocumentationTryItConfiguration(
                slug,
                snapshot.current_operation!.destination_key,
                versionSlug,
              )
            }
            reportAttempt={(attemptToken, outcome) =>
              reportPublicDocumentationTryItAttempt(
                slug,
                snapshot.current_operation!.destination_key,
                attemptToken,
                outcome,
                versionSlug,
              )
            }
          />
        </>
      ) : snapshot.current_operation ? (
        <p role="note">
          Interactive requests are unavailable for this legacy operation.
        </p>
      ) : null}
    </article>
  );
  const nativeReader = (
    <div className={styles.readerLayout}>
      <button
        aria-controls="documentation-primary-navigation"
        aria-expanded={navigationOpen}
        className={styles.navigationToggle}
        onClick={() => setNavigationOpen((open) => !open)}
        type="button"
      >
        {navigationOpen
          ? "Close documentation navigation"
          : "Open documentation navigation"}
      </button>
      <nav
        aria-label="Documentation navigation"
        className={navigationOpen ? styles.primaryNavOpen : styles.primaryNav}
        id="documentation-primary-navigation"
        onClick={() => setNavigationOpen(false)}
      >
        {renderNativeNavigation(
          readerNavigationTree.children,
          readerProjection.selectedPagePath,
        )}
      </nav>
      <main className={styles.main} id="main-content">
        <nav
          aria-label="Documentation breadcrumb"
          className={styles.breadcrumb}
        >
          <ol>
            <li>
              <a href={pageBase}>Documentation</a>
            </li>
          </ol>
        </nav>
        {readerContent}
        {renderAdjacentNavigation(adjacent)}
      </main>
    </div>
  );
  return (
    <div className={styles.readerShell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <header className={styles.header} data-reader-shell="true">
        <div className={styles.brandLockup}>
          <p className={styles.eyebrow}>Public Documentation</p>
          <a className={styles.brand} href={pageBase}>
            {snapshot.site.name}
          </a>
        </div>
        <form
          className={styles.searchForm}
          role="search"
          onSubmit={(event) => void submitSearch(event)}
        >
          <label htmlFor="documentation-search">Search Documentation</label>
          <input
            className={styles.searchInput}
            id="documentation-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className={styles.searchButton} type="submit">
            Search
          </button>
        </form>
        <p className={styles.searchStatus} role="status" aria-live="polite">
          {searching
            ? "Searching…"
            : results
              ? `${results.length} ${results.length === 1 ? "result" : "results"}`
              : ""}
        </p>
        {searchError ? <p role="alert">{searchError}</p> : null}
        {results ? (
          <ul aria-label="Search results" className={styles.searchResults}>
            {results.map((result) => (
              <li key={result.page_id}>
                <a href={`${pageBase}/${result.canonical_path}`}>
                  {result.title}
                </a>
                <p>{result.excerpt}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      {authorizedReaderTree ? (
        <LazyDocumentationPublicationReaderChrome
          fallback={nativeReader}
          source={readerSource}
        >
          {readerContent}
        </LazyDocumentationPublicationReaderChrome>
      ) : (
        nativeReader
      )}
    </div>
  );
};
