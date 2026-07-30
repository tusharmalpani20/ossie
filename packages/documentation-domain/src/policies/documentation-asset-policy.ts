import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationAssetSourceInput } from "../types/documentation-domain";

export { DocumentationDomainError };

const safe_asset_name_characters = (value: string) =>
  [...value]
    .map((character) => {
      const point = character.codePointAt(0) ?? 0;
      return point <= 31 ||
        point === 127 ||
        (point >= 0x202a && point <= 0x202e) ||
        (point >= 0x2066 && point <= 0x2069) ||
        character === "/" ||
        character === "\\"
        ? " "
        : character;
    })
    .join("");

export const normalize_documentation_asset_name = (value: string) => {
  const name = safe_asset_name_characters(value)
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
