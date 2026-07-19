import { describe, expect, it } from "vitest";
import { render_guide_html_export } from "@repo/guide-domain";
import type { GuideDetail } from "./guide.service";

describe("Guide HTML export", () => {
  it("renders relational block title/body content", () => {
    const detail = {
      artifact: { id: "guide_1", organization_id: "org_1", project_id: "project_1", created_by_id: "member_1", created_at: "2026-01-01T00:00:00.000Z" },
      edition: { id: "edition_1", organization_id: "org_1", project_id: "project_1", guide_id: "guide_1", project_version_id: "version_1", source_capture_session_id: null, title: "Guide", description: null, status: "draft", created_by_id: "member_1", updated_by_id: "member_1", version: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
      working_draft: { id: "draft_1", organization_id: "org_1", project_id: "project_1", guide_edition_id: "edition_1", created_by_id: "member_1", updated_by_id: "member_1", version: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
      authored_updated_at: "2026-01-01T00:00:00.000Z",
      guide_blocks: [{ id: "block_1", organization_id: "org_1", project_id: "project_1", guide_working_draft_id: "draft_1", block_type: "header", title: "Heading", body: null, block_index: 1, created_by_id: "member_1", updated_by_id: "member_1", version: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", step: null }],
      source_capture_assets: [],
    } satisfies GuideDetail;
    expect(render_guide_html_export(detail).html).toContain("Heading");
  });
});
