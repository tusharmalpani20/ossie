import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders an accessible button with variants, merged classes, and caller-owned click behavior", () => {
    const onClick = vi.fn();

    render(
      <Button className="extra-class" variant="secondary" size="sm" onClick={onClick}>
        Save changes
      </Button>
    );

    const button = screen.getByRole("button", { name: "Save changes" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("extra-class");
    expect(button.className).toContain("border");
    expect(button.className).toContain("cursor-pointer");
    expect(button.className).toContain("disabled:cursor-not-allowed");

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
