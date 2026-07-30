import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationReviewPanel } from "./DocumentationReviewPanel";

describe("Documentation Review panel", () => {
  it("creates a request for the selected exact latest Revision", async () => {
    const createRequest = vi.fn().mockResolvedValue({ id: "request" });
    render(
      <DocumentationReviewPanel
        projectId="project"
        versionSlug="v1"
        siteId="site"
        latestRevision={{ id: "revision", revision_number: 3 }}
        canRequest
        canManagePolicy={false}
        loadPolicy={vi.fn().mockResolvedValue({
          id: "policy",
          mode: "optional",
          required_approvals: 1,
          require_maintainer_approval: false,
          maintainer_org_user_ids: [],
          version: 1,
        })}
        loadCandidates={vi.fn().mockResolvedValue({
          candidates: [
            {
              org_user_id: "reviewer",
              display_name: "Rae Viewer",
              project_role: "viewer",
              is_organization_owner: false,
              is_maintainer: false,
            },
          ],
          next_cursor: null,
        })}
        loadRequests={vi.fn().mockResolvedValue({
          review_requests: [],
          next_cursor: null,
        })}
        createRequest={createRequest}
      />,
    );
    await screen.findByText(/Rae Viewer/);
    fireEvent.click(screen.getByRole("checkbox", { name: /Rae Viewer/ }));
    fireEvent.click(screen.getByRole("button", { name: "Request review" }));
    await waitFor(() =>
      expect(createRequest).toHaveBeenCalledWith(
        "project",
        "v1",
        "site",
        expect.objectContaining({ site_revision_id: "revision" }),
      ),
    );
  });
});
