import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationSnippetPanel } from "./DocumentationSnippetPanel";

describe("DocumentationSnippetPanel", () => {
  it("creates and archives snippets without exposing delete", async () => {
    const create = vi.fn(async () => ({
      snippet: {
        id: "snippet",
        name: "Reusable warning",
        status: "active" as const,
        version: 1,
        blocks: [],
      },
    }));
    const transition = vi.fn(async () => ({
      snippet: {
        id: "snippet",
        name: "Reusable warning",
        status: "archived" as const,
        version: 2,
        blocks: [],
      },
    }));
    render(
      <DocumentationSnippetPanel
        canWrite
        createSnippet={create}
        listSnippets={async () => ({ snippets: [] })}
        projectId="project"
        saveSnippet={vi.fn()}
        siteId="site"
        transitionSnippet={transition}
        versionSlug="main"
      />,
    );

    fireEvent.change(await screen.findByLabelText("Snippet name"), {
      target: { value: "Reusable warning" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Snippet" }));
    expect(await screen.findByText("Reusable warning")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive Snippet" }));
    await waitFor(() => expect(transition).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Save Snippet" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rename Snippet" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restore Snippet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
