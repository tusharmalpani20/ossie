export type DocumentationWorkClass = "publication" | "rebuild";

type AdmissionResult =
  | {
      acquired: true;
      release: () => void;
    }
  | {
      acquired: false;
      reason: "total_capacity" | "class_capacity";
    };

export const build_documentation_work_admission = (limits: {
  total: number;
  publication: number;
  rebuild: number;
}) => {
  let total_active = 0;
  const active: Record<DocumentationWorkClass, number> = {
    publication: 0,
    rebuild: 0,
  };

  const try_acquire = (work_class: DocumentationWorkClass): AdmissionResult => {
    if (total_active >= limits.total) {
      return { acquired: false, reason: "total_capacity" };
    }
    if (active[work_class] >= limits[work_class]) {
      return { acquired: false, reason: "class_capacity" };
    }
    total_active += 1;
    active[work_class] += 1;
    let released = false;
    return {
      acquired: true,
      release: () => {
        if (released) return;
        released = true;
        total_active -= 1;
        active[work_class] -= 1;
      },
    };
  };

  return {
    try_acquire,
    snapshot: () => ({
      total_active,
      publication_active: active.publication,
      rebuild_active: active.rebuild,
    }),
  };
};

export type DocumentationWorkAdmission = ReturnType<
  typeof build_documentation_work_admission
>;
