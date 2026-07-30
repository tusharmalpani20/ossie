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
});
