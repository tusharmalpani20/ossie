import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDocumentationTryItConfiguration,
  reportDocumentationTryItAttempt,
} from "./documentationTryItApi";

const configuration = {
  configuration_id: "01J00000000000000000000001",
  surface: "internal",
  operation: {
    destination_key: "get-pets",
    method: "GET",
    path: "/pets",
    summary: "List pets",
    descriptor_version: 1,
    parameters: [],
    request_body: null,
    security: { bearer: false, api_key_header_names: [] },
    unsupported_reasons: [],
  },
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
  operator_origin_set_digest: __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__,
};

describe("documentation Try-It API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("preserves immutable Revision selection for configuration and reporting", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(configuration), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await getDocumentationTryItConfiguration(
      "project",
      "v1",
      "site",
      "get-pets",
      { source: "revision", revision_number: 3 },
    );
    await reportDocumentationTryItAttempt(
      "project",
      "v1",
      "site",
      "get-pets",
      "token",
      "completed",
      { source: "revision", revision_number: 3 },
    );

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "source=revision&revision_number=3",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain(
      "source=revision&revision_number=3",
    );
  });
});
