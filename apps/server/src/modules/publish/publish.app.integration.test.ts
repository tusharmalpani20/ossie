import { describe, expect, it } from "vitest";
describe("publish app seam", () => {
  it("keeps public routes outside Project Version authorization while selecting an explicit manifest entry", () =>
    expect(
      "/api/v1/public/publish-links/:slug/versions/:version_slug",
    ).not.toContain("project_version_id"));
});
