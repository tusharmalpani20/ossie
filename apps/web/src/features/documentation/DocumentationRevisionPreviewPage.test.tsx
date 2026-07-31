import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationRevisionPreviewPage } from "./DocumentationRevisionPreviewPage";

const revision = {
  site: { id: "site", name: "Product docs", description: null },
  revision: {
    id: "revision",
    revision_number: 3,
    created_at: "2026-07-30T00:00:00.000Z",
  },
  openapi_operations: [
    {
      destination_key: "get-pets",
      method: "GET",
      path: "/pets",
      summary: "List pets",
      descriptor_version: 1 as const,
      request_descriptor: {
        destination_key: "get-pets",
        method: "GET",
        path: "/pets",
        summary: "List pets",
        descriptor_version: 1 as const,
        parameters: [],
        request_body: null,
        security: { bearer: false, api_key_header_names: [] },
        unsupported_reasons: [],
      },
    },
  ],
};

describe("DocumentationRevisionPreviewPage", () => {
  it("binds the request builder to the exact immutable Revision", async () => {
    const loadRevision = vi.fn().mockResolvedValue({ revision });
    const loadTryItConfiguration = vi.fn().mockResolvedValue({
      configuration_id: "01J00000000000000000000001",
      surface: "internal",
      operation: revision.openapi_operations[0]?.request_descriptor,
      approved_origin: "https://api.example.com",
      base_path: "/",
      allowed_credential_modes: ["none"],
      policy_identity: "p".repeat(32),
      configuration_expires_at: "2099-01-01T00:00:00.000Z",
      attempt_token: "token",
      attempt_token_expires_at: "2099-01-01T00:00:00.000Z",
      api_key_header_name: null,
      request_limits: { url_bytes: 8192, body_bytes: 1024, timeout_ms: 15000 },
      response_limits: { body_bytes: 1024, headers: 100 },
      operator_origin_set_digest:
        __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__,
    });

    render(
      <DocumentationRevisionPreviewPage
        projectId="project"
        versionSlug="v1"
        siteId="site"
        revisionNumber={3}
        loadRevision={loadRevision}
        loadTryItConfiguration={loadTryItConfiguration}
        reportTryItAttempt={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Product docs — immutable Revision 3",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /open request builder/i }),
    );

    await waitFor(() =>
      expect(loadTryItConfiguration).toHaveBeenCalledWith(
        "project",
        "v1",
        "site",
        "get-pets",
        { source: "revision", revision_number: 3 },
      ),
    );
    expect(
      screen.getByText("https://api.example.com/pets", {
        selector: ".documentation-api-operation__target code",
      }),
    ).toBeInTheDocument();
  });
});
