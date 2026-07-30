import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";

const base = { position: 1, expected_version: 1 };

describe("DocumentationBlockRenderer", () => {
  it("renders semantic expanded content and never executes author text", () => {
    const blocks: DocumentationBlock[] = [
      {
        ...base,
        id: "callout",
        kind: "callout",
        tone: "warning",
        title: "Careful",
        text: "Use **staging** first.",
      },
      {
        ...base,
        id: "table",
        kind: "table",
        caption: "Ports",
        rows: [
          {
            id: "row",
            position: 1,
            expected_version: 1,
            cells: [
              {
                id: "cell",
                column_position: 1,
                expected_version: 1,
                is_header: true,
                text: "Port",
              },
            ],
          },
        ],
      },
      {
        ...base,
        id: "snippet-use",
        kind: "snippet_reference",
        snippet_id: "snippet",
      },
    ];

    render(
      <DocumentationBlockRenderer
        blocks={blocks}
        snippets={[
          {
            id: "snippet",
            name: "Reusable note",
            status: "active",
            blocks: [
              {
                ...base,
                id: "quote",
                kind: "quote",
                text: "<script>alert(1)</script>",
                attribution: "Docs team",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("note")).toHaveTextContent("Use staging first.");
    expect(screen.getByRole("table", { name: "Ports" })).toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });

  it("uses source-disambiguated URLs and frozen publication labels", () => {
    render(
      <DocumentationBlockRenderer
        blocks={[
          {
            ...base,
            id: "image",
            kind: "image",
            source: { kind: "capture_asset", id: "capture" },
            alt_text: "Dashboard",
            caption: null,
          },
          {
            ...base,
            id: "publication",
            kind: "guide_publication",
            published_artifact_id: "publication",
            publication: {
              title: "Install guide",
              description: "Frozen description",
              project_version: { name: "2.0" },
              revision_number: 3,
              publication_sequence: 4,
            },
          },
        ]}
        assetUrl={(source) =>
          `/assets/${source.kind === "capture_asset" ? "capture/" : ""}${source.id}/file`
        }
      />,
    );

    expect(screen.getByRole("img", { name: "Dashboard" })).toHaveAttribute(
      "src",
      "/assets/capture/capture/file",
    );
    expect(screen.getByText("Install guide")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Install guide" })).toBeNull();
  });

  it("renders the controlled inline-markup grammar consistently", () => {
    render(
      <DocumentationBlockRenderer
        blocks={[
          {
            ...base,
            id: "paragraph",
            kind: "paragraph",
            text: "Use *care*, **strength**, and `code`.\nThen continue.",
          },
        ]}
      />,
    );

    expect(screen.getByText("care", { selector: "em" })).toBeInTheDocument();
    expect(
      screen.getByText("strength", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(screen.getByText("code", { selector: "code" })).toBeInTheDocument();
    expect(document.querySelector("br")).toBeInTheDocument();
    expect(screen.getByText(/Then continue\./u)).toBeInTheDocument();
  });

  it("copies code with an announced result", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <DocumentationBlockRenderer
        blocks={[
          {
            ...base,
            id: "code",
            kind: "code_example",
            title: "Install",
            language: "shell",
            code: "pnpm install",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    expect(writeText).toHaveBeenCalledWith("pnpm install");
    expect(await screen.findByRole("status")).toHaveTextContent("Code copied");
  });

  it("supports the ARIA Tabs keyboard interaction", () => {
    render(
      <DocumentationBlockRenderer
        blocks={[
          {
            ...base,
            id: "tabs",
            kind: "tabs",
            items: [
              {
                id: "first",
                label: "Linux",
                body: "Linux instructions",
                position: 1,
                expected_version: 1,
              },
              {
                id: "second",
                label: "macOS",
                body: "macOS instructions",
                position: 2,
                expected_version: 1,
              },
            ],
          },
        ]}
      />,
    );
    const linux = screen.getByRole("tab", { name: "Linux" });
    const macos = screen.getByRole("tab", { name: "macOS" });

    linux.focus();
    fireEvent.keyDown(linux, { key: "ArrowRight" });
    expect(macos).toHaveAttribute("aria-selected", "true");
    expect(macos).toHaveFocus();

    fireEvent.keyDown(macos, { key: "Home" });
    expect(linux).toHaveAttribute("aria-selected", "true");
    expect(linux).toHaveFocus();
  });
});
