import { Node as TiptapExtension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentationBlock } from "@repo/types";
import {
  documentationBlocksToTiptapProse,
  tiptapProseToDocumentationBlocks,
  type TiptapDocument,
} from "./adapters/documentationTiptapProseAdapter";

type ProseBlock = Extract<
  DocumentationBlock,
  {
    kind:
      | "paragraph"
      | "heading"
      | "quote"
      | "callout"
      | "ordered_list"
      | "unordered_list";
  }
>;

const proofNode = ({
  name,
  content,
  attrs,
  tag,
}: {
  name: string;
  content: string;
  attrs: Record<string, { default: unknown }>;
  tag: string;
}) =>
  TiptapExtension.create({
    name,
    group: "block",
    content,
    addAttributes: () => attrs,
    parseHTML: () => [{ tag: `${tag}[data-ossie-prose-node="${name}"]` }],
    renderHTML: ({ HTMLAttributes }) => [
      tag,
      { ...HTMLAttributes, "data-ossie-prose-node": name },
      0,
    ],
  });

const proseExtensions = [
  StarterKit.configure({
    paragraph: false,
    heading: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false,
    orderedList: false,
    bulletList: false,
    listItem: false,
  }),
  proofNode({
    name: "paragraph",
    content: "inline*",
    tag: "p",
    attrs: { blockId: { default: null }, field: { default: "text" } },
  }),
  proofNode({
    name: "heading",
    content: "inline*",
    tag: "h2",
    attrs: {
      blockId: { default: null },
      field: { default: "text" },
      level: { default: 2 },
    },
  }),
  proofNode({
    name: "blockquote",
    content: "inline*",
    tag: "blockquote",
    attrs: {
      blockId: { default: null },
      field: { default: "text" },
      attribution: { default: null },
    },
  }),
  proofNode({
    name: "callout",
    content: "inline*",
    tag: "aside",
    attrs: {
      blockId: { default: null },
      field: { default: "text" },
      tone: { default: "info" },
      title: { default: null },
    },
  }),
  proofNode({
    name: "orderedList",
    content: "listItem+",
    tag: "ol",
    attrs: { blockId: { default: null } },
  }),
  proofNode({
    name: "bulletList",
    content: "listItem+",
    tag: "ul",
    attrs: { blockId: { default: null } },
  }),
  proofNode({
    name: "listItem",
    content: "inline*",
    tag: "li",
    attrs: {
      blockId: { default: null },
      itemId: { default: null },
      position: { default: 1 },
      expectedVersion: { default: null },
    },
  }),
];

export const DocumentationTiptapProseField = ({
  block,
  readOnly,
  ariaLabel,
  onChange,
}: {
  block: ProseBlock;
  readOnly: boolean;
  ariaLabel: string;
  onChange: (block: ProseBlock) => void;
}) => {
  const sourceRef = useRef<DocumentationBlock[]>([block]);
  const [error, setError] = useState<string | null>(null);
  const initialDocument = useMemo(
    () => documentationBlocksToTiptapProse([block]),
    [block],
  );
  const editor = useEditor({
    extensions: proseExtensions,
    content: initialDocument,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor: updated }) => {
      try {
        const next = tiptapProseToDocumentationBlocks(
          updated.getJSON() as TiptapDocument,
          sourceRef.current,
        );
        const nextBlock = next[0];
        if (!nextBlock) throw new Error("Tiptap field produced no block");
        sourceRef.current = next;
        setError(null);
        onChange(nextBlock as ProseBlock);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unsupported edit");
      }
    },
  });

  useEffect(() => {
    const element = editor?.view.dom;
    if (!element) return;
    element.setAttribute("aria-label", ariaLabel);
  }, [ariaLabel, editor]);

  return (
    <div data-testid={`documentation-tiptap-field-${block.id}`}>
      <EditorContent editor={editor} />
      {error ? (
        <p role="alert">Tiptap field rejected the edit: {error}</p>
      ) : null}
    </div>
  );
};
