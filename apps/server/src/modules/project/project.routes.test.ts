import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  EmptyProjectUpdateError,
  ProjectNameConflictError,
  ProjectNotFoundError,
  ProjectSlugConflictError,
  type Project,
} from "./project.service";
import { build_project_routes } from "./project.routes";

const auth_context = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
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

const build_test_app = async (
  overrides: {
    auth_service?: Partial<Parameters<typeof build_project_routes>[0]["auth_service"]>;
    project_service?: Partial<Parameters<typeof build_project_routes>[0]["project_service"]>;
  } = {}
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(build_project_routes({
    auth_service: {
      get_current_auth_context: async () => auth_context,
      ...overrides.auth_service,
    },
    project_service: {
      create_project: async () => project,
      list_projects: async () => [project],
      get_project: async () => project,
      update_project: async () => ({
        ...project,
        name: "Updated Demo",
        version: 2,
        updated_by_id: "org_user_1",
        updated_at: "2026-06-05T00:00:01.000Z",
      }),
      delete_project: async () => undefined,
      ...overrides.project_service,
    },
  }), { prefix: "/api/v1/projects" });
  return app;
};

describe("project routes", () => {
  it("rejects requests without a valid auth session", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });
    expect(delete_response.statusCode).toBe(401);
    expect(delete_response.json()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });

    await app.close();
  });

  it("creates a project with auth context derived organization and actor", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      project_service: {
        create_project: async (input) => {
          seen_inputs.push(input);
          return project;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "Onboarding Demo",
        description: "Internal onboarding demo flow",
        status: "archived",
        organization_id: "attacker_org",
        created_by_id: "attacker_org_user",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      mutation: {
        actor_label: "Owner User",
        request_id: expect.any(String),
      },
      data: {
        name: "Onboarding Demo",
        description: "Internal onboarding demo flow",
      },
    }]);
    expect(response.json()).toEqual({ project });
    expect(JSON.stringify(response.json())).not.toContain("is_deleted");

    await app.close();
  });

  it("lists gets and updates projects through the project service", async () => {
    const app = await build_test_app();

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects?status=archived",
      cookies: {
        ossie_session: "session-token",
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1",
      cookies: {
        ossie_session: "session-token",
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "Updated Demo",
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json()).toEqual({ projects: [project] });
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json()).toEqual({ project });
    expect(update_response.statusCode).toBe(200);
    expect(update_response.json().project).toMatchObject({
      name: "Updated Demo",
      version: 2,
    });

    await app.close();
  });

  it("lists projects with a bearer session token", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("extension-session-token");
          return auth_context;
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
      headers: {
        authorization: "Bearer extension-session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ projects: [project] });

    await app.close();
  });

  it("soft deletes a project with auth context derived organization and actor", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      project_service: {
        delete_project: async (input) => {
          seen_inputs.push(input);
        },
      },
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(seen_inputs).toEqual([{
      auth: {
        organization_id: "organization_1",
        actor_org_user_id: "org_user_1",
      },
      project_id: "project_1",
    }]);

    await app.close();
  });

  it("maps project domain errors to stable responses", async () => {
    const name_conflict_app = await build_test_app({
      project_service: {
        create_project: async () => {
          throw new ProjectNameConflictError();
        },
      },
    });
    const slug_conflict_app = await build_test_app({
      project_service: {
        create_project: async () => {
          throw new ProjectSlugConflictError();
        },
      },
    });
    const not_found_app = await build_test_app({
      project_service: {
        get_project: async () => {
          throw new ProjectNotFoundError();
        },
      },
    });
    const empty_update_app = await build_test_app({
      project_service: {
        update_project: async () => {
          throw new EmptyProjectUpdateError();
        },
      },
    });
    const delete_not_found_app = await build_test_app({
      project_service: {
        delete_project: async () => {
          throw new ProjectNotFoundError();
        },
      },
    });

    const name_conflict_response = await name_conflict_app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: "session-token" },
      payload: { name: "Onboarding Demo" },
    });
    const slug_conflict_response = await slug_conflict_app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: "session-token" },
      payload: { name: "Onboarding Demo" },
    });
    const not_found_response = await not_found_app.inject({
      method: "GET",
      url: "/api/v1/projects/missing",
      cookies: { ossie_session: "session-token" },
    });
    const empty_update_response = await empty_update_app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1",
      cookies: { ossie_session: "session-token" },
      payload: {},
    });
    const delete_not_found_response = await delete_not_found_app.inject({
      method: "DELETE",
      url: "/api/v1/projects/missing",
      cookies: { ossie_session: "session-token" },
    });

    expect(name_conflict_response.statusCode).toBe(409);
    expect(name_conflict_response.json().error.type).toBe("project_name_conflict");
    expect(slug_conflict_response.statusCode).toBe(409);
    expect(slug_conflict_response.json().error.type).toBe("project_slug_conflict");
    expect(not_found_response.statusCode).toBe(404);
    expect(not_found_response.json().error.type).toBe("project_not_found");
    expect(empty_update_response.statusCode).toBe(400);
    expect(empty_update_response.json().error.type).toBe("empty_project_update");
    expect(delete_not_found_response.statusCode).toBe(404);
    expect(delete_not_found_response.json()).toEqual({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    });

    await name_conflict_app.close();
    await slug_conflict_app.close();
    await not_found_app.close();
    await empty_update_app.close();
    await delete_not_found_app.close();
  });

  it("rejects blank project names", async () => {
    const app = await build_test_app();

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "   ",
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "   ",
      },
    });

    expect(create_response.statusCode).toBe(400);
    expect(update_response.statusCode).toBe(400);

    await app.close();
  });
});
