import fastify from "fastify";
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { build_artifact_carry_forward_routes } from "./artifact-carry-forward.routes";

describe("Artifact Carry-Forward routes", () => {
  it("requires a valid idempotency key and forwards current actor scope", async () => {
    const carry_forward = vi.fn(async () => ({
      carry_forward: {},
      items: [],
      replayed: false,
    }));
    const app = fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(
      build_artifact_carry_forward_routes({
        auth_service: {
          get_current_auth_context: vi.fn(
            async () =>
              ({
                organization: { id: "org_1" },
                org_user: { id: "actor_1" },
              }) as never,
          ),
        },
        artifact_carry_forward_service: { carry_forward } as never,
      }),
      { prefix: "/api/v1/projects" },
    );
    const body = {
      source_project_version_id: "version_1",
      target_project_version_id: "version_2",
      artifacts: [{ artifact_type: "guide", artifact_id: "guide_1" }],
    };
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/projects/project_1/artifact-editions/carry-forward",
          payload: body,
        })
      ).statusCode,
    ).toBe(400);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/artifact-editions/carry-forward",
      headers: { "idempotency-key": "opaque-request-key-0001" },
      payload: body,
    });
    expect(response.statusCode).toBe(201);
    expect(carry_forward).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: { organization_id: "org_1", actor_org_user_id: "actor_1" },
        project_id: "project_1",
        idempotency_key: "opaque-request-key-0001",
      }),
    );
  });
});
