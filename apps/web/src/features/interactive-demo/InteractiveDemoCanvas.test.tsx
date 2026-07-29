import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InteractiveDemoCanvas } from "./InteractiveDemoCanvas";

describe("InteractiveDemoCanvas", () => {
  it("selects and keyboard-adjusts normalized Hotspot geometry", () => {
    const onSelect = vi.fn();
    const onGeometryChange = vi.fn();
    render(
      <InteractiveDemoCanvas
        sceneTitle="Start"
        backgroundUrl="/scene.png"
        hotspots={[
          {
            id: "hotspot_1",
            label: "Continue",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.1,
          },
        ]}
        selectedHotspotId="hotspot_1"
        onSelect={onSelect}
        onGeometryChange={onGeometryChange}
      />,
    );

    const hotspot = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(hotspot);
    fireEvent.keyDown(hotspot, { key: "ArrowRight" });

    expect(onSelect).toHaveBeenCalledWith("hotspot_1");
    expect(onGeometryChange).toHaveBeenCalledWith("hotspot_1", {
      x: 0.11,
      y: 0.2,
      width: 0.3,
      height: 0.1,
    });
  });

  it("keeps geometry controls unavailable when the background is broken", () => {
    render(
      <InteractiveDemoCanvas
        sceneTitle="Missing"
        backgroundUrl={null}
        hotspots={[]}
        selectedHotspotId={null}
        onSelect={() => undefined}
        onGeometryChange={() => undefined}
      />,
    );
    expect(screen.getByText("Captured screen is unavailable.")).toBeVisible();
  });
});
