import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationReviewInboxPage } from "./DocumentationReviewInboxPage";

describe("Documentation Review inbox", () => {
  it("renders safe joined context without message bodies", async () => {
    render(
      <DocumentationReviewInboxPage
        projectId="project"
        versionSlug="v1"
        loadInbox={vi.fn().mockResolvedValue({
          items: [
            {
              notification: {
                id: "notification",
                review_request_id: "request",
                site_id: "site",
                status: "unread",
                version: 1,
                type: "review_assigned",
              },
              display_context: {
                site_name: "Product docs",
                revision_number: 2,
                request_number: 1,
              },
            },
          ],
          unread_count: 1,
          next_cursor: null,
        })}
      />,
    );
    expect(await screen.findByText(/Product docs/)).toBeInTheDocument();
    expect(screen.getByText(/1 unread/)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Documentation review inbox" }),
    ).toBeInTheDocument();
  });

  it("makes an unavailable inbox actionable", async () => {
    const loadInbox = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ items: [], unread_count: 0, next_cursor: null });
    render(
      <DocumentationReviewInboxPage
        projectId="project"
        versionSlug="v1"
        loadInbox={loadInbox}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Documentation review inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Review inbox could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("0 unread review notifications.")).toBeInTheDocument();
  });

  it("announces mark-read failures without losing the inbox", async () => {
    render(
      <DocumentationReviewInboxPage
        projectId="project"
        versionSlug="v1"
        loadInbox={vi.fn().mockResolvedValue({
          items: [
            {
              notification: {
                id: "notification",
                review_request_id: "request",
                site_id: "site",
                status: "unread",
                version: 1,
                type: "review_assigned",
              },
              display_context: {
                site_name: "Product docs",
                revision_number: 2,
                request_number: 1,
              },
            },
          ],
          unread_count: 1,
          next_cursor: null,
        })}
        markRead={vi.fn().mockRejectedValue(new Error("offline"))}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Mark read" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Review notification could not be marked as read.",
    );
    expect(screen.getByText(/Product docs/)).toBeInTheDocument();
  });
});
