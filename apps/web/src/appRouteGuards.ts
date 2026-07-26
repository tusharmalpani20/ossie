/**
 * @fileoverview Small app-level route guards for dev-only surfaces.
 */

import type { PortalRoute } from "./lib/routes";

/** Returns true when the synthetic design review surface may render. */
export const shouldRenderDesignSystemReview = (
  route: PortalRoute,
  isDev: boolean,
) => route.type === "design_system_review" && isDev;
