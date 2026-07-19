import { describe,expect,it } from "vitest";
describe("publish app seam",()=>{it("keeps public routes unversioned",()=>expect("/api/v1/public/publish-links/:slug").not.toContain("project_version"))});
