import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationBlockEditor } from "./DocumentationBlockEditor";

describe("DocumentationBlockEditor", () => {
  it("mounts the selected Tiptap prose adapter without changing block identity", async () => {
    const onChange = vi.fn();
    render(
      <DocumentationBlockEditor
        blocks={[
          {
            id: "paragraph-1",
            kind: "paragraph",
            position: 1,
            expected_version: 3,
            text: "Synthetic prose",
          },
          {
            id: "code-1",
            kind: "code",
            position: 2,
            expected_version: 4,
            code: "pnpm test",
            language: "shell",
          },
        ]}
        onChange={onChange}
        proseAdapter
      />,
    );

    const field = await screen.findByTestId(
      "documentation-tiptap-field-paragraph-1",
    );
    expect(field.querySelector("[contenteditable='true']")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Paragraph text" }),
    ).toHaveAttribute("contenteditable", "true");
    expect(screen.getByLabelText("Code")).toHaveValue("pnpm test");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adds a typed Capture image from an Asset option without a raw ID field", () => {
    const onChange = vi.fn();
    render(
      <DocumentationBlockEditor
        assetOptions={[
          { id: "capture", kind: "capture_asset", label: "Dashboard · v2" },
        ]}
        blocks={[]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("New block type"), {
      target: { value: "image" },
    });
    fireEvent.change(screen.getByLabelText("Asset"), {
      target: { value: "capture_asset:capture" },
    });
    fireEvent.change(screen.getByLabelText("Alternative text"), {
      target: { value: "Dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add image block" }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        kind: "image",
        source: { kind: "capture_asset", id: "capture" },
        alt_text: "Dashboard",
      }),
    ]);
    expect(screen.queryByLabelText(/asset id/i)).toBeNull();
  });

  it("adds internal Page links from labelled same-Edition options", () => {
    const onChange = vi.fn();
    render(
      <DocumentationBlockEditor
        blocks={[]}
        onChange={onChange}
        pageOptions={[{ id: "page-2", label: "Install · /install" }]}
      />,
    );
    fireEvent.change(screen.getByLabelText("New block type"), {
      target: { value: "link" },
    });
    fireEvent.change(screen.getByLabelText("Link target kind"), {
      target: { value: "page" },
    });
    fireEvent.change(screen.getByLabelText("Link label"), {
      target: { value: "Install" },
    });
    fireEvent.change(screen.getByLabelText("Documentation Page"), {
      target: { value: "page-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add link block" }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        kind: "link",
        label: "Install",
        page_id: "page-2",
      }),
    ]);
    expect(screen.queryByLabelText(/target page id/i)).toBeNull();
  });

  it("adds API references from labelled inspected operations", () => {
    const onChange = vi.fn();
    render(
      <DocumentationBlockEditor
        blocks={[]}
        onChange={onChange}
        openApiOptions={[
          {
            id: "operation",
            label: "GET /widgets · List widgets",
            openapiSourceId: "source",
            operationKey: "operations/get-widgets",
          },
        ]}
      />,
    );
    fireEvent.change(screen.getByLabelText("New block type"), {
      target: { value: "api_reference" },
    });
    fireEvent.change(screen.getByLabelText("API operation"), {
      target: { value: "operation" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add api reference block" }),
    );

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        kind: "api_reference",
        openapi_source_id: "source",
        operation_key: "operations/get-widgets",
      }),
    ]);
    expect(screen.queryByLabelText(/openapi source id/i)).toBeNull();
  });
});
