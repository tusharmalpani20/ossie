import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { ulid } from "ulid";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import type { DocumentationBlock } from "@repo/types";
import {
  getDocumentationPage,
  saveDocumentationPage,
  uploadDocumentationAsset,
  type DocumentationPage,
} from "../../lib/documentationApi";
import { DocumentationCommentsPanel } from "./DocumentationCommentsPanel";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  pageId: string;
  canWrite: boolean;
  loadPage?: typeof getDocumentationPage;
  savePage?: typeof saveDocumentationPage;
  uploadAsset?: typeof uploadDocumentationAsset;
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
  uploadAsset = uploadDocumentationAsset,
  autosaveDelayMs = 800,
}: Props) => {
  const [page, setPage] = useState<DocumentationPage | null>(null);
  const [blocks, setBlocks] = useState<DocumentationBlock[]>([]);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "conflict" | "error"
  >("saved");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [assetStatus, setAssetStatus] = useState("");

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

  const addImage = async () => {
    if (!imageFile || !imageAlt.trim()) return;
    setAssetStatus("Uploading image…");
    try {
      const { asset } = await uploadAsset(
        projectId,
        versionSlug,
        siteId,
        imageFile,
      );
      setBlocks((current) => [
        ...current,
        {
          id: ulid(),
          kind: "image",
          position:
            Math.max(0, ...current.map((block) => block.position)) + 1,
          expected_version: null,
          asset_id: asset.id,
          alt_text: imageAlt.trim(),
          caption: null,
        },
      ]);
      setImageFile(null);
      setImageAlt("");
      setSaveState("unsaved");
      setAssetStatus("Image added. Save the Page to retain the reference.");
    } catch {
      setAssetStatus("Image could not be uploaded.");
    }
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
      {canWrite ? (
        <section aria-labelledby="documentation-image-heading">
          <h2 id="documentation-image-heading">Add image</h2>
          <label>
            Documentation image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) =>
                setImageFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <label>
            Image alternative text
            <input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
            />
          </label>
          <Button
            disabled={!imageFile || !imageAlt.trim()}
            onClick={() => void addImage()}
          >
            Upload and add image
          </Button>
          <p role="status">{assetStatus}</p>
        </section>
      ) : null}
      {!canWrite ? (
        <section aria-label="Saved Page content">
          {blocks.map((block) => {
            if (block.kind === "paragraph") return <p key={block.id}>{block.text}</p>;
            if (block.kind === "heading") {
              const Heading = `h${block.level}` as "h2" | "h3" | "h4";
              return <Heading key={block.id}>{block.text}</Heading>;
            }
            if (
              block.kind === "ordered_list" ||
              block.kind === "unordered_list"
            ) {
              const List = block.kind === "ordered_list" ? "ol" : "ul";
              return (
                <List key={block.id}>
                  {block.items.map((item) => <li key={item.id}>{item.text}</li>)}
                </List>
              );
            }
            if (block.kind === "code")
              return <pre key={block.id}><code>{block.code}</code></pre>;
            if (block.kind === "link")
              return block.url ? (
                <p key={block.id}><a href={block.url}>{block.label}</a></p>
              ) : (
                <p key={block.id}>{block.label}</p>
              );
            if (block.kind === "divider") return <hr key={block.id} />;
            if (block.kind === "api_reference")
              return <p key={block.id}>API operation: {block.operation_key}</p>;
            if (block.kind === "image")
              return <p key={block.id}>{block.caption ?? block.alt_text}</p>;
            return null;
          })}
        </section>
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
      <DocumentationCommentsPanel
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        pageId={pageId}
        canComment={canWrite}
      />
    </main>
  );
};
