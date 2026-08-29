import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PopupSelect } from "./PopupSelect";

describe("PopupSelect", () => {
  it("scrolls its options into view when opened", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(
      <PopupSelect
        label="Project"
        listboxLabel="Projects"
        groupLabel="Projects"
        placeholder="Select a Project"
        value={null}
        options={[{ value: "project-1", label: "Test" }]}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Project: Select a Project" }),
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });
});
