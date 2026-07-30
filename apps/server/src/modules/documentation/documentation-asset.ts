export type DocumentationImageMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp";

const mime_by_decoded_format: Record<string, DocumentationImageMimeType> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const invalid_image = (message: string) =>
  Object.assign(new Error(message), { code: "documentation_asset_invalid" });

export const assert_documentation_image_format = (
  decoded_format: string | undefined,
  declared_mime_type: DocumentationImageMimeType,
) => {
  const decoded_mime_type = decoded_format
    ? mime_by_decoded_format[decoded_format]
    : undefined;
  if (!decoded_mime_type)
    throw invalid_image("Documentation image format is unsupported");
  if (decoded_mime_type !== declared_mime_type)
    throw invalid_image(
      "Documentation image format does not match its declared MIME type",
    );
};

export const assert_documentation_image_dimensions = (
  width: number,
  height: number,
) => {
  if (width > 16_384 || height > 16_384)
    throw invalid_image(
      "Documentation image dimensions exceed the safety ceiling",
    );
};
