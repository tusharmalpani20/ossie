import { Node as TiptapExtension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentationBlock } from "@repo/types";
import {
  documentationBlocksToTiptapGraph,
  documentationBlocksToTiptapProse,
  tiptapProseToDocumentationBlocks,
  type TiptapDocument,
} from "./adapters/documentationEditorAdapter";

type ProofNodeConfig = {
  name: string;
  content: string;
  attrs: Record<string, { default: unknown }>;
  tag: string;
};

const proofNode = ({ name, content, attrs, tag }: ProofNodeConfig) =>
  TiptapExtension.create({
    name,
    group: "block",
    content,
    addAttributes: () => attrs,
    parseHTML: () => [{ tag: `${tag}[data-ossie-proof-node="${name}"]` }],
    renderHTML: ({ HTMLAttributes }) => [
      tag,
      { ...HTMLAttributes, "data-ossie-proof-node": name },
      0,
    ],
  });

const proseExtensions = [
  StarterKit.configure({
    paragraph: false,
    heading: false,
    blockquote: false,
    orderedList: false,
    bulletList: false,
    listItem: false,
  }),
  proofNode({
    name: "paragraph",
    content: "inline*",
    tag: "p",
    attrs: {
      blockId: { default: null },
      field: { default: "text" },
    },
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

const EditorProof = ({
  mode,
  blocks,
  readOnly,
  onChange,
}: {
  mode: "tiptap-prose" | "tiptap-graph";
  blocks: DocumentationBlock[];
  readOnly: boolean;
  onChange: (blocks: DocumentationBlock[]) => void;
}) => {
  const sourceRef = useRef(blocks);
  const [error, setError] = useState<string | null>(null);
  const initialDocument = useMemo(
    () => documentationBlocksToTiptapProse(blocks),
    [blocks],
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
        sourceRef.current = next;
        setError(null);
        onChange(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unsupported edit");
      }
    },
  });
  useEffect(() => {
    const element = editor?.view.dom;
    if (!element) return;
    element.setAttribute("aria-label", "Tiptap prose-field editor");
  }, [editor]);

  if (mode === "tiptap-graph") {
    const graph = documentationBlocksToTiptapGraph(blocks);
    return (
      <section aria-labelledby="documentation-tiptap-graph-heading">
        <h2 id="documentation-tiptap-graph-heading">
          Tiptap whole-graph proof
        </h2>
        <p>
          Every accepted block and nested identity is represented in transient
          typed nodes. Saving remains owned by the native Page or Snippet
          client.
        </p>
        <div role="region" aria-label="Tiptap graph proof output">
          <pre>{JSON.stringify(graph, null, 2)}</pre>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="documentation-tiptap-prose-heading">
      <h2 id="documentation-tiptap-prose-heading">Tiptap prose-field proof</h2>
      <p>
        Prose text is edited by Tiptap while Ossie block identity, references,
        ordering, concurrency, and persistence remain native.
      </p>
      {error ? (
        <p role="alert">Tiptap proof rejected the edit: {error}</p>
      ) : null}
      <div data-testid="documentation-tiptap-prose-editor">
        <EditorContent editor={editor} />
      </div>
    </section>
  );
};

export const DocumentationAdapterProofPanel = ({
  mode,
  blocks,
  readOnly,
  onChange,
}: {
  mode: "tiptap-prose" | "tiptap-graph";
  blocks: DocumentationBlock[];
  readOnly?: boolean;
  onChange: (blocks: DocumentationBlock[]) => void;
}) => {
  return (
    <EditorProof
      blocks={blocks}
      mode={mode}
      onChange={onChange}
      readOnly={readOnly ?? false}
    />
  );
};
