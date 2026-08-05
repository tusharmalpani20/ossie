import { describe, expect, it } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import {
  documentationBlocksToTiptapProse,
  tiptapProseToDocumentationBlocks,
} from "./documentationTiptapProseAdapter";

const paragraph: DocumentationBlock = {
  id: "paragraph-1",
  kind: "paragraph",
  position: 1,
  expected_version: 3,
  text: "Hello **world** with a `code` line.",
};

describe("Tiptap production prose adapter", () => {
  it("preserves controlled inline marks and block identity", () => {
    const document = documentationBlocksToTiptapProse([paragraph]);

    expect(document.content[0]?.content).toEqual([
      { type: "text", text: "Hello " },
      { type: "text", text: "world", marks: [{ type: "bold" }] },
      { type: "text", text: " with a " },
      { type: "text", text: "code", marks: [{ type: "code" }] },
      { type: "text", text: " line." },
    ]);
    expect(
      tiptapProseToDocumentationBlocks(document, [paragraph]),
    ).toEqual([paragraph]);
  });

  it("fails closed when an initial prose value contains unsupported markup", () => {
    expect(() =>
      documentationBlocksToTiptapProse([
        { ...paragraph, text: "<script>alert(1)</script>" },
      ]),
    ).toThrow(/unsupported markup/i);
  });
});
