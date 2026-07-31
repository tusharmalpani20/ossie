import { isIP } from "node:net";
import { promises as dns } from "node:dns";
import { normalize_documentation_try_it_target } from "@repo/documentation-domain";

export type DocumentationTryItDnsAnswer = {
  address: string;
  family: 4 | 6;
};

export class DocumentationTryItOriginError extends Error {
  readonly code:
    | "origin_not_allowed"
    | "origin_resolution_failed"
    | "origin_resolution_unsafe";

  constructor(code: DocumentationTryItOriginError["code"], message: string) {
    super(message);
    this.name = "DocumentationTryItOriginError";
    this.code = code;
  }
}

const ipv4_is_public = (address: string): boolean => {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255))
    return false;
  const [a = 0, b = 0, c = 0] = parts;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
};

const ipv6_is_public = (address: string): boolean => {
  const normalized = address.toLowerCase().replace(/^\[|\]$/gu, "");
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/u.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
};

const address_is_public = (answer: DocumentationTryItDnsAnswer) => {
  const family = isIP(answer.address);
  return family === 4
    ? ipv4_is_public(answer.address)
    : family === 6
      ? ipv6_is_public(answer.address)
      : false;
};

export const validate_documentation_try_it_origin = async (input: {
  origin: string;
  allowed_origins: ReadonlySet<string>;
  resolve?: (
    hostname: string,
    options: { all: true },
  ) => Promise<DocumentationTryItDnsAnswer[]>;
}) => {
  const normalized = normalize_documentation_try_it_target(
    input.origin,
    "/",
  ).approved_origin;
  if (!input.allowed_origins.has(normalized))
    throw new DocumentationTryItOriginError(
      "origin_not_allowed",
      "Try-It origin is not permitted by the deployment operator",
    );
  let answers: DocumentationTryItDnsAnswer[];
  try {
    const resolve =
      input.resolve ??
      (async (hostname: string) =>
        (await dns.lookup(hostname, {
          all: true,
        })) as DocumentationTryItDnsAnswer[]);
    answers = await resolve(new URL(normalized).hostname, { all: true });
  } catch {
    throw new DocumentationTryItOriginError(
      "origin_resolution_failed",
      "Try-It origin could not be resolved safely",
    );
  }
  if (
    answers.length === 0 ||
    answers.some((answer) => !address_is_public(answer))
  )
    throw new DocumentationTryItOriginError(
      "origin_resolution_unsafe",
      "Try-It origin resolves to a non-public address",
    );
  return normalized;
};
