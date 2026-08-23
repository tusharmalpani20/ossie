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
  it("presents Documentation usage as a focused operations summary", async () => {
    render(
      <OrganizationDocumentationOperationsPage load={async () => summary} />,
    );

    expect(
      await screen.findByRole("heading", { name: "Documentation", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Monitor Documentation usage and manage Organization limits.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Stored files")).toBeInTheDocument();
    expect(screen.getByText("1 KB")).toBeInTheDocument();
    expect(screen.getByText("Work requiring attention")).toBeInTheDocument();
    expect(screen.getByText("Imports ready for review")).toBeInTheDocument();
    expect(screen.getByText("Retained content")).toBeInTheDocument();
    expect(screen.queryByText("Retained file bytes")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Documentation usage is up to date."),
    ).not.toBeInTheDocument();
  });

  it("enables saving only after an owner changes a limit", async () => {
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

    expect((await screen.findAllByText("Active Sites")).length).toBeGreaterThan(
      1,
    );
    expect(
      screen.getByText(/Existing content is retained/u),
    ).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    const unlimited = screen.getAllByLabelText("Unlimited");
    fireEvent.click(unlimited[0]!);
    expect(
      screen.getByRole("spinbutton", { name: "Active Site limit" }),
    ).toHaveAttribute("step", "1");
    fireEvent.click(unlimited[0]!);
    fireEvent.click(unlimited[1]!);
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        active_sites_limit: null,
        active_pages_limit: null,
        expected_version: 1,
      }),
    );
    await waitFor(() => expect(save).toBeDisabled());
    expect(screen.getByText("Documentation limits saved.")).toBeInTheDocument();
  });

  it("offers a retry when Documentation usage cannot be loaded", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(summary);

    render(<OrganizationDocumentationOperationsPage load={load} />);

    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(
      screen.getByText("Could not load Documentation usage."),
    ).toBeInTheDocument();
    fireEvent.click(retry);
    expect(await screen.findByText("Stored files")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
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
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Documentation limits")).not.toBeInTheDocument();
  });
});
