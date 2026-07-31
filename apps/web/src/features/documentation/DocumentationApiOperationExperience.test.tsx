import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      screen.getByRole("dialog", { name: "Confirm target API request" }),
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
    const confirm = screen.getByRole("button", { name: "Confirm and send" });
    expect(confirm).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "I understand this can change real target data",
      }),
    );
    expect(confirm).toBeEnabled();
    expect(targetFetch).not.toHaveBeenCalled();
  });
});
