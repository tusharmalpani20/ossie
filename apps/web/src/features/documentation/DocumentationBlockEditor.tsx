import { useState } from "react";
import { ulid } from "ulid";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import type { DocumentationBlock } from "@repo/types";
import { LazyDocumentationTiptapProseField } from "./LazyDocumentationTiptapProseField";

type NewBlockKind = DocumentationBlock["kind"];

type ReferenceOption = { id: string; label: string };
type OpenApiOption = ReferenceOption & {
  openapiSourceId: string;
  operationKey: string;
};
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
  pageOptions = [],
  openApiOptions = [],
  guidePublicationOptions = [],
  demoPublicationOptions = [],
  proseAdapter = false,
}: {
  blocks: DocumentationBlock[];
  onChange: (blocks: DocumentationBlock[]) => void;
  snippetOptions?: ReferenceOption[];
  assetOptions?: AssetOption[];
  pageOptions?: ReferenceOption[];
  openApiOptions?: OpenApiOption[];
  guidePublicationOptions?: ReferenceOption[];
  demoPublicationOptions?: ReferenceOption[];
  proseAdapter?: boolean;
}) => {
  const [kind, setKind] = useState<NewBlockKind>("paragraph");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [tertiary, setTertiary] = useState("");
  const [calloutTone, setCalloutTone] =
    useState<Extract<DocumentationBlock, { kind: "callout" }>["tone"]>("info");
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
    if (kind === "api_reference" && primary) {
      const operation = openApiOptions.find(({ id }) => id === primary);
      if (operation)
        block = {
          ...base,
          kind,
          openapi_source_id: operation.openapiSourceId,
          operation_key: operation.operationKey,
        };
    }
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
        title: tertiary.trim() || null,
      };
    if (kind === "callout")
      block = {
        ...base,
        kind,
        tone: calloutTone,
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
          caption: tertiary.trim() || null,
        };
    }
    if (!block) return;
    onChange([...blocks, block]);
    setPrimary("");
    setSecondary("");
    setTertiary("");
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
              {proseAdapter ? (
                <LazyDocumentationTiptapProseField
                  block={block}
                  readOnly={false}
                  ariaLabel="Paragraph text"
                  fallback={
                    <Textarea
                      id={`block-${block.id}-text`}
                      value={block.text}
                      onChange={(event) =>
                        replace(block.id, {
                          ...block,
                          text: event.target.value,
                        })
                      }
                    />
                  }
                  onChange={(next) => replace(block.id, next)}
                />
              ) : (
                <Textarea
                  id={`block-${block.id}-text`}
                  value={block.text}
                  onChange={(event) =>
                    replace(block.id, { ...block, text: event.target.value })
                  }
                />
              )}
            </>
          ) : null}
          {block.kind === "heading" ? (
            <>
              <Label htmlFor={`block-${block.id}-heading`}>Heading text</Label>
              {proseAdapter ? (
                <LazyDocumentationTiptapProseField
                  block={block}
                  readOnly={false}
                  ariaLabel="Heading text"
                  fallback={
                    <Input
                      id={`block-${block.id}-heading`}
                      value={block.text}
                      onChange={(event) =>
                        replace(block.id, {
                          ...block,
                          text: event.target.value,
                        })
                      }
                    />
                  }
                  onChange={(next) => replace(block.id, next)}
                />
              ) : (
                <Input
                  id={`block-${block.id}-heading`}
                  value={block.text}
                  onChange={(event) =>
                    replace(block.id, { ...block, text: event.target.value })
                  }
                />
              )}
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
              {proseAdapter ? (
                <LazyDocumentationTiptapProseField
                  block={block}
                  readOnly={false}
                  ariaLabel="List items, one per line"
                  fallback={
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
                  }
                  onChange={(next) => replace(block.id, next)}
                />
              ) : (
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
              )}
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
          {block.kind === "code_example" ? (
            <>
              <Label htmlFor={`block-${block.id}-title`}>
                Code example title
              </Label>
              <Input
                id={`block-${block.id}-title`}
                value={block.title ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    title: event.target.value || null,
                  })
                }
              />
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
          {block.kind === "quote" ? (
            <>
              <Label htmlFor={`block-${block.id}-quote`}>Quote text</Label>
              {proseAdapter ? (
                <LazyDocumentationTiptapProseField
                  block={block}
                  readOnly={false}
                  ariaLabel="Quote text"
                  fallback={
                    <Textarea
                      id={`block-${block.id}-quote`}
                      value={block.text}
                      onChange={(event) =>
                        replace(block.id, {
                          ...block,
                          text: event.target.value,
                        })
                      }
                    />
                  }
                  onChange={(next) => replace(block.id, next)}
                />
              ) : (
                <Textarea
                  id={`block-${block.id}-quote`}
                  value={block.text}
                  onChange={(event) =>
                    replace(block.id, { ...block, text: event.target.value })
                  }
                />
              )}
              <Label htmlFor={`block-${block.id}-attribution`}>
                Attribution
              </Label>
              <Input
                id={`block-${block.id}-attribution`}
                value={block.attribution ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    attribution: event.target.value || null,
                  })
                }
              />
            </>
          ) : null}
          {block.kind === "callout" ? (
            <>
              <Label htmlFor={`block-${block.id}-callout`}>Callout text</Label>
              {proseAdapter ? (
                <LazyDocumentationTiptapProseField
                  block={block}
                  readOnly={false}
                  ariaLabel="Callout text"
                  fallback={
                    <Textarea
                      id={`block-${block.id}-callout`}
                      value={block.text}
                      onChange={(event) =>
                        replace(block.id, {
                          ...block,
                          text: event.target.value,
                        })
                      }
                    />
                  }
                  onChange={(next) => replace(block.id, next)}
                />
              ) : (
                <Textarea
                  id={`block-${block.id}-callout`}
                  value={block.text}
                  onChange={(event) =>
                    replace(block.id, { ...block, text: event.target.value })
                  }
                />
              )}
              <Label htmlFor={`block-${block.id}-tone`}>Callout tone</Label>
              <select
                id={`block-${block.id}-tone`}
                value={block.tone}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    tone: event.target.value as typeof block.tone,
                  })
                }
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
              <Label htmlFor={`block-${block.id}-title`}>Callout title</Label>
              <Input
                id={`block-${block.id}-title`}
                value={block.title ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    title: event.target.value || null,
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
                {block.url ? "Link URL" : "Documentation Page"}
              </Label>
              {block.url ? (
                <Input
                  id={`block-${block.id}-target`}
                  value={block.url}
                  onChange={(event) =>
                    replace(block.id, { ...block, url: event.target.value })
                  }
                />
              ) : (
                <select
                  id={`block-${block.id}-target`}
                  value={block.page_id}
                  onChange={(event) =>
                    replace(block.id, {
                      ...block,
                      page_id: event.target.value,
                    })
                  }
                >
                  {pageOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : null}
          {block.kind === "api_reference" ? (
            <>
              <Label htmlFor={`block-${block.id}-operation`}>
                API operation
              </Label>
              <select
                id={`block-${block.id}-operation`}
                value={
                  openApiOptions.find(
                    (option) =>
                      option.openapiSourceId === block.openapi_source_id &&
                      option.operationKey === block.operation_key,
                  )?.id ?? ""
                }
                onChange={(event) => {
                  const operation = openApiOptions.find(
                    ({ id }) => id === event.target.value,
                  );
                  if (operation)
                    replace(block.id, {
                      ...block,
                      openapi_source_id: operation.openapiSourceId,
                      operation_key: operation.operationKey,
                    });
                }}
              >
                <option value="">Select an API operation</option>
                {openApiOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          {block.kind === "tabs" ? (
            <>
              <Label htmlFor={`block-${block.id}-tabs`}>
                Tabs, one Label|Body pair per line
              </Label>
              <Textarea
                id={`block-${block.id}-tabs`}
                value={block.items
                  .map((item) => `${item.label}|${item.body}`)
                  .join("\n")}
                onChange={(event) => {
                  const items = event.target.value
                    .split("\n")
                    .map((line) =>
                      line.split("|", 2).map((part) => part.trim()),
                    )
                    .map(([label, body], itemIndex) => ({
                      id: block.items[itemIndex]?.id ?? ulid(),
                      label: label ?? "",
                      body: body ?? "",
                      position: itemIndex + 1,
                      expected_version:
                        block.items[itemIndex]?.expected_version ?? null,
                    }));
                  replace(block.id, { ...block, items });
                }}
              />
            </>
          ) : null}
          {block.kind === "table" ? (
            <>
              <Label htmlFor={`block-${block.id}-table`}>
                Table rows, with tab-separated cells
              </Label>
              <Textarea
                id={`block-${block.id}-table`}
                value={block.rows
                  .map((row) => row.cells.map((cell) => cell.text).join("\t"))
                  .join("\n")}
                onChange={(event) => {
                  const rows = event.target.value
                    .split("\n")
                    .map((line) => line.split("\t"));
                  replace(block.id, {
                    ...block,
                    rows: rows.map((cells, rowIndex) => ({
                      id: block.rows[rowIndex]?.id ?? ulid(),
                      position: rowIndex + 1,
                      expected_version:
                        block.rows[rowIndex]?.expected_version ?? null,
                      cells: cells.map((text, columnIndex) => ({
                        id:
                          block.rows[rowIndex]?.cells[columnIndex]?.id ??
                          ulid(),
                        column_position: columnIndex + 1,
                        expected_version:
                          block.rows[rowIndex]?.cells[columnIndex]
                            ?.expected_version ?? null,
                        is_header:
                          block.rows[rowIndex]?.cells[columnIndex]?.is_header ??
                          rowIndex === 0,
                        text,
                      })),
                    })),
                  });
                }}
              />
              <Label htmlFor={`block-${block.id}-caption`}>Table caption</Label>
              <Input
                id={`block-${block.id}-caption`}
                value={block.caption ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    caption: event.target.value || null,
                  })
                }
              />
            </>
          ) : null}
          {block.kind === "image" ? (
            <>
              <Label htmlFor={`block-${block.id}-asset`}>Asset</Label>
              <select
                id={`block-${block.id}-asset`}
                value={`${block.source?.kind ?? "documentation_asset"}:${block.source?.id ?? block.asset_id}`}
                onChange={(event) => {
                  const [sourceKind, id] = event.target.value.split(":", 2);
                  if (
                    id &&
                    (sourceKind === "documentation_asset" ||
                      sourceKind === "capture_asset")
                  )
                    replace(block.id, {
                      ...block,
                      source: { kind: sourceKind, id },
                      asset_id: undefined,
                    });
                }}
              >
                {assetOptions.map((option) => (
                  <option
                    key={`${option.kind}:${option.id}`}
                    value={`${option.kind}:${option.id}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <Label htmlFor={`block-${block.id}-alt`}>Alternative text</Label>
              <Input
                id={`block-${block.id}-alt`}
                value={block.alt_text}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    alt_text: event.target.value,
                  })
                }
              />
              <Label htmlFor={`block-${block.id}-caption`}>Image caption</Label>
              <Input
                id={`block-${block.id}-caption`}
                value={block.caption ?? ""}
                onChange={(event) =>
                  replace(block.id, {
                    ...block,
                    caption: event.target.value || null,
                  })
                }
              />
            </>
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
        {kind === "link" && linkTarget === "page" ? (
          <>
            <Label htmlFor="new-documentation-page-reference">
              Documentation Page
            </Label>
            <select
              id="new-documentation-page-reference"
              onChange={(event) => setSecondary(event.target.value)}
              value={secondary}
            >
              <option value="">Select a Page</option>
              {pageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : null}
        {kind === "api_reference" ? (
          <>
            <Label htmlFor="new-documentation-api-reference">
              API operation
            </Label>
            <select
              id="new-documentation-api-reference"
              onChange={(event) => setPrimary(event.target.value)}
              value={primary}
            >
              <option value="">Select an API operation</option>
              {openApiOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : kind === "snippet_reference" ? (
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
        kind === "quote" ||
        kind === "callout" ||
        kind === "table" ||
        kind === "image" ||
        (kind === "link" && linkTarget === "url") ? (
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
        {kind === "callout" ? (
          <>
            <Label htmlFor="new-documentation-callout-tone">Callout tone</Label>
            <select
              id="new-documentation-callout-tone"
              value={calloutTone}
              onChange={(event) =>
                setCalloutTone(event.target.value as typeof calloutTone)
              }
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
          </>
        ) : null}
        {kind === "code_example" || kind === "image" ? (
          <>
            <Label htmlFor="new-documentation-block-tertiary">
              {kind === "code_example"
                ? "Code example title (optional)"
                : "Image caption (optional)"}
            </Label>
            <Input
              id="new-documentation-block-tertiary"
              value={tertiary}
              onChange={(event) => setTertiary(event.target.value)}
            />
          </>
        ) : null}
        <Button onClick={add}>Add {kind.replaceAll("_", " ")} block</Button>
      </fieldset>
    </section>
  );
};
