import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentationPublishingPanel } from "./DocumentationPublishingPanel";

afterEach(() => vi.unstubAllGlobals());

describe("DocumentationPublishingPanel", () => {
  it("discovers Organization Owner recovery permission independently of project access source", async () => {
    render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        loadOperations={async () => ({
          limits: {
            active_sites_limit: null,
            active_pages_limit: null,
            version: 0,
            updated_at: null,
          },
          usage: {
            active_sites: 1,
            active_pages: 1,
            retained_file_bytes: 0,
            retained_revisions: 0,
            retained_publications: 0,
            active_import_inspections: 0,
            open_review_requests: 0,
          },
          states: [
            {
              dimension: "active_sites",
              usage: 1,
              limit: null,
              state: "within_limit",
            },
            {
              dimension: "active_pages",
              usage: 1,
              limit: null,
              state: "within_limit",
            },
            {
              dimension: "retained_file_bytes",
              usage: 0,
              limit: null,
              state: "within_limit",
            },
          ],
          permissions: { can_manage_limits: true },
          generated_at: "2026-07-31T00:00:00.000Z",
        })}
        loadRevisions={async () => ({ revisions: [] })}
        loadPublications={async () => ({ publications: [] })}
        loadPublishLinks={async () => ({ publish_links: [] })}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Search projection recovery",
      }),
    ).toBeInTheDocument();
  });

  it("lets only an explicitly authorized Owner confirm exact projection rebuilds", async () => {
    const rebuildProjection = vi.fn(async () => ({
      projection: "publication_search" as const,
      site_id: "site",
      publication_id: "publication",
      output_digest: "a".repeat(64),
      documents: 3,
      outcome: "rebuilt" as const,
    }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { rerender } = render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        canRebuildProjections
        loadRevisions={async () => ({ revisions: [] })}
        loadPublications={async () => ({
          publications: [
            {
              id: "publication",
              publication_sequence: 2,
              revision_number: 4,
              published_at: "2026-07-31T00:00:00.000Z",
            },
          ],
        })}
        loadPublishLinks={async () => ({ publish_links: [] })}
        rebuildProjection={rebuildProjection}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Rebuild Publication 2 search",
      }),
    );
    await waitFor(() =>
      expect(rebuildProjection).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        {
          projection: "publication_search",
          publication_id: "publication",
        },
      ),
    );
    expect(confirm).toHaveBeenCalled();
    expect(
      await screen.findByText(
        "Publication 2 search projection rebuilt; 3 documents verified.",
      ),
    ).toBeInTheDocument();

    rerender(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        canRebuildProjections={false}
        loadRevisions={async () => ({ revisions: [] })}
        loadPublications={async () => ({ publications: [] })}
        loadPublishLinks={async () => ({ publish_links: [] })}
        rebuildProjection={rebuildProjection}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Search projection recovery" }),
    ).not.toBeInTheDocument();
  });

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

  it("requires explicit confirmation before enabling Try It for a Publish Link", async () => {
    const requests: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        requests.push(init ?? {});
        return new Response(
          JSON.stringify({
            policy: null,
            effective_status: "off",
            entries: [
              {
                entry_id: "01J00000000000000000000001",
                project_version_slug: "main",
                project_version_label: "Main",
                is_default: true,
                effective_status: "available",
              },
            ],
          }),
          { headers: { "content-type": "application/json" } },
        );
      }),
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <DocumentationPublishingPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canPublish
        canOverrideReview
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
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Enable published Try It",
      }),
    );
    expect(confirm).toHaveBeenCalledWith(
      "Enable browser-direct Try It for Product docs? Link access does not grant target API access.",
    );
    expect(
      requests.filter((request) => request.method === "PATCH"),
    ).toHaveLength(0);
  });
});
