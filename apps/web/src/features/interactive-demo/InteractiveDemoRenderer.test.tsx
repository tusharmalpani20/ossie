import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  it("projects Hotspots over the captured screen and follows Transitions", () => {
    render(
      <InteractiveDemoRenderer
        title="Department demo"
        scenes={scenes}
        assets={[{ id: "asset_1", fileUrl: "/scene.png" }]}
      />,
    );

    const hotspot = screen.getByRole("button", { name: "Continue" });
    expect(hotspot).toHaveStyle({
      left: "10%",
      top: "20%",
      width: "30%",
      height: "10%",
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
});
