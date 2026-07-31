type ExampleInput = {
  url: string;
  method: string;
  headers: Record<string, string>;
  sensitive_header_names: string[];
  body: string | null;
  timeout_ms: number;
};

const shellQuote = (value: string) => `'${value.replaceAll("'", `'\\''`)}'`;
const pythonQuote = (value: string) =>
  `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

const placeholderFor = (name: string) =>
  name.toLowerCase() === "authorization"
    ? "<BEARER_TOKEN>"
    : `<${name.toUpperCase().replaceAll(/[^A-Z0-9]+/gu, "_")}>`;

export const generateDocumentationTryItExamples = (input: ExampleInput) => {
  const sensitive = new Set(
    input.sensitive_header_names.map((name) => name.toLowerCase()),
  );
  const headers = Object.fromEntries(
    Object.entries(input.headers).map(([name, value]) => [
      name,
      sensitive.has(name.toLowerCase()) ? placeholderFor(name) : value,
    ]),
  );
  const curl = [
    "curl",
    "--fail-with-body",
    "--location-trusted=false",
    "--max-time",
    String(Math.ceil(input.timeout_ms / 1_000)),
    "-X",
    input.method,
    ...Object.entries(headers).flatMap(([name, value]) => [
      "-H",
      shellQuote(`${name}: ${value}`),
    ]),
    ...(input.body === null ? [] : ["--data-raw", shellQuote(input.body)]),
    shellQuote(input.url),
  ].join(" ");
  const javascript = [
    `await fetch(${JSON.stringify(input.url)}, {`,
    `  method: ${JSON.stringify(input.method)},`,
    `  headers: ${JSON.stringify(headers, null, 2)
      .split("\n")
      .map((line, index) => (index === 0 ? line : `  ${line}`))
      .join("\n")},`,
    ...(input.body === null ? [] : [`  body: ${JSON.stringify(input.body)},`]),
    '  credentials: "omit",',
    '  redirect: "error",',
    '  referrerPolicy: "no-referrer",',
    '  cache: "no-store",',
    "});",
  ].join("\n");
  const pythonHeaders = Object.entries(headers)
    .map(([name, value]) => `    ${pythonQuote(name)}: ${pythonQuote(value)},`)
    .join("\n");
  const python = [
    "import urllib.request",
    "",
    `request = urllib.request.Request(${pythonQuote(input.url)},`,
    input.body === null
      ? "    data=None,"
      : `    data=${pythonQuote(input.body)}.encode("utf-8"),`,
    `    method=${pythonQuote(input.method)},`,
    "    headers={",
    pythonHeaders,
    "    },",
    ")",
    `with urllib.request.urlopen(request, timeout=${Math.ceil(
      input.timeout_ms / 1_000,
    )}) as response:`,
    '    print(response.read().decode("utf-8"))',
  ].join("\n");
  return { curl, javascript, python };
};
