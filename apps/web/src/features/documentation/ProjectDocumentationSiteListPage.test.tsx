import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectDocumentationSiteListPage } from "./ProjectDocumentationSiteListPage";

describe("ProjectDocumentationSiteListPage", () => {
  it("shows an actionable Admin empty state and creates the first Site", async () => {
    const createSite = vi.fn(async () => ({
      site: { id: "site", name: "Product docs", description: null },
      edition: { id: "edition", primary_language: "en-US" },
      working_draft: { id: "draft", version: 2 },
      home_page: { id: "page", canonical_path: "home" },
    }));
    render(
      <ProjectDocumentationSiteListPage
        projectId="project"
        versionSlug="main"
        canManage
        loadSites={async () => ({ documentation_sites: [] })}
        createSite={createSite}
      />,
    );

    expect(
      await screen.findByText("No Documentation Sites yet"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Site" }));
    fireEvent.change(screen.getByLabelText("Site name"), {
      target: { value: "Product docs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Documentation Site" }));

    await waitFor(() => expect(createSite).toHaveBeenCalled());
    expect(await screen.findByText("Product docs")).toBeInTheDocument();
  });

  it("keeps the Viewer list read-only", async () => {
    render(
      <ProjectDocumentationSiteListPage
        projectId="project"
        versionSlug="main"
        canManage={false}
        loadSites={async () => ({
          documentation_sites: [
            {
              id: "site",
              name: "Product docs",
              description: null,
              edition_id: "edition",
              primary_language: "en-US",
              version: 1,
              edition_version: 1,
              updated_at: "2026-07-30T00:00:00.000Z",
            },
          ],
        })}
        createSite={vi.fn()}
      />,
    );
    expect(await screen.findByText("Product docs")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create Site" }),
    ).not.toBeInTheDocument();
  });

  it("explains why an archived Project Version cannot import", async () => {
    render(
      <ProjectDocumentationSiteListPage
        projectId="project"
        versionSlug="archived"
        canManage={false}
        importUnavailableReason="This Project Version is archived. Documentation import and Site creation are unavailable."
        loadSites={async () => ({ documentation_sites: [] })}
        createSite={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(
        "This Project Version is archived. Documentation import and Site creation are unavailable.",
      ),
    ).toBeInTheDocument();
  });
});
