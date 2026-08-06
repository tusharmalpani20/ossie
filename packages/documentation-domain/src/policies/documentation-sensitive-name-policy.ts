const SENSITIVE_NAME_PATTERN =
  /(?:authorization|cookie|credential|secret|token|password|passwd|api[-_ ]?key|session)/iu;

/**
 * Names matching this policy are treated as sensitive even when an OpenAPI
 * schema does not declare the property or no schema is present at all.
 */
export const is_documentation_sensitive_name = (name: string): boolean =>
  SENSITIVE_NAME_PATTERN.test(name);
