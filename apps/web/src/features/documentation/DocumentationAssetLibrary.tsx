import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  listDocumentationAssets,
  transitionDocumentationAsset,
  uploadDocumentationAsset,
  type DocumentationAsset,
} from "../../lib/documentationApi";
import styles from "./DocumentationContentWorkflows.module.css";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  listAssets?: typeof listDocumentationAssets;
  transitionAsset?: typeof transitionDocumentationAsset;
  uploadAsset?: typeof uploadDocumentationAsset;
};

export const DocumentationAssetLibrary = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  listAssets = listDocumentationAssets,
  transitionAsset = transitionDocumentationAsset,
  uploadAsset = uploadDocumentationAsset,
}: Props) => {
  const [assets, setAssets] = useState<DocumentationAsset[]>([]);
  const [status, setStatus] = useState("Loading Assets…");

  const load = () =>
    listAssets(projectId, versionSlug, siteId, {
      status: "all",
      includeInUse: true,
    }).then(({ assets: loaded }) => {
      setAssets(loaded);
      setStatus(loaded.length ? "Assets loaded." : "No Assets yet.");
    });

  useEffect(() => {
    let active = true;
    load().catch(() => {
      if (active) setStatus("Assets could not be loaded.");
    });
    return () => {
      active = false;
    };
    // The injected loader is the stable dependency for this panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listAssets, projectId, siteId, versionSlug]);

  const upload = async (file?: File) => {
    if (!file) return;
    setStatus("Uploading Documentation Asset…");
    try {
      await uploadAsset(projectId, versionSlug, siteId, file);
      await load();
      setStatus("Documentation Asset uploaded.");
    } catch {
      setStatus("Documentation Asset upload failed.");
    }
  };

  const transition = async (asset: DocumentationAsset) => {
    if (asset.source.kind !== "documentation_asset") return;
    const command = asset.status === "active" ? "archive" : "restore";
    setStatus(`${command === "archive" ? "Archiving" : "Restoring"} Asset…`);
    try {
      await transitionAsset(
        projectId,
        versionSlug,
        siteId,
        asset.source.id,
        asset.version,
        command,
      );
      await load();
    } catch {
      setStatus("Asset lifecycle change failed.");
    }
  };

  return (
    <section aria-labelledby="documentation-assets-heading">
      <h2 id="documentation-assets-heading">Assets</h2>
      {canWrite ? (
        <label>
          Upload Documentation image
          <input
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void upload(event.target.files?.[0])}
            type="file"
          />
        </label>
      ) : null}
      <div className={styles.assetGrid}>
        {assets.map((asset) => (
          <article key={`${asset.source.kind}:${asset.source.id}`}>
            <h3>{asset.name}</h3>
            <p>
              {asset.source.kind === "capture_asset"
                ? `Capture · ${asset.source_project_version?.name ?? "Unknown version"}`
                : "Documentation upload"}
            </p>
            <p>
              {asset.mime_type} · {asset.width} × {asset.height} ·{" "}
              {asset.status}
            </p>
            {canWrite && asset.source.kind === "documentation_asset" ? (
              <Button onClick={() => void transition(asset)}>
                {asset.status === "active" ? "Archive" : "Restore"} Asset
              </Button>
            ) : null}
          </article>
        ))}
      </div>
      <p aria-live="polite" role="status">
        {status}
      </p>
    </section>
  );
};
