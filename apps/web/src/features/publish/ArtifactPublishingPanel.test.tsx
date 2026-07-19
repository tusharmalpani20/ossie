import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api", () => ({
  listArtifactPublications: vi.fn(async () => ({
    publications: [],
    next_before_publication_sequence: null,
  })),
  listArtifactPublishLinks: vi.fn(async () => ({
    publish_links: [],
    next_cursor: null,
  })),
  publishArtifact: vi.fn(),
  createArtifactPublishLink: vi.fn(),
  replaceArtifactPublishLinkManifest: vi.fn(),
  rollbackArtifactPublishLinkEntry: vi.fn(),
  revokeArtifactPublishLink: vi.fn(),
  updateArtifactPublishLink: vi.fn(),
}));

import { ArtifactPublishingPanel } from "./ArtifactPublishingPanel";

describe("ArtifactPublishingPanel", () => {
  it("does not gate publishing to the Default Project Version", async () => {
    render(
      <ArtifactPublishingPanel
        projectId="p"
        projectVersionId="named"
        artifactType="guide"
        artifactId="g"
        editionVersion={1}
        workingDraftVersion={1}
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Publish this draft" }),
    ).toBeEnabled();
  });

  it("blocks Publication creation but keeps Publish Link management available for an archived Edition", async () => {
    render(
      <ArtifactPublishingPanel
        projectId="p"
        projectVersionId="named"
        artifactType="guide"
        artifactId="g"
        editionVersion={1}
        workingDraftVersion={1}
        publicationReadOnly
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Publish this draft" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Create from latest Publication" }),
    ).toBeEnabled();
  });

  it("shows history without mutation controls to a Viewer", async () => {
    render(
      <ArtifactPublishingPanel
        projectId="p"
        projectVersionId="named"
        artifactType="guide"
        artifactId="g"
        editionVersion={1}
        workingDraftVersion={1}
        showMutationControls={false}
      />,
    );

    expect(await screen.findByText("Project Version history")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Publish this draft" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create from latest Publication" }),
    ).not.toBeInTheDocument();
  });
});
