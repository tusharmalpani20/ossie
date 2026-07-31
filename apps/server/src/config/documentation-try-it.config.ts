import { createHash } from "node:crypto";
import { parse_documentation_connect_origins } from "@repo/documentation-domain";

export type DocumentationTryItOriginConfig = {
  origins: string[];
  origin_set: ReadonlySet<string>;
  digest: string;
};

export const parse_documentation_try_it_origins = (
  raw_value: string | undefined,
): DocumentationTryItOriginConfig => {
  const origins = parse_documentation_connect_origins(raw_value);
  const digest = createHash("sha256").update(origins.join("\n")).digest("hex");
  return { origins, origin_set: new Set(origins), digest };
};

export const get_documentation_try_it_origin_config = (
  environment: NodeJS.ProcessEnv = process.env,
) =>
  parse_documentation_try_it_origins(
    environment.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS,
  );
