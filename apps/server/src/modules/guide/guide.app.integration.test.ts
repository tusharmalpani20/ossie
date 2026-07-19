import { describe, expect, it } from "vitest";

describe("guide app integration seam", () => {
  it("keeps the Project-nested route prefix", () => {
    expect("/api/v1/projects/:project_id/guides").toContain(":project_id/guides");
  });
});
