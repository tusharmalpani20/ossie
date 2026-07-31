const normalize_origin = (candidate: string) => {
  if (candidate.includes("*")) throw new Error("Wildcards are not allowed");
  const url = new URL(candidate);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Documentation connect origins must be exact HTTPS origins",
    );
  }
  return url.origin;
};

export const parse_documentation_connect_origins = (
  raw_value: string | undefined,
) =>
  [
    ...new Set(
      (raw_value ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalize_origin),
    ),
  ].sort();

export const build_documentation_csp = (input: {
  api_origin?: string;
  try_it_origins: readonly string[];
  development_script_origin?: string;
}) => {
  const connect_origins = [
    ...new Set(
      [input.api_origin, ...input.try_it_origins].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ];
  const script_sources = ["'self'", input.development_script_origin]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  return [
    "default-src 'self'",
    `script-src ${script_sources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${connect_origins.length ? ` ${connect_origins.join(" ")}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");
};
