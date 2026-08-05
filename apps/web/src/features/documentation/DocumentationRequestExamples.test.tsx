import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DocumentationTryItRequestDescriptor } from "@repo/types";
import { DocumentationRequestExamples } from "./DocumentationRequestExamples";

const descriptor: DocumentationTryItRequestDescriptor = {
  descriptor_version: 1,
  destination_key: "create-pet",
  method: "POST",
  path: "/pets/{petId}",
  summary: "Create a pet",
  parameters: [
    {
      name: "petId",
      location: "path",
      required: true,
      value_type: "string",
      is_array: false,
      explode: false,
      sensitive: false,
      example: "pet/1",
    },
  ],
  request_body: {
    required: true,
    media_type: "application/json",
    schema: {
      type: "object",
      nullable: false,
      sensitive: false,
      properties: {
        password: {
          type: "string",
          nullable: false,
          sensitive: true,
        },
      },
    },
    example: { password: "private-body-value" },
  },
  security: { bearer: true, api_key_header_names: [] },
  unsupported_reasons: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DocumentationRequestExamples", () => {
  it("renders all languages independently, supports keyboard tabs, and copies text", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const targetFetch = vi.fn();
    vi.stubGlobal("fetch", targetFetch);
    render(<DocumentationRequestExamples descriptor={descriptor} />);

    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "https://api.example.com/pets/pet%2F1",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "<SENSITIVE_VALUE>",
    );
    expect(screen.getByRole("tabpanel")).not.toHaveTextContent(
      "private-body-value",
    );
    expect(screen.getByRole("tabpanel").querySelector("pre")).toHaveAttribute(
      "tabindex",
      "0",
    );

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Browser Fetch" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Copy Browser Fetch example" }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(targetFetch).not.toHaveBeenCalled();
    expect(screen.getByText("Browser Fetch example copied.")).toBeInTheDocument();
  });

  it("downloads one safe text file and revokes its object URL", () => {
    const createObjectURL = vi.fn(() => "blob:request-example");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(
      <DocumentationRequestExamples
        descriptor={descriptor}
        operationName="Create Pet / unsafe"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download curl example" }),
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:request-example");
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("announces clipboard failure without changing the displayed example", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn(async () => Promise.reject(new Error("denied"))),
      },
    });
    render(<DocumentationRequestExamples descriptor={descriptor} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy curl example" }));
    await waitFor(() =>
      expect(
        screen.getByText("curl example could not be copied."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "https://api.example.com/pets/pet%2F1",
    );
  });

  it("shows bounded unsupported output without copy or download actions", () => {
    render(
      <DocumentationRequestExamples
        descriptor={{ ...descriptor, unsupported_reasons: ["unsafe source"] }}
      />,
    );
    expect(
      screen.getByText(/cannot produce a safe request example/u),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy curl example" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download curl example" }),
    ).not.toBeInTheDocument();
  });
});
