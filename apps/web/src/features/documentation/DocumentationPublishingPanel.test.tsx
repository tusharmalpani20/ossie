import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPublishingPanel } from "./DocumentationPublishingPanel";

describe("DocumentationPublishingPanel", () => {
  it("refreshes the selected Revision gate after review state changes", async () => {
    const loadReviewGate = vi
      .fn()
      .mockResolvedValueOnce({
        site_revision_id: "revision",
        policy_mode: "optional",
        policy_version: 1,
        outcome: "not_required",
        override_available_to_actor: false,
      })
      .mockResolvedValue({
        site_revision_id: "revision",
        policy_mode: "approval_required",
        policy_version: 2,
        outcome: "invalidated",
        override_available_to_actor: true,
      });
    render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        canOverrideReview
        loadRevisions={async () => ({
          revisions: [
            {
              id: "revision",
              revision_number: 1,
              created_at: "2026-07-30T00:00:00.000Z",
            },
          ],
        })}
        loadPublications={async () => ({ publications: [] })}
        loadPublishLinks={async () => ({ publish_links: [] })}
        loadReviewGate={loadReviewGate}
      />,
    );

    expect(
      await screen.findByText("Review gate: not required"),
    ).toBeInTheDocument();
    window.dispatchEvent(
      new CustomEvent("documentation-review-gate-changed", {
        detail: { siteId: "site" },
      }),
    );
    expect(
      await screen.findByText("Review gate: invalidated"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Admin override reason (at least 20 characters)"),
    ).toBeInTheDocument();
  });

  it("publishes an exact Revision to a new stable link", async () => {
    const publish = vi.fn(async () => ({
      publication: { id: "publication", publication_sequence: 1 },
      link: {
        id: "link",
        slug: "product-docs",
        resource_family: "documentation_site" as const,
      },
      entry: { id: "entry", version: 1 },
    }));
    render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        loadRevisions={async () => ({
          revisions: [
            {
              id: "revision",
              revision_number: 1,
              created_at: "2026-07-30T00:00:00.000Z",
            },
          ],
        })}
        loadPublications={async () => ({ publications: [] })}
        loadPublishLinks={async () => ({ publish_links: [] })}
        publish={publish}
      />,
    );
    expect(await screen.findByText("Revision 1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Public link name"), {
      target: { value: "Product docs" },
    });
    fireEvent.change(screen.getByLabelText("Public link slug"), {
      target: { value: "product-docs" },
    });
    fireEvent.change(screen.getByLabelText("Public link password (optional)"), {
      target: { value: "safe local password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish revision" }));
    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "revision",
        {
          mode: "create",
          name: "Product docs",
          slug: "product-docs",
          visibility: "public",
          expires_at: null,
          password: "safe local password",
        },
      ),
    );
    expect(
      await screen.findByRole("link", { name: "Open published Documentation" }),
    ).toHaveAttribute("href", "/docs/product-docs");
  });

  it("repoints an existing entry and rolls it back to an exact Publication", async () => {
    const publish = vi.fn(async () => ({
      publication: { id: "publication-2", publication_sequence: 2 },
      link: {
        id: "link",
        slug: "product-docs",
        resource_family: "documentation_site" as const,
      },
      entry: { id: "entry", version: 3 },
    }));
    const rollback = vi.fn(async () => ({
      link: { id: "link", slug: "product-docs" },
      entry: { id: "entry", version: 4, site_publication_id: "publication-1" },
    }));
    render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        loadRevisions={async () => ({
          revisions: [
            {
              id: "revision-2",
              revision_number: 2,
              created_at: "2026-07-30T00:00:00.000Z",
            },
            {
              id: "revision-1",
              revision_number: 1,
              created_at: "2026-07-29T00:00:00.000Z",
            },
          ],
        })}
        loadPublications={async () => ({
          publications: [
            {
              id: "publication-1",
              publication_sequence: 1,
              revision_number: 1,
              published_at: "2026-07-30T00:00:00.000Z",
            },
          ],
        })}
        loadPublishLinks={async () => ({
          publish_links: [
            {
              id: "link",
              slug: "product-docs",
              name: "Product docs",
              status: "active",
              version: 1,
              entries: [
                {
                  id: "entry",
                  version: 2,
                  site_publication_id: "publication-1",
                },
              ],
            },
          ],
        })}
        publish={publish}
        rollback={rollback}
      />,
    );

    expect(await screen.findByText("Live: Publication 1")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Publish Revision 2 to existing link",
      }),
    );
    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "revision-2",
        {
          mode: "existing",
          link_id: "link",
          entry_id: "entry",
          expected_entry_version: 2,
        },
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Roll back to Publication 1" }),
    );
    expect(
      await screen.findByText(/Review gate loaded for rollback Publication 1/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Roll back to Publication 1" }),
    );
    await waitFor(() =>
      expect(rollback).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "link",
        "entry",
        "publication-1",
        3,
      ),
    );
  });

  it("revokes an active Documentation Publish Link with its current version", async () => {
    const revoke = vi.fn(async () => ({
      publish_link: {
        id: "link",
        slug: "product-docs",
        name: "Product docs",
        status: "revoked" as const,
        version: 4,
        entries: [],
      },
    }));
    render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        loadRevisions={async () => ({ revisions: [] })}
        loadPublications={async () => ({ publications: [] })}
        loadPublishLinks={async () => ({
          publish_links: [
            {
              id: "link",
              slug: "product-docs",
              name: "Product docs",
              status: "active",
              version: 3,
              entries: [
                {
                  id: "entry",
                  version: 1,
                  site_publication_id: "publication",
                },
              ],
            },
          ],
        })}
        revoke={revoke}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Revoke link" }));
    await waitFor(() =>
      expect(revoke).toHaveBeenCalledWith("project", "main", "site", "link", 3),
    );
    expect(
      await screen.findByText("Publish Link revoked."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revoke link" }),
    ).not.toBeInTheDocument();
  });
});
