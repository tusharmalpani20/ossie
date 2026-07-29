import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectInstancePanel } from "./ConnectInstancePanel";

describe("ConnectInstancePanel", () => {
  it("labels both URLs and rejects credential-bearing base URLs", async () => {
    const onSave = vi.fn(async () => {});
    render(<ConnectInstancePanel onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: { value: "https://user:secret@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid http:// or https:// instance URL.",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("prevents a second submit while settings are saving", async () => {
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<ConnectInstancePanel onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: { value: "https://example.com/base" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByRole("button", { name: "Connecting..." }),
    ).toBeDisabled();
    expect(onSave).toHaveBeenCalledTimes(1);
    resolveSave?.();
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });
});
