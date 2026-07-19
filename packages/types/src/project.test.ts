import { describe, expect, it } from "vitest";
import {
  CreateProjectRequestSchema,
  ProjectListQuerySchema,
  ProjectResponseSchema,
  UpdateProjectRequestSchema,
} from "./project";

const project = {
  id: "project_1",
  organization_id: "org_1",
  name: "Launch Guide",
  description: null,
  slug: "launch-guide",
  color: null,
  icon: null,
  status: "active",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  access: {
    role: "project_admin",
    source: "organization_owner",
  },
};

describe("project contracts", () => {
  it("accepts the current project response shape", () => {
    expect(ProjectResponseSchema.parse({ project })).toEqual({ project });
  });

  it("preserves create and update passthrough request behavior", () => {
    expect(CreateProjectRequestSchema.parse({
      name: " Launch Guide ",
      description: null,
      metadata: {
        source: "test",
      },
      ignored_but_allowed: true,
    })).toEqual({
      name: "Launch Guide",
      description: null,
      metadata: {
        source: "test",
      },
      ignored_but_allowed: true,
    });

    expect(UpdateProjectRequestSchema.parse({
      status: "archived",
      ignored_but_allowed: true,
    })).toEqual({
      status: "archived",
      ignored_but_allowed: true,
    });
  });

  it("validates project status query values", () => {
    expect(ProjectListQuerySchema.safeParse({ status: "active" }).success).toBe(true);
    expect(ProjectListQuerySchema.safeParse({ purpose: "capture" }).success).toBe(true);
    expect(ProjectListQuerySchema.safeParse({ purpose: "admin" }).success).toBe(false);
    expect(ProjectListQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
  });
});
