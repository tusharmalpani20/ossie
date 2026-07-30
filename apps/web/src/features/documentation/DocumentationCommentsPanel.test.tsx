import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationCommentsPanel } from "./DocumentationCommentsPanel";

describe("DocumentationCommentsPanel", () => {
  it("creates, replies to, and resolves a private thread", async () => {
    const createThread = vi.fn(async () => ({
      thread: {
        id: "thread",
        body: "Clarify this",
        state: "open" as const,
        version: 1,
        block_anchor_id: null,
        replies: [],
      },
    }));
    const reply = vi.fn(async () => ({
      reply: { id: "reply", body: "Done" },
    }));
    const transition = vi.fn(async () => ({
      thread: {
        id: "thread",
        body: "Clarify this",
        state: "resolved" as const,
        version: 2,
        block_anchor_id: null,
        replies: [{ id: "reply", body: "Done" }],
      },
    }));
    render(
      <DocumentationCommentsPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canComment
        loadComments={async () => ({ comments: [] })}
        createThread={createThread}
        createReply={reply}
        transitionThread={transition}
      />,
    );
    fireEvent.change(await screen.findByLabelText("New comment"), {
      target: { value: "Clarify this" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add comment" }));
    expect(await screen.findByText("Clarify this")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Reply to Clarify this"), {
      target: { value: "Done" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    await waitFor(() => expect(reply).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));
    expect(await screen.findByText("Resolved")).toBeInTheDocument();
  });

  it("renders private comments read-only for a Viewer", async () => {
    render(
      <DocumentationCommentsPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canComment={false}
        loadComments={async () => ({
          comments: [
            {
              id: "thread",
              body: "Private review note",
              state: "open",
              version: 1,
              block_anchor_id: null,
              replies: [],
            },
          ],
        })}
        createThread={vi.fn()}
        createReply={vi.fn()}
        transitionThread={vi.fn()}
      />,
    );
    expect(await screen.findByText("Private review note")).toBeInTheDocument();
    expect(screen.queryByLabelText("New comment")).not.toBeInTheDocument();
  });
});
