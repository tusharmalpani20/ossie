import type { CaptureEventType, DemoHotspotType } from "@repo/constants";

export type InteractiveDemoSourceEventType = CaptureEventType;

export type InteractiveDemoSourceEvent = {
  id: string;
  event_type: InteractiveDemoSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_title: string | null;
  target_label: string | null;
  target_text: string | null;
  note: string | null;
};

export type InteractiveDemoSourceCaptureSession = {
  id: string;
  name: string;
  description: string | null;
};

export type NormalizedCreateInteractiveDemoInput = {
  project_version_id: string;
  title: string;
  description: string | null;
  source_capture_session_id: string | null;
};

export type NormalizedUpdateInteractiveDemoInput = Partial<{
  title: string;
  description: string | null;
}>;

export type NormalizedCreateDemoSceneInput = {
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
};

export type NormalizedUpdateDemoSceneInput = Partial<{
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
}>;

export type NormalizedGeneratedDemoScene = {
  scene_index: number;
  source_capture_event_id: string;
  source_capture_asset_id: string;
  background_capture_asset_id: string;
  title: string;
  description: string | null;
};

export type NormalizedCreateInteractiveDemoFromCaptureInput = {
  title: string;
  description: string | null;
  scenes: NormalizedGeneratedDemoScene[];
};

export type NormalizedCreateDemoHotspotInput = {
  hotspot_type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  transition: { target_scene_id: string } | null;
};

export type NormalizedUpdateDemoHotspotInput = Partial<{
  hotspot_type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  transition: { target_scene_id: string } | null;
}>;
