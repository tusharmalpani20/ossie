import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import { DocumentationAdapterProofPanel } from "./DocumentationAdapterProofPanel";

const blocks: DocumentationBlock[] = [
  {
    id: "paragraph-1",
    kind: "paragraph",
    position: 1,
    expected_version: 2,
    text: "Synthetic proof copy",
  },
];

describe("DocumentationAdapterProofPanel", () => {
  it("renders the exhaustive graph proof without exposing a persistence control", () => {
    render(
      <DocumentationAdapterProofPanel
        mode="tiptap-graph"
        blocks={blocks}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tiptap whole-graph proof" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Tiptap graph proof output"),
    ).toHaveTextContent("ossieParagraph");
    expect(
      screen.queryByRole("button", { name: /save/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the prose proof as a read-only editor for viewers", async () => {
    render(
      <DocumentationAdapterProofPanel
        mode="tiptap-prose"
        blocks={blocks}
        readOnly
        onChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Tiptap prose-field proof" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Synthetic proof copy")).toBeInTheDocument();
    expect(
      screen
        .getByTestId("documentation-tiptap-prose-editor")
        .querySelector("[contenteditable]"),
    ).toHaveAttribute("contenteditable", "false");
  });
});
