import { describe, expect, it } from "vitest";
import {
  DocumentationPublishLinkSchema,
  PublishLinkSchema,
} from "./publish";

describe("publish resource families", () => {
  it("keeps legacy Artifact links valid", () => {
    expect(
      PublishLinkSchema.safeParse({
        id: "link",
        artifact_type: "guide",
        artifact_id: "artifact",
        name: "Guide",
        slug: "slug",
        visibility: "public",
        status: "active",
        expires_at: null,
        password_protected: false,
        version: 1,
        entries: [],
        public_url: "/g/slug",
        default_public_url: "/g/slug",
        created_at: "2026-07-30T00:00:00.000Z",
        updated_at: "2026-07-30T00:00:00.000Z",
        revoked_at: null,
      }).success,
    ).toBe(true);
  });

  it("forbids Artifact fields on Documentation links", () => {
    const base = {
      id: "link",
      resource_family: "documentation_site",
      documentation_site_id: "site",
      name: "Docs",
      slug: "docs",
      visibility: "public",
      status: "active",
      expires_at: null,
      password_protected: false,
      version: 1,
      entries: [],
      public_url: "/docs/docs",
      default_public_url: "/docs/docs",
      created_at: "2026-07-30T00:00:00.000Z",
      updated_at: "2026-07-30T00:00:00.000Z",
      revoked_at: null,
    };
    expect(DocumentationPublishLinkSchema.safeParse(base).success).toBe(true);
    expect(
      DocumentationPublishLinkSchema.safeParse({
        ...base,
        artifact_type: "guide",
      }).success,
    ).toBe(false);
  });
});
