import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InteractiveDemoRenderer } from "./InteractiveDemoRenderer";

const scenes = [
  {
    id: "scene_1",
    sceneIndex: 1,
    title: "Start",
    description: "Choose continue",
    backgroundAssetId: "asset_1",
    hotspots: [
      {
        id: "hotspot_1",
        type: "click" as const,
        label: "Continue",
        content: null,
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.1,
        targetSceneId: "scene_2",
      },
    ],
  },
  {
    id: "scene_2",
    sceneIndex: 2,
    title: "Finish",
    description: null,
    backgroundAssetId: null,
    hotspots: [],
  },
];

describe("InteractiveDemoRenderer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("projects Hotspots over the captured screen and follows Transitions", () => {
    render(
      <InteractiveDemoRenderer
        title="Department demo"
        scenes={scenes}
        assets={[
          {
            id: "asset_1",
            fileUrl: "/scene.png",
            width: 1200,
            height: 800,
          },
        ]}
      />,
    );

    const hotspot = screen.getByRole("button", { name: "Continue" });
    expect(hotspot).toHaveStyle({
      left: "10%",
      top: "20%",
      width: "30%",
      height: "10%",
    });
    expect(screen.getByTestId("interactive-demo-scene-canvas")).toHaveStyle({
      aspectRatio: "1200 / 800",
    });

    fireEvent.click(hotspot);
    expect(screen.getByRole("heading", { name: "Finish" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Moved to Scene 2: Finish",
    );
  });

  it("keeps terminal Hotspots operable without inventing a Transition", () => {
    render(
      <InteractiveDemoRenderer
        title="Terminal demo"
        scenes={[
          {
            ...scenes[0]!,
            hotspots: [
              {
                ...scenes[0]!.hotspots[0]!,
                label: "More details",
                content: "This is the end of the walkthrough.",
                targetSceneId: null,
              },
            ],
          },
        ]}
        assets={[{ id: "asset_1", fileUrl: "/scene.png" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "More details" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "This is the end of the walkthrough.",
    );
  });

  it("blocks invalid Transitions with an explicit warning", () => {
    render(
      <InteractiveDemoRenderer
        title="Invalid transition demo"
        scenes={[
          {
            ...scenes[0]!,
            hotspots: [
              {
                ...scenes[0]!.hotspots[0]!,
                targetSceneId: "missing_scene",
              },
            ],
          },
        ]}
        assets={[{ id: "asset_1", fileUrl: "/scene.png" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "The target Scene is unavailable.",
    );
    expect(screen.getByRole("heading", { name: "Start" })).toBeVisible();
  });

  it("renders a stable missing-media state and hides Hotspots after an image error", () => {
    render(
      <InteractiveDemoRenderer
        title="Broken media demo"
        scenes={scenes}
        assets={[{ id: "asset_1", fileUrl: "/broken.png" }]}
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Start captured screen" }));
    expect(screen.getByText("Captured screen is unavailable.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  });

  it("can leave title ownership to the surrounding public shell", () => {
    render(
      <InteractiveDemoRenderer
        title="Shell-owned title"
        showTitle={false}
        scenes={scenes}
        assets={[]}
      />,
    );

    expect(
      screen.queryByRole("heading", { level: 1, name: "Shell-owned title" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Start" }),
    ).toBeVisible();
  });

  it("hydrates an authenticated cross-origin background for read-only playback", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(new Blob(["synthetic image"], { type: "image/png" }), {
        status: 200,
      }),
    );
    const createObjectURL = vi.fn(() => "blob:scene");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("fetch", fetch);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    render(
      <InteractiveDemoRenderer
        title="Remote demo"
        scenes={scenes}
        assets={[
          {
            id: "asset_1",
            fileUrl: "http://localhost:3022/asset.png",
          },
        ]}
      />,
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("http://localhost:3022/asset.png", {
        credentials: "include",
        signal: expect.any(AbortSignal),
      }),
    );
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("img", { name: "Start captured screen" }),
    ).toHaveAttribute("src", "blob:scene");
    expect(screen.getByRole("button", { name: "Continue" })).toBeVisible();
  });
});
