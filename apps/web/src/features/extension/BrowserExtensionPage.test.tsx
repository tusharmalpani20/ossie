import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrowserExtensionPage } from "./BrowserExtensionPage";

describe("BrowserExtensionPage", () => {
  it("downloads the authenticated bundle and shows concrete setup values", async () => {
    const blob = new Blob(["archive"], { type: "application/zip" });
    const downloadBundle = vi.fn(async () => ({
      filename: "ossie-extension-v0.1.0.zip",
      blob,
    }));
    const saveFile = vi.fn(async () => undefined);

    render(
      <BrowserExtensionPage
        checkAuth={async () => undefined}
        downloadBundle={downloadBundle}
        saveFile={saveFile}
        instanceUrl="https://api.example.com"
        portalUrl="https://portal.example.com"
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Download extension" }),
    );

    await waitFor(() => {
      expect(downloadBundle).toHaveBeenCalledTimes(1);
      expect(saveFile).toHaveBeenCalledWith("ossie-extension-v0.1.0.zip", blob);
    });
    expect(screen.getByText("https://api.example.com")).toBeInTheDocument();
    expect(screen.getByText("https://portal.example.com")).toBeInTheDocument();
    expect(screen.getAllByText("chrome://extensions")).toHaveLength(2);
    expect(screen.getByText("manifest.json")).toBeInTheDocument();
  });

  it("does not expose the download instructions before auth succeeds", async () => {
    let finishAuthentication: (() => void) | undefined;
    const checkAuth = () =>
      new Promise<void>((resolve) => {
        finishAuthentication = resolve;
      });

    render(
      <BrowserExtensionPage
        checkAuth={checkAuth}
        instanceUrl="https://api.example.com"
        portalUrl="https://portal.example.com"
      />,
    );

    expect(screen.getByText("Checking extension access…")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download extension" }),
    ).not.toBeInTheDocument();

    finishAuthentication?.();
    expect(
      await screen.findByRole("button", { name: "Download extension" }),
    ).toBeInTheDocument();
  });

  it("keeps the auth-check error state headed", async () => {
    render(
      <BrowserExtensionPage
        checkAuth={async () => {
          throw new Error("temporary auth failure");
        }}
      />,
    );

    expect(
      await screen.findByText(
        "Extension access could not be checked. Reload this page to try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Browser extension",
      }),
    ).toBeInTheDocument();
  });

  it("can retry a temporary auth-check failure", async () => {
    const checkAuth = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary auth failure"))
      .mockResolvedValueOnce(undefined);
    render(<BrowserExtensionPage checkAuth={checkAuth} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Try again" }),
    );
    expect(
      await screen.findByRole("button", { name: "Download extension" }),
    ).toBeInTheDocument();
    expect(checkAuth).toHaveBeenCalledTimes(2);
  });
});
