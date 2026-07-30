import { render, screen } from "@testing-library/react";
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
  });
});
