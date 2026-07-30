import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationAssetSourceInput } from "../types/documentation-domain";

export { DocumentationDomainError };

const unsafe_name_characters =
  /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069/\\]+/gu;

export const normalize_documentation_asset_name = (value: string) => {
  const name = value
    .replace(unsafe_name_characters, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/^\.+\s*/u, "");
  if (!name || [...name].length > 200)
    throw new DocumentationDomainError(
      "documentation_asset_name_invalid",
      "Asset name must contain between 1 and 200 safe characters",
    );
  return name;
};

export const validate_documentation_asset_source = (
  source: DocumentationAssetSourceInput,
) => {
  if (!["documentation_asset", "capture_asset"].includes(source.kind))
    throw new DocumentationDomainError(
      "documentation_asset_source_unsupported",
      "Asset source is not implemented",
    );
  if (!source.id.trim())
    throw new DocumentationDomainError(
      "documentation_asset_source_unavailable",
      "Asset identity is required",
    );
  return {
    kind: source.kind as "documentation_asset" | "capture_asset",
    id: source.id.trim(),
  };
};
