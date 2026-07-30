type AdmissionOptions = {
  parsers_per_process_max: number;
  parsers_per_actor_max: number;
  attempts_per_window_max: number;
  attempt_window_ms: number;
};

const admission_error = (
  code: "documentation_import_busy",
  retryAfterSeconds: number,
) =>
  Object.assign(new Error("Documentation import is temporarily unavailable"), {
    code,
    retry_after_seconds: Math.max(1, retryAfterSeconds),
  });

export const build_documentation_import_admission = (
  options: AdmissionOptions,
) => {
  let active = 0;
  const activeByActor = new Map<string, number>();
  const attemptsByActor = new Map<string, number[]>();

  return {
    acquire(input: { actor_key: string; now_ms?: number }) {
      const now = input.now_ms ?? Date.now();
      const cutoff = now - options.attempt_window_ms;
      const attempts = (attemptsByActor.get(input.actor_key) ?? []).filter(
        (attempt) => attempt > cutoff,
      );
      if (attempts.length >= options.attempts_per_window_max) {
        attemptsByActor.set(input.actor_key, attempts);
        throw admission_error(
          "documentation_import_busy",
          Math.ceil(
            (attempts[0]! + options.attempt_window_ms - now) / 1_000,
          ),
        );
      }
      attempts.push(now);
      attemptsByActor.set(input.actor_key, attempts);

      if (
        active >= options.parsers_per_process_max ||
        (activeByActor.get(input.actor_key) ?? 0) >=
          options.parsers_per_actor_max
      )
        throw admission_error("documentation_import_busy", 1);

      active += 1;
      activeByActor.set(
        input.actor_key,
        (activeByActor.get(input.actor_key) ?? 0) + 1,
      );
      let released = false;
      return {
        release() {
          if (released) return;
          released = true;
          active -= 1;
          const actorActive = (activeByActor.get(input.actor_key) ?? 1) - 1;
          if (actorActive === 0) activeByActor.delete(input.actor_key);
          else activeByActor.set(input.actor_key, actorActive);
        },
      };
    },
  };
};
