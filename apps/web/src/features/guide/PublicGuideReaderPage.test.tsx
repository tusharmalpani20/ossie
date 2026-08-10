import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { PublicGuideReaderPage } from "./PublicGuideReaderPage";
describe("PublicGuideReaderPage", () => {
  it("gives the public reader an explicit loading state", () => {
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={() => new Promise(() => undefined)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Loading published guide" }),
    ).toBeInTheDocument();
  });

  it("explains when the published guide cannot be found", async () => {
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            message: "Not found",
            type: "publish_link_not_found",
          });
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Published guide was not found.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region")).toHaveAccessibleName(
      "Published guide was not found.",
    );
  });

  it("offers retry for a transient public reader failure", async () => {
    const loadPublishLink = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue({
        publish_link: { entries: [] },
        selected_entry: {},
        published_artifact: {
          artifact_type: "guide",
          publication_sequence: 1,
          revision: { title: "Recovered guide" },
          guide_blocks: [],
          capture_assets: [],
        },
        canonical_public_url: "/p/link/versions/docs",
      } as never);
    render(
      <PublicGuideReaderPage slug="link" loadPublishLink={loadPublishLink} />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Published guide could not be loaded.",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Recovered guide" }),
    ).toBeInTheDocument();
    expect(loadPublishLink).toHaveBeenCalledTimes(2);
  });

  it("renders typed immutable Guide Revision content", async () => {
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={async () => ({
          publish_link: {
            entries: [
              { project_version_name: "Docs", project_version_slug: "docs" },
            ],
          } as never,
          selected_entry: { project_version_slug: "docs" } as never,
          published_artifact: {
            artifact_type: "guide",
            publication_sequence: 1,
            revision: { title: "Install Ossie", description: null } as never,
            guide_blocks: [],
            capture_assets: [],
          },
          canonical_public_url: "/p/link/versions/docs",
        })}
        createViewerSession={async () => undefined}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Install Ossie" }),
    ).toBeTruthy();
  });

  it("gives the published guide shell one title and a readable block frame", async () => {
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={async () => ({
          publish_link: {
            entries: [
              { project_version_name: "Docs", project_version_slug: "docs" },
            ],
          } as never,
          selected_entry: { project_version_slug: "docs" } as never,
          published_artifact: {
            artifact_type: "guide",
            publication_sequence: 1,
            revision: {
              title: "Install Ossie",
              description: "A short immutable guide.",
            } as never,
            guide_blocks: [
              {
                id: "block_1",
                block_index: 1,
                title: "First step",
                body: "Follow this step.",
                step: null,
              },
            ] as never,
            capture_assets: [],
          },
          canonical_public_url: "/p/link/versions/docs",
        })}
      />,
    );

    expect(
      await screen.findByRole("main", { name: "Install Ossie" }),
    ).toHaveAttribute("aria-labelledby", "public-guide-title");
    expect(
      screen.getByRole("heading", { level: 1, name: "Install Ossie" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "First step" }),
    ).toBeVisible();
  });

  it("provides a keyboard skip link to published Guide content", async () => {
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={async () => ({
          publish_link: { entries: [] } as never,
          selected_entry: {} as never,
          published_artifact: {
            artifact_type: "guide",
            publication_sequence: 1,
            revision: { title: "Keyboard guide" } as never,
            guide_blocks: [],
            capture_assets: [],
          },
          canonical_public_url: "/p/link",
        })}
      />,
    );

    expect(
      await screen.findByRole("link", { name: "Skip to guide content" }),
    ).toHaveAttribute("href", "#public-guide-content");
    expect(document.getElementById("public-guide-content")).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("keeps the password form available after an invalid password", async () => {
    const createViewerSession = vi.fn().mockRejectedValue(
      new ApiClientError({
        kind: "unauthenticated",
        status: 401,
        message: "Password is invalid.",
        type: "publish_link_password_invalid",
      }),
    );
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            message: "Password required.",
            type: "publish_link_password_required",
          });
        }}
        createViewerSession={createViewerSession}
      />,
    );

    const passwordInput = await screen.findByLabelText("Publish Link password");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    fireEvent.change(passwordInput, {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password is invalid.",
    );
    expect(screen.getByLabelText("Publish Link password")).toBeTruthy();
    await waitFor(() => expect(createViewerSession).toHaveBeenCalledOnce());
  });

  it("renders an explicit fallback when a published screenshot fails", async () => {
    render(
      <PublicGuideReaderPage
        slug="link"
        loadPublishLink={async () => ({
          publish_link: {
            entries: [
              { project_version_name: "Docs", project_version_slug: "docs" },
            ],
          } as never,
          selected_entry: { project_version_slug: "docs" } as never,
          published_artifact: {
            artifact_type: "guide",
            publication_sequence: 1,
            revision: { title: "Broken guide" } as never,
            guide_blocks: [
              {
                id: "block_1",
                block_index: 1,
                title: null,
                body: null,
                step: {
                  title: "Broken screenshot",
                  body: null,
                  display_capture_asset_id: "asset_1",
                },
              },
            ] as never,
            capture_assets: [
              { id: "asset_1", file_url: "/broken.png" },
            ] as never,
          },
          canonical_public_url: "/p/link/versions/docs",
        })}
      />,
    );

    fireEvent.error(
      await screen.findByRole("img", {
        name: "Screenshot for Broken screenshot",
      }),
    );
    expect(
      screen.getByRole("status", {
        name: "",
      }),
    ).toHaveTextContent("Captured screenshot is unavailable.");
  });
});
