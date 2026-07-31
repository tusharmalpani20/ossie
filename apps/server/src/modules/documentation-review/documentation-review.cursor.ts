import { createHmac, timingSafeEqual } from "node:crypto";

type DocumentationReviewCursorFamily =
  | "candidates"
  | "requests"
  | "inbox"
  | "evidence";

type DocumentationReviewCursorContext = {
  family: DocumentationReviewCursorFamily;
  scope: Record<string, string | null>;
  filters: Record<string, string | null>;
};

type DocumentationReviewCursorPosition = {
  sort_value: string;
  id: string;
};

type DocumentationReviewCursorPayload = DocumentationReviewCursorContext & {
  version: 1;
  position: DocumentationReviewCursorPosition;
};

class DocumentationReviewCursorError extends Error {
  readonly code = "invalid_documentation_review_request";

  constructor() {
    super("Documentation review cursor is invalid for this request");
    this.name = "DocumentationReviewCursorError";
  }
}

const same_record = (
  left: Record<string, string | null>,
  right: Record<string, string | null>,
) => JSON.stringify(left) === JSON.stringify(right);

const cursor_secret = () =>
  process.env.COOKIE_SECRET ||
  "ossie-documentation-review-cursor-development-secret";
const sign = (body: string) =>
  createHmac("sha256", cursor_secret()).update(body).digest("base64url");

export const encode_documentation_review_cursor = (
  input: DocumentationReviewCursorContext & {
    position: DocumentationReviewCursorPosition;
  },
) => {
  const body = Buffer.from(
    JSON.stringify({
      version: 1,
      family: input.family,
      scope: input.scope,
      filters: input.filters,
      position: input.position,
    } satisfies DocumentationReviewCursorPayload),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
};

export const decode_documentation_review_cursor = (
  cursor: string,
  context: DocumentationReviewCursorContext,
): DocumentationReviewCursorPosition => {
  try {
    const [body, signature, extra] = cursor.split(".");
    if (
      extra !== undefined ||
      !body ||
      !signature ||
      !/^[A-Za-z0-9_-]+$/u.test(body) ||
      !/^[A-Za-z0-9_-]+$/u.test(signature)
    )
      throw new DocumentationReviewCursorError();
    const expected = Buffer.from(sign(body));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new DocumentationReviewCursorError();
    const decoded = Buffer.from(body, "base64url").toString("utf8");
    if (Buffer.from(decoded).toString("base64url") !== body)
      throw new DocumentationReviewCursorError();
    const value = JSON.parse(
      decoded,
    ) as Partial<DocumentationReviewCursorPayload>;
    if (
      value.version !== 1 ||
      value.family !== context.family ||
      !value.scope ||
      !value.filters ||
      !same_record(value.scope, context.scope) ||
      !same_record(value.filters, context.filters) ||
      !value.position ||
      typeof value.position.sort_value !== "string" ||
      value.position.sort_value.length === 0 ||
      typeof value.position.id !== "string" ||
      value.position.id.length === 0
    )
      throw new DocumentationReviewCursorError();
    return value.position;
  } catch (error) {
    if (error instanceof DocumentationReviewCursorError) throw error;
    throw new DocumentationReviewCursorError();
  }
};
