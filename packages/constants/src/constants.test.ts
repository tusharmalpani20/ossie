import { describe, expect, it } from "vitest";
import {
  ACCESS_ACTOR_TYPES,
  ACCESS_AUTHORIZATION_TYPES,
  ACCESS_OUTCOMES,
  ACCESS_REASON_CODES,
  ACCESS_SOURCE_TYPES,
  ACCESS_SURFACES,
  CAPTURE_ASSET_TYPES,
  CAPTURE_EVENT_TYPES,
  CAPTURE_SESSION_SOURCE_TYPES,
  CAPTURE_SESSION_STATUSES,
  DEMO_HOTSPOT_TYPES,
  DEPLOYMENT_MODES,
  FILE_STORAGE_PROVIDERS,
  GUIDE_ANNOTATION_TYPES,
  GUIDE_BLOCK_PLACEMENTS,
  GUIDE_BLOCK_TYPES,
  GUIDE_CREATABLE_BLOCK_TYPES,
  GUIDE_STATUSES,
  INTERACTIVE_DEMO_STATUSES,
  ONBOARDING_MODES,
  ORGANIZATION_INVITE_STATUSES,
  ORGANIZATION_MEMBER_STATUSES,
  ORGANIZATION_ROLES,
  PROJECT_STATUSES,
  PUBLISH_ARTIFACT_TYPES,
  PUBLISH_LINK_STATUSES,
  PUBLISH_VISIBILITIES,
} from "./index";

const exported_constant_sets = {
  ACCESS_ACTOR_TYPES,
  ACCESS_AUTHORIZATION_TYPES,
  ACCESS_OUTCOMES,
  ACCESS_REASON_CODES,
  ACCESS_SOURCE_TYPES,
  ACCESS_SURFACES,
  CAPTURE_SESSION_STATUSES,
  CAPTURE_SESSION_SOURCE_TYPES,
  CAPTURE_EVENT_TYPES,
  CAPTURE_ASSET_TYPES,
  FILE_STORAGE_PROVIDERS,
  GUIDE_STATUSES,
  GUIDE_BLOCK_TYPES,
  GUIDE_CREATABLE_BLOCK_TYPES,
  GUIDE_BLOCK_PLACEMENTS,
  GUIDE_ANNOTATION_TYPES,
  INTERACTIVE_DEMO_STATUSES,
  DEMO_HOTSPOT_TYPES,
  PUBLISH_ARTIFACT_TYPES,
  PUBLISH_VISIBILITIES,
  PUBLISH_LINK_STATUSES,
  ORGANIZATION_ROLES,
  ORGANIZATION_INVITE_STATUSES,
  ORGANIZATION_MEMBER_STATUSES,
  PROJECT_STATUSES,
  DEPLOYMENT_MODES,
  ONBOARDING_MODES,
} as const;

describe("@repo/constants", () => {
  it("exports unique tuple values for every constants set", () => {
    for (const [name, values] of Object.entries(exported_constant_sets)) {
      expect(new Set(values), `${name} should not contain duplicate values`).toHaveLength(values.length);
    }
  });

  it("keeps guide creatable block types inside the full guide block type set", () => {
    for (const block_type of GUIDE_CREATABLE_BLOCK_TYPES) {
      expect(GUIDE_BLOCK_TYPES).toContain(block_type);
    }
  });

  it("keeps public instance mode defaults representable by exported constants", () => {
    expect(DEPLOYMENT_MODES).toContain("self_hosted");
    expect(DEPLOYMENT_MODES).toContain("hosted");
    expect(ONBOARDING_MODES).toContain("first_run_setup");
    expect(ONBOARDING_MODES).toContain("signup");
  });
});
