import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationReviewPanel } from "./DocumentationReviewPanel";

describe("Documentation Review panel", () => {
  const detail = {
    review_request: {
      id: "request",
      site_revision_id: "revision",
      revision_number: 3,
      request_number: 2,
      status: "open" as const,
      effective_status: "open" as const,
      required_approvals: 1,
      valid_approval_count: 0,
      require_maintainer_approval: false,
      valid_maintainer_approval_count: 0,
      created_by_id: "another-editor",
      version: 1,
    },
    assignments: [],
    actor_can_decide: false,
    actor_can_cancel: false,
    change_summary: {
      baseline_revision_id: "revision-2",
      baseline_revision_number: 2,
      metadata_changed: true,
      home_page_changed: false,
      pages: { added: 1, changed: 2, removed: 0 },
      navigation_changed: false,
      routing_changed: true,
      snippets: { added: 0, changed: 1, removed: 0 },
      assets: { added: 1, changed: 0, removed: 0 },
      openapi_changed: false,
      artifact_references_changed: true,
    },
    publication_gate: { outcome: "approval_pending" as const },
    cancellation: null,
  };

  it("prevents duplicate Review Request pagination and offers retry after failure", async () => {
    const loadRequests = vi
      .fn()
      .mockResolvedValueOnce({ review_requests: [], next_cursor: "cursor" })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ review_requests: [], next_cursor: null });
    render(
      <DocumentationReviewPanel
        projectId="project"
        versionSlug="v1"
        siteId="site"
        latestRevision={null}
        canRequest={false}
        canManagePolicy={false}
        loadPolicy={vi.fn().mockResolvedValue({
          id: "policy",
          mode: "optional",
          required_approvals: 1,
          require_maintainer_approval: false,
          maintainer_org_user_ids: [],
          version: 1,
        })}
        loadRequests={loadRequests}
        loadEvidence={vi.fn().mockResolvedValue({ evidence: [], next_cursor: null })}
      />,
    );
    const loadMore = await screen.findByRole("button", {
      name: "Load more Review Requests",
    });
    fireEvent.click(loadMore);
    fireEvent.click(loadMore);
    expect(loadMore).toBeDisabled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "More Review Requests could not be loaded.",
    );
    expect(loadRequests).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Load more Review Requests" }));
    await waitFor(() => expect(loadRequests).toHaveBeenCalledTimes(3));
  });

  it("ignores a pagination response that belongs to an older request filter", async () => {
    let resolveMore:
      | ((value: {
          review_requests: Array<typeof detail.review_request>;
          next_cursor: string | null;
        }) => void)
      | undefined;
    const loadRequests = vi
      .fn()
      .mockResolvedValueOnce({ review_requests: [], next_cursor: "cursor" })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveMore = resolve;
          }),
      )
      .mockResolvedValue({ review_requests: [], next_cursor: null });
    render(
      <DocumentationReviewPanel
        projectId="project"
        versionSlug="v1"
        siteId="site"
        latestRevision={null}
        canRequest={false}
        canManagePolicy={false}
        loadPolicy={vi.fn().mockResolvedValue({
          id: "policy",
          mode: "optional",
          required_approvals: 1,
          require_maintainer_approval: false,
          maintainer_org_user_ids: [],
          version: 1,
        })}
        loadRequests={loadRequests}
        loadEvidence={vi.fn().mockResolvedValue({ evidence: [], next_cursor: null })}
      />,
    );
    await screen.findByRole("button", { name: "Load more Review Requests" });
    fireEvent.click(screen.getByRole("button", { name: "Load more Review Requests" }));
    fireEvent.change(screen.getByLabelText("Request status"), {
      target: { value: "open" },
    });
    await waitFor(() => expect(loadRequests).toHaveBeenCalledTimes(3));
    resolveMore?.({ review_requests: [detail.review_request], next_cursor: null });
    await waitFor(() => expect(screen.queryByText(/Request 2: Revision 3/)).not.toBeInTheDocument());
  });

  it("shows a retry boundary when the initial review workflow cannot load", async () => {
    const loadPolicy = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        id: "policy",
        mode: "optional" as const,
        required_approvals: 1,
        require_maintainer_approval: false,
        maintainer_org_user_ids: [],
        version: 1,
      });
    const loadRequests = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ review_requests: [], next_cursor: null });
    render(
      <DocumentationReviewPanel
        projectId="project"
        versionSlug="v1"
        siteId="site"
        latestRevision={null}
        canRequest={false}
        canManagePolicy={false}
        loadPolicy={loadPolicy}
        loadRequests={loadRequests}
        loadEvidence={vi.fn().mockResolvedValue({ evidence: [], next_cursor: null })}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Could not load Documentation review." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Policy: Optional")).toBeInTheDocument();
    expect(loadPolicy).toHaveBeenCalledTimes(2);
    expect(loadRequests).toHaveBeenCalledTimes(2);
  });


  it("shows the safe structural summary and uses actor-specific cancellation permission", async () => {
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
          mode: "approval_required",
          required_approvals: 1,
          require_maintainer_approval: false,
          maintainer_org_user_ids: [],
          version: 1,
        })}
        loadCandidates={vi.fn().mockResolvedValue({
          candidates: [],
          next_cursor: null,
        })}
        loadRequests={vi.fn().mockResolvedValue({
          review_requests: [detail.review_request],
          next_cursor: null,
        })}
        loadDetail={vi.fn().mockResolvedValue(detail)}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Open review detail" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Structural change summary",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pages: 1 added, 2 changed/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open immutable Revision 3" }),
    ).toHaveAttribute(
      "href",
      "/projects/project/versions/v1/documentation/site/revisions/3",
    );
    expect(
      screen.queryByRole("button", { name: "Cancel request" }),
    ).not.toBeInTheDocument();
  });

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
    fireEvent.click(
      screen.getByRole("button", { name: "Close evidence details" }),
    );
    expect(
      screen.queryByText(/Emergency publication approved by the release owner/),
    ).not.toBeInTheDocument();
  });
});
