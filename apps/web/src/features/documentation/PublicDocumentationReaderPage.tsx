import { useEffect, useMemo, useRef, useState } from "react";
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
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";
import { LazyDocumentationApiOperationExperience } from "./LazyDocumentationApiOperationExperience";
import { LazyDocumentationPublicationReaderChrome } from "./LazyDocumentationPublicationReaderChrome";
import { readDocumentationInitialDocument } from "../../lib/documentationInitialDocument";

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
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
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
        setUnavailable(true);
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
    setSearching(true);
    try {
      const response = await search(slug, versionSlug, query.trim());
      setResults(response.results);
    } finally {
      setSearching(false);
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
      <main id="main-content">
        <form onSubmit={(event) => void unlock(event)}>
          <h1>Password required</h1>
          <label>
            Publish Link password
            <input
              aria-label="Publish Link password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
              }}
            />
          </label>
          {passwordError ? <p role="alert">{passwordError}</p> : null}
          <button type="submit">Continue</button>
        </form>
      </main>
    );
  if (unavailable)
    return (
      <main id="main-content">
        <h1>Documentation unavailable</h1>
        <p>This link is unavailable or you do not have access.</p>
      </main>
    );
  if (!snapshot) return <p role="status">Loading Documentation…</p>;
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
    })),
  };
  const readerContent = (
    <>
      <h1>{snapshot.page.title}</h1>
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
      ) : snapshot.current_operation ? (
        <p role="note">
          Interactive requests are unavailable for this legacy operation.
        </p>
      ) : null}
    </>
  );
  const nativeReader = (
    <div>
      <nav aria-label="Documentation navigation">
        <ul>
          {snapshot.navigation
            .filter((node) => node.kind === "page")
            .map((node) => {
              const page = snapshot.pages.find(
                (candidate) => candidate.id === node.page_id,
              );
              return page ? (
                <li key={node.id}>
                  <a href={pageUrl(page.canonical_path)}>
                    {node.label ?? page.title}
                  </a>
                </li>
              ) : null;
            })}
        </ul>
      </nav>
      <main id="main-content">
        <p>
          <a href={pageBase}>Documentation</a>
        </p>
        {readerContent}
      </main>
    </div>
  );
  return (
    <>
      <a href="#main-content">Skip to content</a>
      <header>
        <a href={pageBase}>{snapshot.site.name}</a>
        <form role="search" onSubmit={(event) => void submitSearch(event)}>
          <label htmlFor="documentation-search">Search Documentation</label>
          <input
            id="documentation-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <p role="status">
          {searching
            ? "Searching…"
            : results
              ? `${results.length} ${results.length === 1 ? "result" : "results"}`
              : ""}
        </p>
        {results ? (
          <ul>
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
      <LazyDocumentationPublicationReaderChrome
        fallback={nativeReader}
        source={readerSource}
      >
        {readerContent}
      </LazyDocumentationPublicationReaderChrome>
    </>
  );
};
