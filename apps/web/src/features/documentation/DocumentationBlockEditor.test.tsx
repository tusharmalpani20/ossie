import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationBlockEditor } from "./DocumentationBlockEditor";

describe("DocumentationBlockEditor", () => {
  it("adds a typed Capture image from an Asset option without a raw ID field", () => {
    const onChange = vi.fn();
    render(
      <DocumentationBlockEditor
        assetOptions={[
          { id: "capture", kind: "capture_asset", label: "Dashboard · v2" },
        ]}
        blocks={[]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("New block type"), {
      target: { value: "image" },
    });
    fireEvent.change(screen.getByLabelText("Asset"), {
      target: { value: "capture_asset:capture" },
    });
    fireEvent.change(screen.getByLabelText("Alternative text"), {
      target: { value: "Dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add image block" }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        kind: "image",
        source: { kind: "capture_asset", id: "capture" },
        alt_text: "Dashboard",
      }),
    ]);
    expect(screen.queryByLabelText(/asset id/i)).toBeNull();
  });
});
