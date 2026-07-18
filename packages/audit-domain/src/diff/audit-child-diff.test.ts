import { describe, expect, it } from "vitest";
import { build_child_diff } from "./audit-child-diff";

describe("audit child diff", () => {
  it("emits relational child creates and deletes with stable parent identity", () => {
    expect(build_child_diff({
      before_ids: ["child-a"],
      after_ids: ["child-b"],
      entity_type: "guide_block",
      parent_entity_type: "guide",
      parent_entity_id: "guide-1",
    })).toEqual([
      expect.objectContaining({ entity_id: "child-a", operation: "delete", before_state: "present", after_state: "absent" }),
      expect.objectContaining({ entity_id: "child-b", operation: "create", before_state: "absent", after_state: "present" }),
    ]);
  });
});
