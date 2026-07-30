import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
