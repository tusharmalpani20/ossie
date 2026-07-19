import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { PublicInteractiveDemoViewerPage } from "./PublicInteractiveDemoViewerPage";
describe("PublicInteractiveDemoViewerPage", () => {
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

    fireEvent.change(await screen.findByLabelText("Publish Link password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password is invalid.",
    );
    expect(screen.getByLabelText("Publish Link password")).toBeTruthy();
    await waitFor(() => expect(createViewerSession).toHaveBeenCalledOnce());
  });
});
