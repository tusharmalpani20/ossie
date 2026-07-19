import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InteractiveDemoDetailResponse } from "@repo/types/demo";
import { InteractiveDemoEditorPage } from "./InteractiveDemoEditorPage";

const now = "2026-07-19T10:00:00.000Z";
const detail: InteractiveDemoDetailResponse = {
  artifact: { id: "demo_1", organization_id: "org_1", project_id: "project_1", created_by_id: "user_1", created_at: now },
  edition: { id: "edition_1", organization_id: "org_1", project_id: "project_1", interactive_demo_id: "demo_1", project_version_id: "version_1", source_capture_session_id: null, title: "Relational demo", description: "Edition metadata", status: "draft", created_by_id: "user_1", updated_by_id: "user_1", version: 3, created_at: now, updated_at: now },
  working_draft: { id: "draft_1", organization_id: "org_1", project_id: "project_1", interactive_demo_edition_id: "edition_1", created_by_id: "user_1", updated_by_id: "user_1", version: 8, created_at: now, updated_at: now },
  authored_updated_at: now,
};

describe("InteractiveDemoEditorPage", () => {
  it("loads relational Edition and Working Draft data", async () => {
    const loadDemo = vi.fn().mockResolvedValue(detail);
    render(<InteractiveDemoEditorPage projectId="project_1" projectVersionId="version_1" interactiveDemoId="demo_1" loadDemo={loadDemo} loadScenes={async () => ({ demo_scenes: [], working_draft: detail.working_draft })} loadPublishStatus={async () => ({ publish_link: null, published_artifact: null })} />);
    expect(await screen.findByRole("heading", { name: "Relational demo" })).toBeInTheDocument();
    expect(loadDemo).toHaveBeenCalledWith("project_1", "demo_1");
  });

  it("uses the Edition Row Version for metadata saves", async () => {
    const saveDemo = vi.fn().mockResolvedValue({ ...detail, edition: { ...detail.edition, version: 4 } });
    render(<InteractiveDemoEditorPage projectId="project_1" projectVersionId="version_1" interactiveDemoId="demo_1" loadDemo={async () => detail} loadScenes={async () => ({ demo_scenes: [], working_draft: detail.working_draft })} loadPublishStatus={async () => ({ publish_link: null, published_artifact: null })} saveDemo={saveDemo} />);
    await screen.findByRole("heading", { name: "Relational demo" });
    screen.getByRole("button", { name: "Save demo" }).click();
    expect(saveDemo).toHaveBeenCalledWith("project_1", "demo_1", expect.objectContaining({ expected_edition_version: 3 }));
  });

  it("defers a first publish outside the Default Project Version", async () => {
    render(<InteractiveDemoEditorPage projectId="project_1" projectVersionId="version_1" interactiveDemoId="demo_1" isDefaultVersion={false} loadDemo={async () => detail} loadScenes={async () => ({ demo_scenes: [], working_draft: detail.working_draft })} loadPublishStatus={async () => ({ publish_link: null, published_artifact: null })} />);
    expect(await screen.findByText(/Publishing from a named Project Version is deferred/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish demo" })).not.toBeInTheDocument();
  });

  it("archives with the current Edition Row Version", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const changeEditionStatus = vi.fn().mockResolvedValue({ edition: { ...detail.edition, status: "archived", version: 4 } });
    render(<InteractiveDemoEditorPage projectId="project_1" projectVersionId="version_1" interactiveDemoId="demo_1" loadDemo={async () => detail} loadScenes={async () => ({ demo_scenes: [], working_draft: detail.working_draft })} loadPublishStatus={async () => ({ publish_link: null, published_artifact: null })} changeEditionStatus={changeEditionStatus} />);
    (await screen.findByRole("button", { name: "Archive demo" })).click();
    expect(changeEditionStatus).toHaveBeenCalledWith("archive", "project_1", "demo_1", "version_1", 3);
    expect(await screen.findByRole("button", { name: "Restore demo" })).toBeInTheDocument();
  });
});
