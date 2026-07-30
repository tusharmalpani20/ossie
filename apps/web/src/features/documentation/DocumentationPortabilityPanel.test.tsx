import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentationPortabilityPanel } from "./DocumentationPortabilityPanel";

describe("DocumentationPortabilityPanel", () => {
  it("provides a labelled keyboard-operable package input", () => {
    render(
      <DocumentationPortabilityPanel
        projectId="project"
        versionSlug="main"
        kind="site_package"
        mode="create_site"
        canImport
      />,
    );
    expect(screen.getByLabelText("Ossie Site ZIP")).toHaveAttribute(
      "accept",
      "application/zip,.zip",
    );
    expect(screen.getByRole("button", { name: "Inspect file" })).toBeDisabled();
  });

  it("does not expose mutation controls to a Viewer", () => {
    const { container } = render(
      <DocumentationPortabilityPanel
        projectId="project"
        versionSlug="main"
        kind="site_package"
        mode="create_site"
        canImport={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
