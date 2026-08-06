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

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses semantic command tokens for every command hierarchy variant", () => {
    const { rerender } = render(
      <Button variant="primary">Primary action</Button>,
    );
    const button = screen.getByRole("button", { name: "Primary action" });

    expect(button.className).toContain(
      "bg-[var(--ossie-color-action-primary)]",
    );
    expect(button.className).not.toMatch(/(?:slate|red|white)-/u);

    rerender(<Button variant="secondary">Secondary action</Button>);
    expect(button.className).toContain(
      "border-[var(--ossie-color-border)]",
    );

    rerender(<Button variant="ghost">More actions</Button>);
    expect(button.className).toContain(
      "hover:bg-[var(--ossie-color-action-ghost-hover)]",
    );

    rerender(<Button variant="destructive">Delete action</Button>);
    expect(button.className).toContain(
      "bg-[var(--ossie-color-action-destructive)]",
    );
  });
});
