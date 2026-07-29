import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
import {
  listArtifactPublications,
  listArtifactPublishLinks,
  publishArtifact,
  rollbackArtifactPublishLinkEntry,
  replaceArtifactPublishLinkManifest,
  revokeArtifactPublishLink,
  updateArtifactPublishLink,
} from "../../lib/api";

const publication = {
  id: "publication-2",
  artifact_type: "guide" as const,
  artifact_id: "g",
  edition_id: "edition",
  project_version_id: "named",
  revision_id: "revision-2",
  revision_number: 2,
  publication_sequence: 2,
  publisher: { id: "user-2", display_name: "Taylor Editor" },
  published_at: "2026-07-20T10:00:00.000Z",
  created_at: "2026-07-20T10:00:00.000Z",
};

const previousPublication = {
  ...publication,
  id: "publication-1",
  revision_id: "revision-1",
  revision_number: 1,
  publication_sequence: 1,
  publisher: { id: "user-1", display_name: "Morgan Editor" },
  published_at: "2026-07-19T10:00:00.000Z",
  created_at: "2026-07-19T10:00:00.000Z",
};

const publishLink = {
  id: "link-1",
  artifact_type: "guide" as const,
  artifact_id: "g",
  name: "Customer docs",
  slug: "opaque-link",
  visibility: "public" as const,
  status: "active" as const,
  expires_at: null,
  password_protected: false,
  version: 3,
  entries: [
    {
      id: "entry-1",
      project_version: {
        id: "named",
        name: "2026.2",
        slug: "2026-2",
        status: "active" as const,
      },
      position: 1,
      is_default: true,
      version: 2,
      published_artifact: publication,
    },
  ],
  public_url: "/p/opaque-link",
  default_public_url: "/p/opaque-link/versions/2026-2",
  created_at: "2026-07-20T10:00:00.000Z",
  updated_at: "2026-07-20T10:00:00.000Z",
  revoked_at: null,
};

const renderPanel = () =>
  render(
    <ArtifactPublishingPanel
      projectId="p"
      projectVersionId="named"
      artifactType="guide"
      artifactId="g"
      editionVersion={4}
      workingDraftVersion={7}
    />,
  );

