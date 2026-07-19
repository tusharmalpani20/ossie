import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { PublicGuideReaderPage } from "./PublicGuideReaderPage";
import type { PublicPublishLinkResponse } from "./types";

const publicGuideResponse: PublicPublishLinkResponse = {
  publish_link: {
    slug: "abc123",
    artifact_type: "guide",
    visibility: "public",
    expires_at: null,
    status: "active",
    password_protected: false,
  },
  published_artifact: {
    id: "published_artifact_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: 1,
    title: "Department guide",
    published_at: "2026-06-10T00:00:00.000Z",
    snapshot: {
      artifact_type: "guide",
      guide: {
        id: "guide_1",
        title: "Department guide",
        description: "Set up departments from the list view.",
        source_capture_session_id: "capture_session_1",
        published_version: 1,
        published_at: "2026-06-10T00:00:00.000Z",
      },
      blocks: [
        {
          id: "block_2",
          block_type: "step",
          content: null,
          block_index: 2,
          step: {
            id: "step_2",
            title: "Click Add Department",
            body: "Use the primary action in the list view.",
          },
          source_asset: {
            id: "asset_2",
            asset_type: "screenshot",
            width: 1440,
            height: 900,
            page_title: "Add Department",
            page_url: "https://example.test/departments/new",
            file_url: "/api/v1/public/publish-links/abc123/assets/asset_2/file",
            file: {
              id: "file_2",
              original_name: "add-department.png",
              mime_type: "image/png",
              size_bytes: 234567,
            },
          },
        },
        {
          id: "block_1",
          block_type: "step",
          content: null,
          block_index: 1,
          step: {
            id: "step_1",
            title: "Navigate to Department List",
            body: "Open the Department module.",
          },
          source_asset: {
            id: "asset_1",
            asset_type: "screenshot",
            width: 1440,
            height: 900,
            page_title: "Department List",
            page_url: "https://example.test/departments",
            file_url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
            file: {
              id: "file_1",
              original_name: "departments.png",
              mime_type: "image/png",
              size_bytes: 123456,
            },
          },
        },
        {
          id: "block_3",
          block_type: "header",
          content: {
            title: "Department fields",
          },
          block_index: 3,
          step: null,
          source_asset: null,
        },
        {
          id: "block_4",
          block_type: "paragraph",
          content: {
            body: "Choose the right department settings before saving.",
          },
          block_index: 4,
          step: null,
          source_asset: null,
        },
        {
          id: "block_5",
          block_type: "divider",
          content: null,
          block_index: 5,
          step: null,
          source_asset: null,
        },
      ],
    },
  },
};

const renderPage = (overrides: {
  response?: PublicPublishLinkResponse;
  loadPublishLink?: (slug: string) => Promise<PublicPublishLinkResponse>;
  createViewerSession?: (slug: string, input: { password: string }) => Promise<void>;
  mode?: "page" | "embed";
} = {}) => {
  const loadPublishLink = overrides.loadPublishLink ?? vi.fn(async () => overrides.response ?? publicGuideResponse);

  render(
    <PublicGuideReaderPage
      slug="abc123"
      loadPublishLink={loadPublishLink}
      createViewerSession={overrides.createViewerSession}
      mode={overrides.mode}
    />
  );

  return { loadPublishLink };
};

