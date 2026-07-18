import { describe, expect, it } from "vitest";
import {
  build_project_service,
  EmptyProjectUpdateError,
  ProjectNotFoundError,
  type Project,
  type ProjectRepository,
} from "./project.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const mutation = {
  actor_label: "Owner User",
  request_id: "request-1",
};

const project: Project = {
  id: "project_1",
  organization_id: "organization_1",
  name: "Onboarding Demo",
  description: "Internal onboarding demo flow",
  slug: "onboarding-demo",
  color: "#2563eb",
  icon: "presentation",
  status: "active",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_repository = (): ProjectRepository & {
  creates: unknown[];
  lists: unknown[];
  finds: unknown[];
  updates: unknown[];
  deletes: unknown[];
} => {
  const creates: unknown[] = [];
  const lists: unknown[] = [];
  const finds: unknown[] = [];
  const updates: unknown[] = [];
  const deletes: unknown[] = [];

  return {
    creates,
    lists,
    finds,
    updates,
    deletes,
    async create_project(input) {
      creates.push(input);
      return project;
    },
    async list_projects(input) {
      lists.push(input);
      return [project];
    },
    async find_project(input) {
      finds.push(input);
      return input.project_id === "project_1" ? project : null;
    },
    async update_project(input) {
      updates.push(input);
      if (input.project_id !== "project_1") {
        return null;
      }

      return {
        ...project,
        ...input.data,
        updated_by_id: input.actor_org_user_id,
        version: 2,
        updated_at: "2026-06-05T00:00:01.000Z",
      };
    },
    async delete_project(input) {
      deletes.push(input);
      return input.project_id === "project_1";
    },
  };
};

describe("project service", () => {
  it("creates projects using the current organization and actor org user", async () => {
    const repository = build_repository();
    const service = build_project_service(repository);

    await service.create_project({
      auth,
      mutation,
      data: {
        name: " Onboarding Demo ",
        description: "",
        slug: " onboarding-demo ",
        color: "#2563eb",
        icon: "presentation",
      },
    });

    expect(repository.creates).toEqual([{
      organization_id: "organization_1",
      actor_org_user_id: "org_user_1",
      data: {
        name: "Onboarding Demo",
        description: null,
        slug: "onboarding-demo",
        color: "#2563eb",
        icon: "presentation",
        metadata: undefined,
      },
    }]);
  });

  it("delegates normalized Project creation to the audited writer when configured", async () => {
    const repository = build_repository();
    const writes: unknown[] = [];
    const service = build_project_service(repository, {
      create_project: async (input) => {
        writes.push(input);
        return project;
      },
    });
    await service.create_project({
      auth,
      mutation,
      data: { name: " Project ", metadata: { private: "metadata-value" } },
    });
    expect(repository.creates).toEqual([]);
    expect(writes).toEqual([{
      organization_id: "organization_1",
      actor_org_user_id: "org_user_1",
      actor_label: "Owner User",
      request_id: "request-1",
      metadata_was_present: true,
      data: {
        name: "Project",
        description: undefined,
        slug: undefined,
        color: undefined,
        icon: undefined,
        metadata: { private: "metadata-value" },
      },
    }]);
  });

  it("lists and finds projects scoped to the current organization", async () => {
    const repository = build_repository();
    const service = build_project_service(repository);

    await expect(service.list_projects({ auth })).resolves.toEqual([project]);
    await expect(service.list_projects({ auth, status: "archived" })).resolves.toEqual([project]);
    await expect(service.get_project({ auth, project_id: "project_1" })).resolves.toEqual(project);
    await expect(service.get_project({ auth, project_id: "missing" })).rejects.toBeInstanceOf(ProjectNotFoundError);

    expect(repository.lists).toEqual([
      {
        organization_id: "organization_1",
        status: "active",
      },
      {
        organization_id: "organization_1",
        status: "archived",
      },
    ]);
    expect(repository.finds).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
      },
      {
        organization_id: "organization_1",
        project_id: "missing",
      },
    ]);
  });

  it("updates projects using the current organization and actor org user", async () => {
    const repository = build_repository();
    const service = build_project_service(repository);

    await expect(service.update_project({
      auth,
      project_id: "project_1",
      data: {
        name: " Updated Demo ",
        description: "",
        status: "archived",
      },
    })).resolves.toMatchObject({
      name: "Updated Demo",
      description: null,
      status: "archived",
      updated_by_id: "org_user_1",
      version: 2,
    });
    await expect(service.update_project({
      auth,
      project_id: "project_1",
      data: {},
    })).rejects.toBeInstanceOf(EmptyProjectUpdateError);
    await expect(service.update_project({
      auth,
      project_id: "missing",
      data: {
        name: "Updated Demo",
      },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);

    expect(repository.updates).toEqual([
      {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
        project_id: "project_1",
        data: {
          name: "Updated Demo",
          description: null,
          status: "archived",
        },
      },
      {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
        project_id: "missing",
        data: {
          name: "Updated Demo",
        },
      },
    ]);
  });

  it("soft deletes projects using the current organization and actor org user", async () => {
    const repository = build_repository();
    const service = build_project_service(repository);

    await expect(service.delete_project({
      auth,
      project_id: "project_1",
    })).resolves.toBeUndefined();
    await expect(service.delete_project({
      auth,
      project_id: "missing",
    })).rejects.toBeInstanceOf(ProjectNotFoundError);

    expect(repository.deletes).toEqual([
      {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
        project_id: "project_1",
      },
      {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
        project_id: "missing",
      },
    ]);
  });
});
