import type {
  GuideAnnotation,
  GuideBlock,
  GuideDetail,
  GuideEdition,
  GuideSourceCaptureAsset,
} from "@repo/types/guide";
import type { GuideHtmlExport } from "../types/guide-domain";
import { compact_optional_string } from "./guide-generation-policy";

const default_public_base_url = "http://localhost:3000";

const normalize_line_endings = (value: string) => (
  value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
);

const escape_markdown_text = (value: string) => (
  normalize_line_endings(value).replace(/([\\[\]])/g, "\\$1").trim()
);

const markdown_percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

const markdown_asset_url = (file_url: string, public_base_url: string) => {
  if (/^https?:\/\//i.test(file_url)) {
    return encodeURI(file_url).replace(/\(/g, "%28").replace(/\)/g, "%29");
  }

  const base = public_base_url.replace(/\/$/, "");
  const path = file_url.startsWith("/") ? file_url : `/${file_url}`;

  return encodeURI(`${base}${path}`).replace(/\(/g, "%28").replace(/\)/g, "%29");
};

const slug_for_guide = (guide: GuideEdition) => (
  guide.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
);

export const guide_markdown_filename = (guide: GuideEdition) => {
  const slug = slug_for_guide(guide);

  return `${slug || `guide-${guide.id}`}.md`;
};

export const guide_html_zip_filename = (guide: GuideEdition) => {
  const slug = slug_for_guide(guide);

  return `${slug || `guide-${guide.id}`}-html-export.zip`;
};

const step_number_for_block = (blocks: GuideBlock[], target: GuideBlock) => (
  blocks
    .filter((block) => block.block_type === "step" && block.block_index <= target.block_index)
    .length
);

const markdown_asset_alt = (
  asset: GuideSourceCaptureAsset,
  fallback_title: string,
  step_number: number
) => (
  escape_markdown_text(asset.page_title ?? asset.file.original_name ?? fallback_title ?? `Step ${step_number} screenshot`)
);

const markdown_sections = (...sections: Array<string | null | undefined>) => (
  sections
    .map((section) => section?.trim())
    .filter((section): section is string => Boolean(section))
    .join("\n\n")
);

const render_annotations_markdown = (annotations: GuideAnnotation[] | null | undefined) => {
  if (!annotations?.length) {
    return null;
  }

  return [
    "Highlights:",
    "",
    ...annotations.map((annotation, index) => (
      `- Highlight ${index + 1}: x ${markdown_percent(annotation.x)}, y ${markdown_percent(annotation.y)}, width ${markdown_percent(annotation.width)}, height ${markdown_percent(annotation.height)}`
    )),
  ].join("\n");
};

const render_blockquote_markdown = (
  label: "Tip" | "Alert",
  block: Pick<GuideBlock, "title" | "body">
) => {
  const title = compact_optional_string(block.title);
  const body = compact_optional_string(block.body);
  const label_line = title
    ? `> **${label}: ${escape_markdown_text(title)}**`
    : `> **${label}:**${body ? ` ${escape_markdown_text(body)}` : ""}`;

  if (!body || !title) {
    return label_line;
  }

  return `${label_line}\n> ${escape_markdown_text(body).replace(/\n/g, "\n> ")}`;
};

const render_guide_block_markdown = (
  blocks: GuideBlock[],
  block: GuideBlock,
  assets_by_id: Map<string, GuideSourceCaptureAsset>,
  public_base_url: string
) => {
  if (block.block_type === "header" && block.title) {
    return `## ${escape_markdown_text(block.title)}`;
  }

  if (block.block_type === "paragraph" && block.body) {
    return escape_markdown_text(block.body);
  }

  if (block.block_type === "tip") {
    return render_blockquote_markdown("Tip", block);
  }

  if (block.block_type === "alert") {
    return render_blockquote_markdown("Alert", block);
  }

  if (block.block_type === "divider") {
    return "---";
  }

  if (block.block_type === "step" && block.step) {
    const step_number = step_number_for_block(blocks, block);
    const asset = block.step.display_capture_asset_id
      ? assets_by_id.get(block.step.display_capture_asset_id)
      : undefined;
    const screenshot_markdown = asset
      ? `![${markdown_asset_alt(asset, block.step.title, step_number)}](${markdown_asset_url(asset.file_url, public_base_url)})`
      : null;

    return markdown_sections(
      `## ${step_number}. ${escape_markdown_text(block.step.title)}`,
      block.step.body ? escape_markdown_text(block.step.body) : null,
      screenshot_markdown,
      render_annotations_markdown(asset ? block.step.annotations : null)
    );
  }

  return `<!-- Unsupported guide block: ${block.block_type} -->`;
};

