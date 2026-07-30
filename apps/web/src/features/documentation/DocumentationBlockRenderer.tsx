import { Fragment, useState, type ReactNode } from "react";
import type { DocumentationBlock } from "@repo/types";
import styles from "./DocumentationContentWorkflows.module.css";

type FrozenPublication = {
  title: string;
  description?: string | null;
  project_version?: { name?: string };
  revision_number?: number;
  publication_sequence?: number;
};

type DocumentationAssetSource = {
  kind: "documentation_asset" | "capture_asset";
  id: string;
};

export type RenderableDocumentationBlock = DocumentationBlock & {
  publication?: FrozenPublication;
};

export type RenderableDocumentationSnippet = {
  id: string;
  name: string;
  status: "active" | "archived";
  blocks: RenderableDocumentationBlock[];
};

const inline = (text: string): ReactNode => {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|_[^_\n]+_)/gu);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_"))
      return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
};

const Tabs = ({
  block,
}: {
  block: Extract<DocumentationBlock, { kind: "tabs" }>;
}) => {
  const [selected, setSelected] = useState(0);
  return (
    <section>
      <div className={styles.tabs} role="tablist" aria-label="Content tabs">
        {block.items.map((item, index) => (
          <button
            aria-controls={`${block.id}-${item.id}-panel`}
            aria-selected={selected === index}
            id={`${block.id}-${item.id}-tab`}
            key={item.id}
            onClick={() => setSelected(index)}
            role="tab"
            tabIndex={selected === index ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {block.items.map((item, index) => (
        <div
          aria-labelledby={`${block.id}-${item.id}-tab`}
          hidden={selected !== index}
          id={`${block.id}-${item.id}-panel`}
          key={item.id}
          role="tabpanel"
        >
          <p>{inline(item.body)}</p>
        </div>
      ))}
    </section>
  );
};

export const DocumentationBlockRenderer = ({
  blocks,
  snippets = [],
  pageUrl,
  operationUrl,
  operationLabel,
  assetUrl,
}: {
  blocks: RenderableDocumentationBlock[];
  snippets?: RenderableDocumentationSnippet[];
  pageUrl?: (
    pageId: string,
    targetBlockId?: string | null,
  ) => string | undefined;
  operationUrl?: (operationKey: string) => string | undefined;
  operationLabel?: (
    operationKey: string,
  ) => { method: string; label: string; path: string } | undefined;
  assetUrl?: (source: DocumentationAssetSource) => string | undefined;
}) => (
  <div className={styles.content}>
    {blocks.map((block) => {
      switch (block.kind) {
        case "paragraph":
          return <p key={block.id}>{inline(block.text)}</p>;
        case "heading": {
          const Heading = `h${block.level}` as "h2" | "h3" | "h4";
          return (
            <Heading id={`documentation-block-${block.id}`} key={block.id}>
              {inline(block.text)}
            </Heading>
          );
        }
        case "ordered_list":
        case "unordered_list": {
          const List = block.kind === "ordered_list" ? "ol" : "ul";
          return (
            <List key={block.id}>
              {block.items.map((item) => (
                <li key={item.id}>{inline(item.text)}</li>
              ))}
            </List>
          );
        }
        case "code":
        case "code_example":
          return (
            <figure key={block.id}>
              {"title" in block && block.title ? (
                <figcaption>{block.title}</figcaption>
              ) : null}
              <pre className={styles.code}>
                <code data-language={block.language ?? undefined}>
                  {block.code}
                </code>
              </pre>
            </figure>
          );
        case "link": {
          const href =
            block.url ??
            pageUrl?.(block.page_id!, block.target_block_id ?? null);
          return href ? (
            <p key={block.id}>
              <a
                href={href}
                rel={block.url ? "noopener noreferrer" : undefined}
              >
                {block.label}
              </a>
            </p>
          ) : (
            <p key={block.id}>{block.label}</p>
          );
        }
        case "image": {
          const source =
            block.source ??
            (block.asset_id
              ? ({ kind: "documentation_asset", id: block.asset_id } as const)
              : undefined);
          const src = source ? assetUrl?.(source) : undefined;
          return (
            <figure key={block.id}>
              {src ? <img alt={block.alt_text} src={src} /> : null}
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }
        case "divider":
          return <hr key={block.id} />;
        case "api_reference": {
          const href = block.operation_key
            ? operationUrl?.(block.operation_key)
            : undefined;
          const operation = block.operation_key
            ? operationLabel?.(block.operation_key)
            : undefined;
          return (
            <aside key={block.id}>
              {href ? (
                <>
                  <a href={href}>
                    {operation ? (
                      <>
                        <strong>{operation.method.toUpperCase()}</strong>{" "}
                        {operation.label}
                      </>
                    ) : (
                      <>API operation: {block.operation_key}</>
                    )}
                  </a>
                  {operation ? <code>{operation.path}</code> : null}
                </>
              ) : (
                <p>API operation: {block.operation_key}</p>
              )}
            </aside>
          );
        }
        case "quote":
          return (
            <figure key={block.id}>
              <blockquote>{inline(block.text)}</blockquote>
              {block.attribution ? (
                <figcaption>— {block.attribution}</figcaption>
              ) : null}
            </figure>
          );
        case "table":
          return (
            <div className={styles.tableScroller} key={block.id}>
              <table
                aria-label={block.caption ?? undefined}
                className={styles.table}
              >
                {block.caption ? <caption>{block.caption}</caption> : null}
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.id}>
                      {row.cells.map((cell) => {
                        const Cell = cell.is_header ? "th" : "td";
                        return (
                          <Cell
                            key={cell.id}
                            scope={cell.is_header ? "col" : undefined}
                          >
                            {inline(cell.text)}
                          </Cell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        case "callout":
          return (
            <aside
              className={styles.callout}
              data-tone={block.tone}
              key={block.id}
              role="note"
            >
              {block.title ? <strong>{block.title}</strong> : null}
              <p>{inline(block.text)}</p>
            </aside>
          );
        case "tabs":
          return <Tabs block={block} key={block.id} />;
        case "snippet_reference": {
          const snippet = snippets.find(
            (candidate) => candidate.id === block.snippet_id,
          );
          return snippet ? (
            <section
              aria-label={`Snippet: ${snippet.name}`}
              data-snippet-status={snippet.status}
              key={block.id}
            >
              <DocumentationBlockRenderer
                assetUrl={assetUrl}
                blocks={snippet.blocks}
                operationLabel={operationLabel}
                operationUrl={operationUrl}
                pageUrl={pageUrl}
                snippets={[]}
              />
            </section>
          ) : (
            <p key={block.id} role="status">
              Referenced Snippet is unavailable.
            </p>
          );
        }
        case "guide_publication":
        case "interactive_demo_publication":
          return (
            <article className={styles.publication} key={block.id}>
              <p>
                {block.kind === "guide_publication"
                  ? "Guide publication"
                  : "Interactive Demo publication"}
              </p>
              <h3>{block.publication?.title ?? "Publication unavailable"}</h3>
              {block.publication?.description ? (
                <p>{block.publication.description}</p>
              ) : null}
              {block.publication ? (
                <p>
                  Version {block.publication.project_version?.name ?? "—"} ·
                  Revision {block.publication.revision_number ?? "—"} ·
                  Publication {block.publication.publication_sequence ?? "—"}
                </p>
              ) : null}
            </article>
          );
      }
    })}
  </div>
);
