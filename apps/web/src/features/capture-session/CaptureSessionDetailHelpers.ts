/**
 * @fileoverview Capture Session detail helper functions and local types.
 */

import { ApiClientError } from "../../lib/api";
import type {
  CaptureAsset,
  CaptureEvent,
  UpdateCaptureEventInput,
} from "./types";

export type UploadQueueItem = {
  id: string;
  name: string;
  status: "queued" | "uploading" | "event_created" | "failed";
};

export type EventEditDraft = {
  page_title: string;
  page_url: string;
  target_label: string;
  target_text: string;
  input_intent: string;
  note: string;
};

export const allowedScreenshotMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatBytes = (value: number) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export const eventTitle = (event: CaptureEvent) =>
  event.note ??
  event.target_label ??
  event.page_title ??
  event.target_text ??
  event.event_type;

export const assetTitle = (asset: CaptureAsset) =>
  asset.file.original_name ?? asset.page_title ?? asset.page_url ?? asset.asset_type;

export const assetAltText = (asset: CaptureAsset) =>
  `${asset.page_title ?? asset.file.original_name ?? "Capture"} screenshot`;

export const optionalUploadField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

export const optionalEventField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

export const draftFromEvent = (event: CaptureEvent): EventEditDraft => ({
  page_title: event.page_title ?? "",
  page_url: event.page_url ?? "",
  target_label: event.target_label ?? "",
  target_text: event.target_text ?? "",
  input_intent: event.input_intent ?? "",
  note: event.note ?? "",
});

export const inputFromDraft = (
  draft: EventEditDraft,
): UpdateCaptureEventInput => ({
  page_title: optionalEventField(draft.page_title),
  page_url: optionalEventField(draft.page_url),
  target_label: optionalEventField(draft.target_label),
  target_text: optionalEventField(draft.target_text),
  input_intent: optionalEventField(draft.input_intent),
  note: optionalEventField(draft.note),
});

export const nextEventIndex = (events: CaptureEvent[]) =>
  events.reduce((max, event) => Math.max(max, event.event_index), 0) + 1;

export const uploadErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to upload screenshots.";
    }

    if (error.kind === "not_found") {
      return "Capture session was not found.";
    }

    if (
      error.type === "invalid_capture_asset_upload" ||
      error.type === "upload_file_required"
    ) {
      return "Screenshot input is invalid.";
    }

    if (error.type === "unsupported_capture_asset_upload_type") {
      return "Screenshot file type is not supported.";
    }

    if (error.type === "upload_too_large") {
      return "Screenshot is too large.";
    }
  }

  return "Could not upload screenshot.";
};

export const eventCreationAfterUploadErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.type === "capture_event_index_conflict") {
      return "Screenshot uploaded, but another event used that order. Reload and try again.";
    }

    if (error.kind === "unauthenticated") {
      return "Screenshot uploaded, but you must sign in again before creating the event.";
    }
  }

  return "Screenshot uploaded, but the capture event could not be created. Reload and try again.";
};

export const uploadStatusLabel = (status: UploadQueueItem["status"]) => {
  switch (status) {
    case "uploading":
      return "Uploading";
    case "event_created":
      return "Event created";
    case "failed":
      return "Failed";
    default:
      return "Queued";
  }
};

export const reorderErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to reorder capture events.";
    }

    if (error.kind === "not_found") {
      return "Capture session was not found.";
    }

    if (error.type === "invalid_capture_event_order") {
      return "Capture event order is invalid.";
    }

    if (error.type === "capture_event_reorder_not_allowed") {
      return "Capture events cannot be reordered for this session.";
    }
  }

  return "Could not reorder capture events.";
};

export const updateEventErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to edit capture events.";
    }

    if (error.kind === "not_found") {
      return "Capture event was not found.";
    }

    if (error.type === "invalid_capture_event") {
      return "Capture event input is invalid.";
    }

    if (error.type === "capture_event_update_not_allowed") {
      return "Only active manual capture sessions can be edited.";
    }
  }

  return "Could not update capture event.";
};

export const eventPageLabel = (event: CaptureEvent) => {
  if (!event.page_url) {
    return null;
  }

  try {
    return new URL(event.page_url).hostname;
  } catch {
    return event.page_url;
  }
};
