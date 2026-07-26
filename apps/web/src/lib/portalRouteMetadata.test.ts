/**
 * @fileoverview Portal route metadata tests.
 */

import { describe, expect, it } from "vitest";
import { portalRouteMetadata } from "./portalRouteMetadata";
import type { PortalRoute } from "./routes";

describe("portalRouteMetadata", () => {
  it("marks private portal routes as shell routes", () => {
    expect(portalRouteMetadata({ type: "project_list" }).usesPortalShell).toBe(
      true,
    );
    expect(
      portalRouteMetadata({
        type: "project_guide_list",
        projectId: "project_1",
        versionSlug: "main",
      }).section,
    ).toBe("guides");
  });

  it("keeps public and setup routes outside the portal shell", () => {
    const routes: PortalRoute[] = [
      { type: "login" },
      { type: "setup" },
      { type: "organization_invite_accept", token: "invite" },
      { type: "public_guide_reader", slug: "guide" },
      { type: "public_interactive_demo_embed", slug: "demo" },
      { type: "design_system_review" },
      { type: "unsupported" },
    ];

    expect(
      routes.map((route) => portalRouteMetadata(route).usesPortalShell),
    ).toEqual([false, false, false, false, false, false, false]);
  });
});
