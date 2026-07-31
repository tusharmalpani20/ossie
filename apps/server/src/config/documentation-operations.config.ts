import {
  DOCUMENTATION_HEAVY_WORK_CONCURRENCY_DEFAULT,
  DOCUMENTATION_HEAVY_WORK_CONCURRENCY_MAX,
  DOCUMENTATION_HEAVY_WORK_CONCURRENCY_MIN,
  DOCUMENTATION_INITIAL_HTML_MAX_BYTES_DEFAULT,
  DOCUMENTATION_INITIAL_HTML_MAX_BYTES_MAX,
  DOCUMENTATION_INITIAL_HTML_MAX_BYTES_MIN,
  DOCUMENTATION_PUBLICATION_CONCURRENCY_DEFAULT,
  DOCUMENTATION_PUBLICATION_CONCURRENCY_MAX,
  DOCUMENTATION_PUBLICATION_CONCURRENCY_MIN,
  DOCUMENTATION_PUBLICATION_TIMEOUT_DEFAULT_MS,
  DOCUMENTATION_PUBLICATION_TIMEOUT_MAX_MS,
  DOCUMENTATION_PUBLICATION_TIMEOUT_MIN_MS,
  DOCUMENTATION_REBUILD_BATCH_SIZE_DEFAULT,
  DOCUMENTATION_REBUILD_BATCH_SIZE_MAX,
  DOCUMENTATION_REBUILD_BATCH_SIZE_MIN,
  DOCUMENTATION_REBUILD_CONCURRENCY_DEFAULT,
  DOCUMENTATION_REBUILD_CONCURRENCY_MAX,
  DOCUMENTATION_REBUILD_CONCURRENCY_MIN,
  DOCUMENTATION_TRY_IT_DNS_TIMEOUT_DEFAULT_MS,
  DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MAX_MS,
  DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MIN_MS,
} from "@repo/constants";

const parse_bounded_integer = (
  environment: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
) => {
  const raw_value = environment[name];
  if (raw_value === undefined || raw_value === "") return fallback;
  const value = Number(raw_value);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
};

export const get_documentation_operations_config = (
  environment: NodeJS.ProcessEnv = process.env,
) => {
  const heavy_work_concurrency = parse_bounded_integer(
    environment,
    "OSSIE_DOCUMENTATION_HEAVY_WORK_CONCURRENCY",
    DOCUMENTATION_HEAVY_WORK_CONCURRENCY_DEFAULT,
    DOCUMENTATION_HEAVY_WORK_CONCURRENCY_MIN,
    DOCUMENTATION_HEAVY_WORK_CONCURRENCY_MAX,
  );
  const publication_concurrency = parse_bounded_integer(
    environment,
    "OSSIE_DOCUMENTATION_PUBLICATION_CONCURRENCY",
    DOCUMENTATION_PUBLICATION_CONCURRENCY_DEFAULT,
    DOCUMENTATION_PUBLICATION_CONCURRENCY_MIN,
    DOCUMENTATION_PUBLICATION_CONCURRENCY_MAX,
  );
  const rebuild_concurrency = parse_bounded_integer(
    environment,
    "OSSIE_DOCUMENTATION_REBUILD_CONCURRENCY",
    DOCUMENTATION_REBUILD_CONCURRENCY_DEFAULT,
    DOCUMENTATION_REBUILD_CONCURRENCY_MIN,
    DOCUMENTATION_REBUILD_CONCURRENCY_MAX,
  );
  if (
    publication_concurrency > heavy_work_concurrency ||
    rebuild_concurrency > heavy_work_concurrency
  ) {
    throw new Error(
      "Documentation per-class concurrency cannot exceed total heavy-work concurrency",
    );
  }
  return Object.freeze({
    heavy_work_concurrency,
    publication_concurrency,
    rebuild_concurrency,
    publication_timeout_ms: parse_bounded_integer(
      environment,
      "OSSIE_DOCUMENTATION_PUBLICATION_TIMEOUT_MS",
      DOCUMENTATION_PUBLICATION_TIMEOUT_DEFAULT_MS,
      DOCUMENTATION_PUBLICATION_TIMEOUT_MIN_MS,
      DOCUMENTATION_PUBLICATION_TIMEOUT_MAX_MS,
    ),
    rebuild_batch_size: parse_bounded_integer(
      environment,
      "OSSIE_DOCUMENTATION_REBUILD_BATCH_SIZE",
      DOCUMENTATION_REBUILD_BATCH_SIZE_DEFAULT,
      DOCUMENTATION_REBUILD_BATCH_SIZE_MIN,
      DOCUMENTATION_REBUILD_BATCH_SIZE_MAX,
    ),
    initial_html_max_bytes: parse_bounded_integer(
      environment,
      "OSSIE_DOCUMENTATION_INITIAL_HTML_MAX_BYTES",
      DOCUMENTATION_INITIAL_HTML_MAX_BYTES_DEFAULT,
      DOCUMENTATION_INITIAL_HTML_MAX_BYTES_MIN,
      DOCUMENTATION_INITIAL_HTML_MAX_BYTES_MAX,
    ),
    try_it_dns_timeout_ms: parse_bounded_integer(
      environment,
      "OSSIE_DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MS",
      DOCUMENTATION_TRY_IT_DNS_TIMEOUT_DEFAULT_MS,
      DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MIN_MS,
      DOCUMENTATION_TRY_IT_DNS_TIMEOUT_MAX_MS,
    ),
  });
};

export type DocumentationOperationsConfig = ReturnType<
  typeof get_documentation_operations_config
>;
