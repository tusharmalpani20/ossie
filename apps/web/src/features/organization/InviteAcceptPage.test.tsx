/**
 * @fileoverview Tests for public organization invite acceptance.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import type { AuthResponse } from "../auth/types";
import { InviteAcceptPage } from "./InviteAcceptPage";
import type { PublicOrganizationInvite } from "./types";

const invite: PublicOrganizationInvite = {
  id: "org_invite_1",
  organization_name: "Example Org",
  email: "teammate@example.com",
  role: "member",
  status: "pending",
  expires_at: "2026-06-22T10:00:00.000Z",
  requires_login: false,
};

const authResponse: AuthResponse = {
  auth: {
    user: {
      id: "user_2",
      email: "teammate@example.com",
      display_name: "Team Mate",
    },
    organization: {
      id: "organization_1",
      name: "Example Org",
    },
    org_user: {
      id: "org_user_2",
      role: "member",
    },
    session: {
      id: "session_1",
      session_type: "web",
      expires_at: "2026-06-22T10:00:00.000Z",
    },
  },
};

const renderPage = (overrides: {
  loadInvite?: (token: string) => Promise<{ invite: PublicOrganizationInvite }>;
  acceptInvite?: (token: string, input: { password?: string; display_name?: string | null }) => Promise<AuthResponse>;
  navigate?: (path: string) => void;
  token?: string;
} = {}) => {
  const loadInvite = overrides.loadInvite ?? vi.fn(async () => ({ invite }));
  const acceptInvite = overrides.acceptInvite ?? vi.fn(async () => authResponse);
  const navigate = overrides.navigate ?? vi.fn();

  render(
    <InviteAcceptPage
      token={overrides.token ?? "plain-token"}
      loadInvite={loadInvite}
      acceptInvite={acceptInvite}
      navigate={navigate}
    />
  );

  return { loadInvite, acceptInvite, navigate };
};

describe("InviteAcceptPage", () => {
  it("renders invite details for new users", async () => {
    const { loadInvite } = renderPage();

    expect(screen.getByText("Loading invite...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Join Example Org" })).toBeInTheDocument();
    expect(screen.getByText("teammate@example.com")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(loadInvite).toHaveBeenCalledWith("plain-token");
  });

  it("accepts invites for new users and navigates to projects", async () => {
    const acceptInvite = vi.fn(async () => authResponse);
    const navigate = vi.fn();
    renderPage({ acceptInvite, navigate });

    await screen.findByRole("heading", { name: "Join Example Org" });
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: " Team Mate " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "safe password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept invite" }));

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith("plain-token", {
      display_name: "Team Mate",
      password: "safe password",
    }));
    expect(navigate).toHaveBeenCalledWith("/projects");
  });

  it("blocks duplicate invite acceptance while accept is pending", async () => {
    const acceptInvite = vi.fn(() => new Promise<AuthResponse>(() => undefined));
    renderPage({ acceptInvite });

    await screen.findByRole("heading", { name: "Join Example Org" });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "safe password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept invite" }));
    fireEvent.click(screen.getByRole("button", { name: "Accepting..." }));

    expect(screen.getByRole("button", { name: "Accepting..." })).toBeDisabled();
    expect(acceptInvite).toHaveBeenCalledTimes(1);
  });

  it("requires a password before accepting new-user invites", async () => {
    const { acceptInvite } = renderPage();

    await screen.findByRole("heading", { name: "Join Example Org" });
    fireEvent.click(screen.getByRole("button", { name: "Accept invite" }));

    expect(screen.getByText("Password is required to create your account.")).toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it("prompts existing users to sign in before accepting", async () => {
    renderPage({
      loadInvite: async () => ({
        invite: {
          ...invite,
          requires_login: true,
        },
      }),
    });

    expect(await screen.findByRole("heading", { name: "Join Example Org" })).toBeInTheDocument();
    expect(screen.getByText("This email already has an account. Sign in first, then return to accept the invite.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to accept" })).toHaveAttribute(
      "href",
      "/login?next=%2Finvites%2Fplain-token"
    );
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("accepts existing-user invites with the current session", async () => {
    const acceptInvite = vi.fn(async () => authResponse);
    const navigate = vi.fn();
    renderPage({
      loadInvite: async () => ({
        invite: {
          ...invite,
          requires_login: true,
        },
      }),
      acceptInvite,
      navigate,
    });

    await screen.findByRole("heading", { name: "Join Example Org" });
    fireEvent.click(screen.getByRole("button", { name: "Accept with current session" }));

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith("plain-token", {}));
    expect(navigate).toHaveBeenCalledWith("/projects");
  });

  it("renders expired or missing invite states", async () => {
    renderPage({
      loadInvite: async () => {
        throw new ApiClientError({
          kind: "not_found",
          status: 404,
          type: "invite_not_found",
          message: "Invite was not found",
        });
      },
    });

    expect(await screen.findByRole("heading", { name: "Invite unavailable" })).toBeInTheDocument();
    expect(screen.getByText("This invite is no longer available.")).toBeInTheDocument();
  });
});
