import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  ComplianceAuditEventDetailResponse,
  ComplianceAuditEventSummary,
  ComplianceEventsResponse,
} from "@repo/types/compliance";
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
      action: "organization.members_viewed",
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

const auditEvent: ComplianceAuditEventSummary = {
  id: "01J00000000000000000000005",
  evidence_kind: "audit",
  organization_id: "01J00000000000000000000002",
  project_id: null,
  root_resource_type: "organization",
  root_resource_id: "01J00000000000000000000002",
  action: "setup.owner_bootstrapped",
  source_type: "web",
  actor_type: "org_user",
  actor_org_user_id: "01J00000000000000000000003",
  actor_label: "Synthetic owner",
  request_id: "request-2",
  occurred_at: "2026-07-19T12:00:00.000Z",
  outcome: "committed",
  correlation_id: null,
  idempotency_key_hash: null,
  before_row_version: null,
  after_row_version: 1,
  reason: null,
  change_item_count: 2,
};

const auditPage: ComplianceEventsResponse = {
  ...accessPage,
  events: [auditEvent],
};

const auditDetail: ComplianceAuditEventDetailResponse = {
  event: {
    ...auditEvent,
    change_items: [
      {
        id: "01J00000000000000000000006",
        entity_type: "organization",
        entity_id: "01J00000000000000000000002",
        parent_entity_type: null,
        parent_entity_id: null,
        logical_key: null,
        operation: "create",
        field_name: "name",
        value_type: "text",
        before: { state: "absent" },
        after: { state: "value", value_type: "text", value: "Ossie" },
      },
      {
        id: "01J00000000000000000000007",
        entity_type: "org_user",
        entity_id: "01J00000000000000000000003",
        parent_entity_type: "organization",
        parent_entity_id: "01J00000000000000000000002",
        logical_key: null,
        operation: "create",
        field_name: "org_user",
        value_type: null,
        before: { state: "absent" },
        after: { state: "present" },
      },
    ],
  },
};

describe("ComplianceTimelinePage", () => {
  it("presents important evidence as a readable table", async () => {
    const loadEvents = vi.fn(async () => accessPage);
    render(
      <ComplianceTimelinePage
        loadEvents={loadEvents}
        performLogout={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Compliance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Review important changes and access across your Organization.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Changes recorded")).toBeInTheDocument();
    expect(screen.getByText("Access records")).toBeInTheDocument();
    expect(screen.getByText("Evidence since")).toBeInTheDocument();
    expect(
      await screen.findByRole("cell", {
        name: "Organization members viewed",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("organization.members_viewed"),
    ).not.toBeInTheDocument();
    expect(loadEvents).toHaveBeenCalledWith({
      activity: "important",
      kind: "all",
    });
    expect(screen.queryByText("Organization members")).not.toBeInTheDocument();
  });

  it("reloads evidence from compact type filters", async () => {
    const loadEvents = vi.fn(async () => accessPage);
    render(
      <ComplianceTimelinePage
        loadEvents={loadEvents}
        performLogout={vi.fn()}
      />,
    );

    await screen.findByRole("table", { name: "Compliance activity" });
    fireEvent.click(screen.getByRole("button", { name: "Changes" }));
    await waitFor(() =>
      expect(loadEvents).toHaveBeenLastCalledWith({
        activity: "important",
        kind: "audit",
      }),
    );
    expect(screen.getByRole("button", { name: "Changes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens complete evidence in a detail dialog", async () => {
    render(
      <ComplianceTimelinePage
        loadEvents={vi.fn(async () => accessPage)}
        performLogout={vi.fn()}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "View details for Organization members viewed",
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Organization members viewed",
    });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("GET /api/v1/organization")).toBeInTheDocument();
    expect(screen.getByText("request-1")).toBeInTheDocument();
  });

  it("uses plain-language labels for missing values and record versions", async () => {
    render(
      <ComplianceTimelinePage
        loadEvents={vi.fn(async () => auditPage)}
        loadAuditDetail={vi.fn(async () => auditDetail)}
        performLogout={vi.fn()}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "View details for Setup owner bootstrapped",
      }),
    );

    expect(await screen.findByText("Ossie")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.queryByText("absent")).not.toBeInTheDocument();
    expect(screen.queryByText("present")).not.toBeInTheDocument();
    expect(screen.getByText("Record version")).toBeInTheDocument();
    expect(screen.queryByText("Row versions")).not.toBeInTheDocument();
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
