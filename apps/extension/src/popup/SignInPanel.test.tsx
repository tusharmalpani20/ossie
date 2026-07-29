import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignInPanel } from "./SignInPanel";

describe("SignInPanel", () => {
  it("keeps credentials in the submit boundary and exposes pending state", async () => {
    let resolveSignIn: (() => void) | undefined;
    const onSignIn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    render(
      <SignInPanel
        instanceUrl="https://api.example.com/a/very/long/base/path"
        onSignIn={onSignIn}
        onChangeInstance={async () => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: " owner@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "safe password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(onSignIn).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "safe password",
    });
    expect(
      await screen.findByRole("button", { name: "Signing in..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Change instance" }),
    ).toBeDisabled();
    resolveSignIn?.();
  });
});
