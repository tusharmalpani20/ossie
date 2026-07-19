import type { ProjectCapability } from "./project-access.policy";

type ProjectOperationInput = {
  auth: { organization_id: string; actor_org_user_id: string };
  project_id: string;
};
type Service = Record<string, unknown>;

export const with_project_authorization = <T extends Service>(
  service: T,
  access: { authorize(input: ProjectOperationInput & { capability: ProjectCapability }): Promise<unknown> },
  capabilities: Partial<Record<keyof T, ProjectCapability>>,
): T => new Proxy(service, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    const capability = capabilities[property as keyof T];
    if (!capability || typeof value !== "function") return value;
    return async (input: ProjectOperationInput, ...rest: unknown[]) => {
      await access.authorize({ auth: input.auth, project_id: input.project_id, capability });
      return (value as (input: ProjectOperationInput, ...rest: unknown[]) => unknown)
        .call(target, input, ...rest);
    };
  },
});
