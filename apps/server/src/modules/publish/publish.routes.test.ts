import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { build_publish_routes, type PublishRouteDependencies } from "./publish.routes";
import cookie from "@fastify/cookie";

describe("authenticated publish compatibility routes", () => {
  it("requires and forwards Project Version scope", async () => {
    const get_guide_publish_status=vi.fn(async()=>({publish_link:null,published_artifact:null}));
    const app=Fastify();app.setValidatorCompiler(validatorCompiler);app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(build_publish_routes({auth_service:{get_current_auth_context:vi.fn(async()=>({organization:{id:"org_1"},org_user:{id:"member_1"}}))},publish_service:{get_guide_publish_status} as never} as unknown as PublishRouteDependencies),{prefix:"/api/v1"});
    expect((await app.inject({method:"GET",url:"/api/v1/projects/project_1/guides/guide_1/publish"})).statusCode).toBe(400);
    const response=await app.inject({method:"GET",url:"/api/v1/projects/project_1/guides/guide_1/publish?project_version_id=version_1"});
    expect(response.statusCode).toBe(200);expect(get_guide_publish_status).toHaveBeenCalledWith(expect.objectContaining({project_version_id:"version_1"}));await app.close();
  });
});
