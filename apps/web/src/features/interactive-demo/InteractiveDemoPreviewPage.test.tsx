import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InteractiveDemoPreviewPage } from "./InteractiveDemoPreviewPage";

const now = "2026-07-29T00:00:00.000Z";
const detail = {
  artifact: {
    id: "demo_1",
    organization_id: "org_1",
    project_id: "project_1",
    created_by_id: "user_1",
    created_at: now,
  },
  edition: {
    id: "edition_1",
    organization_id: "org_1",
    project_id: "project_1",
    interactive_demo_id: "demo_1",
    project_version_id: "version_1",
    source_capture_session_id: null,
    title: "Draft demo",
    description: null,
    status: "draft" as const,
    created_by_id: "user_1",
    updated_by_id: "user_1",
    version: 1,
    created_at: now,
    updated_at: now,
  },
  working_draft: {
    id: "draft_1",
    organization_id: "org_1",
    project_id: "project_1",
    interactive_demo_edition_id: "edition_1",
    created_by_id: "user_1",
    updated_by_id: "user_1",
    version: 1,
    created_at: now,
    updated_at: now,
  },
  authored_updated_at: now,
};

describe("InteractiveDemoPreviewPage", () => {
  it("labels mutable content as a Working Draft preview", async () => {
    render(
      <InteractiveDemoPreviewPage
        projectId="project_1"
        projectVersionId="version_1"
        interactiveDemoId="demo_1"
        loadDemo={async () => detail}
        loadScenes={async () => ({
          demo_scenes: [],
          working_draft: detail.working_draft,
          background_capture_assets: [],
        })}
        loadHotspots={async () => ({
          demo_hotspots: [],
          working_draft: detail.working_draft,
        })}
      />,
    );
    expect(await screen.findByText("Working Draft preview")).toBeVisible();
    expect(screen.queryByText("Published interactive demo")).toBeNull();
  });
});
