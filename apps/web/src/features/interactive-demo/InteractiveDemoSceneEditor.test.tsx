import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DemoHotspot, DemoScene } from "./types";
import {
  InteractiveDemoSceneEditor,
  type InteractiveDemoSceneEditorProps,
} from "./InteractiveDemoSceneEditor";

const now = "2026-07-29T12:00:00.000Z";
const scene = {
  id: "scene_1",
  scene_index: 1,
  title: "Start",
  description: null,
  background_capture_asset_id: null,
} as DemoScene;
const hotspot = {
  id: "hotspot_1",
  hotspot_index: 1,
  hotspot_type: "click",
  label: "Continue",
  content: null,
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.1,
  transition: null,
  created_at: now,
  updated_at: now,
} as DemoHotspot;

const props = (hotspots: DemoHotspot[]): InteractiveDemoSceneEditorProps => ({
  projectId: "project_1",
  scene,
  sceneNumber: 1,
  isFirst: true,
  isLast: true,
  draft: {
    title: "Start",
    description: "",
    background_capture_asset_id: "",
  },
  pendingAction: null,
  resolveAssetUrl: (url) => url,
  scenes: [scene],
  backgroundAssets: [],
  selectableBackgroundAssetIds: [],
  backgroundPickerError: false,
  retryBackgroundAssets: vi.fn(),
  hotspots,
  hotspotDrafts: {},
  updateDraft: vi.fn(),
  updateHotspotDraft: vi.fn(),
  saveCurrentScene: vi.fn(),
  moveScene: vi.fn(),
  deleteCurrentScene: vi.fn(),
  createCurrentHotspot: vi.fn(),
  saveCurrentHotspot: vi.fn(),
  moveHotspot: vi.fn(),
  deleteCurrentHotspot: vi.fn(),
});

describe("InteractiveDemoSceneEditor", () => {
  it("selects the first Hotspot added after an empty render", () => {
    const { rerender } = render(<InteractiveDemoSceneEditor {...props([])} />);
    expect(screen.queryByLabelText("Hotspot label")).toBeNull();

    rerender(<InteractiveDemoSceneEditor {...props([hotspot])} />);

    expect(screen.getByLabelText("Hotspot label")).toHaveValue("Continue");
  });

  it("keeps a referenced archived background visible but not selectable", () => {
    render(
      <InteractiveDemoSceneEditor
        {...props([])}
        draft={{
          title: "Start",
          description: "",
          background_capture_asset_id: "asset_archived",
        }}
        backgroundAssets={[
          {
            id: "asset_archived",
            status: "archived",
            page_title: "Archived screen",
            file_url: "/archived.png",
            file: { original_name: "archived.png" },
          },
          {
            id: "asset_other_archived",
            status: "archived",
            page_title: "Other archived screen",
            file_url: "/other.png",
            file: { original_name: "other.png" },
          },
        ] as InteractiveDemoSceneEditorProps["backgroundAssets"]}
      />,
    );

    expect(
      screen.getByRole("option", { name: "Archived screen (archived)" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("option", { name: "Other archived screen (archived)" }),
    ).toBeNull();
  });
});
