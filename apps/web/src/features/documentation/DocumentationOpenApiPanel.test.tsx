import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentationOpenApiPanel } from "./DocumentationOpenApiPanel";

afterEach(() => vi.unstubAllGlobals());

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
        loadSource={async () => null}
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

  it("applies over the currently loaded source version", async () => {
    const apply = vi.fn(async () => ({
      source: { id: "source", version: 4 },
      operations: [],
    }));
    render(
      <DocumentationOpenApiPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        loadSource={async () => ({
          source: { id: "source", version: 3 },
          operations: [],
        })}
        inspect={async () => ({
          inspection: {
            id: "inspection",
            openapi_version: "3.1.0",
            title: "Widget API",
            operation_count: 0,
            warnings: [],
          },
        })}
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
    fireEvent.click(
      await screen.findByRole("button", { name: "Apply source" }),
    );
    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "inspection",
        3,
      ),
    );
  });

  it("lets a Viewer open an enabled descriptor-v1 draft request without policy controls", async () => {
    const loadTryItConfiguration = vi.fn(async () => ({
      configuration_id: "01J00000000000000000000001",
      policy_identity: "p".repeat(32),
      configuration_expires_at: "2099-01-01T00:00:00.000Z",
      attempt_token_expires_at: "2099-01-01T00:00:00.000Z",
      surface: "internal" as const,
      operation: {
        descriptor_version: 1 as const,
        destination_key: "get-widgets",
        method: "GET" as const,
        path: "/widgets",
        summary: "List widgets",
        parameters: [],
        request_body: null,
        security: { bearer: false, api_key_header_names: [] },
        unsupported_reasons: [],
      },
      approved_origin: "https://api.example.com",
      base_path: "/",
      allowed_credential_modes: ["none" as const],
      api_key_header_name: null,
      request_limits: {
        url_bytes: 8192,
        body_bytes: 262144,
        timeout_ms: 15000,
      },
      response_limits: { body_bytes: 1048576, headers: 100 },
      operator_origin_set_digest:
        __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__,
      attempt_token: "signed-token",
    }));
    render(
      <DocumentationOpenApiPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite={false}
        loadSource={async () => ({
          source: { id: "source", version: 3 },
          operations: [
            {
              destination_key: "get-widgets",
              method: "get",
              path: "/widgets",
              summary: "List widgets",
              descriptor_version: 1,
              request_descriptor: {
                descriptor_version: 1,
                destination_key: "get-widgets",
                method: "GET",
                path: "/widgets",
                summary: "List widgets",
                parameters: [],
                request_body: null,
                security: { bearer: false, api_key_header_names: [] },
                unsupported_reasons: [],
              },
            },
          ],
        })}
        loadTryItConfiguration={loadTryItConfiguration}
        reportTryItAttempt={async () => undefined}
      />,
    );
    expect(
      await screen.findByText(
        "Only a Project Admin can change this security policy.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole("button", { name: "Open request builder" }),
    );
    await waitFor(() => expect(loadTryItConfiguration).toHaveBeenCalled());
    expect(await screen.findByText(/Target:/)).toHaveTextContent(
      "https://api.example.com/widgets",
    );
  });

  it("bounds operation selection, supports filtering, labels imported servers unapproved, and confirms policy authority", async () => {
    const operations = Array.from({ length: 150 }, (_, index) => ({
      destination_key: `get-widget-${index}`,
      method: "get",
      path: `/widgets/${index}`,
      summary: `Widget ${index}`,
      descriptor_version: 1 as const,
      request_descriptor: {
        descriptor_version: 1 as const,
        destination_key: `get-widget-${index}`,
        method: "GET" as const,
        path: `/widgets/${index}`,
        summary: `Widget ${index}`,
        parameters: [],
        request_body: null,
        security: { bearer: false, api_key_header_names: [] },
        unsupported_reasons: [],
      },
    }));
    const requests: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        requests.push(init ?? {});
        if (init?.method === "PUT")
          return new Response(
            JSON.stringify({
              policy: { version: 1 },
            }),
            { headers: { "content-type": "application/json" } },
          );
        return new Response(JSON.stringify({ policy: null }), {
          headers: { "content-type": "application/json" },
        });
      }),
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <DocumentationOpenApiPanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        canManageTryIt
        loadSource={async () => ({
          source: {
            id: "source",
            version: 3,
            server_candidates: ["https://imported.example.com/v1"],
          },
          operations,
        })}
      />,
    );

    expect(
      await screen.findByText(
        "https://imported.example.com/v1 (imported suggestion — not approved)",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Enable for the next revision" }),
    );
    fireEvent.change(screen.getByLabelText("Approved exact HTTPS origin"), {
      target: { value: "https://api.example.com" },
    });
    expect(
      screen.getAllByRole("checkbox", { name: /GET \/widgets\// }).length,
    ).toBeLessThanOrEqual(100);
    fireEvent.change(screen.getByLabelText("Filter allowed operations"), {
      target: { value: "/widgets/149" },
    });
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "GET /widgets/149" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Try It policy" }));
    expect(confirm).toHaveBeenCalledWith(
      "Approve https://api.example.com for 1 selected operation?",
    );
    expect(requests.filter((request) => request.method === "PUT")).toHaveLength(
      0,
    );

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Save Try It policy" }));
    await waitFor(() =>
      expect(
        requests.filter((request) => request.method === "PUT"),
      ).toHaveLength(1),
    );
  });
});
