import {
  NoUsableCaptureEventsError,
} from "../errors/demo-domain-error";
import type {
  InteractiveDemoSourceCaptureSession,
  InteractiveDemoSourceEvent,
  NormalizedGeneratedDemoScene,
} from "../types/demo-domain";
import { compact_optional_string } from "./demo-input-policy";

export {
  NoUsableCaptureEventsError,
};

export const normalize_create_demo_from_capture_source = (
  capture_session: InteractiveDemoSourceCaptureSession
) => ({
  title: capture_session.name.trim(),
  description: compact_optional_string(capture_session.description) ?? null,
});

export const title_for_demo_scene_source_event = (event: InteractiveDemoSourceEvent) => {
  const target_text = compact_optional_string(event.target_text);
  if (event.event_type === "click" && target_text) {
    return `Click ${target_text}`;
  }

  const target_label = compact_optional_string(event.target_label);
  if (event.event_type === "click" && target_label) {
    return `Click ${target_label}`;
  }

  const page_title = compact_optional_string(event.page_title);
  if (page_title) {
    return page_title;
  }

  const note = compact_optional_string(event.note);
  if (note) {
    return note;
  }

  return `Step ${event.event_index}`;
};

export const build_demo_from_capture_source = (input: {
  source_events: InteractiveDemoSourceEvent[];
  screenshot_capture_asset_ids: ReadonlySet<string>;
}): NormalizedGeneratedDemoScene[] => {
  const scenes = input.source_events
    .filter((event) => event.capture_asset_id && input.screenshot_capture_asset_ids.has(event.capture_asset_id))
    .map((event, index) => ({
      scene_index: index + 1,
      source_capture_event_id: event.id,
      source_capture_asset_id: event.capture_asset_id as string,
      background_capture_asset_id: event.capture_asset_id as string,
      title: title_for_demo_scene_source_event(event),
      description: null,
    }));

  if (scenes.length === 0) {
    throw new NoUsableCaptureEventsError();
  }

  return scenes;
};

export const demo_redirect_path = (project_id: string, project_version_id: string, interactive_demo_id: string) => (
  `/projects/${encodeURIComponent(project_id)}/versions/${encodeURIComponent(project_version_id)}/interactive-demos/${encodeURIComponent(interactive_demo_id)}`
);
