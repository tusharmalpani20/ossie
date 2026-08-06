import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import { DocumentationTiptapProseField } from "./DocumentationTiptapProseField";

describe("DocumentationTiptapProseField", () => {
  it("syncs externally updated heading metadata without emitting during sync", async () => {
    const onChange = vi.fn();
    const initial: DocumentationBlock = {
      id: "heading-1",
      kind: "heading",
      level: 2,
      position: 1,
      expected_version: 1,
      text: "Initial heading",
    };
    const updated: DocumentationBlock = {
      ...initial,
      level: 3,
      expected_version: 2,
    };
    const { rerender } = render(
      <DocumentationTiptapProseField
        block={initial}
        readOnly={false}
        ariaLabel="Heading text"
        onChange={onChange}
      />,
    );
    const field = await screen.findByRole("textbox", { name: "Heading text" });

    rerender(
      <DocumentationTiptapProseField
        block={updated}
        readOnly={false}
        ariaLabel="Heading text"
        onChange={onChange}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(field.querySelector("h2")).toHaveAttribute("level", "3"),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("syncs externally updated quote attribution without emitting during sync", async () => {
    const onChange = vi.fn();
    const initial = {
      id: "quote-1",
      kind: "quote" as const,
      position: 1,
      expected_version: 1,
      text: "A quote",
      attribution: "Old author",
    };
    const { rerender } = render(
      <DocumentationTiptapProseField
        block={initial}
        readOnly={false}
        ariaLabel="Quote text"
        onChange={onChange}
      />,
    );
    const field = await screen.findByRole("textbox", { name: "Quote text" });
    rerender(
      <DocumentationTiptapProseField
        block={{ ...initial, attribution: "New author", expected_version: 2 }}
        readOnly={false}
        ariaLabel="Quote text"
        onChange={onChange}
      />,
    );

    await waitFor(() =>
      expect(field.querySelector("blockquote")).toHaveAttribute(
        "attribution",
        "New author",
      ),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("syncs externally updated callout metadata without emitting during sync", async () => {
    const onChange = vi.fn();
    const initial = {
      id: "callout-1",
      kind: "callout" as const,
      position: 1,
      expected_version: 1,
      text: "A callout",
      tone: "info" as const,
      title: "Old title",
    };
    const { rerender } = render(
      <DocumentationTiptapProseField
        block={initial}
        readOnly={false}
        ariaLabel="Callout text"
        onChange={onChange}
      />,
    );
    const field = await screen.findByRole("textbox", { name: "Callout text" });
    rerender(
      <DocumentationTiptapProseField
        block={{
          ...initial,
          tone: "warning",
          title: "New title",
          expected_version: 2,
        }}
        readOnly={false}
        ariaLabel="Callout text"
        onChange={onChange}
      />,
    );

    await waitFor(() =>
      expect(field.querySelector("aside")).toHaveAttribute(
        "title",
        "New title",
      ),
    );
    expect(field.querySelector("aside")).toHaveAttribute("tone", "warning");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves unsaved local prose when a conflicting parent text arrives", async () => {
    const onChange = vi.fn();
    const initial = {
      id: "paragraph-1",
      kind: "paragraph" as const,
      position: 1,
      expected_version: 1,
      text: "Initial text",
    };
    const { rerender } = render(
      <DocumentationTiptapProseField
        block={initial}
        readOnly={false}
        ariaLabel="Paragraph text"
        onChange={onChange}
      />,
    );
    const field = await screen.findByRole("textbox", {
      name: "Paragraph text",
    });
    field.innerHTML =
      '<p blockid="paragraph-1" field="text" data-ossie-prose-node="paragraph">Local text</p>';
    fireEvent.input(field);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    rerender(
      <DocumentationTiptapProseField
        block={{ ...initial, expected_version: 2, text: "Server text" }}
        readOnly={false}
        ariaLabel="Paragraph text"
        onChange={onChange}
      />,
    );

    expect(field).toHaveTextContent("Local text");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("keeps read-only prose non-editable while accepting metadata sync", async () => {
    const onChange = vi.fn();
    const initial = {
      id: "quote-read-only",
      kind: "quote" as const,
      position: 1,
      expected_version: 1,
      text: "Published quote",
      attribution: "Old author",
    };
    const { rerender } = render(
      <DocumentationTiptapProseField
        block={initial}
        readOnly
        ariaLabel="Published quote"
        onChange={onChange}
      />,
    );
    const field = await screen.findByRole("textbox", {
      name: "Published quote",
    });
    expect(field).toHaveAttribute("contenteditable", "false");

    rerender(
      <DocumentationTiptapProseField
        block={{ ...initial, attribution: "New author", expected_version: 2 }}
        readOnly
        ariaLabel="Published quote"
        onChange={onChange}
      />,
    );
    await waitFor(() =>
      expect(field.querySelector("blockquote")).toHaveAttribute(
        "attribution",
        "New author",
      ),
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
