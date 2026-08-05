import { useMemo } from "react";
import { AnchorProvider, TOCItem, useActiveAnchor } from "fumadocs-core/toc";
import { useBreadcrumb } from "fumadocs-core/breadcrumb";
import {
  buildDocumentationReaderProjection,
  buildFumadocsPageTree,
  type DocumentationReaderProjectionSource,
} from "./adapters/documentationReaderAdapter";

const ActiveHeading = () => {
  const activeAnchor = useActiveAnchor();
  return <p role="status">Active heading: {activeAnchor ?? "none"}</p>;
};

export const DocumentationReaderAdapterProofPanel = ({
  source,
}: {
  source: DocumentationReaderProjectionSource;
}) => {
  const projection = useMemo(
    () => buildDocumentationReaderProjection(source),
    [source],
  );
  const tree = useMemo(() => buildFumadocsPageTree(projection), [projection]);
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
    <section aria-labelledby="documentation-fumadocs-heading">
      <h2 id="documentation-fumadocs-heading">Fumadocs headless proof</h2>
      <p>
        Authorized {projection.resourceClass} input is projected into a
        privacy-minimized page tree, breadcrumb, and heading TOC.
      </p>
      <nav aria-label="Fumadocs breadcrumb">
        <ol>
          {breadcrumb.map((item) => (
            <li key={`${item.url ?? "root"}-${String(item.name)}`}>
              {item.url ? <a href={item.url}>{item.name}</a> : item.name}
            </li>
          ))}
        </ol>
      </nav>
      <nav aria-label="Fumadocs page tree">
        <ul>
          {tree.children.map((node) =>
            node.type === "page" ? (
              <li key={node.$id ?? node.url}>
                <a href={node.url}>{node.name}</a>
              </li>
            ) : (
              <li key={node.$id ?? String(node.name)}>{node.name}</li>
            ),
          )}
        </ul>
      </nav>
      <AnchorProvider toc={toc}>
        <nav aria-label="Fumadocs table of contents">
          <ul>
            {toc.map((item) => (
              <li key={item.url}>
                <TOCItem href={item.url}>{item.title}</TOCItem>
              </li>
            ))}
          </ul>
        </nav>
        <ActiveHeading />
      </AnchorProvider>
    </section>
  );
};
