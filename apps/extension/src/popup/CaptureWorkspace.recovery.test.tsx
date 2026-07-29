import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocalCaptureRecovery } from "./LocalCaptureRecovery";

describe("LocalCaptureRecovery", () => {
  it("requires explicit confirmation and explains the server state", async () => {
    const onClear = vi.fn(async () => {});
    render(<LocalCaptureRecovery busy={false} onClear={onClear} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Clear local capture state" }),
    );
    expect(onClear).not.toHaveBeenCalled();
    expect(screen.getByRole("group")).toHaveTextContent(
      "does not cancel or delete the server Capture Session",
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep capture" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Clear local capture state" }),
      ).toHaveFocus(),
    );
  });

  it("keeps confirmation open when quiescing or local clear fails", async () => {
    render(
      <LocalCaptureRecovery
        busy={false}
        onClear={async () => {
          throw new Error(
            "A capture is still saving. Wait for it to finish, then retry.",
          );
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Clear local capture state" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear local state" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A capture is still saving",
    );
    expect(
      screen.getByRole("button", { name: "Clear local state" }),
    ).toBeEnabled();
  });
});
