import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { PublicInteractiveDemoViewerPage } from "./PublicInteractiveDemoViewerPage";
describe("PublicInteractiveDemoViewerPage", () => {
  it("gives the public viewer an explicit loading state", () => {
    render(
      <PublicInteractiveDemoViewerPage
        slug="link"
        loadPublishLink={() => new Promise(() => undefined)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Loading published demo" }),
    ).toBeInTheDocument();
  });

  it("offers a clear retry state for a transient viewer failure", async () => {
    render(
      <PublicInteractiveDemoViewerPage
        slug="link"
        loadPublishLink={async () => {
          throw new Error("temporary");
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Published demo could not be loaded.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("renders typed immutable Demo Revision content", async () => {
    render(
      <PublicInteractiveDemoViewerPage
        slug="link"
        loadPublishLink={async () => ({
          publish_link: {
            entries: [
              { project_version_name: "Demo", project_version_slug: "demo" },
            ],
          } as never,
          selected_entry: { project_version_slug: "demo" } as never,
          published_artifact: {
            artifact_type: "interactive_demo",
            publication_sequence: 1,
            revision: { title: "Tour" } as never,
            demo_scenes: [],
            capture_assets: [],
          },
          canonical_public_url: "/d/link/versions/demo",
        })}
        createViewerSession={async () => undefined}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Tour" })).toBeTruthy();
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
      <PublicInteractiveDemoViewerPage
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

  it("uses immutable Revision Scene targets for overlay navigation", async () => {
    render(
      <PublicInteractiveDemoViewerPage
        slug="link"
        loadPublishLink={async () =>
          ({
            publish_link: { entries: [] },
            selected_entry: {},
            canonical_public_url: "/d/link/versions/demo",
            published_artifact: {
              artifact_type: "interactive_demo",
              publication_sequence: 2,
              revision: { title: "Tour", description: null },
              capture_assets: [{ id: "asset_1", file_url: "/scene.png" }],
              demo_scenes: [
                {
                  id: "revision_scene_1",
                  scene_index: 1,
                  title: "Start",
                  description: null,
                  background_capture_asset_id: "asset_1",
                  hotspots: [
                    {
                      id: "revision_hotspot_1",
                      hotspot_type: "click",
                      label: "Continue",
                      content: null,
                      x: 0.1,
                      y: 0.2,
                      width: 0.3,
                      height: 0.1,
                      transition: {
                        target_demo_revision_scene_id: "revision_scene_2",
                      },
                    },
                  ],
                },
                {
                  id: "revision_scene_2",
                  scene_index: 2,
                  title: "Finish",
                  description: null,
                  background_capture_asset_id: null,
                  hotspots: [],
                },
              ],
            },
          }) as never
        }
      />,
    );

    const hotspot = await screen.findByRole("button", { name: "Continue" });
    expect(hotspot).toHaveStyle({ left: "10%", top: "20%" });
    fireEvent.click(hotspot);
    expect(screen.getByRole("heading", { name: "Finish" })).toHaveFocus();
  });

  it("offers retry for a transient viewer failure", async () => {
    const loadPublishLink = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue({
        publish_link: { entries: [] },
        selected_entry: {},
        canonical_public_url: "/d/link/versions/demo",
        published_artifact: {
          artifact_type: "interactive_demo",
          publication_sequence: 1,
          revision: { title: "Recovered" },
          demo_scenes: [],
          capture_assets: [],
        },
      });
    render(
      <PublicInteractiveDemoViewerPage
        slug="link"
        loadPublishLink={loadPublishLink}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Recovered" }),
    ).toBeVisible();
    expect(loadPublishLink).toHaveBeenCalledTimes(2);
  });

  it("clears the prior publication while navigating to another public demo", async () => {
    let releaseSecond: ((value: never) => void) | undefined;
    const loadPublishLink = vi
      .fn()
      .mockResolvedValueOnce({
        publish_link: { entries: [] },
        selected_entry: {},
        canonical_public_url: "/d/first/versions/demo",
        published_artifact: {
          artifact_type: "interactive_demo",
          publication_sequence: 1,
          revision: { title: "First demo" },
          demo_scenes: [],
          capture_assets: [],
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseSecond = resolve;
          }),
      );
    const { rerender } = render(
      <PublicInteractiveDemoViewerPage
        slug="first"
        loadPublishLink={loadPublishLink}
      />,
    );
    expect(await screen.findByRole("heading", { name: "First demo" })).toBeInTheDocument();

    rerender(
      <PublicInteractiveDemoViewerPage
        slug="second"
        loadPublishLink={loadPublishLink}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Loading published demo" }),
    ).toBeInTheDocument();
    releaseSecond?.({} as never);
  });
});
