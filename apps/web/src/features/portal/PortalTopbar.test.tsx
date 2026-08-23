import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PortalTopbar } from "./PortalTopbar";

describe("PortalTopbar", () => {
  it("does not show the legacy sign-out control while a library account loads", () => {
    render(<PortalTopbar projectLibrary account={null} />);

    expect(
      screen.getByRole("status", { name: "Loading account" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

  it("renders a home brand link and preserves sign-out behavior", async () => {
    const performLogout = vi.fn(async () => undefined);
    const navigate = vi.fn();

    render(
      <PortalTopbar
        context="Project workspace"
        navigate={navigate}
        performLogout={performLogout}
      />
    );

    const brandLink = screen.getByRole("link", { name: "Ossie" });
    expect(brandLink).toHaveAttribute("href", "/projects");
    expect(brandLink.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/ossie-app-icon-64.png",
    );
    expect(screen.getByText("Project workspace")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("button", { name: "Signing out..." })).toBeDisabled();
    expect(performLogout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("keeps sign-out failures visible without navigating away", async () => {
    const performLogout = vi.fn(async () => {
      throw new Error("logout failed");
    });
    const navigate = vi.fn();

    render(
      <PortalTopbar
        context="Project workspace"
        navigate={navigate}
        performLogout={performLogout}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Could not sign out.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
