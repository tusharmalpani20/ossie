/**
 * @fileoverview Presentational sections for Capture Session detail.
 */

import type { ReactNode } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  assetAltText,
  assetTitle,
  eventPageLabel,
  eventTitle,
  formatBytes,
  formatDateTime,
  plural,
  type EventEditDraft,
} from "./CaptureSessionDetailHelpers";
import type { CaptureAsset, CaptureEvent, CaptureSessionDetail } from "./types";
import styles from "./CaptureSessionDetailPage.module.css";

export const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.metric}>
    <div className={styles.metricLabel}>{label}</div>
    <div className={styles.metricValue}>{value}</div>
  </div>
);

export const CaptureSessionMetrics = ({
  detail,
}: {
  detail: CaptureSessionDetail;
}) => {
  const session = detail.capture_session;

  return (
    <div className={styles.metrics}>
      <Metric
        label="Events"
        value={plural(detail.capture_events.length, "event")}
      />
      <Metric
        label="Assets"
        value={plural(detail.capture_assets.length, "asset")}
      />
      <Metric label="Started" value={formatDateTime(session.started_at)} />
      <Metric label="Completed" value={formatDateTime(session.completed_at)} />
      <Metric
        label="Browser"
        value={
          [session.browser_name, session.browser_version]
            .filter(Boolean)
            .join(" ") || "Not set"
        }
      />
      <Metric label="System" value={session.operating_system ?? "Not set"} />
      <Metric
        label="Viewport"
        value={
          session.viewport_width && session.viewport_height
            ? `${session.viewport_width} x ${session.viewport_height}`
            : "Not set"
        }
      />
      <Metric
        label="Device scale"
        value={
          session.device_pixel_ratio ? `${session.device_pixel_ratio}x` : "Not set"
        }
      />
    </div>
  );
};

export const EventRow = ({
  event,
  stepNumber,
  linkedAsset,
  canReorder,
  disableReorder,
  canEdit,
  disableEdit,
  isEditing,
  editDraft,
  editError,
  isSaving,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onCancelEdit,
  onChangeDraft,
  onSave,
}: {
  event: CaptureEvent;
  stepNumber: number;
  linkedAsset?: CaptureAsset;
  canReorder: boolean;
  disableReorder: boolean;
  canEdit: boolean;
  disableEdit: boolean;
  isEditing: boolean;
  editDraft: EventEditDraft | null;
  editError: string | null;
  isSaving: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChangeDraft: (field: keyof EventEditDraft, value: string) => void;
  onSave: () => void;
}) => {
  const pageLabel = eventPageLabel(event);
  const title = eventTitle(event);
  const secondaryDetails = [
    event.target_label,
    event.target_text,
    event.input_intent,
  ].filter((value): value is string => Boolean(value) && value !== title);

  return (
    <article className={styles.event}>
      <div className={styles.eventIndex}>{stepNumber}</div>
      <div className={styles.eventBody}>
        {isEditing && editDraft ? (
          <form
            className={styles.eventEditForm}
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              onSave();
            }}
          >
            {editError ? (
              <Alert variant="destructive">{editError}</Alert>
            ) : null}
            <Label className={styles.field}>
              <span>Event page title</span>
              <Input
                value={editDraft.page_title}
                disabled={isSaving}
                onChange={(changeEvent) =>
                  onChangeDraft("page_title", changeEvent.target.value)
                }
              />
            </Label>
            <Label className={styles.field}>
              <span>Event page URL</span>
              <Input
                value={editDraft.page_url}
                disabled={isSaving}
                onChange={(changeEvent) =>
                  onChangeDraft("page_url", changeEvent.target.value)
                }
              />
            </Label>
            <Label className={styles.field}>
              <span>Event target label</span>
              <Input
                value={editDraft.target_label}
                disabled={isSaving}
                onChange={(changeEvent) =>
                  onChangeDraft("target_label", changeEvent.target.value)
                }
              />
            </Label>
            <Label className={styles.field}>
              <span>Event target text</span>
              <Input
                value={editDraft.target_text}
                disabled={isSaving}
                onChange={(changeEvent) =>
                  onChangeDraft("target_text", changeEvent.target.value)
                }
              />
            </Label>
            <Label className={styles.field}>
              <span>Event input intent</span>
              <Input
                value={editDraft.input_intent}
                disabled={isSaving}
                onChange={(changeEvent) =>
                  onChangeDraft("input_intent", changeEvent.target.value)
                }
              />
            </Label>
            <Label className={styles.field}>
              <span>Event note</span>
              <Textarea
                value={editDraft.note}
                disabled={isSaving}
                onChange={(changeEvent) =>
                  onChangeDraft("note", changeEvent.target.value)
                }
              />
            </Label>
            <div className={styles.eventEditActions}>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? `Saving event ${stepNumber}`
                  : `Save event ${stepNumber}`}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={isSaving}
                onClick={onCancelEdit}
              >
                {`Cancel event ${stepNumber} edit`}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className={styles.eventHeader}>
              <span className={styles.eventTitle}>{title}</span>
              <span className={styles.eventType}>{event.event_type}</span>
            </div>
            <div className={styles.eventMeta}>
              {formatDateTime(event.occurred_at)}
              {pageLabel ? ` · ${pageLabel}` : ""}
            </div>
            {secondaryDetails.length > 0 ? (
              <div className={styles.eventMeta}>
                {secondaryDetails.join(" · ")}
              </div>
            ) : null}
            {linkedAsset ? (
              <div className={styles.linkedAsset}>Linked screenshot</div>
            ) : null}
          </>
        )}
      </div>
      {canReorder || canEdit ? (
        <div className={styles.eventActions}>
          {canEdit ? (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={disableEdit || isEditing}
              aria-label={`Edit event ${stepNumber}`}
              onClick={onEdit}
            >
              Edit
            </Button>
          ) : null}
          {canReorder ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={disableReorder || isFirst}
                aria-label={`Move event ${stepNumber} up`}
                onClick={onMoveUp}
              >
                Up
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={disableReorder || isLast}
                aria-label={`Move event ${stepNumber} down`}
                onClick={onMoveDown}
              >
                Down
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export const AssetPreview = ({
  asset,
  imageUrl,
  eager,
  controls,
}: {
  asset: CaptureAsset;
  imageUrl: string;
  eager: boolean;
  controls?: ReactNode;
}) => (
  <article className={styles.asset}>
    <img
      className={styles.preview}
      src={imageUrl}
      alt={assetAltText(asset)}
      loading={eager ? "eager" : "lazy"}
    />
    <div className={styles.assetBody}>
      <div className={styles.assetTitle}>{assetTitle(asset)}</div>
      <div className={styles.assetMeta}>
        Lifecycle: {asset.status ?? "active"}
      </div>
      <div className={styles.assetMeta}>
        {asset.width && asset.height
          ? `${asset.width} x ${asset.height}`
          : "Dimensions unknown"}
        {asset.device_pixel_ratio ? ` · ${asset.device_pixel_ratio}x` : ""}
      </div>
      <div className={styles.assetMeta}>
        {asset.file.mime_type} · {formatBytes(asset.file.size_bytes)} ·{" "}
        {formatDateTime(asset.captured_at)}
      </div>
      {asset.page_title || asset.page_url ? (
        <div className={styles.assetMeta}>
          {asset.page_title ?? asset.page_url}
        </div>
      ) : null}
      {controls}
    </div>
  </article>
);
