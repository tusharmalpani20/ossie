import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectVersion } from "@repo/types/project-version";
import { ApiClientError } from "../../lib/api";
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

const version = (
  id: string,
  name: string,
  status: "active" | "archived" = "active",
): ProjectVersion =>
  ({ id, name, slug: name.toLowerCase(), status }) as ProjectVersion;

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
        target={version("version_2", "Next")}
        versions={[version("version_1", "Main"), version("version_2", "Next")]}
        canWrite
      />,
    );

    fireEvent.change(screen.getByLabelText("Source Project Version"), {
      target: { value: "version_1" },
    });
    fireEvent.click(
      await screen.findByRole("checkbox", { name: /Account setup/i }),
    );
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
    expect(api.carryForwardArtifactEditions.mock.calls[0]?.[1]).toMatchObject({
      source_project_version_id: "version_1",
      target_project_version_id: "version_2",
    });
  });

  it("separates archived sources and links successful target Editions", async () => {
    api.carryForwardArtifactEditions.mockResolvedValueOnce({
      items: [
        {
          artifact_type: "guide",
          artifact_id: "guide_1",
          target_edition_id: "edition_2",
        },
      ],
      replayed: false,
    });
    render(
      <ProjectCarryForwardPage
        projectId="project_1"
        target={version("version_2", "Next")}
        versions={[
          version("version_1", "Main"),
          version("version_2", "Next"),
          version("version_3", "Legacy", "archived"),
        ]}
        canWrite
      />,
    );

    expect(
      screen.getByRole("group", { name: "Archived sources" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Source Project Version"), {
      target: { value: "version_3" },
    });
    fireEvent.click(
      await screen.findByRole("checkbox", { name: /Account setup/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Carry forward selected" }),
    );

    expect(
      await screen.findByRole("link", { name: /Open Account setup/i }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/next/guides/guide_1",
    );
  });

  it("lists every target conflict blocker", async () => {
    api.carryForwardArtifactEditions.mockRejectedValueOnce(
      new ApiClientError({
        kind: "unknown",
        status: 409,
        type: "carry_forward_target_conflict",
        message: "Target Editions already exist",
        details: {
          blockers: [
            { artifact_type: "guide", artifact_id: "guide_1" },
            {
              artifact_type: "interactive_demo",
              artifact_id: "demo_1",
            },
          ],
        },
      }),
    );
    render(
      <ProjectCarryForwardPage
        projectId="project_1"
        target={version("version_2", "Next")}
        versions={[version("version_1", "Main"), version("version_2", "Next")]}
        canWrite
      />,
    );
    fireEvent.change(screen.getByLabelText("Source Project Version"), {
      target: { value: "version_1" },
    });
    fireEvent.click(
      await screen.findByRole("checkbox", { name: /Account setup/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Carry forward selected" }),
    );

    expect(await screen.findByText("Guide guide_1")).toBeInTheDocument();
    expect(screen.getByText("Interactive Demo demo_1")).toBeInTheDocument();
  });
});
