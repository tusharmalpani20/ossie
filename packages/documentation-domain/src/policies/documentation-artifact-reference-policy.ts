import { DocumentationDomainError } from "../errors/documentation-domain-error";

export { DocumentationDomainError };

type Input = {
  block_kind: "guide_publication" | "interactive_demo_publication";
  publication_type: "guide" | "interactive_demo";
  published_artifact_id: string;
};

export const validate_documentation_artifact_reference = (input: Input) => {
  const expected =
    input.block_kind === "guide_publication" ? "guide" : "interactive_demo";
  if (input.publication_type !== expected)
    throw new DocumentationDomainError(
      "documentation_artifact_publication_type_mismatch",
      "Published Artifact type does not match the Documentation block",
    );
  if (!input.published_artifact_id.trim())
    throw new DocumentationDomainError(
      "documentation_artifact_publication_not_found",
      "Published Artifact identity is required",
    );
  return {
    ...input,
    published_artifact_id: input.published_artifact_id.trim(),
  };
};
