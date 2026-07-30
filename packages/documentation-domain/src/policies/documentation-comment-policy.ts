import { DocumentationDomainError } from "../errors/documentation-domain-error";

export { DocumentationDomainError };

export const normalize_documentation_comment = (body: string) => {
  const normalized = body.trim();
  if (!normalized || [...normalized].length > 10_000 || /[<>]/u.test(normalized)) {
    throw new DocumentationDomainError(
      "documentation_comment_invalid",
      "Comment must be bounded plain text",
    );
  }
  return normalized;
};

export const assert_documentation_comment_transition = (
  state: "open" | "resolved",
  transition: "resolve" | "reopen",
) => {
  if (state === "open" && transition === "resolve") return "resolved" as const;
  if (state === "resolved" && transition === "reopen") return "open" as const;
  throw new DocumentationDomainError(
    "documentation_comment_transition_invalid",
    "Comment transition is invalid for its current state",
  );
};
