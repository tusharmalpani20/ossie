import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptureAsset } from "@repo/types/capture";
import { CaptureAssetLifecycleControls } from "./CaptureAssetLifecycleControls";

const api = vi.hoisted(() => ({
  changeCaptureAssetLifecycle: vi.fn(),
  getCaptureAssetProtection: vi.fn(),
  purgeCaptureAsset: vi.fn(),
}));

vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  ...api,
}));

const archivedAsset = {
  id: "asset_1",
  status: "archived",
  version: 2,
} as CaptureAsset;

beforeEach(() => {
  vi.clearAllMocks();
  api.getCaptureAssetProtection.mockResolvedValue({
    capture_asset_id: "asset_1",
    status: "archived",
    purge_operation_status: null,
    can_purge: false,
    total_dependency_count: 1,
    dependencies: [
      {
        dependency_type: "guide_revision",
        artifact_id: "guide_1",
        edition_id: "edition_1",
        revision_number: 3,
      },
    ],
  });
});

describe("CaptureAssetLifecycleControls", () => {
  it("reviews protected references before enabling destructive purge", async () => {
    render(
      <CaptureAssetLifecycleControls
        asset={archivedAsset}
        projectId="project_1"
        captureSessionId="capture_1"
        canWrite
        canPurge
        onChanged={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Review purge" }));
    expect(await screen.findByText("Guide Revision 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm permanent purge" }),
    ).toBeDisabled();
    await waitFor(() => expect(api.purgeCaptureAsset).not.toHaveBeenCalled());
  });
});
