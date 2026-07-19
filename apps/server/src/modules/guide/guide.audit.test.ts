import { describe, expect, it } from "vitest";
import { build_guide_snapshot_changes } from "./guide.audit";

describe("guide audit projection", () => {
  it("emits no changes for two absent snapshots", () => {
    expect(build_guide_snapshot_changes(null, null)).toEqual([]);
  });
});
