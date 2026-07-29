import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuideAnnotationEditor } from "./GuideAnnotationEditor";

describe("GuideAnnotationEditor", () => {
  it("edits normalized geometry locally and saves one complete array", () => {
    const onSave = vi.fn();
    render(
      <GuideAnnotationEditor
        stepNumber={2}
        annotations={[
          {
            id: "annotation_1",
            type: "highlight",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
          },
        ]}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Highlight 1 x"), {
      target: { value: "0.25" },
    });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save highlights" }));

    expect(onSave).toHaveBeenCalledWith([
      {
        id: "annotation_1",
        type: "highlight",
        x: 0.25,
        y: 0.2,
        width: 0.3,
        height: 0.4,
      },
    ]);
  });

  it("keeps geometry in bounds and enforces the ten-highlight limit", () => {
    render(
      <GuideAnnotationEditor
        stepNumber={1}
        annotations={Array.from({ length: 10 }, (_, index) => ({
          id: `annotation_${index + 1}`,
          type: "highlight" as const,
          x: 0,
          y: 0,
          width: 0.1,
          height: 0.1,
        }))}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Add highlight" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Highlight 1 x"), {
      target: { value: "0.95" },
    });
    expect(screen.getByLabelText("Highlight 1 x")).toHaveValue(0.9);
  });
});
