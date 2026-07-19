import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicGuideReaderPage } from "./PublicGuideReaderPage";
describe("PublicGuideReaderPage", () => {
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
});
