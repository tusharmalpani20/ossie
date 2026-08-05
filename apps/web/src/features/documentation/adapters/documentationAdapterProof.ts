export type DocumentationAdapterProofMode =
  | "tiptap-prose"
  | "tiptap-graph";

const proofModes = new Set<DocumentationAdapterProofMode>([
  "tiptap-prose",
  "tiptap-graph",
]);

export const getDocumentationAdapterProofMode = (
  search: string,
  isDevelopment: boolean,
): DocumentationAdapterProofMode | null => {
  if (!isDevelopment) return null;
  const value = new URLSearchParams(search).get(
    "__documentation_adapter_proof",
  );
  return value && proofModes.has(value as DocumentationAdapterProofMode)
    ? (value as DocumentationAdapterProofMode)
    : null;
};
