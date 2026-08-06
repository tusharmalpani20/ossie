import { useState } from "react";
import { AnchorProvider, TOCItem } from "fumadocs-core/toc";
import { useBreadcrumb } from "fumadocs-core/breadcrumb";
import type { ReactNode } from "react";
import {
  buildDocumentationReaderProjection,
  buildFumadocsPageTree,
  getDocumentationReaderAdjacentPages,
  type DocumentationReaderProjectionSource,
} from "./adapters/documentationReaderAdapter";
import styles from "./PublicDocumentationReaderPage.module.css";

type PublicationReaderSource = Omit<
  DocumentationReaderProjectionSource,
  "resourceClass"
> & { resourceClass: "publication" };

const renderPageTree = (
  nodes: ReturnType<typeof buildFumadocsPageTree>["children"],
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
            {renderPageTree(node.children, selectedPagePath)}
          </li>
        );
      return node.name ? (
        <li key={node.$id ?? String(node.name)}>{node.name}</li>
      ) : null;
    })}
  </ul>
);

export const DocumentationPublicationReaderChrome = ({
  source,
  children,
}: {
  source: PublicationReaderSource;
  children: ReactNode;
}) => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const projection = buildDocumentationReaderProjection(source);
  const tree = buildFumadocsPageTree(projection);
  const adjacent = getDocumentationReaderAdjacentPages(projection, tree);
  const breadcrumb = useBreadcrumb(projection.selectedPagePath, tree, {
    includePage: true,
  });
  const selected = projection.pages.find(
    (page) => page.id === projection.selectedPageId,
  );
  const toc = (selected?.headings ?? []).map((heading) => ({
    title: heading.title,
    url: `#${heading.id}`,
    depth: heading.level - 1,
  }));

  return (
    <AnchorProvider toc={toc}>
      <div
        className={styles.readerChrome}
        data-resource-class={projection.resourceClass}
        data-testid="documentation-publication-reader-chrome"
      >
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
          {renderPageTree(tree.children, projection.selectedPagePath)}
        </nav>
        <main className={styles.main} id="main-content">
          <nav
            aria-label="Documentation breadcrumb"
            className={styles.breadcrumb}
          >
            <ol>
              {breadcrumb.map((item, index) => (
                <li key={`${index}-${String(item.name)}`}>
                  {item.url ? <a href={item.url}>{item.name}</a> : item.name}
                </li>
              ))}
            </ol>
          </nav>
          {children}
          {adjacent.previous || adjacent.next ? (
            <nav
              aria-label="Documentation page navigation"
              className={styles.adjacent}
            >
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
          ) : null}
        </main>
        {toc.length > 0 ? (
          <aside className={styles.toc}>
            <nav aria-label="On this page">
              <ul>
                {toc.map((item) => (
                  <li key={item.url}>
                    <TOCItem href={item.url}>{item.title}</TOCItem>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}
      </div>
    </AnchorProvider>
  );
};
