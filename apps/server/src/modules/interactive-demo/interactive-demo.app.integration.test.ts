import { describe, expect, it } from "vitest";
describe("interactive demo app seam",()=>{it("keeps Project nesting",()=>expect("/projects/:project_id/interactive-demos").toContain(":project_id"))});
