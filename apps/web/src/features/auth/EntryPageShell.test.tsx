/**
 * @fileoverview Tests for the shared public entry page shell.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryPageShell } from "./EntryPageShell";

describe("EntryPageShell", () => {
  it("renders a brand-only public entry shell", () => {
    render(
      <EntryPageShell>
        <h1>Entry content</h1>
      </EntryPageShell>,
    );

    expect(screen.getByRole("link", { name: "Ossie" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("main", { name: "Entry workspace" })).toContainElement(
      screen.getByRole("heading", { name: "Entry content" }),
    );
    expect(
      screen.queryByRole("navigation", { name: "Portal navigation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });
});
