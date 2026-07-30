import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPublicationReferencePicker } from "./DocumentationPublicationReferencePicker";

describe("DocumentationPublicationReferencePicker", () => {
  it("selects an exact immutable publication rather than a latest artifact", async () => {
    const onSelect = vi.fn();
    render(
      <DocumentationPublicationReferencePicker
        artifactType="guide"
        listPublications={async () => ({
          publications: [
            {
              published_artifact_id: "publication",
              artifact_type: "guide",
              artifact_id: "guide",
              edition_id: "edition",
              project_version_id: "version",
              project_version_name: "Version 2",
              project_version_slug: "v2",
              publication_sequence: 5,
              revision_number: 3,
              title: "Install",
              description: null,
              published_at: "2026-07-30T00:00:00.000Z",
            },
          ],
        })}
        onSelect={onSelect}
        projectId="project"
        siteId="site"
        versionSlug="main"
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Select Install, Version 2, revision 3, publication 5",
      }),
    );
    expect(onSelect).toHaveBeenCalledWith("publication");
    expect(screen.queryByText(/latest/i)).toBeNull();
  });
});
