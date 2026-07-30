import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationRoute } from "../types/documentation-domain";

export { DocumentationDomainError };

const RESERVED_ROOTS = new Set(["api", "assets", "documentation", "versions"]);

export const normalize_documentation_path = (input: string) => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    throw new DocumentationDomainError(
      "documentation_path_invalid",
      "Path encoding is invalid",
    );
  }
  const path = decoded.normalize("NFKC").trim().replace(/^\/+|\/+$/gu, "").toLowerCase();
  const segments = path.split("/");
  if (
    !path ||
    segments.length > 8 ||
    RESERVED_ROOTS.has(segments[0] ?? "") ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(segment),
    )
  ) {
    throw new DocumentationDomainError(
      "documentation_path_invalid",
      "Path contains an unsafe or reserved segment",
    );
  }
  return path;
};

export const validate_documentation_routes = (routes: DocumentationRoute[]) => {
  const targets = new Map<string, string>();
  for (const route of routes) {
    const source = normalize_documentation_path(route.source_path);
    if (route.outcome === "gone") {
      if (route.target_path) {
        throw new DocumentationDomainError(
          "documentation_path_invalid",
          "Gone routes cannot have a target",
        );
      }
      continue;
    }
    if (!route.target_path) {
      throw new DocumentationDomainError(
        "documentation_path_invalid",
        "Redirect routes require a target",
      );
    }
    targets.set(source, normalize_documentation_path(route.target_path));
  }
  for (const source of targets.keys()) {
    const seen = new Set([source]);
    let target = targets.get(source);
    while (target) {
      if (seen.has(target)) {
        throw new DocumentationDomainError(
          "documentation_redirect_cycle",
          "Redirect rules must be acyclic",
        );
      }
      seen.add(target);
      target = targets.get(target);
    }
  }
};
