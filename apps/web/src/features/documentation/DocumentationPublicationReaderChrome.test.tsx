import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import { DocumentationPublicationReaderChrome } from "./DocumentationPublicationReaderChrome";

const source = {
  resourceClass: "publication" as const,
  selectedPageId: "page-install",
  selectedPagePath: "/docs/product/install",
  pages: [
    {
      id: "page-install",
      title: "Install",
      canonicalPath: "/docs/product/install",
      url: "/docs/product/install",
      blocks: [
        {
          id: "heading-setup",
          kind: "heading" as const,
          position: 1,
          expected_version: null,
          level: 2 as const,
          text: "Setup",
        } satisfies DocumentationBlock,
      ],
    },
    {
      id: "page-reference",
      title: "Reference",
      canonicalPath: "/docs/product/reference",
      url: "/docs/product/reference",
      blocks: [],
    },
  ],
  navigation: [
    {
      id: "group-guides",
      kind: "group" as const,
      label: "Guides",
      position: 1,
    },
    {
      id: "nav-install",
      kind: "page" as const,
      pageId: "page-install",
      label: "Install",
      parentId: "group-guides",
      position: 1,
    },
    {
      id: "nav-reference",
      kind: "page" as const,
      pageId: "page-reference",
      label: "Reference",
      parentId: "group-guides",
      position: 2,
    },
  ],
};

describe("DocumentationPublicationReaderChrome", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("renders authorized Fumadocs primitives around Ossie content", () => {
    render(
      <DocumentationPublicationReaderChrome source={source}>
        <h1>Install</h1>
        <h2 id="documentation-block-heading-setup">Setup</h2>
      </DocumentationPublicationReaderChrome>,
    );

    expect(
      screen.getByRole("navigation", { name: "Documentation navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reference" })).toHaveAttribute(
      "href",
      "/docs/product/reference",
    );
    expect(screen.getAllByText("Guides")).not.toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "Next: Reference" }),
    ).toHaveAttribute("rel", "next");
    expect(
      screen.getByRole("navigation", { name: "Documentation breadcrumb" }),
    ).toHaveTextContent("Install");
    expect(
      screen.getByRole("navigation", { name: "On this page" }),
    ).toHaveTextContent("Setup");
    expect(
      screen.getByRole("heading", { name: "Install" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("documentation-publication-reader-chrome"),
    ).toHaveAttribute("data-resource-class", "publication");
  });
});