describe("PublicGuideReaderPage", () => {
  it("renders public guide snapshots in block order with screenshots", async () => {
    const { loadPublishLink } = renderPage();

    expect(screen.getByText("Loading published guide...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Set up departments from the list view.")).toBeInTheDocument();
    expect(screen.getByText("Published version 1")).toBeInTheDocument();
    expect(screen.getByText("Published Jun 10, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getAllByText(/^[12]$/).map((node) => node.textContent)).toEqual(["1", "2"]);
    expect(screen.getByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    expect(screen.getByText("Open the Department module.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Click Add Department" })).toBeInTheDocument();
    expect(screen.getByText("Use the primary action in the list view.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department fields" })).toBeInTheDocument();
    expect(screen.getByText("Choose the right department settings before saving.")).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Guide section divider" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/abc123/assets/asset_1/file"
    );
    expect(screen.getByRole("img", { name: "Add Department" })).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/abc123/assets/asset_2/file"
    );
    expect(screen.getByRole("button", { name: "Open screenshot for step 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open screenshot for step 2" })).toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
    expect(screen.queryByText("file_1")).not.toBeInTheDocument();
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("storage_key")).not.toBeInTheDocument();
    expect(loadPublishLink).toHaveBeenCalledWith("abc123", "reader");
  });

  it("renders public guide snapshots in embed mode with compact public layout", async () => {
    const { loadPublishLink } = renderPage({ mode: "embed" });

    expect(screen.getByText("Loading published guide...")).toBeInTheDocument();
    expect(await screen.findByRole("main", { name: "Embedded published guide" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Set up departments from the list view.")).toBeInTheDocument();
    expect(screen.queryByText("Published guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Published version 1")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/abc123/assets/asset_1/file"
    );
    expect(loadPublishLink).toHaveBeenCalledWith("abc123", "embed");
  });

  it("unlocks password protected public guides and reloads the snapshot", async () => {
    const loadPublishLink = vi.fn()
      .mockRejectedValueOnce(new ApiClientError({
        kind: "unauthenticated",
        status: 401,
        type: "publish_link_password_required",
        message: "Publish link password is required",
      }))
      .mockResolvedValueOnce(publicGuideResponse);
    const createViewerSession = vi.fn(async () => undefined);
    renderPage({ loadPublishLink, createViewerSession });

    expect(await screen.findByText("This guide is password protected.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "shared password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock guide" }));

    await waitFor(() => expect(createViewerSession).toHaveBeenCalledWith("abc123", {
      password: "shared password",
    }, "reader"));
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(loadPublishLink).toHaveBeenCalledTimes(2);
  });

  it("renders compact password gate in embed mode", async () => {
    renderPage({
      mode: "embed",
      loadPublishLink: async () => {
        throw new ApiClientError({
          kind: "unauthenticated",
          status: 401,
          type: "publish_link_password_required",
          message: "Publish link password is required",
        });
      },
    });

    expect(await screen.findByText("Password required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlock" })).toBeInTheDocument();
  });

  it("opens and navigates public guide screenshots", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));

    const firstDialog = screen.getByRole("dialog", { name: "Navigate to Department List" });
    expect(within(firstDialog).getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/abc123/assets/asset_1/file"
    );
    expect(within(firstDialog).getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(within(firstDialog).getByRole("button", { name: "Next screenshot" }));
    const secondDialog = screen.getByRole("dialog", { name: "Click Add Department" });
    expect(within(secondDialog).getByText("2 / 2")).toBeInTheDocument();

    fireEvent.click(within(secondDialog).getByRole("button", { name: "Close screenshot viewer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders snapshotted screenshot highlights in the public reader", async () => {
    renderPage({
      response: {
        ...publicGuideResponse,
        published_artifact: {
          ...publicGuideResponse.published_artifact,
          snapshot: {
            ...(publicGuideResponse.published_artifact.snapshot as Record<string, unknown>),
            blocks: [
              {
                id: "block_1",
                block_type: "step",
                block_index: 1,
                content: {
                  annotations: [{
                    id: "ann_public",
                    type: "highlight",
                    x: 0.12,
                    y: 0.22,
                    width: 0.32,
                    height: 0.14,
                  }, {
                    id: "",
                    type: "highlight",
                    x: 0.2,
                    y: 0.2,
                    width: 0,
                    height: 0.1,
                  }],
                },
                step: {
                  id: "step_1",
                  title: "Navigate to Department List",
                  body: null,
                },
                source_asset: {
                  id: "asset_1",
                  asset_type: "screenshot",
                  width: 1440,
                  height: 900,
                  page_title: "Department List",
                  page_url: "https://example.test/departments",
                  file_url: "/api/v1/public/publish-links/abc123/assets/asset_1/file",
                  file: {
                    id: "file_1",
                    original_name: "departments.png",
                    mime_type: "image/png",
                    size_bytes: 123456,
                  },
                },
              },
            ],
          },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByTestId("guide-highlight-ann_public")).toHaveStyle({
      left: "12%",
      top: "22%",
      width: "32%",
      height: "14%",
    });
    expect(screen.queryByTestId("guide-highlight-")).not.toBeInTheDocument();
  });

  it("renders public not found without portal login navigation", async () => {
    renderPage({
      loadPublishLink: async () => {
        throw new ApiClientError({
          kind: "not_found",
          status: 404,
          type: "publish_link_not_found",
          message: "Publish link was not found",
        });
      },
    });

    expect(await screen.findByText("Published guide was not found.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByText("Ossie portal")).not.toBeInTheDocument();
  });

  it("renders restricted and expired public guide access states", async () => {
    const { rerender } = render(
      <PublicGuideReaderPage
        slug="abc123"
        loadPublishLink={async () => {
          throw new ApiClientError({
            kind: "unknown",
            status: 403,
            type: "publish_link_not_public",
            message: "Publish link is not public",
          });
        }}
      />
    );

    expect(await screen.findByText("This guide is not publicly accessible.")).toBeInTheDocument();

    rerender(
      <PublicGuideReaderPage
        slug="abc123"
        loadPublishLink={async () => {
          throw new ApiClientError({
            kind: "unknown",
            status: 410,
            type: "publish_link_expired",
            message: "Publish link has expired",
          });
        }}
      />
    );

    expect(await screen.findByText("This guide link has expired.")).toBeInTheDocument();
  });

  it.each([
    {
      error: new ApiClientError({
        kind: "unknown",
        status: 403,
        type: "publish_link_not_public",
        message: "Publish link is not public",
      }),
      message: "This guide is not publicly accessible.",
    },
    {
      error: new ApiClientError({
        kind: "unknown",
        status: 410,
        type: "publish_link_expired",
        message: "Publish link has expired",
      }),
      message: "This guide link has expired.",
    },
    {
      error: new ApiClientError({
        kind: "not_found",
        status: 404,
        type: "publish_link_not_found",
        message: "Publish link was not found",
      }),
      message: "Published guide was not found.",
    },
  ])("uses public access errors in embed mode: $message", async ({ error, message }) => {
    renderPage({
      mode: "embed",
      loadPublishLink: async () => {
        throw error;
      },
    });

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("renders empty and metadata-light public guide snapshots", async () => {
    renderPage({
      response: {
        ...publicGuideResponse,
        published_artifact: {
          ...publicGuideResponse.published_artifact,
          snapshot: {
            artifact_type: "guide",
            guide: {
              id: "guide_1",
              title: "Text-only guide",
              description: null,
              source_capture_session_id: null,
              published_version: 1,
              published_at: "",
            },
            blocks: [],
          },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: "Text-only guide" })).toBeInTheDocument();
    expect(screen.getByText("This published guide does not have any blocks yet.")).toBeInTheDocument();
    expect(screen.queryByText(/Published Jun/)).not.toBeInTheDocument();
  });

  it("renders malformed public artifact states safely", async () => {
    renderPage({
      response: {
        ...publicGuideResponse,
        published_artifact: {
          ...publicGuideResponse.published_artifact,
          artifact_type: "interactive_demo",
          snapshot: { artifact_type: "interactive_demo" },
        },
      },
    });

    expect(await screen.findByText("Published artifact cannot be displayed.")).toBeInTheDocument();
    expect(screen.queryByText("interactive_demo")).not.toBeInTheDocument();
  });

  it("ignores invalid block and asset entries without crashing", async () => {
    renderPage({
      response: {
        ...publicGuideResponse,
        published_artifact: {
          ...publicGuideResponse.published_artifact,
          snapshot: {
            artifact_type: "guide",
            guide: {
              id: "guide_1",
              title: "Defensive guide",
              description: null,
              source_capture_session_id: null,
              published_version: 1,
              published_at: "2026-06-10T00:00:00.000Z",
            },
            blocks: [
              null,
              {
                id: "block_1",
                block_type: "step",
                block_index: 1,
                step: {
                  id: "step_1",
                  title: "Valid step",
                  body: null,
                },
                source_asset: {
                  id: "asset_1",
                  file_url: "",
                },
              },
            ],
          },
        },
      } as unknown as PublicPublishLinkResponse,
    });

    expect(await screen.findByRole("heading", { name: "Defensive guide" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Valid step" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
  });
});
