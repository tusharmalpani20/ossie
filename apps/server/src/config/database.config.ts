import pg from "pg";
import pgPromise from "pg-promise";

type DatabaseEnv = Record<string, string | undefined>;

export const get_runtime_database_config = (env: DatabaseEnv = process.env) => ({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT),
  max: Number(env.DB_MAX_POOL),
});

export const pool = new pg.Pool(get_runtime_database_config());

export const pgp = pgPromise();
export const pgpPool = pgp(get_runtime_database_config());
