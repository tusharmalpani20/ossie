import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ulid } from "ulid";
import type { DocumentationBlock } from "@repo/types";
import {
  getDocumentationPage,
  saveDocumentationPage,
  updateDocumentationPage,
  uploadDocumentationAsset,
  type DocumentationPage,
} from "../../lib/documentationApi";
import { DocumentationBlockEditor } from "./DocumentationBlockEditor";
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
  updatePage?: typeof updateDocumentationPage;
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
  updatePage = updateDocumentationPage,
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
  const [metadataTitle, setMetadataTitle] = useState("");
  const [metadataPath, setMetadataPath] = useState("");
  const [metadataStatus, setMetadataStatus] = useState("");

  useEffect(() => {
    let active = true;
    loadPage(projectId, versionSlug, siteId, pageId)
      .then((result) => {
        if (active) {
          setPage(result.page);
          setBlocks(result.page.blocks);
          setMetadataTitle(result.page.title);
          setMetadataPath(result.page.canonical_path);
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

  const saveMetadata = async () => {
    if (!page || !metadataTitle.trim() || !metadataPath.trim()) return;
    setMetadataStatus("Saving Page details…");
    try {
      const result = await updatePage(
        projectId,
        versionSlug,
        siteId,
        pageId,
        {
          expected_version: page.version,
          title: metadataTitle.trim(),
          canonical_path: metadataPath.trim(),
        },
      );
      setPage(result.page);
      setMetadataTitle(result.page.title);
      setMetadataPath(result.page.canonical_path);
      setMetadataStatus(
        result.page.canonical_path === page.canonical_path
          ? "Page details saved."
          : `Page moved. ${page.canonical_path} is now a permanent alias.`,
      );
    } catch {
      setMetadataStatus("Page details changed elsewhere. Reload and retry.");
    }
  };

  return (
    <main id="main-content">
      <p>Documentation Page</p>
      <h1>{page.title}</h1>
      {canWrite ? (
        <section aria-labelledby="documentation-page-details-heading">
          <h2 id="documentation-page-details-heading">Page details</h2>
          <Label htmlFor="documentation-page-title">Page title</Label>
          <Input
            id="documentation-page-title"
            value={metadataTitle}
            onChange={(event) => setMetadataTitle(event.target.value)}
          />
          <Label htmlFor="documentation-page-path">Canonical path</Label>
          <Input
            id="documentation-page-path"
            value={metadataPath}
            onChange={(event) => setMetadataPath(event.target.value)}
          />
          {metadataPath !== page.canonical_path ? (
            <p>The former path will become a permanent alias.</p>
          ) : null}
          <Button onClick={() => void saveMetadata()}>
            Save Page details
          </Button>
          <p role="status">{metadataStatus}</p>
        </section>
      ) : null}
      {canWrite ? (
        <DocumentationBlockEditor
          blocks={blocks}
          onChange={(nextBlocks) => {
            setBlocks(nextBlocks);
            setSaveState("unsaved");
          }}
        />
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
