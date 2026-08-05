import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ulid } from "ulid";
import type { DocumentationBlock } from "@repo/types";
import {
  getDocumentationPage,
  getDocumentationPreview,
  listDocumentationArtifactPublications,
  listDocumentationAssets,
  listDocumentationSnippets,
  saveDocumentationPage,
  updateDocumentationPage,
  uploadDocumentationAsset,
  type DocumentationPage,
  documentationPageMarkdownExportUrl,
} from "../../lib/documentationApi";
import { DocumentationBlockEditor } from "./DocumentationBlockEditor";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";
import { DocumentationCommentsPanel } from "./DocumentationCommentsPanel";
import { DocumentationPortabilityPanel } from "./DocumentationPortabilityPanel";
import { LazyDocumentationAdapterProofPanel } from "./LazyDocumentationAdapterProofPanel";
import { getDocumentationAdapterProofMode } from "./adapters/documentationAdapterProof";

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
  loadOptions?: typeof getDocumentationPreview;
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
  loadOptions = getDocumentationPreview,
  autosaveDelayMs = 800,
}: Props) => {
  const [page, setPage] = useState<DocumentationPage | null>(null);
  const [blocks, setBlocks] = useState<DocumentationBlock[]>([]);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "conflict" | "error"
  >("saved");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const proofMode =
    typeof window === "undefined"
      ? null
      : getDocumentationAdapterProofMode(
          window.location.search,
          // eslint-disable-next-line turbo/no-undeclared-env-vars -- DEV is a Vite built-in mode flag, not a user environment variable.
          import.meta.env.DEV,
        );
  const [assetStatus, setAssetStatus] = useState("");
  const [metadataTitle, setMetadataTitle] = useState("");
  const [metadataPath, setMetadataPath] = useState("");
  const [metadataStatus, setMetadataStatus] = useState("");
  const [snippetOptions, setSnippetOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [assetOptions, setAssetOptions] = useState<
    Array<{
      id: string;
      kind: "documentation_asset" | "capture_asset";
      label: string;
    }>
  >([]);
  const [guidePublicationOptions, setGuidePublicationOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [demoPublicationOptions, setDemoPublicationOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [pageOptions, setPageOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [openApiOptions, setOpenApiOptions] = useState<
    Array<{
      id: string;
      label: string;
      openapiSourceId: string;
      operationKey: string;
    }>
  >([]);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);

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

  useEffect(() => {
    if (!canWrite) return;
    let active = true;
    Promise.all([
      listDocumentationSnippets(projectId, versionSlug, siteId, "active"),
      listDocumentationAssets(projectId, versionSlug, siteId, {
        status: "active",
      }),
      listDocumentationArtifactPublications(
        projectId,
        versionSlug,
        siteId,
        "guide",
      ),
      listDocumentationArtifactPublications(
        projectId,
        versionSlug,
        siteId,
        "interactive_demo",
      ),
    ])
      .then(([snippets, assets, guides, demos]) => {
        if (!active) return;
        setSnippetOptions(
          snippets.snippets.map((snippet) => ({
            id: snippet.id,
            label: snippet.name,
          })),
        );
        setAssetOptions(
          assets.assets.map((asset) => ({
            ...asset.source,
            label:
              asset.source.kind === "capture_asset"
                ? `${asset.name} · Capture · ${asset.source_project_version?.name ?? "Unknown version"}`
                : `${asset.name} · Documentation`,
          })),
        );
        setGuidePublicationOptions(
          guides.publications.map((publication) => ({
            id: publication.published_artifact_id,
            label: `${publication.title} · ${publication.project_version_name} · r${publication.revision_number} · p${publication.publication_sequence}`,
          })),
        );
        setDemoPublicationOptions(
          demos.publications.map((publication) => ({
            id: publication.published_artifact_id,
            label: `${publication.title} · ${publication.project_version_name} · r${publication.revision_number} · p${publication.publication_sequence}`,
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [canWrite, loadOptions, projectId, siteId, versionSlug]);

  useEffect(() => {
    let active = true;
    loadOptions(projectId, versionSlug, siteId)
      .then(({ preview }) => {
        if (!active) return;
        setDraftVersion(preview.working_draft.version);
        setPageOptions(
          preview.pages.map((candidate) => ({
            id: candidate.id,
            label: `${candidate.title} · /${candidate.canonical_path}`,
          })),
        );
        setOpenApiOptions(
          preview.openapi_operations.map((operation) => ({
            id: operation.id,
            openapiSourceId: operation.openapi_source_id,
            operationKey: operation.destination_key,
            label: `${operation.method.toUpperCase()} ${operation.path} · ${operation.summary ?? operation.destination_key}`,
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [canWrite, loadOptions, projectId, siteId, versionSlug]);

  const save = useCallback(async () => {
    if (!page) return;
    setSaveState("saving");
    try {
      const result = await savePage(projectId, versionSlug, siteId, pageId, {
        expected_page_version: page.version,
        blocks,
      });
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
          position: Math.max(0, ...current.map((block) => block.position)) + 1,
          expected_version: null,
          source: { kind: "documentation_asset", id: asset.id },
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
      const result = await updatePage(projectId, versionSlug, siteId, pageId, {
        expected_version: page.version,
        title: metadataTitle.trim(),
        canonical_path: metadataPath.trim(),
      });
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
    <section aria-labelledby="documentation-page-heading">
      <p>Documentation Page</p>
      <h1 id="documentation-page-heading">{page.title}</h1>
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
          <Button onClick={() => void saveMetadata()}>Save Page details</Button>
          <p role="status">{metadataStatus}</p>
        </section>
      ) : null}
      {draftVersion ? (
        <section aria-labelledby="documentation-page-portability-heading">
          <h2 id="documentation-page-portability-heading">
            Page import and export
          </h2>
          <p>
            Markdown is readable, create-only interchange. It omits Page
            description, keywords, binary media, and typed relationship
            fidelity. Use a Site package for a complete round trip.
          </p>
          <a
            href={documentationPageMarkdownExportUrl(
              projectId,
              versionSlug,
              siteId,
              pageId,
              page.version,
              draftVersion,
            )}
            download
          >
            Export current Page Markdown
          </a>
          <DocumentationPortabilityPanel
            projectId={projectId}
            versionSlug={versionSlug}
            kind="page_markdown"
            mode="page"
            siteId={siteId}
            draftVersion={draftVersion}
            canImport={canWrite}
          />
        </section>
      ) : null}
      {proofMode === "tiptap-prose" || proofMode === "tiptap-graph" ? (
        <LazyDocumentationAdapterProofPanel
          blocks={blocks}
          mode={proofMode}
          onChange={(nextBlocks) => {
            setBlocks(nextBlocks);
            setSaveState("unsaved");
          }}
          readOnly={!canWrite}
        />
      ) : canWrite ? (
        <DocumentationBlockEditor
          assetOptions={assetOptions}
          blocks={blocks}
          demoPublicationOptions={demoPublicationOptions}
          guidePublicationOptions={guidePublicationOptions}
          onChange={(nextBlocks) => {
            setBlocks(nextBlocks);
            setSaveState("unsaved");
          }}
          openApiOptions={openApiOptions}
          pageOptions={pageOptions}
          proseAdapter
          snippetOptions={snippetOptions}
        />
      ) : null}
      {canWrite ? (
        <section aria-labelledby="documentation-image-heading">
          <h2 id="documentation-image-heading">Add image</h2>
          <label>
            Documentation image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
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
          <DocumentationBlockRenderer blocks={blocks} />
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
    </section>
  );
};
