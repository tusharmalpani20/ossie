import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { OrganizationMembersPage } from "./OrganizationMembersPage";
import type { OrganizationInvite, OrganizationMember } from "./types";

const members: OrganizationMember[] = [
  {
    id: "org_user_1",
    organization_id: "organization_1",
    user_id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
    role: "owner",
    status: "active",
    created_at: "2026-06-05T10:00:00.000Z",
  },
  {
    id: "org_user_2",
    organization_id: "organization_1",
    user_id: "user_2",
    email: "member@example.com",
    display_name: "Member User",
    role: "member",
    status: "active",
    created_at: "2026-06-06T10:00:00.000Z",
  },
];

const invites: OrganizationInvite[] = [{
  id: "org_invite_1",
  organization_id: "organization_1",
  email: "pending@example.com",
  role: "member",
  status: "pending",
  expires_at: "2026-06-22T10:00:00.000Z",
  accepted_at: null,
  accepted_user_id: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  created_at: "2026-06-15T10:00:00.000Z",
  updated_at: "2026-06-15T10:00:00.000Z",
}];

const renderPage = (overrides: {
  loadMembers?: () => Promise<{ members: OrganizationMember[] }>;
  loadInvites?: () => Promise<{ invites: OrganizationInvite[] }>;
  createInvite?: (input: { email: string; role?: "owner" | "member" }) => Promise<{
    invite: OrganizationInvite;
    invite_token: string;
    invite_url: string;
  }>;
  revokeInvite?: (inviteId: string) => Promise<{ invite: OrganizationInvite }>;
  copyText?: (text: string) => Promise<void>;
  currentPath?: string;
} = {}) => {
  const loadMembers = overrides.loadMembers ?? vi.fn(async () => ({ members }));
  const loadInvites = overrides.loadInvites ?? vi.fn(async () => ({ invites }));
  const createInvite = overrides.createInvite ?? vi.fn(async () => ({
    invite: {
      ...invites[0]!,
      id: "org_invite_2",
      email: "new@example.com",
    },
    invite_token: "plain-token",
    invite_url: "http://localhost:5173/invites/plain-token",
  }));
  const revokeInvite = overrides.revokeInvite ?? vi.fn(async () => ({
    invite: {
      ...invites[0]!,
      status: "revoked" as const,
    },
  }));
  const copyText = overrides.copyText ?? vi.fn(async () => undefined);

  render(
    <OrganizationMembersPage
      loadMembers={loadMembers}
      loadInvites={loadInvites}
      createInvite={createInvite}
      revokeInvite={revokeInvite}
      copyText={copyText}
      currentPath={overrides.currentPath}
    />
  );

  return { loadMembers, loadInvites, createInvite, revokeInvite, copyText };
};

describe("OrganizationMembersPage", () => {
  it("renders organization members and pending invites", async () => {
    const { loadMembers, loadInvites } = renderPage();

    expect(screen.getByText("Loading organization members...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Organization members" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compliance timeline" })).toHaveAttribute("href", "/organization/compliance");

    const memberRows = screen.getAllByTestId("organization-member-row");
    expect(within(memberRows[0]!).getByText("Owner User")).toBeInTheDocument();
    expect(within(memberRows[0]!).getByText("owner@example.com")).toBeInTheDocument();
    expect(within(memberRows[0]!).getByText("owner")).toBeInTheDocument();
    expect(within(memberRows[1]!).getByText("Member User")).toBeInTheDocument();

    const inviteRows = screen.getAllByTestId("organization-invite-row");
    expect(within(inviteRows[0]!).getByText("pending@example.com")).toBeInTheDocument();
    expect(within(inviteRows[0]!).getByText("pending")).toBeInTheDocument();
    expect(within(inviteRows[0]!).getByRole("button", { name: "Revoke invite for pending@example.com" })).toBeInTheDocument();
    expect(loadMembers).toHaveBeenCalledWith();
    expect(loadInvites).toHaveBeenCalledWith();
  });

  it("creates an invite, shows the one-time invite link, and copies it", async () => {
    const copyText = vi.fn(async () => undefined);
    const { createInvite } = renderPage({ copyText });

    await screen.findByRole("heading", { name: "Organization members" });
    fireEvent.change(screen.getByLabelText("Invite email"), {
      target: { value: " new@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Invite role"), {
      target: { value: "member" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create invite" }));

    await waitFor(() => expect(createInvite).toHaveBeenCalledWith({
      email: "new@example.com",
      role: "member",
    }));
    expect(await screen.findByText("Invite link created. Copy it now; the token is only shown once.")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:5173/invites/plain-token")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy invite link" }));
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("http://localhost:5173/invites/plain-token"));
    expect(screen.getByText("Invite link copied.")).toBeInTheDocument();
  });

  it("validates invite email before submitting", async () => {
    const { createInvite } = renderPage();

    await screen.findByRole("heading", { name: "Organization members" });
    fireEvent.change(screen.getByLabelText("Invite email"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create invite" }));

    expect(screen.getByText("Invite email is required.")).toBeInTheDocument();
    expect(createInvite).not.toHaveBeenCalled();
  });

  it("renders duplicate invite errors", async () => {
    renderPage({
      createInvite: async () => {
        throw new ApiClientError({
          kind: "validation",
          status: 409,
          type: "active_invite_exists",
          message: "An active invite already exists",
        });
      },
    });

    await screen.findByRole("heading", { name: "Organization members" });
    fireEvent.change(screen.getByLabelText("Invite email"), {
      target: { value: "pending@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create invite" }));

    expect(await screen.findByText("An active invite already exists for this email.")).toBeInTheDocument();
  });

  it("revokes pending invites and reloads the list", async () => {
    const loadInvites = vi.fn()
      .mockResolvedValueOnce({ invites })
      .mockResolvedValueOnce({ invites: [] });
    const revokeInvite = vi.fn(async () => ({
      invite: {
        ...invites[0]!,
        status: "revoked" as const,
      },
    }));
    renderPage({ loadInvites, revokeInvite });

    await screen.findByRole("heading", { name: "Organization members" });
    fireEvent.click(screen.getByRole("button", { name: "Revoke invite for pending@example.com" }));

    await waitFor(() => expect(revokeInvite).toHaveBeenCalledWith("org_invite_1"));
    await waitFor(() => expect(loadInvites).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No pending invites.")).toBeInTheDocument();
  });

  it("links unauthenticated users to sign in", async () => {
    renderPage({
      currentPath: "/organization/members",
      loadMembers: async () => {
        throw new ApiClientError({
          kind: "unauthenticated",
          status: 401,
          type: "unauthenticated",
          message: "Authentication is required",
        });
      },
    });

    expect(await screen.findByText("Sign in to manage organization members.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Forganization%2Fmembers"
    );
  });
});
