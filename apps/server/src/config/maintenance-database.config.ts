import pg from "pg";

type DatabaseEnv = Record<string, string | undefined>;

export const get_maintenance_database_config = (
  env: DatabaseEnv = process.env,
) => {
  if (!env.DB_MAINTENANCE_USER || !env.DB_MAINTENANCE_PASSWORD) {
    throw new Error("Maintenance database configuration must be defined");
  }
  return {
    user: env.DB_MAINTENANCE_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_MAINTENANCE_PASSWORD,
    port: Number(env.DB_PORT),
    max: Number(env.DB_MAX_POOL),
  };
};

export const create_maintenance_pool = (env: DatabaseEnv = process.env) =>
  new pg.Pool(get_maintenance_database_config(env));

export const get_maintenance_admin_config = (
  env: DatabaseEnv = process.env,
) => ({
  ...get_maintenance_database_config(env),
  database: "postgres",
});
