import { describe, expect, it } from "vitest";
import {
  CreateProjectVersionRequestSchema,
  ProjectVersionDetailSchema,
  ProjectVersionListQuerySchema,
  ProjectVersionSchema,
  ReorderProjectVersionsRequestSchema,
  SetDefaultProjectVersionRequestSchema,
  UpdateProjectVersionRequestSchema,
} from "./project-version";

const project_version = {
  id: "project_version_1",
  organization_id: "org_1",
  project_id: "project_1",
  name: "2026 Q3",
  description: null,
  slug: "2026-q3",
  release_date: "2026-07-19",
  position: 2,
  status: "active",
  is_default: false,
  version: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
};

describe("project version contracts", () => {
  it("accepts strict version and detail responses", () => {
    expect(ProjectVersionSchema.parse(project_version)).toEqual(project_version);
    expect(ProjectVersionSchema.safeParse({ ...project_version, extra: true }).success).toBe(false);

    const detail = {
      ...project_version,
      aliases: [{
        id: "alias_1",
        project_version_id: project_version.id,
        slug: "2026-q3-beta",
        created_by_id: "org_user_1",
        created_at: "2026-07-19T00:00:00.000Z",
      }],
    };
    expect(ProjectVersionDetailSchema.parse(detail)).toEqual(detail);
  });

  it("normalizes strict create and update requests", () => {
    expect(CreateProjectVersionRequestSchema.parse({
      name: "  2026 Q3  ",
      description: "  Supported release  ",
      slug: "  2026-q3  ",
      release_date: "2026-07-19",
    })).toEqual({
      name: "2026 Q3",
      description: "Supported release",
      slug: "2026-q3",
      release_date: "2026-07-19",
    });
    expect(CreateProjectVersionRequestSchema.safeParse({ name: "Main", unknown: true }).success).toBe(false);
    expect(UpdateProjectVersionRequestSchema.safeParse({ expected_version: 1 }).success).toBe(false);
    expect(UpdateProjectVersionRequestSchema.safeParse({ expected_version: 1, name: "Next" }).success).toBe(true);
  });

  it("rejects invalid dates, slugs, status filters, and duplicate order ids", () => {
    expect(CreateProjectVersionRequestSchema.safeParse({ name: "Next", slug: "Next Release" }).success).toBe(false);
    expect(CreateProjectVersionRequestSchema.safeParse({ name: "Next", release_date: "2026-02-30" }).success).toBe(false);
    expect(ProjectVersionListQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
    expect(ReorderProjectVersionsRequestSchema.safeParse({
      project_versions: [
        { id: "project_version_1", expected_version: 1 },
        { id: "project_version_1", expected_version: 2 },
      ],
    }).success).toBe(false);
  });

  it("requires both target and Project Row Versions when changing Default", () => {
    expect(SetDefaultProjectVersionRequestSchema.parse({
      expected_version: 2,
      expected_project_row_version: 4,
    })).toEqual({ expected_version: 2, expected_project_row_version: 4 });
    expect(SetDefaultProjectVersionRequestSchema.safeParse({ expected_version: 2 }).success).toBe(false);
  });
});
