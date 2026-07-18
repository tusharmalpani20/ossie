import type { AuditOperation, AuditValueStateName } from "../types/audit-evidence";

type ChildDiff = {
  entity_type: string;
  entity_id: string;
  parent_entity_type: string;
  parent_entity_id: string;
  operation: Extract<AuditOperation, "create" | "delete">;
  before_state: Extract<AuditValueStateName, "absent" | "present">;
  after_state: Extract<AuditValueStateName, "absent" | "present">;
};

export const build_child_diff = (input: {
  before_ids: readonly string[];
  after_ids: readonly string[];
  entity_type: string;
  parent_entity_type: string;
  parent_entity_id: string;
}): ChildDiff[] => {
  const before = new Set(input.before_ids);
  const after = new Set(input.after_ids);
  return [
    ...input.before_ids.filter((id) => !after.has(id)).map((entity_id) => ({
      entity_type: input.entity_type,
      entity_id,
      parent_entity_type: input.parent_entity_type,
      parent_entity_id: input.parent_entity_id,
      operation: "delete" as const,
      before_state: "present" as const,
      after_state: "absent" as const,
    })),
    ...input.after_ids.filter((id) => !before.has(id)).map((entity_id) => ({
      entity_type: input.entity_type,
      entity_id,
      parent_entity_type: input.parent_entity_type,
      parent_entity_id: input.parent_entity_id,
      operation: "create" as const,
      before_state: "absent" as const,
      after_state: "present" as const,
    })),
  ];
};
