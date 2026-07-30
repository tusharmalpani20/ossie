import { describe, expect, it } from "vitest";
import { build_documentation_search_document } from "./documentation-search-policy";

describe("documentation search policy", () => {
  it("extracts safe Page fields without comments", () => {
    expect(
      build_documentation_search_document({
        title: "Install",
        description: "Set up",
        headings: ["Requirements"],
        body_text: "Run the installer",
        comments: ["private discussion"],
      }),
    ).toEqual({
      title: "Install",
      description: "Set up",
      text: "Install Set up Requirements Run the installer",
    });
  });
});
