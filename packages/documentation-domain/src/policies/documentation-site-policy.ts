import { DocumentationDomainError } from "../errors/documentation-domain-error";

export const normalize_primary_language = (value: string) => {
  const normalized = value.trim();
  try {
    return new Intl.Locale(normalized).toString();
  } catch {
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      "Primary language must be a valid BCP 47 tag",
    );
  }
};
