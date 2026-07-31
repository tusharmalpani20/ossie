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

  it("loads override reasons only when an Admin requests evidence detail", async () => {
    const loadEvidenceDetail = vi.fn().mockResolvedValue({
      evidence: { id: "evidence" },
      override_reason: "Emergency publication approved by the release owner.",
    });
    render(
      <DocumentationReviewPanel
        projectId="project"
        versionSlug="v1"
        siteId="site"
        latestRevision={{ id: "revision", revision_number: 3 }}
        canRequest={false}
        canManagePolicy
        loadPolicy={vi.fn().mockResolvedValue({
          id: "policy",
          mode: "approval_required",
          required_approvals: 1,
          require_maintainer_approval: false,
          maintainer_org_user_ids: [],
          version: 1,
        })}
        loadRequests={vi.fn().mockResolvedValue({
          review_requests: [],
          next_cursor: null,
        })}
        loadEvidence={vi.fn().mockResolvedValue({
          evidence: [
            {
              id: "evidence",
              site_revision_id: "revision",
              operation: "publication",
              outcome: "overridden",
              created_at: "2026-07-30T00:00:00.000Z",
            },
          ],
          next_cursor: null,
        })}
        loadEvidenceDetail={loadEvidenceDetail}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "View evidence details" }),
    );

    expect(
      await screen.findByText(
        /Emergency publication approved by the release owner/,
      ),
    ).toBeInTheDocument();
    expect(loadEvidenceDetail).toHaveBeenCalledWith(
      "project",
      "v1",
      "site",
      "evidence",
    );
  });
});
