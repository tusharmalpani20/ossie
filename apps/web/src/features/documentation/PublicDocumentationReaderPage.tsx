import { useEffect, useMemo, useState } from "react";
import type { DocumentationBlock } from "@repo/types";
import {
  getPublicDocumentationPage,
  searchPublicDocumentation,
  type PublicDocumentationSnapshot,
} from "../../lib/documentationApi";

type SearchResult = Awaited<
  ReturnType<typeof searchPublicDocumentation>
>["results"][number];

type Props = {
  slug: string;
  versionSlug?: string;
  pagePath?: string;
  loadPage?: typeof getPublicDocumentationPage;
  search?: typeof searchPublicDocumentation;
};

const Block = ({
  block,
  snapshot,
  pageBase,
  operationBase,
}: {
  block: DocumentationBlock;
  snapshot: PublicDocumentationSnapshot;
  pageBase: string;
  operationBase: string;
}) => {
  switch (block.kind) {
    case "paragraph":
      return <p>{block.text}</p>;
    case "heading": {
      const Heading = `h${block.level}` as "h2" | "h3" | "h4";
      return <Heading>{block.text}</Heading>;
    }
    case "ordered_list":
    case "unordered_list": {
      const List = block.kind === "ordered_list" ? "ol" : "ul";
      return (
        <List>
          {block.items.map((item) => <li key={item.id}>{item.text}</li>)}
        </List>
      );
    }
    case "code":
      return <pre><code data-language={block.language ?? undefined}>{block.code}</code></pre>;
    case "link": {
      const page = snapshot.pages.find((candidate) => candidate.id === block.page_id);
      return (
        <p>
          <a
            href={
              page
                ? `${pageBase}/${page.canonical_path}`
                : block.url
            }
            rel={block.url ? "noopener noreferrer" : undefined}
          >
            {block.label}
          </a>
        </p>
      );
    }
    case "api_reference": {
      const operation = snapshot.openapi_operations.find(
        (candidate) => candidate.destination_key === block.operation_key,
      );
      return operation ? (
        <aside>
          <a href={`${operationBase}/${operation.destination_key}`}>
            <strong>{operation.method.toUpperCase()}</strong>{" "}
            {operation.summary ?? operation.path}
          </a>
          <code>{operation.path}</code>
        </aside>
      ) : null;
    }
    case "divider":
      return <hr />;
    case "image":
      return <figure><figcaption>{block.caption ?? block.alt_text}</figcaption></figure>;
  }
};

export const PublicDocumentationReaderPage = ({
  slug,
  versionSlug,
  pagePath,
  loadPage = getPublicDocumentationPage,
  search = searchPublicDocumentation,
}: Props) => {
  const [snapshot, setSnapshot] = useState<PublicDocumentationSnapshot | null>(null);
  const [unavailable, setUnavailable] = useState(false);
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
    let active = true;
    loadPage(slug, versionSlug, pagePath)
      .then((loaded) => {
        if (active) setSnapshot(loaded);
      })
      .catch(() => {
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, [loadPage, pagePath, slug, versionSlug]);

  useEffect(() => {
    if (!snapshot) return;
    document.title = `${snapshot.page.title} · ${snapshot.site.name}`;
    document.documentElement.lang = snapshot.revision.primary_language;
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = new URL(
      `${pageBase}/${snapshot.page.canonical_path}`,
      window.location.origin,
    ).toString();
    canonical.dataset.documentationMetadata = "true";
    document.head.append(canonical);
    const description = document.createElement("meta");
    description.name = "description";
    description.content =
      snapshot.page.description ?? snapshot.site.description ?? "";
    description.dataset.documentationMetadata = "true";
    document.head.append(description);
    return () => {
      canonical.remove();
      description.remove();
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

  if (unavailable)
    return (
      <main id="main-content">
        <h1>Documentation unavailable</h1>
        <p>This link is unavailable or you do not have access.</p>
      </main>
    );
  if (!snapshot) return <p role="status">Loading Documentation…</p>;
  const operationBase = `${pageBase}/operations`;
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
                <a href={`${pageBase}/${result.canonical_path}`}>{result.title}</a>
                <p>{result.excerpt}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <div>
        <nav aria-label="Documentation">
          <ul>
            {snapshot.navigation
              .filter((node) => node.kind === "page")
              .map((node) => {
                const page = snapshot.pages.find((candidate) => candidate.id === node.page_id);
                return page ? (
                  <li key={node.id}>
                    <a href={`${pageBase}/${page.canonical_path}`}>
                      {node.label ?? page.title}
                    </a>
                  </li>
                ) : null;
              })}
          </ul>
        </nav>
        <main id="main-content">
          <p><a href={pageBase}>Documentation</a></p>
          <h1>{snapshot.page.title}</h1>
          {snapshot.page.blocks.map((block) => (
            <Block
              key={block.id}
              block={block}
              snapshot={snapshot}
              pageBase={pageBase}
              operationBase={operationBase}
            />
          ))}
        </main>
      </div>
    </>
  );
};
