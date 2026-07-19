import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectVersion } from "@repo/types/project-version";
import { ProjectCarryForwardPage } from "./ProjectCarryForwardPage";

const api = vi.hoisted(() => ({
  listProjectGuides: vi.fn(),
  listProjectInteractiveDemos: vi.fn(),
  carryForwardArtifactEditions: vi.fn(),
}));

vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  ...api,
}));

const version = (id: string, name: string): ProjectVersion =>
  ({ id, name, slug: name.toLowerCase(), status: "active" }) as ProjectVersion;

beforeEach(() => {
  vi.clearAllMocks();
  api.listProjectGuides.mockResolvedValue({
    guide_editions: [
      {
        artifact: { id: "guide_1" },
        edition: { title: "Account setup" },
      },
    ],
  });
  api.listProjectInteractiveDemos.mockResolvedValue({
    interactive_demo_editions: [],
  });
});

describe("ProjectCarryForwardPage", () => {
  it("reuses its idempotency key when the same failed request is retried", async () => {
    api.carryForwardArtifactEditions
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: [{}], replayed: false });
    render(
      <ProjectCarryForwardPage
        projectId="project_1"
        source={version("version_1", "Main")}
        versions={[version("version_1", "Main"), version("version_2", "Next")]}
        canWrite
      />,
    );

    fireEvent.change(await screen.findByLabelText("Target Project Version"), {
      target: { value: "version_2" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Account setup/i }));
    fireEvent.click(
      screen.getByRole("button", { name: "Carry forward selected" }),
    );
    await screen.findByText(/could not be completed/i);
    fireEvent.click(
      screen.getByRole("button", { name: "Carry forward selected" }),
    );

    await waitFor(() =>
      expect(api.carryForwardArtifactEditions).toHaveBeenCalledTimes(2),
    );
    expect(api.carryForwardArtifactEditions.mock.calls[0]?.[2]).toBe(
      api.carryForwardArtifactEditions.mock.calls[1]?.[2],
    );
  });
});
