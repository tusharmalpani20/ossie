import { createHash } from "node:crypto";

export type DocumentationTryItCspConfig = {
  origins: string[];
  digest: string;
};

const normalizeOrigin = (candidate: string): string => {
  if (candidate.includes("*")) throw new Error("Wildcards are not allowed");
  const url = new URL(candidate);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Try-It connect origins must be exact HTTPS origins");
  return url.origin;
};

export const parseDocumentationTryItConnectOrigins = (
  rawValue: string | undefined,
): DocumentationTryItCspConfig => {
  const origins = [
    ...new Set(
      (rawValue ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeOrigin),
    ),
  ].sort();
  return {
    origins,
    digest: createHash("sha256").update(origins.join("\n")).digest("hex"),
  };
};

export const buildDocumentationConnectSrc = (origins: readonly string[]) =>
  `connect-src 'self'${origins.length ? ` ${origins.join(" ")}` : ""}`;
