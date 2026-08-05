import { AnchorProvider, TOCItem } from "fumadocs-core/toc";
import { useBreadcrumb } from "fumadocs-core/breadcrumb";
import type { ReactNode } from "react";
import {
  buildDocumentationReaderProjection,
  buildFumadocsPageTree,
  type DocumentationReaderProjectionSource,
} from "./adapters/documentationReaderAdapter";

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
              aria-current={
                node.url === selectedPagePath ? "page" : undefined
              }
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
  const projection = buildDocumentationReaderProjection(source);
  const tree = buildFumadocsPageTree(projection);
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
        data-resource-class={projection.resourceClass}
        data-testid="documentation-publication-reader-chrome"
      >
        <nav aria-label="Documentation navigation">
          {renderPageTree(tree.children, projection.selectedPagePath)}
        </nav>
        <main id="main-content">
          <nav aria-label="Documentation breadcrumb">
            <ol>
              {breadcrumb.map((item, index) => (
                <li key={`${index}-${String(item.name)}`}>
                  {item.url ? <a href={item.url}>{item.name}</a> : item.name}
                </li>
              ))}
            </ol>
          </nav>
          {children}
        </main>
        {toc.length > 0 ? (
          <aside>
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
