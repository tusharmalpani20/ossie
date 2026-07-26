/**
 * @fileoverview Tests for the Web First-Run Setup page.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError, type PublicInstanceStatus } from "../../lib/api";
import { FirstRunSetupPage } from "./FirstRunSetupPage";
import type { FirstRunSetupInput } from "./types";

const setupRequired: PublicInstanceStatus = {
  deployment_mode: "self_hosted",
  onboarding_mode: "first_run_setup",
  setup_required: true,
  signup_enabled: false,
};

const setupComplete: PublicInstanceStatus = {
  ...setupRequired,
  setup_required: false,
};

const signupMode: PublicInstanceStatus = {
  deployment_mode: "hosted",
  onboarding_mode: "signup",
  setup_required: false,
  signup_enabled: true,
};

const fillSetupForm = () => {
  fireEvent.change(screen.getByLabelText("Owner email"), {
    target: { value: " owner@example.com " },
  });
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: " Owner " },
  });
  fireEvent.change(screen.getByLabelText("Last name"), {
    target: { value: " User " },
  });
  fireEvent.change(screen.getByLabelText("Organization name"), {
    target: { value: " Acme " },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "safe local password" },
  });
};

describe("FirstRunSetupPage", () => {
  it("renders first-run setup form when setup is required", async () => {
    render(<FirstRunSetupPage getInstanceStatus={async () => setupRequired} />);

    expect(await screen.findByRole("heading", { name: "Set up Ossie" })).toBeInTheDocument();
    expect(screen.getByLabelText("Owner email")).toBeRequired();
    expect(screen.getByLabelText("First name")).not.toBeRequired();
    expect(screen.getByLabelText("Last name")).not.toBeRequired();
    expect(screen.getByLabelText("Organization name")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByRole("button", { name: "Create owner account" })).toBeInTheDocument();
  });

  it("submits trimmed setup fields and navigates to projects", async () => {
    const completeSetup = vi.fn(async () => ({
      auth: {
        user: { id: "user_1", email: "owner@example.com" },
        organization: { id: "organization_1", name: "Acme" },
        org_user: { id: "org_user_1", role: "owner" as const },
        session: { id: "session_1" },
      },
    }));
    const navigate = vi.fn();

    render(
      <FirstRunSetupPage
        getInstanceStatus={async () => setupRequired}
        completeSetup={completeSetup}
        navigate={navigate}
      />
    );

    await screen.findByRole("heading", { name: "Set up Ossie" });
    fillSetupForm();
    fireEvent.click(screen.getByRole("button", { name: "Create owner account" }));

    expect(screen.getByRole("button", { name: "Creating owner account..." })).toBeDisabled();
    await waitFor(() => expect(completeSetup).toHaveBeenCalledWith({
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: {
        name: "Acme",
      },
    } satisfies FirstRunSetupInput));
    expect(navigate).toHaveBeenCalledWith("/projects");
  });

  it("blocks duplicate setup submissions while setup is pending", async () => {
    const completeSetup = vi.fn(() => new Promise<never>(() => undefined));

    render(
      <FirstRunSetupPage
        getInstanceStatus={async () => setupRequired}
        completeSetup={completeSetup}
      />,
    );

    await screen.findByRole("heading", { name: "Set up Ossie" });
    fillSetupForm();
    fireEvent.click(screen.getByRole("button", { name: "Create owner account" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Creating owner account..." }),
    );

    expect(
      screen.getByRole("button", { name: "Creating owner account..." }),
    ).toBeDisabled();
    expect(completeSetup).toHaveBeenCalledTimes(1);
  });

  it("shows already setup state when setup is no longer required", async () => {
    render(<FirstRunSetupPage getInstanceStatus={async () => setupComplete} />);

    expect(await screen.findByRole("heading", { name: "This instance is already set up." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "Create owner account" })).not.toBeInTheDocument();
  });

  it("shows unavailable state for hosted signup mode", async () => {
    render(<FirstRunSetupPage getInstanceStatus={async () => signupMode} />);

    expect(await screen.findByRole("heading", { name: "First-run setup is not available for this instance." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create owner account" })).not.toBeInTheDocument();
  });

  it("shows setup validation and conflict errors", async () => {
    const completeSetup = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "unsafe_owner_password",
        message: "Owner password must be at least 12 characters",
      });
    });

    const { rerender } = render(
      <FirstRunSetupPage
        getInstanceStatus={async () => setupRequired}
        completeSetup={completeSetup}
      />
    );

    await screen.findByRole("heading", { name: "Set up Ossie" });
    fillSetupForm();
    fireEvent.click(screen.getByRole("button", { name: "Create owner account" }));

    expect(await screen.findByText("Owner password must be at least 12 characters")).toBeInTheDocument();

    rerender(
      <FirstRunSetupPage
        getInstanceStatus={async () => setupRequired}
        completeSetup={async () => {
          throw new ApiClientError({
            kind: "validation",
            status: 409,
            type: "first_run_setup_completed",
            message: "First-run setup has already been completed",
          });
        }}
      />
    );

    await screen.findByRole("heading", { name: "Set up Ossie" });
    fillSetupForm();
    fireEvent.click(screen.getByRole("button", { name: "Create owner account" }));

    expect(await screen.findByText("This instance is already set up.")).toBeInTheDocument();
  });
});
