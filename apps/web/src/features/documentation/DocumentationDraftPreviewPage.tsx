import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  getDocumentationPreview,
  type DocumentationDraftPreview,
} from "../../lib/documentationApi";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";
import { StatusPanel } from "@repo/ui/status-panel";

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
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setPreview(null);
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
  }, [loadPreview, projectId, reload, siteId, versionSlug]);

  if (failed)
    return (
      <StatusPanel
        tone="error"
        title="Saved draft preview unavailable"
        description="Saved draft preview is unavailable."
        action={
          <Button type="button" onClick={() => setReload((value) => value + 1)}>
            Try again
          </Button>
        }
        titleAs="h1"
      />
    );
  if (!preview)
    return (
      <StatusPanel
        tone="loading"
        title="Loading saved draft preview"
        description="Reading the latest server-saved Documentation state."
        titleAs="h1"
      />
    );
  return (
    <section aria-labelledby="documentation-preview-heading">
      <header>
        <p>Latest saved state — local unsaved edits are not included.</p>
        <h1 id="documentation-preview-heading">{preview.site.name} preview</h1>
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
    </section>
  );
};
