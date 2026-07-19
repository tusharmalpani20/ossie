import { describe, expect, it, vi } from "vitest";
import { with_project_authorization } from "./project-service-authorization";

describe("project service authorization wrapper", () => {
  it("authorizes the named capability before invoking a service method", async () => {
    const authorize = vi.fn().mockResolvedValue({ role: "editor" });
    const operation = vi.fn().mockResolvedValue("result");
    const wrapped = with_project_authorization({ operation }, { authorize }, { operation: "artifact.write" });
    const input = { auth: { organization_id: "org-1", actor_org_user_id: "member-1" }, project_id: "project-1" };
    await expect(wrapped.operation(input)).resolves.toBe("result");
    expect(authorize).toHaveBeenCalledWith({ ...input, capability: "artifact.write" });
    expect(operation).toHaveBeenCalledAfter(authorize);
  });
});
