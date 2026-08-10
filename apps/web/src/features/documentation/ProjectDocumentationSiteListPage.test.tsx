import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectDocumentationSiteListPage } from "./ProjectDocumentationSiteListPage";

describe("ProjectDocumentationSiteListPage", () => {
  it("announces loading and error states with a page heading", async () => {
    const pendingSites = new Promise<{ documentation_sites: [] }>(() => undefined);
    const { rerender } = render(
      <ProjectDocumentationSiteListPage
        projectId="project"
        versionSlug="main"
        canManage={false}
        loadSites={async () => pendingSites}
        loadReviewInbox={async () => ({
          unread_count: 0,
          items: [],
          next_cursor: null,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Documentation Sites", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading Documentation Sites…",
    );

    rerender(
      <ProjectDocumentationSiteListPage
        projectId="project-error"
        versionSlug="main"
        canManage={false}
        loadSites={async () => {
          throw new Error("Network failed");
        }}
        loadReviewInbox={async () => ({
          unread_count: 0,
          items: [],
          next_cursor: null,
        })}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Documentation Sites",
        level: 1,
      }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Documentation Sites could not be loaded.",
    );
  });

  it("shows an actionable Admin empty state and creates the first Site", async () => {
    const createSite = vi.fn(async () => ({
      site: { id: "site", name: "Product docs", description: null },
      edition: { id: "edition", primary_language: "en-US" },
      working_draft: { id: "draft", version: 2 },
      home_page: { id: "page", canonical_path: "home" },
    }));
    const { container } = render(
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
    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Import Site package",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Site" }));
    fireEvent.change(screen.getByLabelText("Site name"), {
      target: { value: "Product docs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Documentation Site" }));

    await waitFor(() => expect(createSite).toHaveBeenCalled());
    expect(await screen.findByText("Product docs")).toBeInTheDocument();
  });

  it("announces Documentation Site creation failures without losing the form", async () => {
    render(
      <ProjectDocumentationSiteListPage
        projectId="project"
        versionSlug="main"
        canManage
        loadSites={async () => ({ documentation_sites: [] })}
        createSite={async () => {
          throw new Error("offline");
        }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Create Site" }));
    fireEvent.change(screen.getByLabelText("Site name"), {
      target: { value: "Product docs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Documentation Site" }));

    expect(
      await screen.findByRole("alert", {
        name: "Documentation Site creation failed",
      }),
    ).toHaveTextContent("Could not create Documentation Site.");
    expect(screen.getByLabelText("Site name")).toBeInTheDocument();
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
