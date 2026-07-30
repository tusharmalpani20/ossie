import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationOpenApiPanel } from "./DocumentationOpenApiPanel";

describe("DocumentationOpenApiPanel", () => {
  it("inspects a bounded File and applies the recognized source", async () => {
    const inspect = vi.fn(async () => ({
      inspection: {
        id: "inspection",
        openapi_version: "3.1.0",
        title: "Widget API",
        operation_count: 1,
        warnings: [],
      },
    }));
    const apply = vi.fn(async () => ({
      source: { id: "source", version: 1 },
      operations: [
        {
          destination_key: "get-widgets",
          method: "get",
          path: "/widgets",
          summary: "List widgets",
        },
      ],
    }));
    render(
      <DocumentationOpenApiPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        inspect={inspect}
        apply={apply}
      />,
    );
    const file = new File(["{}"], "openapi.json", {
      type: "application/json",
    });
    fireEvent.change(screen.getByLabelText("OpenAPI JSON or YAML"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inspect OpenAPI" }));
    expect(await screen.findByText(/OpenAPI 3.1.0/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply source" }));
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "inspection",
        null,
      ),
    );
    expect(await screen.findByText(/GET.*\/widgets/)).toBeInTheDocument();
  });
});
