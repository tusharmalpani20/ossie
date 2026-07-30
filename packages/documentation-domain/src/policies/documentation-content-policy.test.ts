import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  normalize_documentation_blocks,
  parse_documentation_controlled_markdown,
} from "./documentation-content-policy";

describe("documentation content policy", () => {
  it("normalizes constrained blocks and rejects executable content", () => {
    expect(
      normalize_documentation_blocks([
        {
          id: "01J00000000000000000000001",
          kind: "heading",
          level: 2,
          text: " Start ",
        },
        {
          id: "01J00000000000000000000002",
          kind: "link",
          label: " API ",
          url: "https://example.test/api",
        },
        { id: "01J00000000000000000000003", kind: "divider" },
      ]),
    ).toEqual([
      {
        id: "01J00000000000000000000001",
        kind: "heading",
        level: 2,
        text: "Start",
        position: 1,
      },
      {
        id: "01J00000000000000000000002",
        kind: "link",
        label: "API",
        url: "https://example.test/api",
        position: 2,
      },
      { id: "01J00000000000000000000003", kind: "divider", position: 3 },
    ]);

    expect(() =>
      normalize_documentation_blocks([
        {
          id: "01J00000000000000000000001",
          kind: "link",
          label: "bad",
          url: "javascript:alert(1)",
        },
      ]),
    ).toThrow(DocumentationDomainError);
  });

  it("parses only the accepted controlled inline Markdown subset", () => {
    expect(
      parse_documentation_controlled_markdown(
        "Use **strong**, *emphasis*, and `inline code`.",
      ),
    ).toEqual([
      { kind: "text", text: "Use " },
      { kind: "strong", text: "strong" },
      { kind: "text", text: ", " },
      { kind: "emphasis", text: "emphasis" },
      { kind: "text", text: ", and " },
      { kind: "code", text: "inline code" },
      { kind: "text", text: "." },
    ]);
    for (const unsafe of [
      "<script>alert(1)</script>",
      "[tracking](https://example.test)",
      "![pixel](https://example.test/pixel.png)",
      "# nested heading",
      "import X from 'package'",
    ])
      expect(() => parse_documentation_controlled_markdown(unsafe)).toThrow(
        DocumentationDomainError,
      );
  });

  it("normalizes the remaining safe V1 block forms", () => {
    const normalized = normalize_documentation_blocks([
      {
        id: "01J00000000000000000000001",
        kind: "quote",
        text: " Be careful ",
        attribution: " Maintainer ",
      },
      {
        id: "01J00000000000000000000002",
        kind: "table",
        caption: " Limits ",
        rows: [
          {
            id: "01J00000000000000000000003",
            cells: [
              {
                id: "01J00000000000000000000004",
                text: "Name",
                is_header: true,
              },
              {
                id: "01J00000000000000000000005",
                text: "Value",
                is_header: true,
              },
            ],
          },
          {
            id: "01J00000000000000000000006",
            cells: [
              {
                id: "01J00000000000000000000007",
                text: "Retries",
                is_header: false,
              },
              {
                id: "01J00000000000000000000008",
                text: "3",
                is_header: false,
              },
            ],
          },
        ],
      },
      {
        id: "01J00000000000000000000009",
        kind: "tabs",
        items: [
          {
            id: "01J0000000000000000000000A",
            label: "npm",
            body: "`npm install`",
          },
          {
            id: "01J0000000000000000000000B",
            label: "pnpm",
            body: "`pnpm add`",
          },
        ],
      },
    ]);

    expect(normalized).toMatchObject([
      { kind: "quote", text: "Be careful", attribution: "Maintainer" },
      {
        kind: "table",
        caption: "Limits",
        rows: [
          {
            position: 1,
            cells: [
              { column_position: 1, text: "Name", is_header: true },
              { column_position: 2, text: "Value", is_header: true },
            ],
          },
          {
            position: 2,
            cells: [
              { column_position: 1, text: "Retries", is_header: false },
              { column_position: 2, text: "3", is_header: false },
            ],
          },
        ],
      },
      {
        kind: "tabs",
        items: [
          { position: 1, label: "npm", body: "`npm install`" },
          { position: 2, label: "pnpm", body: "`pnpm add`" },
        ],
      },
    ]);
  });

  it("rejects non-rectangular tables and duplicate tab labels", () => {
    expect(() =>
      normalize_documentation_blocks([
        {
          id: "01J00000000000000000000001",
          kind: "table",
          rows: [
            {
              id: "01J00000000000000000000002",
              cells: [
                {
                  id: "01J00000000000000000000003",
                  text: "A",
                  is_header: true,
                },
              ],
            },
            {
              id: "01J00000000000000000000004",
              cells: [
                {
                  id: "01J00000000000000000000005",
                  text: "B",
                  is_header: false,
                },
                {
                  id: "01J00000000000000000000006",
                  text: "C",
                  is_header: false,
                },
              ],
            },
          ],
        },
      ]),
    ).toThrow(DocumentationDomainError);
    expect(() =>
      normalize_documentation_blocks([
        {
          id: "01J00000000000000000000001",
          kind: "tabs",
          items: [
            {
              id: "01J00000000000000000000002",
              label: "Node",
              body: "A",
            },
            {
              id: "01J00000000000000000000003",
              label: " node ",
              body: "B",
            },
          ],
        },
      ]),
    ).toThrow(DocumentationDomainError);
  });
});
