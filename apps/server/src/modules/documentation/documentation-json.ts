import { Tokenizer, TokenType } from "@streamparser/json";

export class DocumentationJsonError extends Error {
  constructor(message = "JSON document is invalid") {
    super(message);
    this.name = "DocumentationJsonError";
  }
}

type JsonContext =
  | { kind: "array" }
  | { kind: "object"; expecting_key: boolean; keys: Set<string> };

export const parse_duplicate_safe_json = (bytes: Buffer): unknown => {
  const stack: JsonContext[] = [];
  const tokenizer = new Tokenizer({
    stringBufferSize: 64 * 1024,
    numberBufferSize: 4 * 1024,
  });
  tokenizer.onToken = ({ token, value }) => {
    const current = stack.at(-1);
    if (token === TokenType.LEFT_BRACE) {
      stack.push({ kind: "object", expecting_key: true, keys: new Set() });
      return;
    }
    if (token === TokenType.LEFT_BRACKET) {
      stack.push({ kind: "array" });
      return;
    }
    if (token === TokenType.RIGHT_BRACE || token === TokenType.RIGHT_BRACKET) {
      stack.pop();
      return;
    }
    if (token === TokenType.COMMA && current?.kind === "object") {
      current.expecting_key = true;
      return;
    }
    if (
      token === TokenType.STRING &&
      current?.kind === "object" &&
      current.expecting_key
    ) {
      if (current.keys.has(value as string))
        throw new DocumentationJsonError("JSON contains a duplicate JSON key");
      current.keys.add(value as string);
      current.expecting_key = false;
    }
  };
  try {
    tokenizer.write(bytes);
    tokenizer.end();
    return JSON.parse(bytes.toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof DocumentationJsonError) throw error;
    throw new DocumentationJsonError(
      error instanceof Error ? error.message : undefined,
    );
  }
};
