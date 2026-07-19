import { useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import type {
  CaptureAsset,
  CaptureAssetProtectionResponse,
} from "@repo/types/capture";
import {
  changeCaptureAssetLifecycle,
  getCaptureAssetProtection,
  purgeCaptureAsset,
} from "../../lib/api";

const dependencyLabel = (
  dependency: CaptureAssetProtectionResponse["dependencies"][number],
) => {
  switch (dependency.dependency_type) {
    case "guide_working_draft":
      return `Guide Working Draft ${dependency.edition_id}`;
    case "interactive_demo_working_draft":
      return `Interactive Demo Working Draft ${dependency.edition_id}`;
    case "guide_revision":
      return `Guide Revision ${dependency.revision_number}`;
    case "interactive_demo_revision":
      return `Interactive Demo Revision ${dependency.revision_number}`;
    case "published_artifact":
      return `Published Artifact ${dependency.publication_number}`;
    case "shared_file_asset":
      return `Capture Asset ${dependency.capture_asset_id} shares this File`;
  }
};

export const CaptureAssetLifecycleControls = ({
  asset,
  projectId,
  captureSessionId,
  canWrite,
  canPurge,
  onChanged,
}: {
  asset: CaptureAsset;
  projectId: string;
  captureSessionId: string;
  canWrite: boolean;
  canPurge: boolean;
  onChanged(): void;
}) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [protection, setProtection] =
    useState<CaptureAssetProtectionResponse | null>(null);
  const status = asset.status ?? "active";

  const lifecycle = async () => {
    setBusy(true);
    setMessage("");
    try {
      await changeCaptureAssetLifecycle({
        projectId,
        captureSessionId,
        captureAssetId: asset.id,
        command: status === "active" ? "archive" : "restore",
        expectedAssetVersion: asset.version,
      });
      onChanged();
    } catch {
      setMessage("Asset lifecycle changed or the request was denied.");
      setBusy(false);
    }
  };

  const reviewPurge = async () => {
    setBusy(true);
    setMessage("");
    try {
      setProtection(
        await getCaptureAssetProtection({
          projectId,
          captureSessionId,
          captureAssetId: asset.id,
        }),
      );
    } catch {
      setMessage("Could not inspect protection dependencies.");
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    if (!protection?.can_purge) return;
    if (
      !window.confirm(
        "Permanently purge these stored bytes? This cannot be undone.",
      )
    ) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await purgeCaptureAsset({
        projectId,
        captureSessionId,
        captureAssetId: asset.id,
        expectedAssetVersion: asset.version,
      });
      onChanged();
    } catch {
      setMessage(
        "Purge failed safely. The Asset remains unavailable; retry later.",
      );
      setBusy(false);
    }
  };

  return (
    <div>
      {message ? <Alert>{message}</Alert> : null}
      {protection ? (
        <Alert variant={protection.can_purge ? "default" : "destructive"}>
          <p>
            {protection.can_purge
              ? "No protected references remain."
              : `Protected by ${protection.total_dependency_count} existing reference${protection.total_dependency_count === 1 ? "" : "s"}.`}
          </p>
          {protection.dependencies.length > 0 ? (
            <ul>
              {protection.dependencies.map((dependency, index) => (
                <li key={`${dependency.dependency_type}:${index}`}>
                  {dependencyLabel(dependency)}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            size="sm"
            variant="destructive"
            disabled={busy || !protection.can_purge}
            onClick={() => void purge()}
          >
            Confirm permanent purge
          </Button>
        </Alert>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          flexWrap: "wrap",
          marginTop: ".65rem",
        }}
      >
        {canWrite ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void lifecycle()}
          >
            {status === "active" ? "Archive Asset" : "Restore Asset"}
          </Button>
        ) : null}
        {canPurge && status === "archived" ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => void reviewPurge()}
          >
            {protection?.purge_operation_status === "failed"
              ? "Review purge retry"
              : "Review purge"}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
