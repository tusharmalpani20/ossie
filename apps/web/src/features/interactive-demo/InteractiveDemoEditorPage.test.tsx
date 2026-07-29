import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InteractiveDemoDetailResponse } from "@repo/types/demo";
import { InteractiveDemoEditorPage } from "./InteractiveDemoEditorPage";

const now = "2026-07-19T10:00:00.000Z";
const detail: InteractiveDemoDetailResponse = {
  artifact: {
    id: "demo_1",
    organization_id: "org_1",
    project_id: "project_1",
    created_by_id: "user_1",
    created_at: now,
  },
  edition: {
    id: "edition_1",
    organization_id: "org_1",
    project_id: "project_1",
    interactive_demo_id: "demo_1",
    project_version_id: "version_1",
    source_capture_session_id: null,
    title: "Relational demo",
    description: "Edition metadata",
    status: "draft",
    created_by_id: "user_1",
    updated_by_id: "user_1",
    version: 3,
    created_at: now,
    updated_at: now,
  },
  working_draft: {
    id: "draft_1",
    organization_id: "org_1",
    project_id: "project_1",
    interactive_demo_edition_id: "edition_1",
    created_by_id: "user_1",
    updated_by_id: "user_1",
    version: 8,
    created_at: now,
    updated_at: now,
  },
  authored_updated_at: now,
};
const emptyScenes = {
  demo_scenes: [],
  working_draft: detail.working_draft,
  background_capture_assets: [],
};
const makeScene = (id: string, index: number, title: string) => ({
  id,
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_working_draft_id: "draft_1",
  source_capture_session_id: null,
  source_capture_event_id: null,
  source_capture_asset_id: null,
  scene_index: index,
  title,
  description: null,
  background_capture_asset_id: null,
  created_by_id: "user_1",
  updated_by_id: "user_1",
  version: 1,
  created_at: now,
  updated_at: now,
});

