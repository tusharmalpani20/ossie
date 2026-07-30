type Repository = {
  expire_import_inspections: (input: {
    now: Date;
    limit: number;
    command: "documentation.import.expire";
  }) => Promise<Array<{ storage_key: string }>>;
};

type Storage = {
  list_documentation_transients: (input: {
    older_than: Date;
    limit: number;
  }) => Promise<Array<{ storage_key: string; modified_at: Date }>>;
  purge_exact: (input: { storage_key: string }) => Promise<void>;
};

export const build_documentation_import_cleanup = (dependencies: {
  repository: Repository;
  storage: Storage;
}) => ({
  async run_once(now = new Date(), limit = 100) {
    const terminal = await dependencies.repository.expire_import_inspections({
      now,
      limit,
      command: "documentation.import.expire",
    });
    for (const file of terminal)
      await dependencies.storage.purge_exact(file).catch(() => undefined);
    const orphans = await dependencies.storage.list_documentation_transients({
      older_than: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      limit: Math.max(0, limit - terminal.length),
    });
    for (const file of orphans)
      await dependencies.storage.purge_exact(file).catch(() => undefined);
    return {
      expired: terminal.length,
      purged_orphans: orphans.length,
    };
  },
});
