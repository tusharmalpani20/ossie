import { useState } from "react";
import { ulid } from "ulid";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import type { DocumentationBlock } from "@repo/types";

type NewBlockKind = DocumentationBlock["kind"];

type ReferenceOption = { id: string; label: string };
type AssetOption = {
  id: string;
  kind: "documentation_asset" | "capture_asset";
  label: string;
};

const positioned = (blocks: DocumentationBlock[]) =>
  blocks.map((block, index) => ({ ...block, position: index + 1 }));

export const DocumentationBlockEditor = ({
  blocks,
  onChange,
  snippetOptions = [],
  assetOptions = [],
  guidePublicationOptions = [],
  demoPublicationOptions = [],
}: {
  blocks: DocumentationBlock[];
  onChange: (blocks: DocumentationBlock[]) => void;
  snippetOptions?: ReferenceOption[];
  assetOptions?: AssetOption[];
  guidePublicationOptions?: ReferenceOption[];
  demoPublicationOptions?: ReferenceOption[];
}) => {
  const [kind, setKind] = useState<NewBlockKind>("paragraph");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [linkTarget, setLinkTarget] = useState<"url" | "page">("url");

  const replace = (id: string, block: DocumentationBlock) =>
    onChange(
      blocks.map((candidate) => (candidate.id === id ? block : candidate)),
    );

  const add = () => {
    const base = {
      id: ulid(),
      position: blocks.length + 1,
      expected_version: null,
    };
    let block: DocumentationBlock | null = null;
    if (kind === "paragraph" && primary.trim())
      block = { ...base, kind, text: primary };
    if (kind === "heading" && primary.trim())
      block = { ...base, kind, level: 2, text: primary.trim() };
    if (
      (kind === "ordered_list" || kind === "unordered_list") &&
      primary.split("\n").some((item) => item.trim())
    )
      block = {
        ...base,
        kind,
        items: primary
          .split("\n")
          .map((text) => text.trim())
          .filter(Boolean)
          .map((text, index) => ({
            id: ulid(),
            text,
            position: index + 1,
            expected_version: null,
          })),
      };
    if (kind === "code")
      block = {
        ...base,
        kind,
        code: primary,
        language: secondary.trim() || null,
      };
    if (kind === "link" && primary.trim() && secondary.trim())
      block =
        linkTarget === "url"
          ? {
              ...base,
              kind,
              label: primary.trim(),
              url: secondary.trim(),
            }
          : {
              ...base,
              kind,
              label: primary.trim(),
              page_id: secondary.trim(),
            };
    if (kind === "divider") block = { ...base, kind };
    if (kind === "api_reference" && primary.trim())
      block = {
        ...base,
        kind,
        openapi_source_id: primary.trim(),
        operation_key: secondary.trim() || null,
      };
    if (kind === "quote" && primary.trim())
      block = {
        ...base,
        kind,
        text: primary,
        attribution: secondary.trim() || null,
      };
    if (kind === "code_example")
      block = {
        ...base,
        kind,
        code: primary,
        language: secondary.trim() || null,
        title: null,
      };
    if (kind === "callout")
      block = {
        ...base,
        kind,
        tone: "info",
        title: secondary.trim() || null,
        text: primary,
      };
    if (kind === "tabs") {
      const items = primary
        .split("\n")
        .map((line) => line.split("|", 2).map((part) => part.trim()))
        .filter(([label, body]) => label && body)
        .map(([label, body], index) => ({
          id: ulid(),
          label: label!,
          body: body!,
          position: index + 1,
          expected_version: null,
        }));
      if (items.length >= 2) block = { ...base, kind, items };
    }
    if (kind === "table") {
      const lines = primary
        .split("\n")
        .map((line) => line.split("\t").map((cell) => cell.trim()))
        .filter((cells) => cells.some(Boolean));
      if (
        lines.length &&
        lines.every((cells) => cells.length === lines[0]!.length)
      )
        block = {
          ...base,
          kind,
          caption: secondary.trim() || null,
          rows: lines.map((cells, rowIndex) => ({
            id: ulid(),
            position: rowIndex + 1,
            expected_version: null,
            cells: cells.map((text, columnIndex) => ({
              id: ulid(),
              column_position: columnIndex + 1,
              expected_version: null,
              is_header: rowIndex === 0,
              text,
            })),
          })),
        };
    }
    if (kind === "snippet_reference" && primary)
      block = { ...base, kind, snippet_id: primary };
    if (
      (kind === "guide_publication" ||
        kind === "interactive_demo_publication") &&
      primary
    )
      block = { ...base, kind, published_artifact_id: primary };
    if (kind === "image" && primary && secondary.trim()) {
      const [sourceKind, id] = primary.split(":", 2);
      if (
        id &&
        (sourceKind === "documentation_asset" || sourceKind === "capture_asset")
      )
        block = {
          ...base,
          kind,
          source: { kind: sourceKind, id },
          alt_text: secondary.trim(),
          caption: null,
        };
    }
    if (!block) return;
    onChange([...blocks, block]);
    setPrimary("");
    setSecondary("");
  };

  const move = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (destination < 0 || destination >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[destination]] = [
      reordered[destination]!,
      reordered[index]!,
    ];
    onChange(positioned(reordered));
  };

  return (
    <section aria-labelledby="documentation-blocks-heading">
      <h2 id="documentation-blocks-heading">Page blocks</h2>
      {blocks.map((block, index) => (
        <fieldset key={block.id}>
          <legend>
            {block.kind.replaceAll("_", " ")} block {index + 1}
          </legend>
          {block.kind === "paragraph" ? (
            <>
              <Label htmlFor={`block-${block.id}-text`}>Paragraph text</Label>
              <Textarea
                id={`block-${block.id}-text`}
                value={block.text}
                onChange={(event) =>
                  replace(block.id, { ...block, text: event.target.value })
                }
              />
            </>
          ) : null}
          {block.kind === "heading" ? (
            <>
              <Label htmlFor={`block-${block.id}-heading`}>Heading text</Label>
              <Input
                id={`block-${block.id}-heading`}
                value={block.text}
                onChange={(event) =>
                  replace(block.id, { ...block, text: event.target.value })
                }
              />
              <Label htmlFor={`block-${block.id}-level`}>Heading level</Label>
              <select
                id={`block-${block.id}-level`}
                value={block.level}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    level: Number(event.target.value) as 2 | 3 | 4,
                  })
                }
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </>
          ) : null}
          {block.kind === "ordered_list" || block.kind === "unordered_list" ? (
            <>
              <Label htmlFor={`block-${block.id}-items`}>
                List items, one per line
              </Label>
              <Textarea
                id={`block-${block.id}-items`}
                value={block.items.map((item) => item.text).join("\n")}
                onChange={(event) => {
                  const lines = event.target.value.split("\n");
                  replace(block.id, {
                    ...block,
                    items: lines.map((text, itemIndex) => ({
                      id: block.items[itemIndex]?.id ?? ulid(),
                      text,
                      position: itemIndex + 1,
                      expected_version:
                        block.items[itemIndex]?.expected_version ?? null,
                    })),
                  });
                }}
              />
            </>
          ) : null}
          {block.kind === "code" ? (
            <>
              <Label htmlFor={`block-${block.id}-code`}>Code</Label>
              <Textarea
                id={`block-${block.id}-code`}
                value={block.code}
                onChange={(event) =>
                  replace(block.id, { ...block, code: event.target.value })
                }
              />
              <Label htmlFor={`block-${block.id}-language`}>
                Code language
              </Label>
              <Input
                id={`block-${block.id}-language`}
                value={block.language ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    language: event.target.value || null,
                  })
                }
              />
            </>
          ) : null}
          {block.kind === "link" ? (
            <>
              <Label htmlFor={`block-${block.id}-label`}>Link label</Label>
              <Input
                id={`block-${block.id}-label`}
                value={block.label}
                onChange={(event) =>
                  replace(block.id, { ...block, label: event.target.value })
                }
              />
              <Label htmlFor={`block-${block.id}-target`}>
                {block.url ? "Link URL" : "Target Page ID"}
              </Label>
              <Input
                id={`block-${block.id}-target`}
                value={block.url ?? block.page_id ?? ""}
                onChange={(event) =>
                  replace(
                    block.id,
                    block.url
                      ? { ...block, url: event.target.value }
                      : { ...block, page_id: event.target.value },
                  )
                }
              />
            </>
          ) : null}
          {block.kind === "api_reference" ? (
            <>
              <Label htmlFor={`block-${block.id}-source`}>
                OpenAPI Source ID
              </Label>
              <Input
                id={`block-${block.id}-source`}
                value={block.openapi_source_id}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    openapi_source_id: event.target.value,
                  })
                }
              />
              <Label htmlFor={`block-${block.id}-operation`}>
                Operation key
              </Label>
              <Input
                id={`block-${block.id}-operation`}
                value={block.operation_key ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    operation_key: event.target.value || null,
                  })
                }
              />
            </>
          ) : null}
          {block.kind === "image" ? (
            <p>
              Image: {block.alt_text}
              {block.caption ? ` — ${block.caption}` : ""}
            </p>
          ) : null}
          <Button disabled={index === 0} onClick={() => move(index, -1)}>
            Move {block.kind.replaceAll("_", " ")} block up
          </Button>
          <Button
            disabled={index === blocks.length - 1}
            onClick={() => move(index, 1)}
          >
            Move {block.kind.replaceAll("_", " ")} block down
          </Button>
          <Button
            onClick={() =>
              onChange(positioned(blocks.filter(({ id }) => id !== block.id)))
            }
          >
            Delete {block.kind.replaceAll("_", " ")} block
          </Button>
        </fieldset>
      ))}
      <fieldset>
        <legend>Add block</legend>
        <Label htmlFor="new-documentation-block-kind">New block type</Label>
        <select
          id="new-documentation-block-kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as NewBlockKind)}
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading">Heading</option>
          <option value="ordered_list">Ordered list</option>
          <option value="unordered_list">Unordered list</option>
          <option value="code">Code</option>
          <option value="link">Link</option>
          <option value="divider">Divider</option>
          <option value="api_reference">API reference</option>
          <option value="quote">Quote</option>
          <option value="table">Table</option>
          <option value="code_example">Code example</option>
          <option value="callout">Callout</option>
          <option value="tabs">Tabs</option>
          <option value="snippet_reference">Snippet</option>
          <option value="image">Image</option>
          <option value="guide_publication">Guide publication</option>
          <option value="interactive_demo_publication">
            Interactive Demo publication
          </option>
        </select>
        {kind === "link" ? (
          <>
            <Label htmlFor="new-documentation-link-target-kind">
              Link target kind
            </Label>
            <select
              id="new-documentation-link-target-kind"
              value={linkTarget}
              onChange={(event) =>
                setLinkTarget(event.target.value as "url" | "page")
              }
            >
              <option value="url">External URL</option>
              <option value="page">Documentation Page</option>
            </select>
          </>
        ) : null}
        {kind === "snippet_reference" ? (
          <>
            <Label htmlFor="new-documentation-block-reference">
              Reusable Snippet
            </Label>
            <select
              id="new-documentation-block-reference"
              onChange={(event) => setPrimary(event.target.value)}
              value={primary}
            >
              <option value="">Select a Snippet</option>
              {snippetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : kind === "image" ? (
          <>
            <Label htmlFor="new-documentation-block-reference">Asset</Label>
            <select
              id="new-documentation-block-reference"
              onChange={(event) => setPrimary(event.target.value)}
              value={primary}
            >
              <option value="">Select an Asset</option>
              {assetOptions.map((option) => (
                <option
                  key={`${option.kind}:${option.id}`}
                  value={`${option.kind}:${option.id}`}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : kind === "guide_publication" ||
          kind === "interactive_demo_publication" ? (
          <>
            <Label htmlFor="new-documentation-block-reference">
              Exact Publication
            </Label>
            <select
              id="new-documentation-block-reference"
              onChange={(event) => setPrimary(event.target.value)}
              value={primary}
            >
              <option value="">Select an exact Publication</option>
              {(kind === "guide_publication"
                ? guidePublicationOptions
                : demoPublicationOptions
              ).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : kind !== "divider" ? (
          <>
            <Label htmlFor="new-documentation-block-primary">
              {kind === "link"
                ? "Link label"
                : kind === "api_reference"
                  ? "OpenAPI Source ID"
                  : kind === "tabs"
                    ? "Tabs, one Label|Body pair per line"
                    : kind === "table"
                      ? "Table rows, with tab-separated cells"
                      : kind === "ordered_list" || kind === "unordered_list"
                        ? "List items, one per line"
                        : kind === "code"
                          ? "Code"
                          : "Block text"}
            </Label>
            <Textarea
              id="new-documentation-block-primary"
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
            />
          </>
        ) : null}
        {kind === "code" ||
        kind === "code_example" ||
        kind === "link" ||
        kind === "api_reference" ||
        kind === "quote" ||
        kind === "callout" ||
        kind === "table" ||
        kind === "image" ? (
          <>
            <Label htmlFor="new-documentation-block-secondary">
              {kind === "code" || kind === "code_example"
                ? "Code language"
                : kind === "image"
                  ? "Alternative text"
                  : kind === "quote"
                    ? "Attribution (optional)"
                    : kind === "callout"
                      ? "Callout title (optional)"
                      : kind === "table"
                        ? "Table caption (optional)"
                        : kind === "link"
                          ? linkTarget === "url"
                            ? "Link URL"
                            : "Target Page ID"
                          : "Operation key (optional)"}
            </Label>
            <Input
              id="new-documentation-block-secondary"
              value={secondary}
              onChange={(event) => setSecondary(event.target.value)}
            />
          </>
        ) : null}
        <Button onClick={add}>Add {kind.replaceAll("_", " ")} block</Button>
      </fieldset>
    </section>
  );
};
