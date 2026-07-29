import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  GuideScreenshotViewer,
  type GuideScreenshotViewerImage,
} from "./GuideScreenshotViewer";

const images: GuideScreenshotViewerImage[] = [
  {
    id: "block_1:asset_1",
    sourceAssetId: "asset_1",
    src: "/assets/department-list.png",
    alt: "Department List",
    title: "Navigate to Department List",
  },
  {
    id: "block_2:asset_1",
    sourceAssetId: "asset_1",
    src: "/assets/add-department.png",
    alt: "Add Department",
    title: "Click Add Department",
  },
];

describe("GuideScreenshotViewer", () => {
  it("renders nothing without an active image", () => {
    const { container, rerender } = render(
      <GuideScreenshotViewer
        images={images}
        activeImageId={null}
        onActiveImageChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <GuideScreenshotViewer
        images={images}
        activeImageId="missing"
        onActiveImageChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("opens the selected screenshot with controls and no raw source asset IDs", () => {
    render(
      <GuideScreenshotViewer
        images={images}
        activeImageId="block_1:asset_1"
        onActiveImageChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Navigate to Department List" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("img", { name: "Department List" }),
    ).toHaveAttribute("src", "/assets/department-list.png");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("Fit")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close screenshot viewer" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
  });

  it("closes with the close button and Escape", () => {
    const onClose = vi.fn();
    render(
      <GuideScreenshotViewer
        images={images}
        activeImageId="block_1:asset_1"
        onActiveImageChange={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Close screenshot viewer" }),
    );
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("restores focus to the trigger after closing", () => {
    const Harness = () => {
      const [activeImageId, setActiveImageId] = useState<string | null>(null);

      return (
        <>
          <button
            type="button"
            onClick={() => setActiveImageId("block_1:asset_1")}
          >
            Open screenshot
          </button>
          <GuideScreenshotViewer
            images={images}
            activeImageId={activeImageId}
            onActiveImageChange={setActiveImageId}
            onClose={() => setActiveImageId(null)}
          />
        </>
      );
    };

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open screenshot" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("button", { name: "Close screenshot viewer" }),
    );

    expect(trigger).toHaveFocus();
  });

  it("zooms in out and resets to fit", () => {
    render(
      <GuideScreenshotViewer
        images={images}
        activeImageId="block_1:asset_1"
        onActiveImageChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("100%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("100%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(screen.getByText("Fit")).toBeInTheDocument();
  });

  it("navigates between screenshot display instances", () => {
    const onActiveImageChange = vi.fn();
    const { rerender } = render(
      <GuideScreenshotViewer
        images={images}
        activeImageId="block_1:asset_1"
        onActiveImageChange={onActiveImageChange}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next screenshot" }));
    expect(onActiveImageChange).toHaveBeenCalledWith("block_2:asset_1");

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onActiveImageChange).toHaveBeenCalledWith("block_2:asset_1");

    rerender(
      <GuideScreenshotViewer
        images={images}
        activeImageId="block_2:asset_1"
        onActiveImageChange={onActiveImageChange}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Previous screenshot" }),
    );
    expect(onActiveImageChange).toHaveBeenCalledWith("block_1:asset_1");
  });

  it("disables previous and next controls for a single screenshot", () => {
    render(
      <GuideScreenshotViewer
        images={[images[0]!]}
        activeImageId="block_1:asset_1"
        onActiveImageChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous screenshot" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Next screenshot" }),
    ).toBeDisabled();
  });
});