describe("ArtifactPublishingPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [],
      next_cursor: null,
    });
    vi.mocked(publishArtifact).mockResolvedValue({
      published_artifact: publication,
      revision_reused: false,
      updated_publish_links: [],
      created_publish_link: null,
    } as never);
    vi.mocked(rollbackArtifactPublishLinkEntry).mockResolvedValue({} as never);
    vi.mocked(revokeArtifactPublishLink).mockResolvedValue({} as never);
    vi.mocked(updateArtifactPublishLink).mockResolvedValue({} as never);
  });

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

  it("starts every active Publish Link unchecked and permits an unlinked Publication", async () => {
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [publishLink],
      next_cursor: null,
    });
    renderPanel();

    const selection = await screen.findByRole("checkbox", {
      name: /Customer docs/i,
    });
    expect(selection).not.toBeChecked();
    expect(
      screen.getByRole("link", { name: "Open Customer docs" }),
    ).toHaveAttribute("href", "/p/opaque-link");
    fireEvent.click(screen.getByRole("button", { name: "Publish this draft" }));

    await waitFor(() =>
      expect(publishArtifact).toHaveBeenCalledWith("p", "guide", "g", "named", {
        expected_edition_version: 4,
        expected_working_draft_version: 7,
        update_publish_links: [],
      }),
    );
  });

  it("can explicitly create a Publish Link atomically with a Publication", async () => {
    renderPanel();
    fireEvent.click(
      await screen.findByRole("checkbox", {
        name: "Create a Publish Link with this Publication",
      }),
    );
    fireEvent.change(screen.getByLabelText("New link name"), {
      target: { value: "Release notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish this draft" }));

    await waitFor(() =>
      expect(publishArtifact).toHaveBeenCalledWith("p", "guide", "g", "named", {
        expected_edition_version: 4,
        expected_working_draft_version: 7,
        update_publish_links: [],
        create_publish_link: {
          name: "Release notes",
          visibility: "public",
          expires_at: null,
          password: null,
        },
      }),
    );
  });

  it("uses the optional Guide aggregate mutation lease for Publication", async () => {
    const lease = vi.fn();
    const runAggregateMutation = async <Result,>(
      command: "publication",
      operation: () => Promise<Result>,
    ): Promise<Result> => {
      lease(command);
      return operation();
    };
    render(
      <ArtifactPublishingPanel
        projectId="p"
        projectVersionId="named"
        artifactType="guide"
        artifactId="g"
        editionVersion={4}
        workingDraftVersion={7}
        runAggregateMutation={runAggregateMutation}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Publish this draft" }),
    );
    await waitFor(() => expect(lease).toHaveBeenCalledOnce());
    expect(lease).toHaveBeenCalledWith("publication");
    expect(publishArtifact).toHaveBeenCalledOnce();
  });

  it("shows rollback evidence and sends only the optional entered reason after confirmation", async () => {
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication, previousPublication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [publishLink],
      next_cursor: null,
    });
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Roll back" }));
    const dialog = screen.getByRole("dialog", { name: "Confirm rollback" });
    expect(dialog).toHaveTextContent("Publication 2");
    expect(dialog).toHaveTextContent("Taylor Editor");
    expect(dialog).toHaveTextContent("Publication 1");
    expect(dialog).toHaveTextContent("Morgan Editor");
    fireEvent.change(screen.getByLabelText("Rollback reason (optional)"), {
      target: { value: "  Restore reviewed copy  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rollback" }));

    await waitFor(() =>
      expect(rollbackArtifactPublishLinkEntry).toHaveBeenCalledWith(
        "p",
        "guide",
        "g",
        "named",
        "link-1",
        "entry-1",
        {
          expected_link_version: 3,
          target_published_artifact_id: "publication-1",
          reason: "Restore reviewed copy",
        },
      ),
    );
  });

  it("edits link-wide name, access, expiry, and password settings explicitly", async () => {
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [publishLink],
      next_cursor: null,
    });
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Edit settings" }),
    );
    fireEvent.change(screen.getByLabelText("Link name"), {
      target: { value: "Partner docs" },
    });
    fireEvent.change(screen.getByLabelText("Visibility"), {
      target: { value: "restricted" },
    });
    fireEvent.change(screen.getByLabelText("Expiry (optional)"), {
      target: { value: "2026-08-01T12:00" },
    });
    fireEvent.change(screen.getByLabelText("New password (optional)"), {
      target: { value: "new secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() =>
      expect(updateArtifactPublishLink).toHaveBeenCalledWith(
        "p",
        "guide",
        "g",
        "named",
        "link-1",
        {
          expected_link_version: 3,
          name: "Partner docs",
          visibility: "restricted",
          expires_at: new Date("2026-08-01T12:00").toISOString(),
          password: "new secret",
        },
      ),
    );
  });

  it("can add the latest Publication for the current Project Version to an existing manifest", async () => {
    const otherPublication = {
      ...publication,
      id: "other-publication",
      edition_id: "other-edition",
      project_version_id: "other-version",
    };
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [
        {
          ...publishLink,
          entries: [
            {
              ...publishLink.entries[0]!,
              project_version: {
                id: "other-version",
                name: "2026.1",
                slug: "2026-1",
                status: "archived",
              },
              published_artifact: otherPublication,
            },
          ],
        },
      ],
      next_cursor: null,
    });
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Add current Project Version",
      }),
    );

    await waitFor(() =>
      expect(replaceArtifactPublishLinkManifest).toHaveBeenCalledWith(
        "p",
        "guide",
        "g",
        "named",
        "link-1",
        {
          expected_link_version: 3,
          published_artifact_ids: ["other-publication", "publication-2"],
          default_published_artifact_id: "other-publication",
        },
      ),
    );
  });

  it("can explicitly clear an existing Publish Link password", async () => {
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [{ ...publishLink, password_protected: true }],
      next_cursor: null,
    });
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Edit settings" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Clear current password" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() =>
      expect(updateArtifactPublishLink).toHaveBeenCalledWith(
        "p",
        "guide",
        "g",
        "named",
        "link-1",
        expect.objectContaining({ password: null }),
      ),
    );
  });

  it("does not remove a manifest entry when destructive confirmation is cancelled", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [
        {
          ...publishLink,
          entries: [
            publishLink.entries[0]!,
            {
              ...publishLink.entries[0]!,
              id: "entry-2",
              project_version: {
                id: "other-version",
                name: "2026.1",
                slug: "2026-1",
                status: "archived",
              },
              position: 2,
              is_default: false,
              published_artifact: {
                ...previousPublication,
                project_version_id: "other-version",
                edition_id: "other-edition",
              },
            },
          ],
        },
      ],
      next_cursor: null,
    });
    renderPanel();

    const removeButtons = await screen.findAllByRole("button", {
      name: "Remove",
    });
    fireEvent.click(removeButtons[1]!);

    expect(confirm).toHaveBeenCalledWith(
      "Remove 2026.1 from this Publish Link? The Publication will remain in history.",
    );
    expect(replaceArtifactPublishLinkManifest).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("cancels rollback with Escape without issuing a request", async () => {
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication, previousPublication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [publishLink],
      next_cursor: null,
    });
    renderPanel();

    const rollbackButton = await screen.findByRole("button", {
      name: "Roll back",
    });
    rollbackButton.focus();
    fireEvent.click(rollbackButton);

    await waitFor(() =>
      expect(screen.getByLabelText("Rollback reason (optional)")).toHaveFocus(),
    );
    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: "Confirm rollback" }),
    ).not.toBeInTheDocument();
    expect(rollbackButton).toHaveFocus();
    expect(rollbackArtifactPublishLinkEntry).not.toHaveBeenCalled();
  });

  it("returns focus to the rollback trigger after Cancel", async () => {
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication, previousPublication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [publishLink],
      next_cursor: null,
    });
    renderPanel();

    const rollbackButton = await screen.findByRole("button", {
      name: "Roll back",
    });
    rollbackButton.focus();
    fireEvent.click(rollbackButton);

    await waitFor(() =>
      expect(screen.getByLabelText("Rollback reason (optional)")).toHaveFocus(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Confirm rollback" }),
    ).not.toBeInTheDocument();
    expect(rollbackButton).toHaveFocus();
  });

  it("moves focus to the Publishing region when a successful rollback removes its trigger", async () => {
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication, previousPublication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks)
      .mockResolvedValueOnce({
        publish_links: [publishLink],
        next_cursor: null,
      })
      .mockResolvedValueOnce({
        publish_links: [
          {
            ...publishLink,
            entries: [
              {
                ...publishLink.entries[0]!,
                published_artifact: previousPublication,
              },
            ],
          },
        ],
        next_cursor: null,
      });
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Roll back" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm rollback" }));

    expect(
      await screen.findByText(
        "Publish Link entry rolled back. No Publication was created.",
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Publishing" })).toHaveFocus(),
    );
  });

  it("reports a committed rollback truthfully when the publishing refresh fails", async () => {
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication, previousPublication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks)
      .mockResolvedValueOnce({
        publish_links: [publishLink],
        next_cursor: null,
      })
      .mockRejectedValueOnce(new Error("refresh unavailable"));
    renderPanel();

    const rollbackButton = await screen.findByRole("button", {
      name: "Roll back",
    });
    fireEvent.click(rollbackButton);
    fireEvent.click(screen.getByRole("button", { name: "Confirm rollback" }));

    expect(
      await screen.findByText(
        "Rollback succeeded, but publishing could not be refreshed. Reload and try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Confirm rollback" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(rollbackButton).toHaveFocus());
  });

  it("does not offer a forward Publication as a rollback target", async () => {
    vi.mocked(listArtifactPublications).mockResolvedValue({
      publications: [publication, previousPublication],
      next_before_publication_sequence: null,
    });
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [
        {
          ...publishLink,
          entries: [
            {
              ...publishLink.entries[0]!,
              published_artifact: previousPublication,
            },
          ],
        },
      ],
      next_cursor: null,
    });
    renderPanel();

    await screen.findByText("Customer docs");
    expect(
      screen.queryByRole("button", { name: "Roll back" }),
    ).not.toBeInTheDocument();
  });

  it("disables revoke while pending and reports a recoverable failure", async () => {
    vi.mocked(listArtifactPublishLinks).mockResolvedValue({
      publish_links: [publishLink],
      next_cursor: null,
    });
    let rejectRevoke!: (error: Error) => void;
    vi.mocked(revokeArtifactPublishLink).mockReturnValue(
      new Promise((_, reject) => {
        rejectRevoke = reject;
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPanel();

    const revoke = await screen.findByRole("button", { name: "Revoke" });
    fireEvent.click(revoke);
    expect(revoke).toBeDisabled();
    fireEvent.click(revoke);
    expect(revokeArtifactPublishLink).toHaveBeenCalledTimes(1);

    rejectRevoke(new Error("network unavailable"));
    expect(
      await screen.findByText("Could not revoke. Reload and try again."),
    ).toBeInTheDocument();
    expect(revoke).toBeEnabled();
  });
});
