import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  applyDocumentationImport,
  cancelDocumentationImport,
  inspectDocumentationImport,
  listDocumentationArtifactPublications,
  type DocumentationImportInspection,
} from "../../lib/documentationApi";
import { DocumentationImportReview } from "./DocumentationImportReview";

type Props = {
  projectId: string;
  versionSlug: string;
  kind: "page_markdown" | "site_package";
  mode: "create_site" | "empty_site" | "page";
  siteId?: string;
  siteVersion?: number;
  draftVersion?: number;
  canImport: boolean;
  onApplied?: (siteId: string) => void;
};

export const DocumentationPortabilityPanel = ({
  projectId,
  versionSlug,
  kind,
  mode,
  siteId,
  siteVersion,
  draftVersion,
  canImport,
  onApplied,
}: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] =
    useState<DocumentationImportInspection | null>(null);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [canonicalPath, setCanonicalPath] = useState("");
  const [setAsHome, setSetAsHome] = useState(false);
  const [applyLanguage, setApplyLanguage] = useState(false);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [publicationOptions, setPublicationOptions] = useState<
    Record<string, Array<{ id: string; label: string }>>
  >({});

  useEffect(() => {
    if (!inspection?.proposal.required_bindings.length) return;
    const kinds = [
      ...new Set(
        inspection.proposal.required_bindings.map((binding) => binding.kind),
      ),
    ];
    void Promise.all(
      kinds.map(async (bindingKind) => {
        const artifactType =
          bindingKind === "guide_publication"
            ? "guide"
            : "interactive_demo";
        const result = await listDocumentationArtifactPublications(
          projectId,
          versionSlug,
          siteId ?? "",
          artifactType,
        );
        return [
          bindingKind,
          result.publications.map((publication) => ({
            id: publication.published_artifact_id,
            label: `${publication.title} · ${publication.project_version_name} · r${publication.revision_number} · p${publication.publication_sequence}`,
          })),
        ] as const;
      }),
    ).then((entries) => setPublicationOptions(Object.fromEntries(entries)));
  }, [inspection, projectId, siteId, versionSlug]);

  const allBindingsSelected = useMemo(
    () =>
      inspection?.proposal.required_bindings.every(
        (binding) => bindings[binding.handle],
      ) ?? true,
    [bindings, inspection],
  );
  if (!canImport) return null;

  const inspectFile = async () => {
    if (!file) return;
    setStatus("Uploading and inspecting source…");
    try {
      const result = await inspectDocumentationImport(
        projectId,
        versionSlug,
        kind,
        file,
      );
      setInspection(result.inspection);
      setTitle(result.inspection.proposal.title ?? "");
      setCanonicalPath(result.inspection.proposal.canonical_path ?? "");
      setStatus("Inspection ready. Review before applying.");
    } catch {
      setStatus("Inspection failed. No Documentation content was changed.");
    }
  };

  const apply = async () => {
    if (!inspection) return;
    setStatus("Applying inspected import…");
    const target =
      mode === "create_site"
        ? { mode, name: null }
        : mode === "empty_site"
          ? {
              mode,
              site_id: siteId!,
              expected_site_version: siteVersion!,
              expected_draft_version: draftVersion!,
              apply_primary_language: applyLanguage,
            }
          : {
              mode,
              site_id: siteId!,
              expected_draft_version: draftVersion!,
              title,
              canonical_path: canonicalPath,
              set_as_home: setAsHome,
            };
    try {
      const result = await applyDocumentationImport(
        projectId,
        versionSlug,
        inspection.id,
        {
          content_fingerprint: inspection.content_fingerprint,
          target,
          external_bindings: inspection.proposal.required_bindings.map(
            (binding) => ({
              handle: binding.handle,
              published_artifact_id: bindings[binding.handle]!,
            }),
          ),
          confirm: true,
        },
      );
      setStatus("Import applied.");
      onApplied?.(result.application.target_site_id);
    } catch {
      setStatus(
        "Import could not be applied. Reload if the target changed, then inspect again.",
      );
    }
  };

  const cancel = async () => {
    if (!inspection) return;
    await cancelDocumentationImport(
      projectId,
      versionSlug,
      inspection.id,
    );
    setInspection(null);
    setStatus("Inspection cancelled.");
  };

  const disabled =
    !inspection ||
    inspection.has_blocking_issues ||
    !allBindingsSelected ||
    (mode === "page" && (!title.trim() || !canonicalPath.trim()));

  return (
    <section aria-labelledby={`documentation-${kind}-${mode}-heading`}>
      <h3 id={`documentation-${kind}-${mode}-heading`}>
        {kind === "site_package"
          ? "Import Site package"
          : "Import Markdown as a new Page"}
      </h3>
      <Label htmlFor={`documentation-import-${kind}-${mode}`}>
        {kind === "site_package" ? "Ossie Site ZIP" : "Markdown file"}
      </Label>
      <input
        id={`documentation-import-${kind}-${mode}`}
        type="file"
        accept={kind === "site_package" ? "application/zip,.zip" : "text/markdown,.md"}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Button disabled={!file} onClick={() => void inspectFile()}>
        Inspect file
      </Button>
      {inspection ? (
        <>
          <DocumentationImportReview inspection={inspection} />
          {mode === "page" ? (
            <>
              <Label htmlFor="documentation-import-page-title">Page title</Label>
              <Input
                id="documentation-import-page-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Label htmlFor="documentation-import-page-path">
                Canonical path
              </Label>
              <Input
                id="documentation-import-page-path"
                value={canonicalPath}
                onChange={(event) => setCanonicalPath(event.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={setAsHome}
                  onChange={(event) => setSetAsHome(event.target.checked)}
                />
                Set as Home Page when the draft has no Home Page
              </label>
            </>
          ) : null}
          {mode === "empty_site" ? (
            <label>
              <input
                type="checkbox"
                checked={applyLanguage}
                onChange={(event) => setApplyLanguage(event.target.checked)}
              />
              Use the package primary language
            </label>
          ) : null}
          {inspection.proposal.required_bindings.map((binding) => (
            <label key={binding.handle}>
              {binding.display.title}
              <select
                value={bindings[binding.handle] ?? ""}
                onChange={(event) =>
                  setBindings((current) => ({
                    ...current,
                    [binding.handle]: event.target.value,
                  }))
                }
              >
                <option value="">Select a publication</option>
                {(publicationOptions[binding.kind] ?? []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <Button disabled={disabled} onClick={() => void apply()}>
            Confirm and apply import
          </Button>
          <Button onClick={() => void cancel()}>
            Cancel inspection
          </Button>
          {disabled ? (
            <p>
              Apply is available after source blockers are resolved and every
              required field and publication is selected.
            </p>
          ) : null}
        </>
      ) : null}
      <p role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
};
