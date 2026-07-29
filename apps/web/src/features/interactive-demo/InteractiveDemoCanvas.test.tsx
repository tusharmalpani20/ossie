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

  it("projects pointer movement into normalized move and resize geometry", () => {
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
        onSelect={() => undefined}
        onGeometryChange={onGeometryChange}
      />,
    );
    const canvas = screen.getByLabelText("Start canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
      right: 1000,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Continue" }), {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 150, pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(onGeometryChange).toHaveBeenCalledWith("hotspot_1", {
      x: 0.2,
      y: 0.3,
      width: 0.3,
      height: 0.1,
    });

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Resize Continue" }),
      { clientX: 400, clientY: 150, pointerId: 2 },
    );
    fireEvent.pointerMove(window, { clientX: 500, clientY: 200, pointerId: 2 });
    expect(onGeometryChange).toHaveBeenLastCalledWith("hotspot_1", {
      x: 0.1,
      y: 0.2,
      width: 0.4,
      height: 0.2,
    });
  });
});
