import { describe, expect, it } from "vitest";
import { build_documentation_work_admission } from "./documentation-work-admission";

describe("Documentation work admission", () => {
  it("refuses without waiting when total or class capacity is full", () => {
    const admission = build_documentation_work_admission({
      total: 2,
      publication: 1,
      rebuild: 1,
    });
    const publication = admission.try_acquire("publication");
    const rebuild = admission.try_acquire("rebuild");

    expect(publication.acquired).toBe(true);
    expect(rebuild.acquired).toBe(true);
    expect(admission.try_acquire("publication")).toEqual({
      acquired: false,
      reason: "total_capacity",
    });

    if (publication.acquired) publication.release();
    expect(admission.try_acquire("publication").acquired).toBe(true);
    if (rebuild.acquired) rebuild.release();
  });

  it("releases a slot exactly once on every exit path", () => {
    const admission = build_documentation_work_admission({
      total: 1,
      publication: 1,
      rebuild: 1,
    });
    const slot = admission.try_acquire("publication");
    expect(slot.acquired).toBe(true);
    if (!slot.acquired) return;

    slot.release();
    slot.release();
    expect(admission.snapshot()).toEqual({
      total_active: 0,
      publication_active: 0,
      rebuild_active: 0,
    });
  });
});
