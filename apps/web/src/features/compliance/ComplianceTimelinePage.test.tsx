import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComplianceEventsResponse } from "@repo/types/compliance";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ComplianceTimelinePage } from "./ComplianceTimelinePage";

const accessPage: ComplianceEventsResponse = {
  events: [
    {
      id: "01J00000000000000000000001",
      evidence_kind: "access",
      organization_id: "01J00000000000000000000002",
      project_id: null,
      root_resource_type: "organization",
      root_resource_id: "01J00000000000000000000002",
      action: "organization.viewed",
      source_type: "web",
      actor_type: "org_user",
      actor_org_user_id: "01J00000000000000000000003",
      actor_label: "Synthetic owner",
      request_id: "request-1",
      occurred_at: "2026-07-19T12:00:00.000Z",
      outcome: "succeeded",
      http_method: "GET",
      route_template: "/api/v1/organization",
      access_surface: "portal",
      authorization_type: "organization_role",
      authorization_role: "owner",
      reason_code: null,
      response_bytes: null,
    },
  ],
  page: { next_cursor: null, has_more: false },
  totals: {
    audit_events: 2,
    audit_change_items: 4,
    access_events: 1,
    oldest_occurred_at: "2026-07-19T12:00:00.000Z",
    newest_occurred_at: "2026-07-19T12:00:00.000Z",
  },
};

describe("ComplianceTimelinePage", () => {
  it("renders retained totals and reloads when the evidence kind changes", async () => {
    const loadEvents = vi.fn(async () => accessPage);
    render(
      <ComplianceTimelinePage
        loadEvents={loadEvents}
        performLogout={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Compliance timeline" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("organization.viewed")).toBeInTheDocument();
    expect(screen.getByText("Audit change items")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Evidence kind"), {
      target: { value: "audit" },
    });
    await waitFor(() =>
      expect(loadEvents).toHaveBeenLastCalledWith({ kind: "audit" }),
    );
    expect(
      screen
        .getAllByRole("link", { name: "Organization members" })
        .some((link) => link.getAttribute("href") === "/organization/members"),
    ).toBe(true);
  });

  it("renders an Owner-required state without evidence", async () => {
    const loadEvents = vi.fn(async () => {
      throw new ApiClientError({
        kind: "forbidden",
        status: 403,
        type: "compliance_permission_denied",
        message: "Owner required",
      });
    });
    render(
      <ComplianceTimelinePage
        loadEvents={loadEvents}
        performLogout={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(
        "Only organization owners can view compliance evidence.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("organization.viewed")).not.toBeInTheDocument();
  });
});
