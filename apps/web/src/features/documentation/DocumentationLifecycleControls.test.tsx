import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationLifecycleControls } from "./DocumentationLifecycleControls";

describe("DocumentationLifecycleControls", () => {
  it("requires consequence confirmation before archiving an Edition", async () => {
    const transition = vi.fn(async () => ({
      edition: {
        id: "edition",
        status: "archived" as const,
        effective_status: "archived" as const,
        read_only_reason: "This resource is archived.",
        version: 3,
      },
    }));
    render(
      <DocumentationLifecycleControls
        projectId="project"
        versionSlug="main"
        siteId="site"
        title="Product docs"
        status="active"
        effectiveStatus="active"
        readOnlyReason={null}
        editionVersion={2}
        canManage
        transition={transition}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Archive Edition" }));
    expect(
      screen.getByText(/Existing Publications remain available/u),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/understand archiving/u));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Archive" }));
    await waitFor(() =>
      expect(transition).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        2,
        "archive",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("archived");
  });

  it("shows inherited state without exposing mutation to a Viewer", () => {
    render(
      <DocumentationLifecycleControls
        projectId="project"
        versionSlug="main"
        siteId="site"
        title="Product docs"
        status="active"
        effectiveStatus="read_only"
        readOnlyReason="This Project Version is archived."
        editionVersion={2}
        canManage={false}
      />,
    );
    expect(screen.getByText("This Project Version is archived.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
