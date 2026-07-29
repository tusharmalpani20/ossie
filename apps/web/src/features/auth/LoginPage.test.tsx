/**
 * @fileoverview Tests for the public sign-in page.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { LoginPage } from "./LoginPage";
import type { AuthResponse } from "./types";

const authResponse: AuthResponse = {
  auth: {
    user: {
      id: "user_1",
      email: "person@example.com",
      display_name: "Person Example",
    },
    organization: {
      id: "organization_1",
      name: "Example Org",
    },
    org_user: {
      id: "org_user_1",
      role: "owner",
    },
    session: {
      id: "session_1",
      session_type: "web",
      expires_at: "2026-06-06T10:00:00.000Z",
    },
  },
};

const fillForm = () => {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: " person@example.com " },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: " secret " },
  });
};

describe("LoginPage", () => {
  it("renders login form fields", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Sign in" })).toBeInTheDocument();
  });

  it("defaults successful login navigation to projects", async () => {
    const submitLogin = vi.fn(async () => authResponse);
    const navigate = vi.fn();

    render(<LoginPage submitLogin={submitLogin} navigate={navigate} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/projects"));
  });

  it("submits trimmed email and exact password before navigating to the next path", async () => {
    const submitLogin = vi.fn(async () => authResponse);
    const navigate = vi.fn();

    render(<LoginPage nextPath="/projects/project_1?tab=guides" submitLogin={submitLogin} navigate={navigate} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    await waitFor(() => expect(submitLogin).toHaveBeenCalledWith({
      email: "person@example.com",
      password: " secret ",
    }));
    expect(navigate).toHaveBeenCalledWith("/projects/project_1?tab=guides");
  });

  it("blocks duplicate submissions while sign-in is pending", async () => {
    const submitLogin = vi.fn(() => new Promise<AuthResponse>(() => undefined));

    render(<LoginPage submitLogin={submitLogin} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    fireEvent.click(screen.getByRole("button", { name: "Signing in..." }));

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    expect(submitLogin).toHaveBeenCalledTimes(1);
  });

  it("rejects unsafe next paths", async () => {
    const submitLogin = vi.fn(async () => authResponse);
    const navigate = vi.fn();

    render(<LoginPage nextPath="//evil.example/path" submitLogin={submitLogin} navigate={navigate} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/projects"));
  });

  it("defaults missing and absolute next paths to projects", async () => {
    const submitLogin = vi.fn(async () => authResponse);
    const navigate = vi.fn();

    const { unmount } = render(<LoginPage submitLogin={submitLogin} navigate={navigate} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/projects"));

    unmount();
    navigate.mockClear();
    submitLogin.mockClear();

    render(<LoginPage nextPath="https://evil.example/path" submitLogin={submitLogin} navigate={navigate} />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/projects"));
  });

  it("shows invalid credentials errors", async () => {
    render(
      <LoginPage
        submitLogin={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "invalid_credentials",
            message: "Email or password is incorrect",
          });
        }}
      />
    );

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
  });

  it("shows generic sign-in errors", async () => {
    render(
      <LoginPage
        submitLogin={async () => {
          throw new Error("Network failed");
        }}
      />
    );

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Could not sign in.")).toBeInTheDocument();
  });
});
