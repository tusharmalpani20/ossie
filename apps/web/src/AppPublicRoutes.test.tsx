/**
 * @fileoverview App public route smoke tests.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

const publicGuideResponse = {
  publish_link: {
    slug: "abc123",
    artifact_type: "guide",
    visibility: "public",
    expires_at: null,
    status: "active",
    password_protected: false,
    entries: [
      {
        project_version_name: "Default",
        project_version_slug: "default",
        position: 1,
        is_default: true,
        publication_sequence: 1,
        public_url: "/p/abc123/versions/default",
      },
    ],
  },
  selected_entry: {
    project_version_name: "Default",
    project_version_slug: "default",
    position: 1,
    is_default: true,
    publication_sequence: 1,
    public_url: "/p/abc123/versions/default",
  },
  published_artifact: {
    artifact_type: "guide",
    publication_sequence: 1,
    revision: {
      id: "revision_1",
      edition_id: "edition_1",
      revision_number: 1,
      trigger: "publication",
      title: "Department guide",
      description: "Set up departments from the list view.",
      source_working_draft_version: 1,
      created_by_id: "member_1",
      created_at: "2026-06-10T00:00:00.000Z",
    },
    guide_blocks: [],
    capture_assets: [],
  },
  canonical_public_url: "/p/abc123/versions/default",
};

/** Builds a JSON response for public route fetch mocks. */
const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });

describe("App public routes", () => {
  it("renders public Documentation routes without portal navigation", async () => {
    window.history.pushState({}, "", "/docs/product-docs/install");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          site: { name: "Product docs", description: null },
          revision: { primary_language: "en-US", home_page_id: "page" },
          pages: [{ id: "page", title: "Install", canonical_path: "install" }],
          navigation: [],
          openapi_operations: [],
          page: {
            id: "page",
            title: "Install",
            description: null,
            canonical_path: "install",
            blocks: [],
          },
        }),
      ),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Install" }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ossie portal")).not.toBeInTheDocument();
  });

  it("renders public guide reader routes without portal navigation", async () => {
    window.history.pushState({}, "", "/p/abc123");
    const fetch = vi.fn(async () => jsonResponse(publicGuideResponse));
    vi.stubGlobal("fetch", fetch);

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Department guide" }),
    ).toBeInTheDocument();
    expect(screen.getByText("This guide has no steps yet.")).toBeInTheDocument();
    expect(screen.queryByText("Ossie portal")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/publish-links/abc123?artifact_type=guide",
      {
        credentials: "include",
        headers: {
          "X-Ossie-Access-Surface": "public_reader",
          accept: "application/json",
        },
      },
    );
  });

  it("renders public guide embed routes without portal navigation", async () => {
    window.history.pushState({}, "", "/p/abc123/embed");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(publicGuideResponse)),
    );

    render(<App />);

    expect(
      await screen.findByRole("main", { name: "Embedded published guide" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Department guide" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ossie portal")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
  });
});