export const render_guide_markdown = (
  detail: GuideDetail,
  public_base_url = default_public_base_url
) => {
  const sorted_blocks = [...detail.guide_blocks].sort((left, right) => left.block_index - right.block_index);
  const assets_by_id = new Map(detail.source_capture_assets.map((asset) => [asset.id, asset]));
  const sections = [
    `# ${escape_markdown_text(detail.edition.title)}`,
    detail.edition.description ? escape_markdown_text(detail.edition.description) : null,
    ...sorted_blocks.map((block) => render_guide_block_markdown(sorted_blocks, block, assets_by_id, public_base_url)),
  ];

  return `${markdown_sections(...sections)}\n`;
};

const escape_html = (value: string) => (
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
);

const extension_for_mime_type = (mime_type: string) => {
  if (mime_type === "image/jpeg") {
    return "jpg";
  }

  if (mime_type === "image/webp") {
    return "webp";
  }

  if (mime_type === "image/gif") {
    return "gif";
  }

  return "png";
};

const percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

const html_paragraphs = (value: string) => (
  value
    .split(/\r?\n/)
    .map((line) => `<p>${escape_html(line)}</p>`)
    .join("\n")
);

const assets_by_id = (assets: GuideSourceCaptureAsset[]) => new Map(
  assets.map((asset) => [asset.id, asset])
);

const html_step_number_for_block = (blocks: GuideBlock[], block: GuideBlock) => (
  blocks
    .filter((candidate) => candidate.block_type === "step" && candidate.step)
    .sort((left, right) => left.block_index - right.block_index)
    .findIndex((candidate) => candidate.id === block.id) + 1
);

const image_path_for = (block: GuideBlock, asset: GuideSourceCaptureAsset) => (
  `assets/${block.block_index}-${asset.id}.${extension_for_mime_type(asset.file.mime_type)}`
);

const render_annotations = (block: GuideBlock) => {
  const annotations = block.step?.annotations ?? [];

  if (annotations.length === 0) {
    return "";
  }

  return annotations
    .filter((annotation) => annotation.annotation_type === "highlight")
    .map((annotation) => (
      `<span class="annotation annotation-highlight" style="left: ${percent(annotation.x)}; top: ${percent(annotation.y)}; width: ${percent(annotation.width)}; height: ${percent(annotation.height)};"></span>`
    ))
    .join("\n");
};

const render_step_image = (
  block: GuideBlock,
  asset: GuideSourceCaptureAsset | null
) => {
  if (!asset || block.step?.screenshot_hidden) {
    return "";
  }

  const image_path = image_path_for(block, asset);
  const alt = asset.page_title ?? asset.file.original_name ?? block.step?.title ?? "Guide screenshot";
  const metadata = asset.page_url
    ? `<figcaption>${escape_html(asset.page_url)}</figcaption>`
    : "";

  return [
    "<figure class=\"step-screenshot\">",
    "<div class=\"screenshot-frame\">",
    `<img src="${escape_html(image_path)}" alt="${escape_html(alt)}">`,
    render_annotations(block),
    "</div>",
    metadata,
    "</figure>",
  ].filter(Boolean).join("\n");
};

