import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicInteractiveDemoViewerPage } from "./PublicInteractiveDemoViewerPage";
import type { PublishedInteractiveDemoSnapshot, PublicPublishLinkResponse } from "./types";

const publicDemoSnapshot: PublishedInteractiveDemoSnapshot = {
  artifact_type: "interactive_demo",
  schema_version: 1,
  interactive_demo: {
    id: "interactive_demo_1",
    title: "Department demo",
    description: "Interactive department walkthrough.",
    source_capture_session_id: "capture_session_1",
    published_version: 1,
    published_at: "2026-06-10T00:00:00.000Z",
  },
  scenes: [{
    id: "scene_1",
    scene_index: 1,
    title: "Navigate to Department List",
    description: "Open the Department module.",
    background_asset: {
      id: "asset_1",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      page_title: "Department List",
      page_url: "https://example.test/departments",
      file_url: "/api/v1/public/publish-links/demo123/assets/asset_1/file",
      file: {
        id: "file_1",
        original_name: "departments.png",
        mime_type: "image/png",
        size_bytes: 123456,
      },
    },
    hotspots: [{
      id: "hotspot_1",
      hotspot_type: "click",
      label: "Continue",
      content: null,
      x: 0.62,
      y: 0.12,
      width: 0.16,
      height: 0.08,
      target_scene_id: "scene_2",
      hotspot_index: 1,
    }, {
      id: "hotspot_2",
      hotspot_type: "info",
      label: "Read first",
      content: "Check the list before continuing.",
      x: 0.1,
      y: 0.8,
      width: 0.24,
      height: 0.1,
      target_scene_id: null,
      hotspot_index: 2,
    }],
  }, {
    id: "scene_2",
    scene_index: 2,
    title: "Click Add Department",
    description: null,
    background_asset: {
      id: "asset_2",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      page_title: "Add Department",
      page_url: "https://example.test/departments/new",
      file_url: "/api/v1/public/publish-links/demo123/assets/asset_2/file",
      file: {
        id: "file_2",
        original_name: "add-department.png",
        mime_type: "image/png",
        size_bytes: 123456,
      },
    },
    hotspots: [],
  }],
};

const publicDemoResponse: PublicPublishLinkResponse = {
  publish_link: {
    slug: "demo123",
    artifact_type: "interactive_demo",
    visibility: "public",
    expires_at: null,
    status: "active",
    password_protected: false,
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "interactive_demo",
    artifact_id: "interactive_demo_1",
    version_number: 1,
    title: "Department demo",
    published_at: "2026-06-10T00:00:00.000Z",
    snapshot: publicDemoSnapshot,
  },
};

const renderPage = (overrides: {
  response?: PublicPublishLinkResponse;
  mode?: "page" | "embed";
} = {}) => {
  const loadPublishLink = vi.fn(async () => overrides.response ?? publicDemoResponse);

  render(
    <PublicInteractiveDemoViewerPage
      slug="demo123"
      mode={overrides.mode}
      loadPublishLink={loadPublishLink}
    />
  );

  return { loadPublishLink };
};

describe("PublicInteractiveDemoViewerPage", () => {
  it("renders a public interactive demo and navigates hotspots", async () => {
    const { loadPublishLink } = renderPage();

    expect(screen.getByText("Loading interactive demo...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department demo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/demo123/assets/asset_1/file"
    );
    expect(screen.getByRole("button", { name: "Continue" })).toHaveStyle({
      left: "62%",
      top: "12%",
      width: "16%",
      height: "8%",
    });

    fireEvent.click(screen.getByRole("button", { name: "Read first" }));
    expect(screen.getByText("Check the list before continuing.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "Click Add Department" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Add Department" })).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/demo123/assets/asset_2/file"
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous scene" }));
    expect(await screen.findByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next scene" }));
    expect(await screen.findByRole("heading", { name: "Click Add Department" })).toBeInTheDocument();
    expect(loadPublishLink).toHaveBeenCalledWith("demo123", "reader");
  });

  it("renders compact public interactive demo embed mode", async () => {
    renderPage({ mode: "embed" });

    expect(await screen.findByRole("main", { name: "Embedded interactive demo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department demo" })).toBeInTheDocument();
    expect(screen.queryByText("Published interactive demo")).not.toBeInTheDocument();
  });

  it("falls back to the next scene when a hotspot target scene is missing", async () => {
    const staleTargetResponse: PublicPublishLinkResponse = {
      ...publicDemoResponse,
      published_artifact: {
        ...publicDemoResponse.published_artifact,
        snapshot: {
          ...publicDemoSnapshot,
          scenes: publicDemoSnapshot.scenes.map((scene, index) => (
            index === 0
              ? {
                ...scene,
                hotspots: scene.hotspots.map((candidate) => (
                  candidate.id === "hotspot_1"
                    ? { ...candidate, target_scene_id: "scene_missing" }
                    : candidate
                )),
              }
              : scene
          )),
        },
      },
    };

    renderPage({ response: staleTargetResponse });

    expect(await screen.findByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Click Add Department" })).toBeInTheDocument();
  });
});
