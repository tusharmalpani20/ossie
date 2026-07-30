import { useState } from "react";
import { ulid } from "ulid";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import type { DocumentationBlock } from "@repo/types";

type NewBlockKind = Exclude<DocumentationBlock["kind"], "image">;

const positioned = (blocks: DocumentationBlock[]) =>
  blocks.map((block, index) => ({ ...block, position: index + 1 }));

export const DocumentationBlockEditor = ({
  blocks,
  onChange,
}: {
  blocks: DocumentationBlock[];
  onChange: (blocks: DocumentationBlock[]) => void;
}) => {
  const [kind, setKind] = useState<NewBlockKind>("paragraph");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [linkTarget, setLinkTarget] = useState<"url" | "page">("url");

  const replace = (id: string, block: DocumentationBlock) =>
    onChange(blocks.map((candidate) => (candidate.id === id ? block : candidate)));

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
          {block.kind === "ordered_list" ||
          block.kind === "unordered_list" ? (
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
          <Button
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
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
        {kind !== "divider" ? (
          <>
            <Label htmlFor="new-documentation-block-primary">
              {kind === "link"
                ? "Link label"
                : kind === "api_reference"
                  ? "OpenAPI Source ID"
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
        {kind === "code" || kind === "link" || kind === "api_reference" ? (
          <>
            <Label htmlFor="new-documentation-block-secondary">
              {kind === "code"
                ? "Code language"
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
