import { useEffect, useState } from "react";
import {
  getDocumentationPreview,
  type DocumentationDraftPreview,
} from "../../lib/documentationApi";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";

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
  const [preview, setPreview] = useState<DocumentationDraftPreview | null>(
    null,
  );
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
          <DocumentationBlockRenderer
            blocks={page.blocks}
            snippets={preview.snippets ?? []}
            pageUrl={(pageId, targetBlockId) => {
              const target = preview.pages.find(
                (candidate) => candidate.id === pageId,
              );
              return target
                ? `${target.canonical_path}${targetBlockId ? `#documentation-block-${targetBlockId}` : ""}`
                : undefined;
            }}
            assetUrl={(source) =>
              `/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation-sites/${encodeURIComponent(siteId)}/assets/${source.kind === "capture_asset" ? "capture/" : ""}${encodeURIComponent(source.id)}/file`
            }
          />
        </article>
      ))}
    </main>
  );
};
