import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrganizationDocumentationOperationsPage } from "./OrganizationDocumentationOperationsPage";

vi.mock("../portal/PortalAppShell", () => ({
  PortalAppShell: ({ children }: { children: React.ReactNode }) => children,
}));

const summary = {
  limits: {
    active_sites_limit: null,
    active_pages_limit: 10,
    version: 1,
    updated_at: "2026-07-31T00:00:00.000Z",
  },
  usage: {
    active_sites: 2,
    active_pages: 12,
    retained_file_bytes: 1024,
    retained_revisions: 4,
    retained_publications: 2,
    active_import_inspections: 0,
    open_review_requests: 1,
  },
  states: [
    {
      dimension: "active_sites" as const,
      usage: 2,
      limit: null,
      state: "within_limit" as const,
    },
    {
      dimension: "active_pages" as const,
      usage: 12,
      limit: 10,
      state: "over_limit" as const,
    },
    {
      dimension: "retained_file_bytes" as const,
      usage: 1024,
      limit: null,
      state: "within_limit" as const,
    },
  ],
  permissions: { can_manage_limits: true },
  generated_at: "2026-07-31T00:00:00.000Z",
};

describe("OrganizationDocumentationOperationsPage", () => {
  it("exposes usage and limits as distinct administration regions", async () => {
    render(
      <OrganizationDocumentationOperationsPage
        load={async () => summary}
      />,
    );

    expect(
      await screen.findByRole("region", { name: "Documentation usage" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Product limits" }),
    ).toBeInTheDocument();
  });

  it("shows retained over-limit state and saves explicit unlimited limits", async () => {
    const update = vi.fn(async () => ({
      limits: { ...summary.limits, active_pages_limit: null, version: 2 },
      usage: summary.usage,
      states: summary.states,
    }));
    render(
      <OrganizationDocumentationOperationsPage
        load={async () => summary}
        update={update}
      />,
    );

    expect(await screen.findByText("Active Sites")).toBeInTheDocument();
    expect(
      screen.getByText(/Existing content is retained/u),
    ).toBeInTheDocument();
    const unlimited = screen.getAllByLabelText("Unlimited product quota");
    fireEvent.click(unlimited[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Save limits" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        active_sites_limit: null,
        active_pages_limit: null,
        expected_version: 1,
      }),
    );
  });

  it("does not render mutation controls for a non-owner member", async () => {
    render(
      <OrganizationDocumentationOperationsPage
        load={async () => ({
          ...summary,
          permissions: { can_manage_limits: false },
        })}
      />,
    );
    expect(await screen.findByText("Active Sites")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save limits" }),
    ).not.toBeInTheDocument();
  });

  it("makes usage-load failures actionable", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(summary);
    render(<OrganizationDocumentationOperationsPage load={load} />);

    expect(
      await screen.findByRole("heading", { name: "Documentation usage unavailable" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Documentation usage could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Active Sites")).toBeInTheDocument();
  });
});