const render_callout = (kind: "tip" | "alert", block: GuideBlock) => {
  const title = block.title;
  const body = block.body;
  const heading = title
    ? `<strong>${kind === "tip" ? "Tip" : "Alert"}: ${escape_html(title)}</strong>`
    : `<strong>${kind === "tip" ? "Tip" : "Alert"}</strong>`;

  return [
    `<aside class="guide-callout guide-callout-${kind}">`,
    heading,
    body ? html_paragraphs(body) : "",
    "</aside>",
  ].filter(Boolean).join("\n");
};

const render_block = (
  sorted_blocks: GuideBlock[],
  block: GuideBlock,
  asset_by_id: Map<string, GuideSourceCaptureAsset>
) => {
  if (block.block_type === "header" && block.title) {
    return `<h2>${escape_html(block.title)}</h2>`;
  }

  if (block.block_type === "paragraph" && block.body) {
    return `<section class="guide-block guide-paragraph">${html_paragraphs(block.body)}</section>`;
  }

  if (block.block_type === "tip") {
    return render_callout("tip", block);
  }

  if (block.block_type === "alert") {
    return render_callout("alert", block);
  }

  if (block.block_type === "divider") {
    return "<hr>";
  }

  if (block.block_type === "step" && block.step) {
    const step_number = html_step_number_for_block(sorted_blocks, block);
    const asset = block.step.display_capture_asset_id
      ? asset_by_id.get(block.step.display_capture_asset_id) ?? null
      : null;

    return [
      "<section class=\"guide-block guide-step\">",
      `<h2>${step_number}. ${escape_html(block.step.title)}</h2>`,
      block.step.body ? html_paragraphs(block.step.body) : "",
      render_step_image(block, asset),
      "</section>",
    ].filter(Boolean).join("\n");
  }

  return `<!-- Unsupported guide block: ${escape_html(block.block_type)} -->`;
};

const stylesheet = `
body {
  color: #1f2937;
  background: #f3f4f6;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.55;
  margin: 0;
}
main {
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 920px;
  padding: 48px 24px 72px;
}
.guide-block,
.guide-callout {
  margin: 28px 0;
}
.step-screenshot {
  margin: 18px 0 0;
}
.screenshot-frame {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  position: relative;
}
.screenshot-frame img {
  border-radius: 8px;
  display: block;
  height: auto;
  width: 100%;
}
.annotation-highlight {
  border: 3px solid #f97316;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2);
  box-sizing: border-box;
  pointer-events: none;
  position: absolute;
}
.guide-callout {
  border-left: 4px solid #2563eb;
  padding: 12px 16px;
}
.guide-callout-alert {
  border-left-color: #dc2626;
}
figcaption {
  color: #6b7280;
  font-size: 13px;
  margin-top: 8px;
}
`;

export const render_guide_html_export = (detail: GuideDetail): GuideHtmlExport => {
  const asset_by_id = assets_by_id(detail.source_capture_assets);
  const sorted_blocks = [...detail.guide_blocks].sort((left, right) => left.block_index - right.block_index);
  const image_references = sorted_blocks.flatMap((block) => {
    if (block.step?.screenshot_hidden || !block.step?.display_capture_asset_id) {
      return [];
    }

    const asset = asset_by_id.get(block.step.display_capture_asset_id);

    if (!asset) {
      return [];
    }

    return [{
      capture_asset_id: asset.id,
      asset_path: image_path_for(block, asset),
      mime_type: asset.file.mime_type,
    }];
  });

  const html = [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `<title>${escape_html(detail.edition.title)}</title>`,
    `<style>${stylesheet}</style>`,
    "</head>",
    "<body>",
    "<main>",
    `<h1>${escape_html(detail.edition.title)}</h1>`,
    detail.edition.description ? `<p class="guide-description">${escape_html(detail.edition.description)}</p>` : "",
    ...sorted_blocks.map((block) => render_block(sorted_blocks, block, asset_by_id)),
    "</main>",
    "</body>",
    "</html>",
  ].filter(Boolean).join("\n");

  return {
    html,
    image_references,
  };
};
