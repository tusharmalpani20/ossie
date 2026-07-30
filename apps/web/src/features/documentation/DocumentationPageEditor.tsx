import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import type { DocumentationBlock } from "@repo/types";
import {
  getDocumentationPage,
  saveDocumentationPage,
  type DocumentationPage,
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  pageId: string;
  canWrite: boolean;
  loadPage?: typeof getDocumentationPage;
  savePage?: typeof saveDocumentationPage;
  autosaveDelayMs?: number;
};

export const DocumentationPageEditor = ({
  projectId,
  versionSlug,
  siteId,
  pageId,
  canWrite,
  loadPage = getDocumentationPage,
  savePage = saveDocumentationPage,
  autosaveDelayMs = 800,
}: Props) => {
  const [page, setPage] = useState<DocumentationPage | null>(null);
  const [blocks, setBlocks] = useState<DocumentationBlock[]>([]);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "conflict" | "error"
  >("saved");

  useEffect(() => {
    let active = true;
    loadPage(projectId, versionSlug, siteId, pageId)
      .then((result) => {
        if (active) {
          setPage(result.page);
          setBlocks(result.page.blocks);
        }
      })
      .catch(() => {
        if (active) setSaveState("error");
      });
    return () => {
      active = false;
    };
  }, [loadPage, pageId, projectId, siteId, versionSlug]);

  const save = useCallback(async () => {
    if (!page) return;
    setSaveState("saving");
    try {
      const result = await savePage(
        projectId,
        versionSlug,
        siteId,
        pageId,
        { expected_page_version: page.version, blocks },
      );
      setPage(result.page);
      setBlocks(result.page.blocks);
      setSaveState("saved");
    } catch {
      setSaveState("conflict");
    }
  }, [blocks, page, pageId, projectId, savePage, siteId, versionSlug]);

  useEffect(() => {
    if (!canWrite || saveState !== "unsaved") return;
    const timeout = window.setTimeout(() => {
      void save();
    }, autosaveDelayMs);
    return () => window.clearTimeout(timeout);
  }, [autosaveDelayMs, canWrite, save, saveState]);

  if (!page) return <p role="status">Loading Documentation Page…</p>;
  const paragraph = blocks.find(
    (block): block is Extract<DocumentationBlock, { kind: "paragraph" }> =>
      block.kind === "paragraph",
  );

  const updateParagraph = (text: string) => {
    setBlocks((current) =>
      current.map((block) =>
        block.kind === "paragraph" ? { ...block, text } : block,
      ),
    );
    setSaveState("unsaved");
  };

  return (
    <main id="main-content">
      <p>Documentation Page</p>
      <h1>{page.title}</h1>
      {canWrite && paragraph ? (
        <>
          <Label htmlFor="documentation-paragraph">Paragraph text</Label>
          <Textarea
            id="documentation-paragraph"
            value={paragraph.text}
            onChange={(event) => updateParagraph(event.target.value)}
          />
        </>
      ) : null}
      <p role="status">
        {saveState === "unsaved"
          ? "Unsaved changes"
          : saveState === "saving"
            ? "Saving…"
            : saveState === "conflict"
              ? "Conflict — local work is preserved"
              : saveState === "error"
                ? "Page could not be loaded"
                : "Saved"}
      </p>
      {canWrite ? <Button onClick={() => void save()}>Save Page</Button> : null}
    </main>
  );
};
