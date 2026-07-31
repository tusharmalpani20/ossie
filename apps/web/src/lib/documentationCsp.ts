import { createHash } from "node:crypto";
import { parse_documentation_connect_origins } from "@repo/documentation-domain/policies/documentation-csp-policy";

export type DocumentationTryItCspConfig = {
  origins: string[];
  digest: string;
};

export const parseDocumentationTryItConnectOrigins = (
  rawValue: string | undefined,
): DocumentationTryItCspConfig => {
  const origins = parse_documentation_connect_origins(rawValue);
  return {
    origins,
    digest: createHash("sha256").update(origins.join("\n")).digest("hex"),
  };
};

export const buildDocumentationConnectSrc = (origins: readonly string[]) =>
  `connect-src 'self'${origins.length ? ` ${origins.join(" ")}` : ""}`;
