import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DocumentationTryItConfiguration } from "@repo/types";
import { DocumentationApiOperationExperience } from "./DocumentationApiOperationExperience";

const descriptor = {
  descriptor_version: 1 as const,
  destination_key: "get-pets",
  method: "GET" as const,
  path: "/pets/{petId}",
  summary: "Get a pet",
  parameters: [
    {
      name: "petId",
      location: "path" as const,
      required: true,
      value_type: "string" as const,
      is_array: false,
      explode: false,
      sensitive: false,
    },
  ],
  request_body: null,
  security: { bearer: true, api_key_header_names: [] },
  unsupported_reasons: [],
};

const configuration: DocumentationTryItConfiguration = {
  configuration_id: "01J00000000000000000000001",
  policy_identity: "p".repeat(32),
  configuration_expires_at: "2099-01-01T00:00:00.000Z",
  attempt_token_expires_at: "2099-01-01T00:00:00.000Z",
  surface: "public",
  operation: descriptor,
  approved_origin: "https://api.example.com",
  base_path: "/v1",
  allowed_credential_modes: ["none", "bearer"],
  api_key_header_name: null,
  request_limits: { url_bytes: 8192, body_bytes: 1024, timeout_ms: 15000 },
  response_limits: { body_bytes: 1024, headers: 100 },
  operator_origin_set_digest: __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__,
  attempt_token: "signed-token",
};

afterEach(() => vi.unstubAllGlobals());

describe("DocumentationApiOperationExperience", () => {
  it("loads authority on demand, sends one exact request, and reports content-free outcome", async () => {
    const loadConfiguration = vi.fn(async () => configuration);
    const reportAttempt = vi
      .fn<(attemptToken: string, outcome: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    const targetFetch = vi.fn(
      async () =>
        new Response('{"name":"Milo"}', {
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", targetFetch);
    render(
      <DocumentationApiOperationExperience
        descriptor={descriptor}
        loadConfiguration={() => loadConfiguration()}
        reportAttempt={reportAttempt}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open request builder" }),
    );
    expect(await screen.findByLabelText("petId (path)")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("petId (path)"), {
      target: { value: "pet one" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await screen.findByRole("dialog", {
        name: "Confirm target API request",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm and send" }));

    expect(await screen.findByText("Status: 200")).toBeInTheDocument();
    expect(targetFetch).toHaveBeenCalledTimes(1);
    expect(targetFetch).toHaveBeenCalledWith(
      "https://api.example.com/v1/pets/pet%20one",
      expect.objectContaining({ credentials: "omit", redirect: "error" }),
    );
    await waitFor(() =>
      expect(reportAttempt).toHaveBeenCalledWith("signed-token", "completed"),
    );
  });

  it("requires explicit risk acknowledgement before a mutation can be sent", async () => {
    const mutationDescriptor = {
      ...descriptor,
      destination_key: "post-pets",
      method: "POST" as const,
      path: "/pets",
      parameters: [],
    };
    const targetFetch = vi.fn();
    vi.stubGlobal("fetch", targetFetch);
    render(
      <DocumentationApiOperationExperience
        descriptor={mutationDescriptor}
        loadConfiguration={async () => ({
          ...configuration,
          operation: mutationDescriptor,
        })}
        reportAttempt={async () => undefined}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open request builder" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Send" }));
    const confirm = await screen.findByRole("button", {
      name: "Confirm and send",
    });
    expect(confirm).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "I understand this can change real target data",
      }),
    );
    expect(confirm).toBeEnabled();
    expect(targetFetch).not.toHaveBeenCalled();
  });

  it("keeps examples inert, copies all languages, and exposes separate clear controls", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const bodyDescriptor = {
      ...descriptor,
      destination_key: "post-pets",
      method: "POST" as const,
      path: "/pets",
      parameters: [],
      request_body: {
        required: false,
        media_type: "application/json",
        schema: {
          type: "object" as const,
          nullable: false,
          sensitive: false,
          properties: {
            password: {
              type: "string" as const,
              nullable: false,
              sensitive: true,
            },
          },
        },
        example: { password: "must-not-be-prefilled" },
      },
    };
    render(
      <DocumentationApiOperationExperience
        descriptor={bodyDescriptor}
        loadConfiguration={async () => ({
          ...configuration,
          operation: bodyDescriptor,
        })}
        reportAttempt={async () => undefined}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open request builder" }),
    );
    expect(await screen.findByLabelText("JSON request body")).toHaveValue("");
    for (const label of [
      "Copy cURL example",
      "Copy JavaScript fetch example",
      "Copy Python urllib example",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
    }
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(3));
    expect(writeText.mock.calls.flat().join("\n")).not.toContain(
      "must-not-be-prefilled",
    );
    expect(
      screen.getByRole("button", { name: "Clear credentials" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear response" }),
    ).toBeInTheDocument();
  });

  it("refreshes short-lived authority before every confirmation and reports with the fresh token", async () => {
    const operation = { ...descriptor, parameters: [], path: "/pets" };
    const loadConfiguration = vi
      .fn<() => Promise<DocumentationTryItConfiguration>>()
      .mockResolvedValueOnce({ ...configuration, operation })
      .mockResolvedValueOnce({
        ...configuration,
        operation,
        attempt_token: "fresh-token-1",
      })
      .mockResolvedValueOnce({
        ...configuration,
        operation,
        attempt_token: "fresh-token-2",
      });
    const reportAttempt = vi.fn(async () => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, {
            status: 204,
          }),
      ),
    );
    render(
      <DocumentationApiOperationExperience
        descriptor={operation}
        loadConfiguration={loadConfiguration}
        reportAttempt={reportAttempt}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open request builder" }),
    );
    await screen.findByRole("button", { name: "Send" });

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const firstDialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(firstDialog).getByRole("button", { name: "Confirm and send" }),
    );
    await waitFor(() =>
      expect(reportAttempt).toHaveBeenCalledWith("fresh-token-1", "completed"),
    );

    await new Promise((resolve) => setTimeout(resolve, 1_010));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const secondDialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(secondDialog).getByRole("button", { name: "Confirm and send" }),
    );
    await waitFor(() =>
      expect(reportAttempt).toHaveBeenCalledWith("fresh-token-2", "completed"),
    );
    expect(loadConfiguration).toHaveBeenCalledTimes(3);
  });

  it("keeps keyboard focus inside confirmation and restores it when cancelled", async () => {
    const operation = { ...descriptor, parameters: [], path: "/pets" };
    render(
      <DocumentationApiOperationExperience
        descriptor={operation}
        loadConfiguration={async () => ({ ...configuration, operation })}
        reportAttempt={async () => undefined}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open request builder" }),
    );
    const send = await screen.findByRole("button", { name: "Send" });
    fireEvent.click(send);
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", {
      name: "Confirm and send",
    });
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    await waitFor(() => expect(confirm).toHaveFocus());
    cancel.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(send).toHaveFocus();
  });
});
