import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPublishingPanel } from "./DocumentationPublishingPanel";

describe("DocumentationPublishingPanel", () => {
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
            { id: "revision", revision_number: 1, created_at: "2026-07-30T00:00:00.000Z" },
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
        },
      ),
    );
    expect(await screen.findByRole("link", { name: "Open published Documentation" })).toHaveAttribute(
      "href",
      "/docs/product-docs",
    );
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
      screen.getByRole("button", { name: "Publish Revision 2 to existing link" }),
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
});