describe("InteractiveDemoEditorPage", () => {
  it("loads relational Edition and Working Draft data", async () => {
    const loadDemo = vi.fn().mockResolvedValue(detail);
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={loadDemo}
        loadScenes={async () => emptyScenes}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Relational demo" }),
    ).toBeInTheDocument();
    expect(loadDemo).toHaveBeenCalledWith("project_1", "demo_1");
  });

  it("lets the shared publishing panel own the only publication requests", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return new Response(
        JSON.stringify(
          url.includes("/publications")
            ? { publications: [], next_before_publication_sequence: null }
            : { publish_links: [], next_cursor: null },
        ),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetch);

    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
      />,
    );

    await screen.findByRole("heading", { name: "Relational demo" });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("uses the Edition Row Version for metadata saves", async () => {
    const saveDemo = vi.fn().mockResolvedValue({
      ...detail,
      edition: { ...detail.edition, version: 4 },
    });
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
        saveDemo={saveDemo}
      />,
    );
    await screen.findByRole("heading", { name: "Relational demo" });
    screen.getByRole("button", { name: "Save demo" }).click();
    expect(saveDemo).toHaveBeenCalledWith(
      "project_1",
      "demo_1",
      expect.objectContaining({ expected_edition_version: 3 }),
    );
  });

  it("allows publishing outside the Default Project Version", async () => {
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Publish this draft" }),
    ).toBeEnabled();
  });

  it("archives with the current Edition Row Version", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const changeEditionStatus = vi.fn().mockResolvedValue({
      edition: { ...detail.edition, status: "archived", version: 4 },
    });
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
        changeEditionStatus={changeEditionStatus}
      />,
    );
    (await screen.findByRole("button", { name: "Archive demo" })).click();
    expect(changeEditionStatus).toHaveBeenCalledWith(
      "archive",
      "project_1",
      "demo_1",
      "version_1",
      3,
    );
    expect(
      await screen.findByRole("button", { name: "Restore demo" }),
    ).toBeInTheDocument();
  });

  it("creates the first Scene with the current Working Draft Row Version", async () => {
    const createScene = vi.fn().mockResolvedValue({
      demo_scene: {
        id: "scene_1",
        organization_id: "org_1",
        project_id: "project_1",
        interactive_demo_working_draft_id: "draft_1",
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        scene_index: 1,
        title: null,
        description: null,
        background_capture_asset_id: null,
        created_by_id: "user_1",
        updated_by_id: "user_1",
        version: 1,
        created_at: now,
        updated_at: now,
      },
      working_draft: { ...detail.working_draft, version: 9 },
    });
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
        createScene={createScene}
      />,
    );

    (await screen.findByRole("button", { name: "Add Scene" })).click();
    await waitFor(() =>
      expect(createScene).toHaveBeenCalledWith(
        "project_1",
        "demo_1",
        expect.objectContaining({ expected_working_draft_version: 8 }),
      ),
    );
    expect(await screen.findByText("Scene 1")).toBeVisible();
  });

  it("marks edited metadata unsaved and preserves it after a conflict", async () => {
    const saveDemo = vi.fn().mockRejectedValue(
      Object.assign(new Error("conflict"), {
        type: "interactive_demo_edition_conflict",
      }),
    );
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
        saveDemo={saveDemo}
      />,
    );
    const title = await screen.findByLabelText("Demo title");
    fireEvent.change(title, { target: { value: "Relational demo changed" } });
    await waitFor(() => expect(screen.getByText("Unsaved")).toBeVisible());
    screen.getByRole("button", { name: "Save demo" }).click();
    expect(await screen.findByText("Conflict")).toBeVisible();
    expect(title).toHaveValue("Relational demo changed");
  });

  it("shows an explicit failed-save state without discarding metadata", async () => {
    const saveDemo = vi.fn().mockRejectedValue(new Error("offline"));
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
        saveDemo={saveDemo}
      />,
    );
    const title = await screen.findByLabelText("Demo title");
    fireEvent.change(title, { target: { value: "Still local" } });
    screen.getByRole("button", { name: "Save demo" }).click();
    expect(await screen.findByText("Save failed")).toBeVisible();
    expect(title).toHaveValue("Still local");
  });

  it("keeps one Scene selected by stable ID in the workbench rail", async () => {
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => ({
          ...emptyScenes,
          demo_scenes: [
            makeScene("scene_1", 1, "Start here"),
            makeScene("scene_2", 2, "Finish here"),
          ],
        })}
        loadHotspots={async () => ({
          demo_hotspots: [],
          working_draft: detail.working_draft,
        })}
      />,
    );

    expect(
      await screen.findByRole("navigation", { name: "Scene rail" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Start here" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Finish here" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Select Scene 2: Finish here" }),
    );
    expect(screen.getByRole("heading", { name: "Finish here" })).toBeVisible();
  });

  it("creates a Hotspot without inferring a target Scene", async () => {
    const createHotspot = vi.fn().mockResolvedValue({
      demo_hotspot: {
        id: "hotspot_1",
        organization_id: "org_1",
        project_id: "project_1",
        interactive_demo_scene_id: "scene_1",
        hotspot_index: 1,
        hotspot_type: "click",
        label: "New hotspot",
        content: null,
        x: 0.4,
        y: 0.35,
        width: 0.2,
        height: 0.12,
        transition: null,
        created_by_id: "user_1",
        updated_by_id: "user_1",
        version: 1,
        created_at: now,
        updated_at: now,
      },
      working_draft: { ...detail.working_draft, version: 9 },
    });
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => ({
          ...emptyScenes,
          demo_scenes: [
            makeScene("scene_1", 1, "Start"),
            makeScene("scene_2", 2, "Finish"),
          ],
        })}
        loadHotspots={async () => ({
          demo_hotspots: [],
          working_draft: detail.working_draft,
        })}
        createHotspot={createHotspot}
      />,
    );

    (await screen.findByRole("button", { name: "Add hotspot" })).click();
    await waitFor(() =>
      expect(createHotspot).toHaveBeenCalledWith(
        "project_1",
        "demo_1",
        "scene_1",
        expect.objectContaining({ transition: null }),
      ),
    );
  });

  it("warns before unload for unsaved Scene changes", async () => {
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => ({
          ...emptyScenes,
          demo_scenes: [makeScene("scene_1", 1, "Start")],
        })}
        loadHotspots={async () => ({
          demo_hotspots: [],
          working_draft: detail.working_draft,
        })}
      />,
    );

    fireEvent.change(await screen.findByLabelText("Scene 1 title"), {
      target: { value: "Locally changed" },
    });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("fails the editor load when Hotspots cannot be loaded", async () => {
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => ({
          ...emptyScenes,
          demo_scenes: [makeScene("scene_1", 1, "Start")],
        })}
        loadHotspots={async () => {
          throw new Error("hotspot load failed");
        }}
      />,
    );

    expect(
      await screen.findByText("Could not load interactive demo."),
    ).toBeVisible();
    expect(screen.queryByText("No hotspots yet.")).toBeNull();
  });

  it("keeps the editor usable when only background choices fail to load", async () => {
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => ({
          ...emptyScenes,
          demo_scenes: [makeScene("scene_1", 1, "Start")],
        })}
        loadHotspots={async () => ({
          demo_hotspots: [],
          working_draft: detail.working_draft,
        })}
        loadBackgroundAssets={async () => {
          throw new Error("asset picker failed");
        }}
      />,
    );

    expect(await screen.findByLabelText("Scene 1 title")).toBeEnabled();
    expect(
      screen.getByText(
        /Background choices could not be loaded. The current background is preserved./,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Retry background choices" }),
    ).toBeEnabled();
  });

  it("freezes aggregate mutations after a Working Draft conflict and offers recovery", async () => {
    const createScene = vi.fn().mockRejectedValue(
      Object.assign(new Error("conflict"), {
        type: "interactive_demo_working_draft_conflict",
      }),
    );
    render(
      <InteractiveDemoEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => emptyScenes}
        createScene={createScene}
      />,
    );

    (await screen.findByRole("button", { name: "Add Scene" })).click();
    expect(await screen.findByText("Conflict")).toBeVisible();
    expect(screen.getByRole("button", { name: "Archive demo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save demo" })).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Discard local changes and reload",
      }),
    ).toBeEnabled();
    expect(screen.getByText("Review your local changes above")).toBeVisible();
  });
});
