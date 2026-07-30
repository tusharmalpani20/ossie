import { useEffect, useState } from "react";
import { getDocumentationPreview, type DocumentationDraftPreview } from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  loadPreview?: typeof getDocumentationPreview;
};

export const DocumentationDraftPreviewPage = ({
  projectId,
  versionSlug,
  siteId,
  loadPreview = getDocumentationPreview,
}: Props) => {
  const [preview, setPreview] = useState<DocumentationDraftPreview | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    loadPreview(projectId, versionSlug, siteId)
      .then(({ preview: loaded }) => {
        if (active) setPreview(loaded);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [loadPreview, projectId, siteId, versionSlug]);

  if (failed) return <p role="alert">Saved draft preview is unavailable.</p>;
  if (!preview) return <p role="status">Loading saved draft preview…</p>;
  return (
    <main id="main-content">
      <header>
        <p>Latest saved state — local unsaved edits are not included.</p>
        <h1>{preview.site.name} preview</h1>
        <p>Server-saved draft version {preview.working_draft.version}</p>
      </header>
      {preview.pages.map((page) => (
        <article key={page.id}>
          <h2>{page.title}</h2>
          {page.blocks.map((block) => {
            if (block.kind === "paragraph") return <p key={block.id}>{block.text}</p>;
            if (block.kind === "heading") {
              const Heading = `h${block.level}` as "h2" | "h3" | "h4";
              return <Heading key={block.id}>{block.text}</Heading>;
            }
            if (block.kind === "code")
              return <pre key={block.id}><code>{block.code}</code></pre>;
            if (block.kind === "link") return <p key={block.id}>{block.label}</p>;
            if (
              block.kind === "ordered_list" ||
              block.kind === "unordered_list"
            )
              return (
                <ul key={block.id}>
                  {block.items.map((item) => <li key={item.id}>{item.text}</li>)}
                </ul>
              );
            if (block.kind === "api_reference")
              return <p key={block.id}>API operation: {block.operation_key}</p>;
            if (block.kind === "image")
              return <p key={block.id}>{block.caption ?? block.alt_text}</p>;
            return <hr key={block.id} />;
          })}
        </article>
      ))}
    </main>
  );
};
