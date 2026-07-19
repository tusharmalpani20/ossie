import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
