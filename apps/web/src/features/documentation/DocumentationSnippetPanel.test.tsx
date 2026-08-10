import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationSnippetPanel } from "./DocumentationSnippetPanel";

describe("DocumentationSnippetPanel", () => {
  it("offers retry when Documentation Snippets cannot load", async () => {
    const listSnippets = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ snippets: [] });
    render(
      <DocumentationSnippetPanel
        canWrite={false}
        listSnippets={listSnippets}
        projectId="project"
        siteId="site"
        versionSlug="main"
      />,
    );
    expect(await screen.findByRole("heading", { name: "Could not load Documentation snippets." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No Snippets yet.")).toBeInTheDocument();
    expect(listSnippets).toHaveBeenCalledTimes(2);
  });

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
