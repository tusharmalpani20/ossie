import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationAssetLibrary } from "./DocumentationAssetLibrary";

describe("DocumentationAssetLibrary", () => {
  it("offers retry when Documentation Assets cannot load", async () => {
    const listAssets = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ assets: [] });
    render(
      <DocumentationAssetLibrary
        canWrite={false}
        listAssets={listAssets}
        projectId="project"
        siteId="site"
        versionSlug="main"
      />,
    );
    expect(await screen.findByRole("heading", { name: "Could not load Documentation Assets." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No Assets yet.")).toBeInTheDocument();
    expect(listAssets).toHaveBeenCalledTimes(2);
  });

  it("labels Capture source versions and keeps Viewer controls read-only", async () => {
    render(
      <DocumentationAssetLibrary
        canWrite={false}
        listAssets={async () => ({
          assets: [
            {
              source: { kind: "capture_asset", id: "capture" },
              name: "Dashboard",
              status: "active",
              version: 1,
              mime_type: "image/png",
              width: 1200,
              height: 800,
              source_project_version: {
                id: "version",
                name: "Version 2",
                slug: "v2",
              },
            },
          ],
        })}
        projectId="project"
        siteId="site"
        transitionAsset={vi.fn()}
        versionSlug="main"
      />,
    );
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Capture · Version 2/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
  });
});
